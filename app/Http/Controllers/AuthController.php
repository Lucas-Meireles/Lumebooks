<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate(
            [
                'name' => ['required', 'string', 'max:255'],
                'cpf' => ['required', 'string', 'max:20', 'unique:users,cpf'],
                'phone' => ['required', 'string', 'max:20'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ],
            [
                'name.required' => 'O nome completo é obrigatório.',
                'cpf.required' => 'O CPF é obrigatório.',
                'cpf.unique' => 'Este CPF já está cadastrado.',
                'phone.required' => 'O telefone é obrigatório.',
                'email.required' => 'O e-mail é obrigatório.',
                'email.email' => 'Informe um e-mail válido.',
                'email.unique' => 'Este e-mail já está cadastrado.',
                'password.required' => 'A senha é obrigatória.',
                'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
                'password.confirmed' => 'A confirmação de senha não confere.',
            ]
        );

        $name = trim($request->name);
        $cpf = preg_replace('/\D/', '', $request->cpf);
        $phone = preg_replace('/\D/', '', $request->phone);

        if (count(array_filter(explode(' ', $name))) < 2) {
            throw ValidationException::withMessages([
                'name' => ['Informe seu nome completo.'],
            ]);
        }

        if (strlen($cpf) !== 11) {
            throw ValidationException::withMessages([
                'cpf' => ['O CPF deve conter 11 números.'],
            ]);
        }

        if (strlen($phone) < 10 || strlen($phone) > 11) {
            throw ValidationException::withMessages([
                'phone' => ['Informe um telefone válido com DDD.'],
            ]);
        }

        $user = User::create([
            'name' => mb_strtoupper($name, 'UTF-8'),
            'cpf' => $cpf,
            'phone' => $phone,
            'email' => mb_strtolower($request->email, 'UTF-8'),
            'password' => Hash::make($request->password),
            'is_admin' => false,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Conta criada com sucesso.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate(
            [
                'email' => ['required', 'string', 'email'],
                'password' => ['required', 'string'],
            ],
            [
                'email.required' => 'O e-mail é obrigatório.',
                'email.email' => 'Informe um e-mail válido.',
                'password.required' => 'A senha é obrigatória.',
            ]
        );

        $email = mb_strtolower($request->email, 'UTF-8');

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}