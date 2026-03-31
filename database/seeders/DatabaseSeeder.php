<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\User;
use App\Models\Category;
use App\Models\Publication;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 👤 Usuário padrão
        $user = User::first() ?? User::create([
            'name' => 'Lucas',
            'email' => 'lucas@email.com',
            'password' => bcrypt('123456'),
        ]);

        // 📂 Categoria
        $category = Category::first() ?? Category::create([
            'name' => 'Programação',
            'slug' => 'programacao',
        ]);

        // 📚 Ebooks
        Publication::create([
            'category_id' => $category->id,
            'publisher_user_id' => $user->id,
            'title' => 'React do Zero ao Avançado',
            'slug' => 'react-zero-avancado',
            'short_description' => 'Aprenda React na prática',
            'full_description' => 'Conteúdo completo de React moderno.',
            'cover_path' => 'capa1.jpg',
            'file_path' => 'ebook.pdf',
            'price' => 39.90,
            'is_published' => true,
            'published_at' => now(),
        ]);

        Publication::create([
            'category_id' => $category->id,
            'publisher_user_id' => $user->id,
            'title' => 'Laravel Profissional',
            'slug' => 'laravel-profissional',
            'short_description' => 'Backend de verdade',
            'full_description' => 'Aprenda Laravel com arquitetura limpa.',
            'cover_path' => 'capa2.jpg',
            'file_path' => 'ebook.pdf',
            'price' => 49.90,
            'is_published' => true,
            'published_at' => now(),
        ]);
    }
}