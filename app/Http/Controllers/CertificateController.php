<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Publication;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateController extends Controller
{
    public function show($publicationId)
    {
        $certificate = Certificate::where('user_id', auth()->id())
            ->where('publication_id', $publicationId)
            ->with('publication')
            ->first();

        if (!$certificate) {
            return response()->json([
                'message' => 'Certificado ainda não emitido.'
            ], 404);
        }

        return response()->json($certificate);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'publication_id' => ['required', 'integer', 'exists:publications,id'],
        ]);

        $user = auth()->user();
        $publication = Publication::findOrFail($request->publication_id);

        $progress = UserProgress::where('user_id', $user->id)
            ->where('publication_id', $publication->id)
            ->first();

        if (!$progress || $progress->progress < 100) {
            return response()->json([
                'message' => 'Complete 100% da leitura para emitir o certificado.'
            ], 422);
        }

        $cpf = optional($user->customer)->cpf;

        $certificate = Certificate::firstOrCreate(
            [
                'user_id' => $user->id,
                'publication_id' => $publication->id,
            ],
            [
                'certificate_code' => strtoupper(Str::random(12)),
                'student_name' => $user->name,
                'student_cpf' => $cpf,
                'course_name' => $publication->title,
                'issued_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Certificado emitido com sucesso.',
            'certificate' => $certificate,
        ]);
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

        try {
            $verifyUrl = 'http://localhost:5173/certificate/verify/' . $certificate->certificate_code;

            $qrCode = QrCode::format('svg')
                ->size(120)
                ->generate($verifyUrl);

            $pdf = Pdf::loadView('certificates', [
                'certificate' => $certificate,
                'verifyUrl' => $verifyUrl,
                'qrCode' => $qrCode,
            ])->setPaper('a4', 'landscape');

            return response($pdf->output())
                ->header('Content-Type', 'application/pdf')
                ->header(
                    'Content-Disposition',
                    'attachment; filename="certificado-' . $certificate->certificate_code . '.pdf"'
                );
        } catch (\Throwable $e) {
            \Log::error('Erro ao gerar PDF do certificado', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'message' => 'Erro ao gerar certificado.'
            ], 500);
        }
    }

    public function verify($code)
    {
        $certificate = Certificate::where('certificate_code', $code)
            ->with('publication', 'user')
            ->first();

        if (!$certificate) {
            return response()->json([
                'valid' => false,
                'message' => 'Certificado inválido.'
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'certificate' => $certificate,
        ]);
    }
}