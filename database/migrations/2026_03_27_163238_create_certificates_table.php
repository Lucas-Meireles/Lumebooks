<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('publication_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('certificate_code')->unique();
            $table->string('student_name');
            $table->string('student_cpf', 20)->nullable();
            $table->string('course_name');
            $table->timestamp('issued_at');

            $table->timestamps();

            $table->unique(['user_id', 'publication_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
    public function download($publicationId)
{
    $certificate = Certificate::where('user_id', auth()->id())
        ->where('publication_id', $publicationId)
        ->first();

    if (!$certificate) {
        return response()->json([
            'message' => 'Certificado não encontrado.'
        ], 404);
    }

    $pdf = Pdf::loadView('certificates.pdf', [
        'certificate' => $certificate,
    ])->setPaper('a4', 'landscape');

    return response($pdf->output(), 200)
        ->header('Content-Type', 'application/pdf')
        ->header('Content-Disposition', 'attachment; filename="certificado.pdf"');
}
};