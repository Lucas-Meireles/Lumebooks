<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Certificado de Conclusão</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f3e7;
            color: #111827;
        }

        .page {
            padding: 28px;
            text-align: center;
            page-break-after: avoid;
        }

        .box {
            border: 8px solid #4f46e5;
            padding: 28px 26px 24px;
            position: relative;
            background: #fffdf7;
            page-break-inside: avoid;
        }

        .box::before {
            content: '';
            position: absolute;
            top: 10px;
            right: 10px;
            bottom: 10px;
            left: 10px;
            border: 2px solid #c7d2fe;
            pointer-events: none;
        }

        .seal {
            position: absolute;
            top: 16px;
            right: 20px;
            width: 84px;
            height: 84px;
            border-radius: 50%;
            border: 3px solid #f59e0b;
            color: #b45309;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            line-height: 1.25;
            padding-top: 20px;
            box-sizing: border-box;
            transform: rotate(-15deg);
            background: #fff7ed;
        }

        .brand {
            font-size: 15px;
            color: #4f46e5;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 16px;
        }

        .title {
            font-size: 34px;
            font-weight: bold;
            margin-bottom: 16px;
            letter-spacing: 1px;
        }

        .text {
            font-size: 16px;
            margin: 10px 0;
        }

        .student-name {
            font-size: 28px;
            font-weight: bold;
            margin: 16px 0;
            letter-spacing: 2px;
            color: #1e293b;
        }

        .course-name {
            font-size: 22px;
            font-weight: bold;
            color: #4f46e5;
            margin: 18px 0;
            text-decoration: underline;
        }

        .meta {
            margin-top: 20px;
            font-size: 14px;
        }

        .footer {
            margin-top: 26px;
            width: 100%;
            border-collapse: collapse;
        }

        .footer td {
            vertical-align: middle;
        }

        .footer-left {
            width: 33%;
            text-align: left;
        }

        .footer-center {
            width: 34%;
            text-align: center;
        }

        .footer-right {
            width: 33%;
            text-align: right;
        }

        .signature-line {
            width: 180px;
            border-top: 1px solid #111827;
            margin-bottom: 8px;
        }

        .signature-label {
            font-size: 12px;
            color: #374151;
        }

        .code {
            font-size: 13px;
            line-height: 1.6;
        }

        .code strong {
            letter-spacing: 2px;
        }

        .qr-box {
            text-align: center;
        }

        .qr-box svg {
            width: 72px;
            height: 72px;
        }

        .qr-text {
            margin-top: 4px;
            font-size: 11px;
            color: #4b5563;
        }

        .verify-link {
            margin-top: 6px;
            font-size: 9px;
            color: #6b7280;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="box">
            <div class="seal">
                CERTIFICADO<br>OFICIAL
            </div>

            <div class="brand">LUMEBOOKS</div>

            <div class="title">Certificado de Conclusão</div>

            <div class="text">Certificamos que</div>

            <div class="student-name">
                {{ strtoupper($certificate->student_name ?? 'ALUNO') }}
            </div>

            <div class="text">
                CPF:
                <strong>{{ $certificate->student_cpf ?: 'Não informado' }}</strong>
            </div>

            <div class="text">concluiu com êxito o curso / e-book</div>

            <div class="course-name">
                {{ $certificate->course_name ?? 'Curso' }}
            </div>

            <div class="meta">
                Emitido em:
                <strong>
                    {{ $certificate->issued_at ? $certificate->issued_at->format('d/m/Y H:i') : now()->format('d/m/Y H:i') }}
                </strong>
            </div>

            <table class="footer">
                <tr>
                    <td class="footer-left">
                        <div class="signature-line"></div>
                        <div class="signature-label">Equipe LumeBooks</div>
                    </td>

                    <td class="footer-center">
                        <div class="qr-box">
                            {!! $qrCode !!}
                            <div class="qr-text">Escaneie para validar</div>
                        </div>
                    </td>

                    <td class="footer-right">
                        <div class="code">
                            Código:<br>
                            <strong>{{ $certificate->certificate_code }}</strong>
                        </div>

                        <div class="verify-link">
                            {{ $verifyUrl }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>