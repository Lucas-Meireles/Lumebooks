<?php

namespace App\Http\Controllers;

use App\Models\Publication;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class PublicationController extends Controller
{
    public function index()
    {
        $publications = Publication::with(['category', 'publisher'])
            ->where('is_published', true)
            ->latest()
            ->get();

        return response()->json($publications);
    }

    public function show($id)
    {
        $publication = Publication::with(['category', 'publisher'])
            ->where('is_published', true)
            ->findOrFail($id);

        return response()->json($publication);
    }

    public function store(Request $request)
    {
        $publication = Publication::create([
            'category_id' => $request->category_id,
            'publisher_user_id' => auth()->id(),
            'title' => $request->title,
            'slug' => $request->slug ?: Str::slug($request->title),
            'short_description' => $request->short_description,
            'full_description' => $request->full_description,
            'cover_path' => $request->cover_path,
            'file_path' => $request->file_path,
            'price' => $request->price,
            'is_published' => $request->is_published ?? true,
            'published_at' => now(),
        ]);

        return response()->json($publication, 201);
    }

    public function readerFile(Request $request, $id)
    {
        $token = $request->query('token');

        if (!$token) {
            return response()->json([
                'message' => 'Token não informado.'
            ], 401);
        }

        $accessToken = PersonalAccessToken::findToken($token);

        if (!$accessToken) {
            return response()->json([
                'message' => 'Token inválido.'
            ], 401);
        }

        $user = $accessToken->tokenable;

        $publication = Publication::findOrFail($id);

        $hasPurchased = $user->purchases()
            ->whereHas('items', function ($query) use ($id) {
                $query->where('publication_id', $id);
            })
            ->exists();

        if (!$hasPurchased) {
            return response()->json([
                'message' => 'Você não tem acesso a este arquivo.'
            ], 403);
        }

        if (!$publication->file_path) {
            return response()->json([
                'message' => 'Arquivo do ebook não encontrado no banco.'
            ], 404);
        }

        $path = storage_path('app/public/' . $publication->file_path);

        if (!file_exists($path)) {
            return response()->json([
                'message' => 'Arquivo físico não encontrado.'
            ], 404);
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }
}