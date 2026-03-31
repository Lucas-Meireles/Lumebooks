<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type');

        $query = User::select(
            'id',
            'name',
            'cpf',
            'phone',
            'email',
            'is_admin',
            'created_at'
        )->latest();

        if ($type === 'admins') {
            $query->where('is_admin', true);
        }

        if ($type === 'clients') {
            $query->where('is_admin', false);
        }

        return response()->json($query->get());
    }

    public function search(Request $request)
    {
        $term = trim((string) $request->query('q', ''));

        if ($term === '') {
            return response()->json([]);
        }

        $cleanTerm = preg_replace('/\D/', '', $term);

        $users = User::select(
            'id',
            'name',
            'cpf',
            'phone',
            'email',
            'is_admin',
            'created_at'
        )
            ->where(function ($query) use ($term, $cleanTerm) {
                $query->where('name', 'like', '%' . $term . '%')
                    ->orWhere('email', 'like', '%' . $term . '%');

                if ($cleanTerm !== '') {
                    $query->orWhere('cpf', 'like', '%' . $cleanTerm . '%');
                }
            })
            ->orderByDesc('is_admin')
            ->orderBy('name')
            ->limit(20)
            ->get();

        return response()->json($users);
    }

    public function toggleAdmin($id, Request $request)
    {
        $targetUser = User::findOrFail($id);
        $authUser = $request->user();

        if ($authUser->id === $targetUser->id && $targetUser->is_admin) {
            $adminCount = User::where('is_admin', true)->count();

            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Você é o único administrador. Não é possível remover sua própria permissão.'
                ], 422);
            }
        }

        $targetUser->is_admin = !$targetUser->is_admin;
        $targetUser->save();

        return response()->json([
            'message' => $targetUser->is_admin
                ? 'Usuário promovido para administrador com sucesso.'
                : 'Permissão de administrador removida com sucesso.',
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'cpf' => $targetUser->cpf,
                'phone' => $targetUser->phone,
                'email' => $targetUser->email,
                'is_admin' => $targetUser->is_admin,
                'created_at' => $targetUser->created_at,
            ],
        ]);
    }
}