<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->string('avatar_path')->nullable()->after('password');

            $table->string('display_name')->nullable()->after('avatar_path');

            $table->text('bio')->nullable()->after('display_name');

            $table->string('profile_theme')->nullable()->after('bio');

        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->dropColumn([
                'avatar_path',
                'display_name',
                'bio',
                'profile_theme'
            ]);

        });
    }
};