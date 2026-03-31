<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminCouponController extends Controller
{
    public function index()
    {
        return response()->json(
            Coupon::with(['category', 'publication', 'creator'])
                ->latest()
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate(
            [
                'name' => ['required', 'string', 'max:255'],
                'code' => ['required', 'string', 'max:100', 'unique:coupons,code'],
                'type' => ['required', Rule::in(['percentage', 'fixed'])],
                'value' => ['required', 'numeric', 'min:0.01'],
                'minimum_amount' => ['nullable', 'numeric', 'min:0'],
                'usage_limit' => ['nullable', 'integer', 'min:1'],
                'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
                'first_purchase_only' => ['nullable', 'boolean'],
                'is_active' => ['nullable', 'boolean'],
                'category_id' => ['nullable', 'exists:categories,id'],
                'publication_id' => ['nullable', 'exists:publications,id'],
                'starts_at' => ['nullable', 'date'],
                'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            ],
            [
                'name.required' => 'O nome do cupom é obrigatório.',
                'code.required' => 'O código do cupom é obrigatório.',
                'code.unique' => 'Este código de cupom já existe.',
                'type.required' => 'O tipo do cupom é obrigatório.',
                'type.in' => 'Tipo de cupom inválido.',
                'value.required' => 'O valor do cupom é obrigatório.',
                'value.min' => 'O valor do cupom deve ser maior que zero.',
                'usage_limit.min' => 'O limite total deve ser no mínimo 1.',
                'usage_limit_per_user.min' => 'O limite por usuário deve ser no mínimo 1.',
                'expires_at.after_or_equal' => 'A data final deve ser igual ou posterior à data inicial.',
            ]
        );

        $this->validateCouponBusinessRules($validated);

        $coupon = Coupon::create([
            'name' => trim($validated['name']),
            'code' => mb_strtoupper(trim($validated['code']), 'UTF-8'),
            'type' => $validated['type'],
            'value' => $validated['value'],
            'minimum_amount' => $validated['minimum_amount'] ?? null,
            'usage_limit' => $validated['usage_limit'] ?? null,
            'usage_limit_per_user' => $validated['usage_limit_per_user'] ?? 1,
            'first_purchase_only' => (bool) ($validated['first_purchase_only'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'category_id' => $validated['category_id'] ?? null,
            'publication_id' => $validated['publication_id'] ?? null,
            'created_by' => $request->user()->id,
            'starts_at' => $validated['starts_at'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return response()->json([
            'message' => 'Cupom criado com sucesso.',
            'coupon' => $coupon->load(['category', 'publication', 'creator']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate(
            [
                'name' => ['required', 'string', 'max:255'],
                'code' => ['required', 'string', 'max:100', Rule::unique('coupons', 'code')->ignore($coupon->id)],
                'type' => ['required', Rule::in(['percentage', 'fixed'])],
                'value' => ['required', 'numeric', 'min:0.01'],
                'minimum_amount' => ['nullable', 'numeric', 'min:0'],
                'usage_limit' => ['nullable', 'integer', 'min:1'],
                'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
                'first_purchase_only' => ['nullable', 'boolean'],
                'is_active' => ['nullable', 'boolean'],
                'category_id' => ['nullable', 'exists:categories,id'],
                'publication_id' => ['nullable', 'exists:publications,id'],
                'starts_at' => ['nullable', 'date'],
                'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            ]
        );

        $this->validateCouponBusinessRules($validated);

        $coupon->update([
            'name' => trim($validated['name']),
            'code' => mb_strtoupper(trim($validated['code']), 'UTF-8'),
            'type' => $validated['type'],
            'value' => $validated['value'],
            'minimum_amount' => $validated['minimum_amount'] ?? null,
            'usage_limit' => $validated['usage_limit'] ?? null,
            'usage_limit_per_user' => $validated['usage_limit_per_user'] ?? 1,
            'first_purchase_only' => (bool) ($validated['first_purchase_only'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'category_id' => $validated['category_id'] ?? null,
            'publication_id' => $validated['publication_id'] ?? null,
            'starts_at' => $validated['starts_at'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return response()->json([
            'message' => 'Cupom atualizado com sucesso.',
            'coupon' => $coupon->fresh()->load(['category', 'publication', 'creator']),
        ]);
    }

    public function delete($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'message' => 'Cupom excluído com sucesso.',
        ]);
    }

    private function validateCouponBusinessRules(array $validated): void
    {
        if (($validated['type'] ?? null) === 'percentage' && (float) $validated['value'] > 100) {
            throw ValidationException::withMessages([
                'value' => ['Cupons percentuais não podem ser maiores que 100%.'],
            ]);
        }

        if (!empty($validated['category_id']) && !empty($validated['publication_id'])) {
            throw ValidationException::withMessages([
                'publication_id' => ['Escolha apenas uma segmentação: categoria ou publicação.'],
            ]);
        }
    }
}