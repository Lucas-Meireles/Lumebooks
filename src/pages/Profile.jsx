import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiDelete, apiGet, apiPost } from '../services/api'
import AvatarPreview from '../components/avatar/AvatarPreview'
import AvatarBuilder from '../components/avatar/AvatarBuilder'
import './Profile.css'

const API_STORAGE_URL = 'http://127.0.0.1:8000/storage'

const themeOptions = [
  { value: 'violet', label: 'Violeta' },
  { value: 'blue', label: 'Azul' },
  { value: 'emerald', label: 'Esmeralda' },
  { value: 'rose', label: 'Rose' },
  { value: 'amber', label: 'Âmbar' },
]

const defaultAvatarConfig = {
  seed: 'LumeBooks',
  top: 'shortFlat',
  eyes: 'default',
  eyebrows: 'default',
  mouth: 'smile',
  clothing: 'hoodie',
  accessories: 'none',
  facialHair: 'none',
  skinColor: 'ligth',
  backgroundColor: 'b6e3f4',
}

export default function Profile() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    profile_theme: 'violet',
    phone: '',
    avatar: null,
  })

  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarConfig, setAvatarConfig] = useState(defaultAvatarConfig)

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await apiGet('/profile')

        setProfile(data)

        setFormData({
          display_name: data?.display_name || '',
          bio: data?.bio || '',
          profile_theme: data?.profile_theme || 'violet',
          phone: data?.phone || '',
          avatar: null,
        })

        const savedAvatarConfig = data?.avatar_config
          ? {
              ...defaultAvatarConfig,
              ...data.avatar_config,
              seed:
                data?.display_name ||
                data?.name ||
                data?.avatar_config?.seed ||
                'LumeBooks',
            }
          : {
              ...defaultAvatarConfig,
              seed: data?.display_name || data?.name || 'LumeBooks',
            }

        setAvatarConfig(savedAvatarConfig)
      } catch (error) {
        setErrorMessage(error.message || 'Não foi possível carregar seu perfil.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const avatarUrl = useMemo(() => {
    if (avatarPreview) return avatarPreview

    if (profile?.avatar_path) {
      if (profile.avatar_path.startsWith('http')) return profile.avatar_path
      return `${API_STORAGE_URL}/${profile.avatar_path}`
    }

    return ''
  }, [avatarPreview, profile])

  const displayNamePreview = useMemo(() => {
    return (
      formData.display_name?.trim() ||
      profile?.display_name ||
      profile?.name ||
      'Seu perfil'
    )
  }, [formData.display_name, profile])

  const bioPreview = useMemo(() => {
    return (
      formData.bio?.trim() ||
      profile?.bio ||
      'Adicione uma bio para personalizar seu perfil e deixar sua conta com mais identidade.'
    )
  }, [formData.bio, profile])

  const selectedThemeLabel = useMemo(() => {
    return (
      themeOptions.find(
        (item) => item.value === (formData.profile_theme || 'violet')
      )?.label || 'Violeta'
    )
  }, [formData.profile_theme])

  const hasUploadedPhoto = Boolean(avatarUrl)

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

  function handleChange(event) {
    const { name, value, files, type } = event.target

    setSuccessMessage('')
    setErrorMessage('')

    if (type === 'file') {
      const file = files?.[0] || null

      setFormData((prev) => ({
        ...prev,
        avatar: file,
      }))

      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          setAvatarPreview(String(reader.result || ''))
        }
        reader.readAsDataURL(file)
      } else {
        setAvatarPreview('')
      }

      return
    }

    if (name === 'phone') {
      setFormData((prev) => ({
        ...prev,
        phone: formatPhone(value),
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleAvatarConfigChange(nextConfig) {
    setAvatarConfig((prev) => ({
      ...prev,
      ...nextConfig,
      seed: displayNamePreview,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = new FormData()
      payload.append('display_name', formData.display_name || '')
      payload.append('bio', formData.bio || '')
      payload.append('profile_theme', formData.profile_theme || 'violet')
      payload.append('phone', formData.phone || '')
      payload.append(
        'avatar_config',
        JSON.stringify({
          ...avatarConfig,
          seed: displayNamePreview,
        })
      )

      if (formData.avatar) {
        payload.append('avatar', formData.avatar)
      }

      const response = await apiPost('/profile', payload)

      setProfile(response.user)
      setFormData((prev) => ({
        ...prev,
        avatar: null,
      }))

      setAvatarConfig((prev) => ({
        ...prev,
        ...(response?.user?.avatar_config || {}),
        seed:
          response?.user?.display_name ||
          response?.user?.name ||
          prev.seed ||
          'LumeBooks',
      }))

      setSuccessMessage(response.message || 'Perfil atualizado com sucesso.')
      localStorage.setItem('auth_user', JSON.stringify(response.user))
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao atualizar perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveAvatar() {
    setIsRemovingAvatar(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await apiDelete('/profile/avatar')

      setProfile(response.user)
      setAvatarPreview('')
      setFormData((prev) => ({
        ...prev,
        avatar: null,
      }))
      setSuccessMessage(response.message || 'Foto removida com sucesso.')

      localStorage.setItem('auth_user', JSON.stringify(response.user))
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao remover foto.')
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  if (isLoading) {
    return (
      <main className="profile-page">
        <div className="profile-glow profile-glow-left" />
        <div className="profile-glow profile-glow-right" />

        <section className="profile-loading-shell">
          <div className="profile-loading-header">
            <div className="profile-loading-avatar shimmer" />
            <div className="profile-loading-title-group">
              <div className="profile-loading-title shimmer" />
              <div className="profile-loading-subtitle shimmer" />
            </div>
          </div>

          <div className="profile-loading-card">
            <div className="profile-loading-line shimmer" />
            <div className="profile-loading-line shimmer" />
            <div className="profile-loading-line shimmer profile-loading-line--short" />
          </div>

          <div className="profile-loading-center">
            <div className="profile-loading-orb" />
            <div className="profile-loading-spinner" />
            <strong>Preparando seu perfil</strong>
            <span>Carregando foto, personalização e dados da sua conta...</span>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`profile-page theme-${formData.profile_theme || 'violet'}`}>
      <div className="profile-glow profile-glow-left" />
      <div className="profile-glow profile-glow-right" />

      <section className="profile-shell profile-content">
        <aside className="profile-preview-card">
          <span className="profile-badge">Seu perfil</span>

          <div className="profile-avatar-wrap">
            {hasUploadedPhoto ? (
              <img
                src={avatarUrl}
                alt={displayNamePreview}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-builder-preview">
                <AvatarPreview
                  config={{
                    ...avatarConfig,
                    seed: displayNamePreview,
                  }}
                  size="xl"
                />
              </div>
            )}
          </div>

          <h1 className="profile-preview-name">{displayNamePreview}</h1>
          <p className="profile-preview-bio">{bioPreview}</p>

          <div className="profile-preview-meta">
            <article className="profile-meta-card">
              <span>Nome completo</span>
              <strong>{profile?.name || 'Não informado'}</strong>
            </article>

            <article className="profile-meta-card">
              <span>E-mail</span>
              <strong>{profile?.email || 'Não informado'}</strong>
            </article>

            <article className="profile-meta-card">
              <span>Telefone</span>
              <strong>{formData.phone || 'Não informado'}</strong>
            </article>

            <article className="profile-meta-card">
              <span>Tema</span>
              <strong>{selectedThemeLabel}</strong>
            </article>
          </div>

          <div className="profile-preview-actions">
            <button
              type="button"
              className="profile-secondary-button"
              onClick={() => navigate('/')}
            >
              Voltar para home
            </button>
          </div>
        </aside>

        <section className="profile-form-card">
          <header className="profile-hero">
            <div className="profile-hero__content">
              <span className="profile-overline">Área pessoal</span>
              <h2>Monte sua identidade dentro da plataforma</h2>
              <p>
                Customize aparência, avatar e informações de exibição para deixar
                sua presença mais forte e mais sua.
              </p>
            </div>

            <div className="profile-hero__stats">
              <article className="profile-hero-stat">
                <span>Perfil ativo</span>
                <strong>{displayNamePreview}</strong>
              </article>

              <article className="profile-hero-stat">
                <span>Tema atual</span>
                <strong>{selectedThemeLabel}</strong>
              </article>
            </div>
          </header>

          <div className="profile-tabs">
            <button
              type="button"
              className={activeTab === 'profile' ? 'profile-tab active' : 'profile-tab'}
              onClick={() => setActiveTab('profile')}
            >
              Perfil
            </button>

            <button
              type="button"
              className={activeTab === 'appearance' ? 'profile-tab active' : 'profile-tab'}
              onClick={() => setActiveTab('appearance')}
            >
              Aparência
            </button>

            <button
              type="button"
              className={activeTab === 'account' ? 'profile-tab active' : 'profile-tab'}
              onClick={() => setActiveTab('account')}
            >
              Conta
            </button>
          </div>

          {errorMessage && (
            <div className="profile-feedback profile-feedback-error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="profile-feedback profile-feedback-success">
              {successMessage}
            </div>
          )}

          <form className="profile-form" onSubmit={handleSubmit}>
            {activeTab === 'profile' && (
              <div className="profile-form-grid">
                <label className="profile-field profile-field-full">
                  <span>Foto de perfil</span>
                  <input
                    type="file"
                    name="avatar"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleChange}
                  />
                  <small>Envie JPG, PNG ou WEBP com até 4MB.</small>
                </label>

                {(profile?.avatar_path || avatarPreview) && (
                  <div className="profile-inline-actions">
                    <button
                      type="button"
                      className="profile-secondary-button"
                      onClick={handleRemoveAvatar}
                      disabled={isRemovingAvatar}
                    >
                      {isRemovingAvatar ? 'Removendo...' : 'Remover foto'}
                    </button>
                  </div>
                )}

                <label className="profile-field">
                  <span>Nome de exibição</span>
                  <input
                    type="text"
                    name="display_name"
                    placeholder="Como você quer aparecer"
                    value={formData.display_name}
                    onChange={handleChange}
                  />
                </label>

                <label className="profile-field">
                  <span>Telefone</span>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </label>

                <label className="profile-field profile-field-full">
                  <span>Bio</span>
                  <textarea
                    name="bio"
                    rows="5"
                    placeholder="Escreva algo sobre você..."
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </label>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="profile-form-grid">
                <label className="profile-field profile-field-full">
                  <span>Tema do perfil</span>
                  <select
                    name="profile_theme"
                    value={formData.profile_theme}
                    onChange={handleChange}
                  >
                    {themeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>Escolha a vibração visual que mais combina com você.</small>
                </label>

                <div className="profile-theme-showcase profile-field-full">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      className={
                        formData.profile_theme === theme.value
                          ? `profile-theme-chip active theme-${theme.value}`
                          : `profile-theme-chip theme-${theme.value}`
                      }
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          profile_theme: theme.value,
                        }))
                      }
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>

                <div className="profile-field profile-field-full">
                  <span>Avatar estilizado</span>
                  <small>
                    Monte seu personagem escolhendo cabelo, olhos, boca, acessórios e fundo.
                  </small>

                  <div className="profile-avatar-editor-card">
                    <div className="profile-avatar-editor-controls">
                      <AvatarBuilder
                        value={{
                          ...avatarConfig,
                          seed: displayNamePreview,
                        }}
                        onChange={handleAvatarConfigChange}
                        seed={displayNamePreview}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="profile-form-grid">
                <label className="profile-field">
                  <span>Nome completo</span>
                  <input type="text" value={profile?.name || ''} disabled />
                </label>

                <label className="profile-field">
                  <span>E-mail</span>
                  <input type="text" value={profile?.email || ''} disabled />
                </label>

                <label className="profile-field">
                  <span>CPF</span>
                  <input type="text" value={profile?.cpf || ''} disabled />
                </label>

                <label className="profile-field">
                  <span>Status</span>
                  <input
                    type="text"
                    value={profile?.is_admin ? 'Administrador' : 'Usuário'}
                    disabled
                  />
                </label>
              </div>
            )}

            <div className="profile-form-actions">
              <button
                type="submit"
                className="profile-primary-button"
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}

