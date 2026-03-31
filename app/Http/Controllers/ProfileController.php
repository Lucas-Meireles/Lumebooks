<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->fresh());
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate(
            [
                'display_name' => ['nullable', 'string', 'max:255'],
                'bio' => ['nullable', 'string', 'max:1000'],
                'profile_theme' => [
                    'nullable',
                    Rule::in([
                        'violet',
                        'blue',
                        'emerald',
                        'rose',
                        'amber',
                    ]),
                ],
                'phone' => ['nullable', 'string', 'max:20'],
                'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
                'avatar_config' => ['nullable', 'string'],
            ],
            [
                'avatar.image' => 'O arquivo enviado precisa ser uma imagem.',
                'avatar.mimes' => 'A foto deve estar em JPG, JPEG, PNG ou WEBP.',
                'avatar.max' => 'A foto deve ter no máximo 4MB.',
                'phone.max' => 'O telefone deve ter no máximo 20 caracteres.',
                'profile_theme.in' => 'O tema selecionado é inválido.',
            ]
        );

        $data = [
            'display_name' => $validated['display_name'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'profile_theme' => $validated['profile_theme'] ?? 'violet',
            'phone' => $validated['phone'] ?? null,
        ];

        if (!empty($validated['avatar_config'])) {
            $decodedAvatarConfig = json_decode($validated['avatar_config'], true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decodedAvatarConfig)) {
                return response()->json([
                    'message' => 'Configuração do avatar inválida.',
                    'errors' => [
                        'avatar_config' => ['A configuração do avatar precisa ser um JSON válido.'],
                    ],
                ], 422);
            }

            $data['avatar_config'] = [
                'seed' => $decodedAvatarConfig['seed'] ?? ($validated['display_name'] ?? $user->display_name ?? $user->name ?? 'LumeBooks'),
                'top' => $decodedAvatarConfig['top'] ?? 'shortHairShortFlat',
                'eyes' => $decodedAvatarConfig['eyes'] ?? 'default',
                'eyebrows' => $decodedAvatarConfig['eyebrows'] ?? 'default',
                'mouth' => $decodedAvatarConfig['mouth'] ?? 'smile',
                'clothing' => $decodedAvatarConfig['clothing'] ?? 'hoodie',
                'accessories' => $decodedAvatarConfig['accessories'] ?? 'blank',
                'facialHair' => $decodedAvatarConfig['facialHair'] ?? 'blank',
                'backgroundColor' => $decodedAvatarConfig['backgroundColor'] ?? 'b6e3f4',
            ];
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            $data['avatar_path'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($data);

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'user' => $user->fresh(),
        ]);
    }

    public function removeAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->update([
            'avatar_path' => null,
        ]);

        return response()->json([
            'message' => 'Foto de perfil removida com sucesso.',
            'user' => $user->fresh(),
        ]);
    }
}