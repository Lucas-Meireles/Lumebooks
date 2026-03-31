import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet } from '../services/api'
import './CertificateVerify.css'

export default function CertificateVerify() {
  const navigate = useNavigate()
  const { code: routeCode } = useParams()

  const [code, setCode] = useState(routeCode || '')
  const [certificate, setCertificate] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (routeCode) {
      handleVerify(routeCode)
    }
  }, [routeCode])

  async function handleVerify(customCode) {
    const finalCode = String(customCode || code).trim().toUpperCase()

    if (!finalCode) {
      setErrorMessage('Digite um código para validar.')
      setCertificate(null)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setCertificate(null)

    try {
      const data = await apiGet(`/certificate/verify/${finalCode}`)
      setCertificate(data.certificate)
      setCode(finalCode)
    } catch (error) {
      setErrorMessage(error.message || 'Certificado inválido.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    handleVerify()
  }

  return (
    <main className="certificate-verify-page">
      <div className="certificate-verify-glow certificate-verify-glow-left" />
      <div className="certificate-verify-glow certificate-verify-glow-right" />

      <section className="certificate-verify-shell">
        <aside className="certificate-verify-sidebar">
          <button
            className="certificate-verify-back"
            type="button"
            onClick={() => navigate('/')}
          >
            ← Voltar
          </button>

          <span className="certificate-verify-badge">Validação oficial</span>

          <h1 className="certificate-verify-title">
            Validar certificado
          </h1>

          <p className="certificate-verify-description">
            Digite o código do certificado para verificar autenticidade,
            emissão e dados do aluno.
          </p>

          <form className="certificate-verify-form" onSubmit={handleSubmit}>
            <label className="certificate-verify-field">
              <span>Código do certificado</span>
              <input
                type="text"
                placeholder="Ex: ABCD1234EFGH"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
            </label>

            <button
              className="certificate-verify-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Validando...' : 'Validar certificado'}
            </button>
          </form>

          {errorMessage && (
            <div className="certificate-verify-feedback certificate-verify-feedback-error">
              {errorMessage}
            </div>
          )}
        </aside>

        <section className="certificate-verify-content">
          {!certificate && !errorMessage && !isLoading && (
            <div className="certificate-verify-placeholder">
              <div className="certificate-verify-placeholder__icon">✓</div>
              <h2>Pronto para validar</h2>
              <p>
                Informe o código do certificado para consultar autenticidade,
                aluno, curso e data de emissão.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="certificate-verify-placeholder">
              <div className="certificate-verify-placeholder__icon is-loading">⏳</div>
              <h2>Validando certificado</h2>
              <p>
                Estamos consultando os dados oficiais deste certificado.
              </p>
            </div>
          )}

          {certificate && !isLoading && (
            <div className="certificate-card">
              <div className="certificate-card__header">
                <span className="certificate-card__status">Certificado válido</span>
                <h2>{certificate.course_name}</h2>
                <p>
                  Este certificado foi localizado com sucesso na plataforma.
                </p>
              </div>

              <div className="certificate-card__grid">
                <article className="certificate-card__item">
                  <span>Aluno</span>
                  <strong>{certificate.student_name}</strong>
                </article>

                <article className="certificate-card__item">
                  <span>CPF</span>
                  <strong>{certificate.student_cpf || 'Não informado'}</strong>
                </article>

                <article className="certificate-card__item">
                  <span>Código</span>
                  <strong>{certificate.certificate_code}</strong>
                </article>

                <article className="certificate-card__item">
                  <span>Emitido em</span>
                  <strong>
                    {certificate.issued_at
                      ? new Date(certificate.issued_at).toLocaleString('pt-BR')
                      : 'Não informado'}
                  </strong>
                </article>
              </div>

              <div className="certificate-card__actions">
                <button
                  className="certificate-verify-button"
                  type="button"
                  onClick={() => navigate('/')}
                >
                  Ir para a plataforma
                </button>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}