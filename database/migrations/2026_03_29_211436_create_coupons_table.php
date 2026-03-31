<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('code')->unique();

            $table->enum('type', ['percentage', 'fixed']);
            $table->decimal('value', 10, 2);

            $table->decimal('minimum_amount', 10, 2)->nullable();

            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('usage_limit_per_user')->default(1);

            $table->boolean('first_purchase_only')->default(false);
            $table->boolean('is_active')->default(true);

            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('publication_id')->nullable()->constrained('publications')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index(['first_purchase_only', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};