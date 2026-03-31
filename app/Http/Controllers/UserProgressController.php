<?php

namespace App\Http\Controllers;

use App\Models\UserProgress;
use Illuminate\Http\Request;

class UserProgressController extends Controller
{
    public function show($publicationId)
    {
        $progress = UserProgress::firstOrCreate(
            [
                'user_id' => auth()->id(),
                'publication_id' => $publicationId,
            ],
            [
                'progress' => 0,
            ]
        );

        return response()->json($progress);
    }

    public function store(Request $request)
    {
        $request->validate([
            'publication_id' => ['required', 'integer', 'exists:publications,id'],
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $progress = UserProgress::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'publication_id' => $request->publication_id,
            ],
            [
                'progress' => $request->progress,
            ]
        );

        return response()->json($progress);
    }
}