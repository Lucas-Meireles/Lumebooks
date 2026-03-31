<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class CouponController extends Controller
{
    public function apply(Request $request)
    {
        $validated = $request->validate(
            [
                'code' => ['required', 'string'],
                'amount' => ['required', 'numeric', 'min:0.01'],
                'category_id' => ['nullable', 'exists:categories,id'],
                'publication_id' => ['nullable', 'exists:publications,id'],
            ],
            [
                'code.required' => 'Informe o código do cupom.',
                'amount.required' => 'Informe o valor da compra.',
                'amount.min' => 'O valor da compra deve ser maior que zero.',
            ]
        );

        $user = $request->user();
        $coupon = Coupon::where('code', mb_strtoupper(trim($validated['code']), 'UTF-8'))->first();

        if (!$coupon) {
            throw ValidationException::withMessages([
                'code' => ['Cupom não encontrado.'],
            ]);
        }

        $this->validateCouponForUser(
            coupon: $coupon,
            userId: $user->id,
            amount: (float) $validated['amount'],
            categoryId: $validated['category_id'] ?? null,
            publicationId: $validated['publication_id'] ?? null
        );

        $discount = $this->calculateDiscount(
            type: $coupon->type,
            value: (float) $coupon->value,
            amount: (float) $validated['amount']
        );

        $finalAmount = max((float) $validated['amount'] - $discount, 0);

        return response()->json([
            'message' => 'Cupom aplicado com sucesso.',
            'coupon' => [
                'id' => $coupon->id,
                'name' => $coupon->name,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
            ],
            'discount_amount' => round($discount, 2),
            'original_amount' => round((float) $validated['amount'], 2),
            'final_amount' => round($finalAmount, 2),
        ]);
    }

    public function firstPurchaseCoupon(Request $request)
    {
        $user = $request->user();
        $hasPurchases = Purchase::where('user_id', $user->id)->exists();

        if ($hasPurchases) {
            return response()->json([
                'show_banner' => false,
                'coupon' => null,
            ]);
        }

        $coupon = Coupon::query()
            ->where('is_active', true)
            ->where('first_purchase_only', true)
            ->where(function ($query) {
                $now = now();

                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) {
                $now = now();

                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', $now);
            })
            ->orderByDesc('created_at')
            ->first();

        if (!$coupon) {
            return response()->json([
                'show_banner' => false,
                'coupon' => null,
            ]);
        }

        return response()->json([
            'show_banner' => true,
            'coupon' => [
                'id' => $coupon->id,
                'name' => $coupon->name,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
            ],
        ]);
    }

    private function validateCouponForUser(
        Coupon $coupon,
        int $userId,
        float $amount,
        ?int $categoryId = null,
        ?int $publicationId = null
    ): void {
        if (!$coupon->is_active) {
            throw ValidationException::withMessages([
                'code' => ['Este cupom está inativo.'],
            ]);
        }

        $now = Carbon::now();

        if ($coupon->starts_at && $coupon->starts_at->gt($now)) {
            throw ValidationException::withMessages([
                'code' => ['Este cupom ainda não está disponível.'],
            ]);
        }

        if ($coupon->expires_at && $coupon->expires_at->lt($now)) {
            throw ValidationException::withMessages([
                'code' => ['Este cupom expirou.'],
            ]);
        }

        if ($coupon->minimum_amount !== null && $amount < (float) $coupon->minimum_amount) {
            throw ValidationException::withMessages([
                'code' => ['O valor mínimo para usar este cupom não foi atingido.'],
            ]);
        }

        if ($coupon->usage_limit !== null) {
            $totalUsage = CouponUsage::where('coupon_id', $coupon->id)->count();

            if ($totalUsage >= $coupon->usage_limit) {
                throw ValidationException::withMessages([
                    'code' => ['Este cupom atingiu o limite total de usos.'],
                ]);
            }
        }

        if ($coupon->usage_limit_per_user !== null) {
            $userUsage = CouponUsage::where('coupon_id', $coupon->id)
                ->where('user_id', $userId)
                ->count();

            if ($userUsage >= $coupon->usage_limit_per_user) {
                throw ValidationException::withMessages([
                    'code' => ['Você já atingiu o limite de uso deste cupom.'],
                ]);
            }
        }

        if ($coupon->first_purchase_only) {
            $userHasPurchases = Purchase::where('user_id', $userId)->exists();

            if ($userHasPurchases) {
                throw ValidationException::withMessages([
                    'code' => ['Este cupom é válido apenas para a primeira compra.'],
                ]);
            }
        }

        if ($coupon->category_id && (int) $coupon->category_id !== (int) $categoryId) {
            throw ValidationException::withMessages([
                'code' => ['Este cupom não é válido para esta categoria.'],
            ]);
        }

        if ($coupon->publication_id && (int) $coupon->publication_id !== (int) $publicationId) {
            throw ValidationException::withMessages([
                'code' => ['Este cupom não é válido para esta publicação.'],
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