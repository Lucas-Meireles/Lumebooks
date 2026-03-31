<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Certificate;
use App\Models\Publication;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */
    public function dashboard()
    {
        $revenue = (float) DB::table('purchase_items')->sum('total_price');

        $salesByMonth = DB::table('purchases')
            ->join('purchase_items', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->selectRaw("DATE_FORMAT(purchases.created_at, '%Y-%m') as month")
            ->selectRaw('SUM(purchase_items.total_price) as revenue')
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        $topEbooks = DB::table('purchase_items')
            ->join('publications', 'publications.id', '=', 'purchase_items.publication_id')
            ->select(
                'purchase_items.publication_id',
                'publications.title',
                DB::raw('COUNT(*) as total_sales'),
                DB::raw('SUM(purchase_items.total_price) as total_revenue')
            )
            ->groupBy('purchase_items.publication_id', 'publications.title')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->get();

        $latestPublications = Publication::with('category')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'summary' => [
                'users' => User::count(),
                'clients' => User::where('is_admin', false)->count(),
                'admins' => User::where('is_admin', true)->count(),
                'ebooks' => Publication::count(),
                'purchases' => Purchase::count(),
                'certificates' => Certificate::count(),
                'revenue' => round($revenue, 2),
                'progress_avg' => round(
                    DB::table('user_progress')->avg('progress') ?? 0,
                    2
                ),
            ],
            'charts' => [
                'sales_by_month' => $salesByMonth,
            ],
            'top_ebooks' => $topEbooks,
            'latest_publications' => $latestPublications,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORIAS
    |--------------------------------------------------------------------------
    */
    public function categories()
    {
        $defaultCategories = [
            'NEGÓCIOS',
            'MARKETING',
            'VENDAS',
            'FINANÇAS',
            'DESENVOLVIMENTO PESSOAL',
            'TECNOLOGIA',
            'PROGRAMAÇÃO',
            'DESIGN',
            'ARQUITETURA',
            'ENGENHARIA',
            'EDUCAÇÃO',
            'IDIOMAS',
            'SAÚDE',
            'FITNESS',
            'CULINÁRIA',
            'RELACIONAMENTOS',
            'PRODUTIVIDADE',
            'ESPIRITUALIDADE',
            'BIOGRAFIAS',
            'INFANTIL',
        ];

        foreach ($defaultCategories as $categoryName) {
            Category::firstOrCreate(
                ['slug' => Str::slug($categoryName)],
                ['name' => $categoryName]
            );
        }

        return response()->json(
            Category::orderBy('name')->get()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLICAÇÕES (ADMIN)
    |--------------------------------------------------------------------------
    */
    public function publications()
    {
        return response()->json(
            Publication::with('category', 'publisher')
                ->latest()
                ->get()
        );
    }

    public function storePublication(Request $request)
    {
        $validated = $request->validate(
            [
                'category_id' => ['required', 'exists:categories,id'],
                'title' => ['required', 'string', 'max:255'],
                'short_description' => ['nullable', 'string'],
                'full_description' => ['required', 'string'],
                'price' => ['required', 'regex:/^\d+([\,\.]\d{2})$/'],
                'is_published' => ['nullable', 'boolean'],
                'cover' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
                'file' => ['required', 'file', 'mimes:pdf', 'max:20480'],
            ],
            [
                'category_id.required' => 'A categoria é obrigatória.',
                'category_id.exists' => 'A categoria selecionada é inválida.',
                'title.required' => 'O título é obrigatório.',
                'full_description.required' => 'A descrição completa é obrigatória.',
                'price.required' => 'O preço é obrigatório.',
                'price.regex' => 'Informe o preço com duas casas decimais. Exemplo: 29,90',
                'cover.required' => 'A capa é obrigatória.',
                'cover.image' => 'O arquivo da capa precisa ser uma imagem.',
                'file.required' => 'O PDF é obrigatório.',
                'file.mimes' => 'O arquivo precisa ser um PDF válido.',
            ]
        );

        $price = $this->normalizePrice($validated['price']);
        $title = mb_strtoupper(trim($validated['title']), 'UTF-8');
        $shortDescription = isset($validated['short_description'])
            ? trim($validated['short_description'])
            : null;
        $fullDescription = $this->normalizeDescription($validated['full_description']);

        $coverPath = $request->file('cover')->store('covers', 'public');
        $filePath = $request->file('file')->store('publications', 'public');

        $publication = Publication::create([
            'category_id' => $validated['category_id'],
            'publisher_user_id' => $request->user()->id,
            'title' => $title,
            'slug' => Str::slug($title . '-' . uniqid()),
            'short_description' => $shortDescription,
            'full_description' => $fullDescription,
            'cover_path' => $coverPath,
            'file_path' => $filePath,
            'price' => $price,
            'is_published' => (bool) ($validated['is_published'] ?? true),
            'published_at' => (bool) ($validated['is_published'] ?? true) ? now() : null,
        ]);

        return response()->json([
            'message' => 'Publicação criada com sucesso.',
            'publication' => $publication->load('category', 'publisher'),
        ], 201);
    }

    public function updatePublication(Request $request, $id)
    {
        $publication = Publication::findOrFail($id);

        $validated = $request->validate(
            [
                'category_id' => ['required', 'exists:categories,id'],
                'title' => ['required', 'string', 'max:255'],
                'short_description' => ['nullable', 'string'],
                'full_description' => ['required', 'string'],
                'price' => ['required', 'regex:/^\d+([\,\.]\d{2})$/'],
                'is_published' => ['nullable', 'boolean'],
                'cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
                'file' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            ],
            [
                'category_id.required' => 'A categoria é obrigatória.',
                'category_id.exists' => 'A categoria selecionada é inválida.',
                'title.required' => 'O título é obrigatório.',
                'full_description.required' => 'A descrição completa é obrigatória.',
                'price.required' => 'O preço é obrigatório.',
                'price.regex' => 'Informe o preço com duas casas decimais. Exemplo: 29,90',
            ]
        );

        $data = [
            'category_id' => $validated['category_id'],
            'title' => mb_strtoupper(trim($validated['title']), 'UTF-8'),
            'short_description' => isset($validated['short_description'])
                ? trim($validated['short_description'])
                : null,
            'full_description' => $this->normalizeDescription($validated['full_description']),
            'price' => $this->normalizePrice($validated['price']),
            'is_published' => (bool) ($validated['is_published'] ?? false),
        ];

        if ($data['is_published'] && !$publication->published_at) {
            $data['published_at'] = now();
        }

        if (!$data['is_published']) {
            $data['published_at'] = null;
        }

        if ($request->hasFile('cover')) {
            if ($publication->cover_path && Storage::disk('public')->exists($publication->cover_path)) {
                Storage::disk('public')->delete($publication->cover_path);
            }

            $data['cover_path'] = $request->file('cover')->store('covers', 'public');
        }

        if ($request->hasFile('file')) {
            if ($publication->file_path && Storage::disk('public')->exists($publication->file_path)) {
                Storage::disk('public')->delete($publication->file_path);
            }

            $data['file_path'] = $request->file('file')->store('publications', 'public');
        }

        $publication->update($data);

        return response()->json([
            'message' => 'Publicação atualizada com sucesso.',
            'publication' => $publication->fresh()->load('category', 'publisher'),
        ]);
    }

    public function deletePublication($id)
    {
        $publication = Publication::findOrFail($id);

        if ($publication->cover_path && Storage::disk('public')->exists($publication->cover_path)) {
            Storage::disk('public')->delete($publication->cover_path);
        }

        if ($publication->file_path && Storage::disk('public')->exists($publication->file_path)) {
            Storage::disk('public')->delete($publication->file_path);
        }

        $publication->delete();

        return response()->json([
            'message' => 'Publicação deletada com sucesso.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CLIENTES
    |--------------------------------------------------------------------------
    */
    public function clients()
    {
        $clients = User::where('is_admin', false)
            ->with([
                'purchases.items.publication',
                'libraryItems',
                'progress',
            ])
            ->latest()
            ->get()
            ->map(function ($user) {
                $totalSpent = $user->purchases->sum(function ($purchase) {
                    return $purchase->items->sum('total_price');
                });

                $totalPurchases = $user->purchases->count();
                $libraryCount = $user->libraryItems->count();
                $progressAverage = round($user->progress->avg('progress') ?? 0, 2);
                $lastPurchaseAt = optional($user->purchases->sortByDesc('created_at')->first())->created_at;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'cpf' => $user->cpf,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin,
                    'total_spent' => round($totalSpent, 2),
                    'total_purchases' => $totalPurchases,
                    'library_count' => $libraryCount,
                    'progress_avg' => $progressAverage,
                    'last_purchase_at' => $lastPurchaseAt,
                    'created_at' => $user->created_at,
                ];
            })
            ->values();

        return response()->json($clients);
    }

    /*
    |--------------------------------------------------------------------------
    | USUÁRIOS
    |--------------------------------------------------------------------------
    | Mantido apenas por compatibilidade, caso alguma tela antiga use isso
    |--------------------------------------------------------------------------
    */
    public function users()
    {
        return response()->json(
            User::select('id', 'name', 'cpf', 'phone', 'email', 'is_admin')
                ->latest()
                ->get()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | COMPRAS
    |--------------------------------------------------------------------------
    */
    public function purchases()
    {
        return response()->json(
            Purchase::with('items.publication', 'user')
                ->latest()
                ->get()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CERTIFICADOS
    |--------------------------------------------------------------------------
    */
    public function certificates()
    {
        return response()->json(
            Certificate::with('user', 'publication')
                ->latest()
                ->get()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */
    private function normalizePrice(string $price): float
    {
        $normalized = str_replace('.', '', $price);
        $normalized = str_replace(',', '.', $normalized);

        if (!is_numeric($normalized)) {
            throw ValidationException::withMessages([
                'price' => ['Preço inválido.'],
            ]);
        }

        return (float) $normalized;
    }

    private function normalizeDescription(string $description): string
    {
        $description = trim($description);

        if ($description === '') {
            throw ValidationException::withMessages([
                'full_description' => ['A descrição completa é obrigatória.'],
            ]);
        }

        $firstChar = mb_substr($description, 0, 1, 'UTF-8');
        $rest = mb_substr($description, 1, null, 'UTF-8');

        return mb_strtolower($firstChar, 'UTF-8') . $rest;
    }
}