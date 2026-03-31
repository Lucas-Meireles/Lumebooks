<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publications', function (Blueprint $table) {
            $table->id();

            // Relacionamentos
            $table->foreignId('category_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('publisher_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Conteúdo
            $table->string('title');
            $table->string('slug')->unique();

            $table->text('short_description')->nullable();
            $table->longText('full_description'); // obrigatório

            // Arquivos
            $table->string('cover_path'); // obrigatório
            $table->string('file_path');  // obrigatório (PDF)

            // Preço
            $table->decimal('price', 10, 2);

            // Publicação
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            // Index extra pra performance
            $table->index(['category_id', 'is_published']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publications');
    }
};