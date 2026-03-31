import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet } from '../services/api'
import './EbookDetail.css'

const API_STORAGE_URL = 'http://127.0.0.1:8000/storage'

export default function EbookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ebook, setEbook] = useState(null)
  const [libraryData, setLibraryData] = useState([])
  const [progressData, setProgressData] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchDetailData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [ebookData, libraryJson] = await Promise.all([
          apiGet(`/publications/${id}`),
          apiGet('/my-library'),
        ])

        setEbook(ebookData)
        setLibraryData(Array.isArray(libraryJson) ? libraryJson : [])

        try {
          const progressJson = await apiGet(`/progress/${id}`)
          setProgressData(progressJson)
        } catch {
          setProgressData(null)
        }
      } catch (error) {
        setErrorMessage(error.message || 'Não foi possível carregar os detalhes do ebook.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetailData()
  }, [id])

  function hasPurchased(publicationId) {
    return libraryData.some((purchase) =>
      purchase.items?.some((item) => item.publication?.id === Number(publicationId)),
    )
  }

  function getCoverUrl(coverPath) {
    if (!coverPath) return null
    if (coverPath.startsWith('http')) return coverPath
    return `${API_STORAGE_URL}/${coverPath}`
  }

  const purchased = useMemo(() => {
    return hasPurchased(id)
  }, [libraryData, id])

  const progress = useMemo(() => {
    return progressData?.progress || 0
  }, [progressData])

  const actionLabel = useMemo(() => {
    if (purchased && progress >= 100) return 'Revisar leitura'
    if (purchased && progress > 0) return 'Continuar leitura'
    if (purchased) return 'Ler agora'
    return 'Comprar agora'
  }, [purchased, progress])

  function handleMainAction() {
    if (purchased) {
      navigate(`/reader/${id}`)
      return
    }

    navigate(`/checkout/${id}`)
  }

  if (isLoading) {
    return (
      <main className="ebook-detail-page">
        <section className="ebook-detail-feedback">
          Carregando detalhes do ebook...
        </section>
      </main>
    )
  }

  if (errorMessage || !ebook) {
    return (
      <main className="ebook-detail-page">
        <section className="ebook-detail-feedback ebook-detail-feedback-error">
          <strong>{errorMessage || 'Ebook não encontrado.'}</strong>

          <div className="ebook-detail-feedback-actions">
            <button
              className="ebook-detail-secondary-button"
              type="button"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </button>
          </div>
        </section>
      </main>
    )
  }

  const coverUrl = getCoverUrl(ebook.cover_path)

  return (
    <main className="ebook-detail-page">
      <div className="ebook-detail-glow ebook-detail-glow-left" />
      <div className="ebook-detail-glow ebook-detail-glow-right" />

      <section className="ebook-detail-shell">
        <aside className="ebook-detail-sidebar">
          <button
            className="ebook-detail-back-button"
            type="button"
            onClick={() => navigate(-1)}
          >
            ← Voltar
          </button>

          <div
            className={`ebook-detail-cover ${coverUrl ? 'has-image' : ''}`}
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          >
            <span className="ebook-detail-cover-badge">
              {purchased ? 'Adquirido' : 'Disponível'}
            </span>

            <div className="ebook-detail-cover-overlay">
              <h1>{ebook.title}</h1>
              <span>{ebook.category?.name || 'Categoria'}</span>
            </div>
          </div>

          <div className="ebook-detail-stat-card">
            <span>Preço</span>
            <strong>R$ {Number(ebook.price || 0).toFixed(2)}</strong>
          </div>

          <div className="ebook-detail-stat-card">
            <span>Status</span>
            <strong>
              {purchased
                ? progress >= 100
                  ? 'Concluído'
                  : progress > 0
                  ? 'Em andamento'
                  : 'Pronto para leitura'
                : 'Aguardando compra'}
            </strong>
          </div>

          {purchased && (
            <div className="ebook-detail-progress-card">
              <div className="ebook-detail-progress-top">
                <span>Seu progresso</span>
                <strong>{progress}%</strong>
              </div>

              <div className="ebook-detail-progress-bar">
                <div
                  className="ebook-detail-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="ebook-detail-actions">
            <button
              className="ebook-detail-primary-button"
              type="button"
              onClick={handleMainAction}
            >
              {actionLabel}
            </button>

            <button
              className="ebook-detail-secondary-button"
              type="button"
              onClick={() => navigate('/my-library')}
            >
              Minha biblioteca
            </button>
          </div>
        </aside>

        <section className="ebook-detail-content">
          <div className="ebook-detail-header">
            <span className="ebook-detail-overline">Detalhes do conteúdo</span>
            <h2>{ebook.title}</h2>
            <p>
              Veja as informações completas antes de comprar ou continuar sua leitura.
            </p>
          </div>

          <div className="ebook-detail-card">
            <h3>Descrição resumida</h3>
            <p>{ebook.short_description || 'Sem descrição resumida.'}</p>
          </div>

          <div className="ebook-detail-card">
            <h3>Descrição completa</h3>
            <p>{ebook.full_description || 'Sem descrição completa disponível.'}</p>
          </div>

          <div className="ebook-detail-grid">
            <article className="ebook-detail-mini-card">
              <span>Categoria</span>
              <strong>{ebook.category?.name || 'Categoria não informada'}</strong>
            </article>

            <article className="ebook-detail-mini-card">
              <span>Editora / Autor</span>
              <strong>{ebook.publisher?.name || 'Não informado'}</strong>
            </article>

            <article className="ebook-detail-mini-card">
              <span>Slug</span>
              <strong>{ebook.slug || 'Não informado'}</strong>
            </article>

            <article className="ebook-detail-mini-card">
              <span>Publicação</span>
              <strong>{ebook.published_at ? 'Publicado' : 'Indisponível'}</strong>
            </article>
          </div>
        </section>
      </section>
    </main>
  )
}