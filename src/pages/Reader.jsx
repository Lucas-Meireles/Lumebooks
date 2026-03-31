import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost, API_BASE_URL } from '../services/api'
import './Reader.css'

export default function Reader() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ebook, setEbook] = useState(null)
  const [progress, setProgress] = useState(0)
  const [pdfUrl, setPdfUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [certificate, setCertificate] = useState(null)
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false)
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false)

  useEffect(() => {
    async function loadReader() {
      setIsLoading(true)

      try {
        if (!id) {
          throw new Error('ID do ebook não encontrado.')
        }

        const token = localStorage.getItem('auth_token')

        const [ebookData, progressData] = await Promise.all([
          apiGet(`/publications/${Number(id)}`),
          apiGet(`/progress/${Number(id)}`),
        ])

        setEbook(ebookData)
        setProgress(progressData.progress || 0)
        setPdfUrl(`${API_BASE_URL}/reader-file/${Number(id)}?token=${token}`)

        try {
          const cert = await apiGet(`/certificate/${Number(id)}`)
          setCertificate(cert)
        } catch {
          setCertificate(null)
        }
      } catch (error) {
        console.error('Erro Reader:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReader()
  }, [id])

  useEffect(() => {
    async function autoGenerateCertificate() {
      if (!id) return
      if (progress < 100) return
      if (certificate) return
      if (isGeneratingCertificate) return

      try {
        setIsGeneratingCertificate(true)

        const data = await apiPost('/certificate/generate', {
          publication_id: Number(id),
        })

        setCertificate(data.certificate)
      } catch (error) {
        console.error('Erro ao gerar certificado automaticamente:', error)
      } finally {
        setIsGeneratingCertificate(false)
      }
    }

    autoGenerateCertificate()
  }, [progress, certificate, isGeneratingCertificate, id])

  async function saveProgress(value) {
    if (!id) return

    const safe = Math.max(0, Math.min(100, value))
    setProgress(safe)

    try {
      await apiPost('/progress', {
        publication_id: Number(id),
        progress: safe,
      })
    } catch (error) {
      console.error('Erro ao salvar progresso:', error)
    }
  }

  async function handleGenerateCertificate() {
    if (!id) {
      alert('ID do ebook inválido.')
      return
    }

    setIsGeneratingCertificate(true)

    try {
      const data = await apiPost('/certificate/generate', {
        publication_id: Number(id),
      })

      setCertificate(data.certificate)
      alert('Certificado emitido com sucesso 🎉')
    } catch (error) {
      alert(error.message || 'Erro ao emitir certificado')
    } finally {
      setIsGeneratingCertificate(false)
    }
  }

  async function handleDownloadCertificate() {
    if (!id) {
      alert('ID inválido')
      return
    }

    setIsDownloadingCertificate(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/certificate/${Number(id)}/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      )

      const contentType = response.headers.get('content-type')

      if (!response.ok) {
        let message = 'Não foi possível baixar o certificado.'

        try {
          const errorData = await response.json()
          message = errorData.message || message
        } catch {
          //
        }

        throw new Error(message)
      }

      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('O servidor não retornou um PDF válido.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `certificado-${Number(id)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro download certificado:', error)
      alert(error.message || 'Não foi possível baixar o certificado.')
    } finally {
      setIsDownloadingCertificate(false)
    }
  }

  const status = useMemo(() => {
    if (progress >= 100) return 'Concluído'
    if (progress >= 50) return 'Em andamento'
    if (progress > 0) return 'Iniciado'
    return 'Não iniciado'
  }, [progress])

  if (isLoading) {
    return <div className="reader-empty">Abrindo ebook...</div>
  }

  if (!ebook) {
    return <div className="reader-empty">Erro ao carregar</div>
  }

  return (
    <main className="reader-page">
      <aside className="reader-sidebar">
        <button
          className="reader-back-button"
          onClick={() => navigate('/my-library')}
        >
          ← Voltar
        </button>

        <h2 className="reader-title">{ebook.title}</h2>

        <p className="reader-status">
          Status: <strong>{status}</strong>
        </p>

        <div className="reader-progress-card">
          <div className="reader-progress-top">
            <span>Progresso</span>
            <strong>{progress}%</strong>
          </div>

          <div className="reader-progress">
            <div
              className="reader-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="reader-actions">
            <button
              className="reader-step-button"
              onClick={() => saveProgress(progress - 10)}
            >
              -10%
            </button>

            <button
              className="reader-step-button"
              onClick={() => saveProgress(progress + 10)}
            >
              +10%
            </button>
          </div>
        </div>

        {progress >= 100 && (
          <div className="reader-certificate-box">
            <strong className="reader-certificate-title">
              🎓 Certificado liberado
            </strong>

            {certificate ? (
              <>
                <div className="reader-certificate-meta">
                  <small><b>Aluno:</b> {certificate.student_name}</small>
                  <small><b>CPF:</b> {certificate.student_cpf || 'Não informado'}</small>
                  <small><b>Curso:</b> {certificate.course_name}</small>
                  <small><b>Código:</b> {certificate.certificate_code}</small>
                </div>

                <button
                  className="reader-certificate-button"
                  onClick={handleDownloadCertificate}
                  disabled={isDownloadingCertificate}
                >
                  {isDownloadingCertificate ? 'Baixando...' : 'Baixar certificado'}
                </button>
              </>
            ) : (
              <button
                className="reader-certificate-button"
                onClick={handleGenerateCertificate}
                disabled={isGeneratingCertificate}
              >
                {isGeneratingCertificate ? 'Gerando...' : 'Emitir certificado'}
              </button>
            )}
          </div>
        )}
      </aside>

      <section className="reader-content">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="reader-frame"
            title="ebook"
          />
        ) : (
          <p className="reader-loading-pdf">Carregando PDF...</p>
        )}
      </section>
    </main>
  )
}