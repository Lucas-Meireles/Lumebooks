import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'

const API_STORAGE_URL = 'http://127.0.0.1:8000/storage'

export default function EbookCard({
  publication,
  purchased = false,
  progress = 0,
  onToggleFavorite,
  isFavorite = false,
}) {
  const navigate = useNavigate()

  function getCoverUrl(coverPath) {
    if (!coverPath) return null
    if (coverPath.startsWith('http')) return coverPath
    return `${API_STORAGE_URL}/${coverPath}`
  }

  function getActionLabel() {
    if (purchased && progress >= 100) return 'Revisar'
    if (purchased && progress > 0) return 'Continuar leitura'
    if (purchased) return 'Ler agora'
    return 'Comprar agora'
  }

  function getSmartBadge() {
    if (purchased && progress >= 100) return 'Concluído'
    if (purchased && progress > 0) return 'Em andamento'
    if (purchased) return 'Na sua biblioteca'
    return 'E-book premium'
  }

  function handleMainAction() {
    if (purchased) {
      navigate(`/reader/${publication.id}`)
      return
    }

    navigate(`/checkout/${publication.id}`)
  }

  const coverUrl = getCoverUrl(publication.cover_path)

  return (
    <article className="catalog-card premium-catalog-card">
      <div className="catalog-card-visual">
        <div
          className={`catalog-cover premium-catalog-cover ${coverUrl ? 'has-image' : ''}`}
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        >
          {onToggleFavorite && (
            <button
              type="button"
              className={`favorite-button ${isFavorite ? 'active' : ''} card-favorite-button`}
              onClick={() => onToggleFavorite(publication.id)}
              aria-label="Favoritar"
            >
              ♥
            </button>
          )}

          <span className="catalog-cover__label">{getSmartBadge()}</span>

          <div className="catalog-cover__overlay">
            <h3 className="catalog-cover__title">{publication.title}</h3>
            <span className="catalog-cover__category">
              {publication.category?.name || 'Categoria'}
            </span>
          </div>
        </div>
      </div>

      <div className="catalog-content premium-catalog-content">
        <div className="premium-catalog-top">
          <div>
            <h3 className="catalog-title">{publication.title}</h3>
            <p className="catalog-description">
              {publication.short_description || 'Sem descrição resumida.'}
            </p>
          </div>

          <span className="premium-catalog-price">
            R$ {Number(publication.price || 0).toFixed(2)}
          </span>
        </div>

        {purchased && (
          <div className="premium-progress-block">
            <div className="premium-progress-top">
              <span>Progresso</span>
              <strong>{progress}%</strong>
            </div>

            <ProgressBar value={progress} />
          </div>
        )}

        <div className="premium-catalog-footer">
          <span className="premium-catalog-badge">
            {purchased ? 'Conteúdo liberado' : 'Disponível para compra'}
          </span>

          <div className="premium-catalog-actions">
            <Button className="premium-main-button" onClick={handleMainAction}>
              {getActionLabel()}
            </Button>

            <Button
              variant="secondary"
              className="premium-secondary-button"
              onClick={() => navigate(`/ebook/${publication.id}`)}
            >
              Saiba mais
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}