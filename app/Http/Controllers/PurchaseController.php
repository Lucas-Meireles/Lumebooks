<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Publication;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(
            [
                'publication_id' => ['required', 'integer', 'exists:publications,id'],
                'payment_method' => ['required', 'string'],
                'coupon_code' => ['nullable', 'string'],
            ],
            [
                'publication_id.required' => 'A publicação é obrigatória.',
                'publication_id.exists' => 'A publicação selecionada é inválida.',
                'payment_method.required' => 'O método de pagamento é obrigatório.',
            ]
        );

        $user = auth()->user();

        $publication = Publication::with('category')->findOrFail($request->publication_id);

        $alreadyPurchased = PurchaseItem::whereHas('purchase', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('publication_id', $publication->id)
            ->exists();

        if ($alreadyPurchased) {
            return response()->json([
                'message' => 'Você já comprou este ebook.',
            ], 422);
        }

        $subtotal = (float) $publication->price;
        $discountAmount = 0;
        $coupon = null;

        if ($request->filled('coupon_code')) {
            $coupon = Coupon::where('code', mb_strtoupper(trim($request->coupon_code), 'UTF-8'))->first();

            if (!$coupon) {
                throw ValidationException::withMessages([
                    'coupon_code' => ['Cupom não encontrado.'],
                ]);
            }

            $this->validateCouponForPurchase($coupon, $user->id, $publication, $subtotal);

            $discountAmount = $this->calculateDiscount(
                type: $coupon->type,
                value: (float) $coupon->value,
                amount: $subtotal
            );
        }

        $totalAmount = max($subtotal - $discountAmount, 0);

        $purchase = DB::transaction(function () use (
            $user,
            $publication,
            $request,
            $subtotal,
            $discountAmount,
            $totalAmount,
            $coupon
        ) {
            $purchase = Purchase::create([
                'user_id' => $user->id,
                'purchase_code' => strtoupper(Str::random(10)),
                'subtotal_amount' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'payment_status' => 'paid',
                'payment_method' => $request->payment_method,
                'purchased_at' => now(),
            ]);

            PurchaseItem::create([
                'purchase_id' => $purchase->id,
                'publication_id' => $publication->id,
                'unit_price' => $publication->price,
                'quantity' => 1,
                'total_price' => $totalAmount,
            ]);

            if ($coupon) {
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'purchase_id' => $purchase->id,
                    'discount_amount' => $discountAmount,
                    'used_at' => now(),
                ]);
            }

            return $purchase->load('items.publication', 'user');
        });

        return response()->json([
            'message' => 'Compra realizada com sucesso.',
            'purchase' => $purchase,
        ], 201);
    }

    private function validateCouponForPurchase(
        Coupon $coupon,
        int $userId,
        Publication $publication,
        float $amount
    ): void {
        if (!$coupon->is_active) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Este cupom está inativo.'],
            ]);
        }

        $now = now();

        if ($coupon->starts_at && $coupon->starts_at->gt($now)) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Este cupom ainda não está disponível.'],
            ]);
        }

        if ($coupon->expires_at && $coupon->expires_at->lt($now)) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Este cupom expirou.'],
            ]);
        }

        if ($coupon->minimum_amount !== null && $amount < (float) $coupon->minimum_amount) {
            throw ValidationException::withMessages([
                'coupon_code' => ['O valor mínimo para usar este cupom não foi atingido.'],
            ]);
        }

        if ($coupon->usage_limit !== null) {
            $totalUsage = CouponUsage::where('coupon_id', $coupon->id)->count();

            if ($totalUsage >= $coupon->usage_limit) {
                throw ValidationException::withMessages([
                    'coupon_code' => ['Este cupom atingiu o limite total de usos.'],
                ]);
            }
        }

        if ($coupon->usage_limit_per_user !== null) {
            $userUsage = CouponUsage::where('coupon_id', $coupon->id)
                ->where('user_id', $userId)
                ->count();

            if ($userUsage >= $coupon->usage_limit_per_user) {
                throw ValidationException::withMessages([
                    'coupon_code' => ['Você já atingiu o limite de uso deste cupom.'],
                ]);
            }
        }

        if ($coupon->first_purchase_only) {
            $userHasPurchases = Purchase::where('user_id', $userId)->exists();

            if ($userHasPurchases) {
                throw ValidationException::withMessages([
                    'coupon_code' => ['Este cupom é válido apenas para a primeira compra.'],
                ]);
            }
        }

        if ($coupon->category_id && (int) $coupon->category_id !== (int) $publication->category_id) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Este cupom não é válido para a categoria desta publicação.'],
            ]);
        }

        if ($coupon->publication_id && (int) $coupon->publication_id !== (int) $publication->id) {
            throw ValidationException::withMessages([
                'coupon_code' => ['Este cupom não é válido para esta publicação.'],
            ]);
        }
    }

    private function calculateDiscount(string $type, float $value, float $amount): float
    {
        if ($type === 'percentage') {
            return min(($amount * $value) / 100, $amount);
        }

        return min($value, $amount);
    }
}