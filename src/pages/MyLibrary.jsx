import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../services/api'
import EbookCard from '../components/catalog/EbookCard'
import './MyLibrary.css'

export default function MyLibrary() {
  const navigate = useNavigate()

  const [libraryData, setLibraryData] = useState([])
  const [progressData, setProgressData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchLibrary() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const libraryJson = await apiGet('/my-library')

        const normalized = Array.isArray(libraryJson) ? libraryJson : []
        setLibraryData(normalized)

        const boughtIds = Array.from(
          new Set(
            normalized.flatMap((purchase) =>
              purchase.items?.map((item) => item.publication?.id).filter(Boolean) || []
            )
          )
        )

        if (boughtIds.length === 0) {
          setProgressData([])
          return
        }

        const progressResponses = await Promise.all(
          boughtIds.map((id) => apiGet(`/progress/${id}`))
        )

        setProgressData(progressResponses)
      } catch (error) {
        setErrorMessage(error.message || 'Erro ao carregar biblioteca.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLibrary()
  }, [])

  const purchasedPublications = useMemo(() => {
    const map = new Map()

    libraryData.forEach((purchase) => {
      purchase.items?.forEach((item) => {
        if (item.publication) {
          map.set(item.publication.id, item.publication)
        }
      })
    })

    return Array.from(map.values())
  }, [libraryData])

  function getProgress(publicationId) {
    const found = progressData.find(
      (p) => Number(p.publication_id) === Number(publicationId)
    )
    return found?.progress || 0
  }

  if (isLoading) {
    return <div className="library-empty">Carregando sua biblioteca...</div>
  }

  if (errorMessage) {
    return <div className="library-empty">{errorMessage}</div>
  }

  if (purchasedPublications.length === 0) {
    return (
      <div className="library-empty">
        Você ainda não comprou nenhum ebook 📭
      </div>
    )
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <h1>Minha Biblioteca</h1>
        <button onClick={() => navigate('/')}>Voltar</button>
      </header>

      <div className="catalog-grid">
        {purchasedPublications.map((publication) => (
          <EbookCard
            key={publication.id}
            publication={publication}
            purchased={true}
            progress={getProgress(publication.id)}
          />
        ))}
      </div>
    </main>
  )
}