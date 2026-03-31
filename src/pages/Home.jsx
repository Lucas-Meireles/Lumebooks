import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import EbookCard from '../components/catalog/EbookCard'
import AvatarPreview from '../components/avatar/AvatarPreview'
import Button from '../components/ui/Button'
import { apiGet, apiPost } from '../services/api'

const API_STORAGE_URL = 'http://127.0.0.1:8000/storage'

const defaultAvatarConfig = {
  seed: 'LumeBooks',
  top: 'shortHairShortFlat',
  eyes: 'default',
  eyebrows: 'default',
  mouth: 'smile',
  clothing: 'hoodie',
  accessories: 'blank',
  facialHair: 'blank',
  backgroundColor: 'b6e3f4',
}

export default function Home() {
  const navigate = useNavigate()

  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  const [registerData, setRegisterData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authTransitionText, setAuthTransitionText] = useState('')

  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem('auth_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [publications, setPublications] = useState([])
  const [libraryData, setLibraryData] = useState([])
  const [progressData, setProgressData] = useState([])
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('catalog_favorites')
    return saved ? JSON.parse(saved) : []
  })

  const [isLoadingPublications, setIsLoadingPublications] = useState(false)
  const [catalogError, setCatalogError] = useState('')

  const [firstPurchaseCoupon, setFirstPurchaseCoupon] = useState(null)
  const [showFirstPurchaseBanner, setShowFirstPurchaseBanner] = useState(false)
  const [couponCopiedMessage, setCouponCopiedMessage] = useState('')

  useEffect(() => {
    localStorage.setItem('catalog_favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    async function fetchPublications() {
      if (!userData) return

      setIsLoadingPublications(true)
      setCatalogError('')

      try {
        const data = await apiGet('/publications')
        setPublications(Array.isArray(data) ? data : [])
      } catch (error) {
        setCatalogError(error.message || 'Erro ao carregar publicações.')
      } finally {
        setIsLoadingPublications(false)
      }
    }

    fetchPublications()
  }, [userData])

  useEffect(() => {
    async function fetchLibraryData() {
      if (!userData) return

      try {
        const libraryJson = await apiGet('/my-library')
        const normalizedLibrary = Array.isArray(libraryJson) ? libraryJson : []
        setLibraryData(normalizedLibrary)

        const boughtIds = Array.from(
          new Set(
            normalizedLibrary.flatMap((purchase) =>
              purchase.items?.map((item) => item.publication?.id).filter(Boolean) || []
            )
          )
        )

        if (boughtIds.length === 0) {
          setProgressData([])
          return
        }

        const progressResponses = await Promise.all(
          boughtIds.map((publicationId) => apiGet(`/progress/${publicationId}`))
        )

        setProgressData(progressResponses)
      } catch (error) {
        console.error(error)
      }
    }

    fetchLibraryData()
  }, [userData])

  useEffect(() => {
    async function fetchFirstPurchaseCoupon() {
      if (!userData) {
        setFirstPurchaseCoupon(null)
        setShowFirstPurchaseBanner(false)
        return
      }

      try {
        const data = await apiGet('/my-first-purchase-coupon')
        setShowFirstPurchaseBanner(Boolean(data?.show_banner))
        setFirstPurchaseCoupon(data?.coupon || null)
      } catch {
        setShowFirstPurchaseBanner(false)
        setFirstPurchaseCoupon(null)
      }
    }

    fetchFirstPurchaseCoupon()
  }, [userData, libraryData])

  function formatCPF(value) {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  function formatPhone(value) {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)

    if (cleaned.length <= 10) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
    }

    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }

  function getAvatarUrl(avatarPath) {
    if (!avatarPath) return ''
    if (avatarPath.startsWith('http')) return avatarPath
    return `${API_STORAGE_URL}/${avatarPath}`
  }

  function handleLoginChange(event) {
    const { name, value } = event.target
    setLoginData((previousState) => ({
      ...previousState,
      [name]: value,
    }))
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target

    let formattedValue = value

    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    }

    if (name === 'phone') {
      formattedValue = formatPhone(value)
    }

    setRegisterData((previousState) => ({
      ...previousState,
      [name]: formattedValue,
    }))
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const data = await apiPost('/login', loginData)

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      setSuccessMessage('Login realizado com sucesso.')
      setAuthTransitionText('Entrando na sua biblioteca...')
      setIsAuthenticating(true)

      setTimeout(() => {
        setUserData(data.user)
        setIsAuthenticating(false)
        setAuthTransitionText('')
      }, 1200)
    } catch (error) {
      setErrorMessage(error.message || 'Ocorreu um erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (registerData.name.trim().split(/\s+/).length < 2) {
      setErrorMessage('Informe seu nome completo.')
      setIsSubmitting(false)
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      setErrorMessage('As senhas não coincidem.')
      setIsSubmitting(false)
      return
    }

    try {
      const data = await apiPost('/register', {
        name: registerData.name,
        cpf: registerData.cpf,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password,
        password_confirmation: registerData.confirmPassword,
      })

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      setSuccessMessage('Conta criada com sucesso.')
      setAuthTransitionText('Preparando sua conta...')
      setIsAuthenticating(true)

      setTimeout(() => {
        setUserData(data.user)
        setIsAuthenticating(false)
        setAuthTransitionText('')
      }, 1200)
    } catch (error) {
      setErrorMessage(error.message || 'Ocorreu um erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    try {
      await apiPost('/logout')
    } catch (error) {
      console.error(error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')

      setUserData(null)
      setPublications([])
      setLibraryData([])
      setProgressData([])
      setCatalogError('')
      setErrorMessage('')
      setSuccessMessage('')
      setIsAuthenticating(false)
      setAuthTransitionText('')
      setFirstPurchaseCoupon(null)
      setShowFirstPurchaseBanner(false)
      setCouponCopiedMessage('')
      navigate('/')
    }
  }

  async function handleCopyCoupon() {
    if (!firstPurchaseCoupon?.code) return

    try {
      await navigator.clipboard.writeText(firstPurchaseCoupon.code)
      setCouponCopiedMessage('Cupom copiado com sucesso.')
      setTimeout(() => setCouponCopiedMessage(''), 2200)
    } catch {
      setCouponCopiedMessage('Não foi possível copiar o cupom.')
      setTimeout(() => setCouponCopiedMessage(''), 2200)
    }
  }

  function hasPurchased(publicationId) {
    return libraryData.some((purchase) =>
      purchase.items?.some((item) => item.publication?.id === publicationId)
    )
  }

  function getProgress(publicationId) {
    const found = progressData.find(
      (item) => Number(item.publication_id) === Number(publicationId)
    )
    return found?.progress || 0
  }

  function toggleFavorite(publicationId) {
    setFavorites((current) =>
      current.includes(publicationId)
        ? current.filter((id) => id !== publicationId)
        : [...current, publicationId]
    )
  }

  function isFavorite(publicationId) {
    return favorites.includes(publicationId)
  }

  const totalOwned = useMemo(() => {
    const ids = new Set()

    libraryData.forEach((purchase) => {
      purchase.items?.forEach((item) => {
        if (item.publication?.id) {
          ids.add(item.publication.id)
        }
      })
    })

    return ids.size
  }, [libraryData])

  const continueReadingItems = useMemo(() => {
    return publications.filter(
      (publication) =>
        hasPurchased(publication.id) &&
        getProgress(publication.id) > 0 &&
        getProgress(publication.id) < 100
    )
  }, [publications, libraryData, progressData])

  const favoriteItems = useMemo(() => {
    return publications.filter((publication) => isFavorite(publication.id))
  }, [publications, favorites])

  const recommendedItems = useMemo(() => {
    return publications.filter((publication) => !hasPurchased(publication.id))
  }, [publications, libraryData])

  const heroPublication = useMemo(() => {
    return continueReadingItems[0] || favoriteItems[0] || publications[0] || null
  }, [continueReadingItems, favoriteItems, publications])

  const completedItems = useMemo(() => {
    return publications.filter(
      (publication) =>
        hasPurchased(publication.id) &&
        getProgress(publication.id) >= 100
    )
  }, [publications, libraryData, progressData])

  const readingNowCount = continueReadingItems.length
  const completedCount = completedItems.length

  const totalProgressAverage = useMemo(() => {
    if (!progressData.length) return 0

    const total = progressData.reduce((sum, item) => {
      return sum + Number(item?.progress || 0)
    }, 0)

    return Math.round(total / progressData.length)
  }, [progressData])

  const readerLevel = useMemo(() => {
    if (completedCount >= 10) return 'Leitor Elite'
    if (completedCount >= 5) return 'Leitor Pro'
    if (completedCount >= 2) return 'Leitor Frequente'
    return 'Leitor Iniciante'
  }, [completedCount])

  const readerLevelClass = useMemo(() => {
    if (completedCount >= 10) return 'reader-level reader-level--elite'
    if (completedCount >= 5) return 'reader-level reader-level--pro'
    if (completedCount >= 2) return 'reader-level reader-level--frequente'
    return 'reader-level reader-level--iniciante'
  }, [completedCount])

  const profileDisplayName =
    userData?.display_name?.trim() || userData?.name || 'Leitor'

  const profileThemeClass = `theme-${userData?.profile_theme || 'violet'}`
  const profileAvatarUrl = getAvatarUrl(userData?.avatar_path || '')
  const profileAvatarConfig = userData?.avatar_config
    ? {
        ...defaultAvatarConfig,
        ...userData.avatar_config,
        seed: profileDisplayName,
      }
    : {
        ...defaultAvatarConfig,
        seed: profileDisplayName,
      }

  if (isAuthenticating) {
    return (
      <main className="auth-shell">
        <div className="auth-glow auth-glow-left" />
        <div className="auth-glow auth-glow-right" />

        <section className="loading-screen">
          <div className="loading-orb" />
          <div className="loading-spinner" />
          <h2 className="loading-title">LumeBooks</h2>
          <p className="loading-text">{authTransitionText}</p>
        </section>
      </main>
    )
  }

  if (!userData) {
    return (
      <main className="auth-shell">
        <div className="auth-glow auth-glow-left" />
        <div className="auth-glow auth-glow-right" />

        <section className="auth-layout">
          <aside className="showcase-panel">
            <div className="brand-mark">
              <div className="brand-mark__icon">L</div>

              <div className="brand-mark__content">
                <span className="brand-mark__name">LumeBooks</span>
                <span className="brand-mark__tagline">
                  Leitura com presença, valor e elegância.
                </span>
              </div>
            </div>

            <span className="showcase-badge">Plataforma editorial premium</span>

            <h1 className="showcase-title">
              Transforme seu catálogo em uma experiência de leitura elegante.
            </h1>

            <p className="showcase-description">
              Venda, organize e entregue seus e-books com uma identidade forte,
              autenticação segura e uma jornada moderna para seus clientes.
            </p>

            <div className="showcase-grid">
              <article className="showcase-card">
                <strong>Biblioteca inteligente</strong>
                <span>Conteúdos organizados, fluidos e prontos para continuar.</span>
              </article>

              <article className="showcase-card">
                <strong>Acesso seguro</strong>
                <span>Autenticação protegida com token e sessão confiável.</span>
              </article>

              <article className="showcase-card">
                <strong>Base escalável</strong>
                <span>Preparada para catálogo, compra e área premium.</span>
              </article>
            </div>
          </aside>

          <section className="auth-panel">
            <div className="auth-panel-header">
              <span className="auth-overline">
                {isRegisterMode ? 'Cadastro' : 'Login'}
              </span>

              <h2 className="auth-title">
                {isRegisterMode ? 'Crie sua conta' : 'Acesse sua conta'}
              </h2>

              <p className="auth-subtitle">
                {isRegisterMode
                  ? 'Cadastre-se para começar sua experiência na plataforma.'
                  : 'Entre com seus dados para acessar sua biblioteca.'}
              </p>
            </div>

            <div className="auth-switch">
              <button
                type="button"
                className={!isRegisterMode ? 'switch-button active' : 'switch-button'}
                onClick={() => {
                  setErrorMessage('')
                  setSuccessMessage('')
                  setIsRegisterMode(false)
                }}
              >
                Entrar
              </button>

              <button
                type="button"
                className={isRegisterMode ? 'switch-button active' : 'switch-button'}
                onClick={() => {
                  setErrorMessage('')
                  setSuccessMessage('')
                  setIsRegisterMode(true)
                }}
              >
                Cadastrar
              </button>
            </div>

            <div className="card-scene">
              <div className={`card-rotator ${isRegisterMode ? 'is-flipped' : ''}`}>
                <div className="card-face card-front">
                  <form className="auth-form" onSubmit={handleLoginSubmit}>
                    <label className="field-group">
                      <span className="field-label">E-mail</span>
                      <input
                        className="field-input"
                        type="email"
                        name="email"
                        placeholder="seuemail@exemplo.com"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        required
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">Senha</span>

                      <div className="password-wrapper">
                        <input
                          className="field-input password-input"
                          type={showLoginPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Digite sua senha"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                        >
                          {showLoginPassword ? '🙈' : '👁'}
                        </button>
                      </div>
                    </label>

                    {errorMessage && (
                      <div className="feedback-message feedback-error">
                        {errorMessage}
                      </div>
                    )}

                    {successMessage && (
                      <div className="feedback-message feedback-success">
                        {successMessage}
                      </div>
                    )}

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Entrando...' : 'Entrar na plataforma'}
                    </Button>
                  </form>
                </div>

                <div className="card-face card-back">
                  <form className="auth-form" onSubmit={handleRegisterSubmit}>
                    <label className="field-group">
                      <span className="field-label">Nome completo</span>
                      <input
                        className="field-input"
                        type="text"
                        name="name"
                        placeholder="Seu nome completo"
                        value={registerData.name}
                        onChange={handleRegisterChange}
                        required
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">CPF</span>
                      <input
                        className="field-input"
                        type="text"
                        name="cpf"
                        placeholder="000.000.000-00"
                        value={registerData.cpf}
                        onChange={handleRegisterChange}
                        required
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">Telefone</span>
                      <input
                        className="field-input"
                        type="text"
                        name="phone"
                        placeholder="(11) 99999-9999"
                        value={registerData.phone}
                        onChange={handleRegisterChange}
                        required
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">E-mail</span>
                      <input
                        className="field-input"
                        type="email"
                        name="email"
                        placeholder="seuemail@exemplo.com"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        required
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">Senha</span>

                      <div className="password-wrapper">
                        <input
                          className="field-input password-input"
                          type={showRegisterPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Crie sua senha"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                        >
                          {showRegisterPassword ? '🙈' : '👁'}
                        </button>
                      </div>
                    </label>

                    <label className="field-group">
                      <span className="field-label">Confirmar senha</span>

                      <div className="password-wrapper">
                        <input
                          className="field-input password-input"
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Confirme sua senha"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? '🙈' : '👁'}
                        </button>
                      </div>
                    </label>

                    {errorMessage && (
                      <div className="feedback-message feedback-error">
                        {errorMessage}
                      </div>
                    )}

                    {successMessage && (
                      <div className="feedback-message feedback-success">
                        {successMessage}
                      </div>
                    )}

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    )
  }

  const sidebar = (
    <div className={`home-profile-sidebar ${profileThemeClass}`}>
      <div className="brand-mark">
        <div className="brand-mark__icon">L</div>

        <div className="brand-mark__content">
          <span className="brand-mark__name">LumeBooks</span>
          <span className="brand-mark__tagline">
            Leitura com presença, valor e elegância.
          </span>
        </div>
      </div>

      <span className="showcase-badge">Sessão iniciada</span>

      <div className="home-profile-hero">
        <div className="home-profile-avatar-wrap">
          {profileAvatarUrl ? (
            <>
              <img
                src={profileAvatarUrl}
                alt={profileDisplayName}
                className="home-profile-avatar"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                  const fallback = event.currentTarget.nextElementSibling
                  if (fallback) {
                    fallback.style.display = 'flex'
                  }
                }}
              />

              <div
                className="home-profile-avatar home-profile-avatar--fallback"
                style={{ display: 'none' }}
              >
                {profileDisplayName?.slice(0, 2).toUpperCase()}
              </div>
            </>
          ) : (
            <div className="home-profile-avatar-builder">
              <AvatarPreview config={profileAvatarConfig} size="lg" />
            </div>
          )}
        </div>

        <div className="home-profile-hero__content">
          <span className={readerLevelClass}>{readerLevel}</span>

          <h1 className="showcase-title">
            Bem-vindo de volta, {profileDisplayName}.
          </h1>

          <p className="showcase-description">
            {userData?.bio?.trim()
              ? userData.bio
              : 'Sua jornada de leitura está evoluindo. Continue de onde parou.'}
          </p>
        </div>

        <div className="reader-progress-card">
          <div className="reader-progress-card__top">
            <strong>Progresso geral</strong>
            <span>{totalProgressAverage}%</span>
          </div>

          <div className="reader-progress-bar">
            <div
              className="reader-progress-bar__fill"
              style={{ width: `${totalProgressAverage}%` }}
            />
          </div>

          <small>Média geral das suas leituras.</small>
        </div>
      </div>

      <div className="showcase-grid home-stats-grid">
        <article className="showcase-card">
          <strong>Conta ativa</strong>
          <span>{userData.email}</span>
        </article>

        <article className="showcase-card">
          <strong>Biblioteca</strong>
          <span>{totalOwned} conteúdos adquiridos</span>
        </article>

        <article className="showcase-card">
          <strong>Lendo agora</strong>
          <span>{readingNowCount} em andamento</span>
        </article>

        <article className="showcase-card">
          <strong>Concluídos</strong>
          <span>{completedCount} finalizados</span>
        </article>
      </div>

      <div className="account-actions">
        <Button onClick={() => navigate('/my-library')}>
          Minha biblioteca
        </Button>

        <Button onClick={() => navigate('/profile')}>
          Meu perfil
        </Button>

        {userData?.is_admin && (
          <Button onClick={() => navigate('/admin')}>
            Painel Admin
          </Button>
        )}

        <Button variant="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <main className="auth-shell auth-shell--catalog">
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <DashboardLayout sidebar={sidebar}>
        {showFirstPurchaseBanner && firstPurchaseCoupon && (
          <section className="catalog-section">
            <div className="first-purchase-banner">
              <div className="first-purchase-banner__content">
                <span className="first-purchase-banner__badge">Oferta de boas-vindas</span>
                <h3 className="first-purchase-banner__title">
                  Sua primeira compra pode sair com desconto especial
                </h3>
                <p className="first-purchase-banner__text">
                  Use o cupom <strong>{firstPurchaseCoupon.code}</strong> e aproveite sua estreia na
                  plataforma com uma vantagem exclusiva.
                </p>
              </div>

              <div className="first-purchase-banner__actions">
                <button
                  type="button"
                  className="first-purchase-banner__button"
                  onClick={handleCopyCoupon}
                >
                  Copiar cupom
                </button>

                {couponCopiedMessage && (
                  <span className="first-purchase-banner__copied">
                    {couponCopiedMessage}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {heroPublication && (
          <section className="catalog-section">
            <div className="catalog-section__header">
              <div>
                <span className="auth-overline">Destaque</span>
                <h3>{heroPublication.title}</h3>
              </div>
            </div>

            <div className="dashboard-empty">
              {heroPublication.short_description || 'Seu próximo conteúdo em destaque.'}
            </div>
          </section>
        )}

        <section className="catalog-section">
          <div className="catalog-section__header">
            <div>
              <span className="auth-overline">Continue lendo</span>
              <h3>Seu ritmo continua daqui</h3>
            </div>
          </div>

          {continueReadingItems.length === 0 ? (
            <div className="dashboard-empty">Você ainda não iniciou nenhuma leitura.</div>
          ) : (
            <div className="catalog-grid premium-catalog-grid">
              {continueReadingItems.map((publication) => (
                <EbookCard
                  key={`continue-${publication.id}`}
                  publication={publication}
                  purchased={hasPurchased(publication.id)}
                  progress={getProgress(publication.id)}
                  isFavorite={isFavorite(publication.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </section>

        <section className="catalog-section">
          <div className="catalog-section__header">
            <div>
              <span className="auth-overline">Recomendados</span>
              <h3>Seleções para explorar</h3>
            </div>
          </div>

          {recommendedItems.length === 0 ? (
            <div className="dashboard-empty">Você já adquiriu todos os conteúdos disponíveis.</div>
          ) : (
            <div className="catalog-grid premium-catalog-grid">
              {recommendedItems.map((publication) => (
                <EbookCard
                  key={`recommended-${publication.id}`}
                  publication={publication}
                  purchased={hasPurchased(publication.id)}
                  progress={getProgress(publication.id)}
                  isFavorite={isFavorite(publication.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </section>

        {favoriteItems.length > 0 && (
          <section className="catalog-section">
            <div className="catalog-section__header">
              <div>
                <span className="auth-overline">Favoritos</span>
                <h3>Seus títulos salvos</h3>
              </div>
            </div>

            <div className="catalog-grid premium-catalog-grid">
              {favoriteItems.map((publication) => (
                <EbookCard
                  key={`favorite-${publication.id}`}
                  publication={publication}
                  purchased={hasPurchased(publication.id)}
                  progress={getProgress(publication.id)}
                  isFavorite={isFavorite(publication.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        <section className="catalog-section">
          <div className="catalog-section__header">
            <div>
              <span className="auth-overline">Todo o catálogo</span>
              <h3>Explore todos os títulos</h3>
            </div>
          </div>

          {isLoadingPublications ? (
            <div className="dashboard-empty">Carregando catálogo...</div>
          ) : catalogError ? (
            <div className="feedback-message feedback-error">{catalogError}</div>
          ) : publications.length === 0 ? (
            <div className="dashboard-empty">Nenhuma publicação encontrada no momento.</div>
          ) : (
            <div className="catalog-grid premium-catalog-grid">
              {publications.map((publication) => (
                <EbookCard
                  key={publication.id}
                  publication={publication}
                  purchased={hasPurchased(publication.id)}
                  progress={getProgress(publication.id)}
                  isFavorite={isFavorite(publication.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </section>
      </DashboardLayout>
    </main>
  )
}