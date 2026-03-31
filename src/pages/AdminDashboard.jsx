import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiDelete, apiGet, apiPost } from '../services/api'
import AdminUsers from './admin/AdminUser'
import AdminCoupons from './admin/AdminCoupons'
import './AdminDashboard.css'

const initialForm = {
  id: null,
  category_id: '',
  title: '',
  short_description: '',
  full_description: '',
  cover: null,
  file: null,
  price: '',
  is_published: true,
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatPriceInput(value) {
  let cleaned = value.replace(/\D/g, '')

  if (!cleaned) return ''

  cleaned = String(Number(cleaned))
  cleaned = cleaned.padStart(3, '0')

  const integerPart = cleaned.slice(0, -2)
  const decimalPart = cleaned.slice(-2)

  return `${Number(integerPart)},${decimalPart}`
}

function SparkBar({ value, max }) {
  const width = max > 0 ? Math.max((value / max) * 100, 8) : 8

  return (
    <div className="sparkbar">
      <div className="sparkbar__fill" style={{ width: `${width}%` }} />
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [tab, setTab] = useState('dashboard')
  const [dashboardData, setDashboardData] = useState(null)
  const [publications, setPublications] = useState([])
  const [purchases, setPurchases] = useState([])
  const [certificates, setCertificates] = useState([])
  const [categories, setCategories] = useState([])
  const [clients, setClients] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState(initialForm)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [
        dashboard,
        publicationsData,
        purchasesData,
        certificatesData,
        categoriesData,
        clientsData,
      ] = await Promise.all([
        apiGet('/admin/dashboard'),
        apiGet('/admin/publications'),
        apiGet('/admin/purchases'),
        apiGet('/admin/certificates'),
        apiGet('/admin/categories'),
        apiGet('/admin/clients'),
      ])

      setDashboardData(dashboard)
      setPublications(Array.isArray(publicationsData) ? publicationsData : [])
      setPurchases(Array.isArray(purchasesData) ? purchasesData : [])
      setCertificates(Array.isArray(certificatesData) ? certificatesData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setClients(Array.isArray(clientsData) ? clientsData : [])
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao carregar painel admin.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    navigate('/')
  }

  function resetForm() {
    setFormData(initialForm)
    setIsEditing(false)
    setSuccessMessage('')
    setErrorMessage('')
  }

  function handleFormChange(event) {
    const { name, value, type, checked, files } = event.target

    if (type === 'file') {
      setFormData((prev) => ({
        ...prev,
        [name]: files?.[0] || null,
      }))
      return
    }

    if (name === 'price') {
      setFormData((prev) => ({
        ...prev,
        price: formatPriceInput(value),
      }))
      return
    }

    if (name === 'title') {
      setFormData((prev) => ({
        ...prev,
        title: value.toUpperCase(),
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleEditPublication(publication) {
    setTab('publications')
    setIsEditing(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formattedPrice = Number(publication.price || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    setFormData({
      id: publication.id,
      category_id: publication.category_id || '',
      title: publication.title || '',
      short_description: publication.short_description || '',
      full_description: publication.full_description || '',
      cover: null,
      file: null,
      price: formattedPrice,
      is_published: Boolean(publication.is_published),
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDeletePublication(publicationId) {
    const confirmed = window.confirm('Deseja realmente excluir esta publicação?')

    if (!confirmed) return

    try {
      await apiDelete(`/admin/publications/${publicationId}`)
      setSuccessMessage('Publicação excluída com sucesso.')
      setErrorMessage('')
      await loadAdminData()
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao excluir publicação.')
    }
  }

  async function handleSubmitPublication(event) {
    event.preventDefault()
    setIsSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const payload = new FormData()
      payload.append('category_id', Number(formData.category_id))
      payload.append('title', formData.title)
      payload.append('short_description', formData.short_description || '')
      payload.append('full_description', formData.full_description || '')
      payload.append('price', formData.price)
      payload.append('is_published', formData.is_published ? '1' : '0')

      if (formData.cover) {
        payload.append('cover', formData.cover)
      }

      if (formData.file) {
        payload.append('file', formData.file)
      }

      if (isEditing && formData.id) {
        payload.append('_method', 'PUT')
        await apiPost(`/admin/publications/${formData.id}`, payload)
        setSuccessMessage('Publicação atualizada com sucesso.')
      } else {
        if (!formData.cover || !formData.file) {
          throw new Error('Envie a capa e o PDF da publicação.')
        }

        await apiPost('/admin/publications', payload)
        setSuccessMessage('Publicação criada com sucesso.')
      }

      resetForm()
      await loadAdminData()
      setTab('publications')
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao salvar publicação.')
    } finally {
      setIsSaving(false)
    }
  }

  const summary = useMemo(() => {
    return dashboardData?.summary || {
      users: 0,
      clients: 0,
      admins: 0,
      ebooks: 0,
      purchases: 0,
      certificates: 0,
      revenue: 0,
      progress_avg: 0,
    }
  }, [dashboardData])

  const salesByMonth = dashboardData?.charts?.sales_by_month || []
  const topEbooks = dashboardData?.top_ebooks || []
  const salesMax = Math.max(...salesByMonth.map((item) => Number(item.revenue || 0)), 0)
  const averageTicket =
    summary.purchases > 0 ? Number(summary.revenue || 0) / Number(summary.purchases) : 0

  if (isLoading) {
    return (
      <main className="admin-page">
        <section className="admin-loading-shell">
          <div className="admin-loading-orb" />
          <div className="admin-loading-spinner" />
          <h1>Painel Administrativo</h1>
          <p>Carregando visão estratégica da plataforma...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <div className="admin-glow admin-glow-left" />
      <div className="admin-glow admin-glow-right" />

      <section className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <div className="admin-brand__icon">L</div>
            <div>
              <strong>LumeBooks Admin</strong>
              <span>Controle, métricas e operação</span>
            </div>
          </div>

          <span className="admin-badge">Área administrativa</span>

          <h1 className="admin-title">Painel de gestão</h1>

          <p className="admin-description">
            Controle total da plataforma com visão comercial, operacional e editorial.
          </p>

          <nav className="admin-nav">
            <button
              className={tab === 'dashboard' ? 'admin-nav__item active' : 'admin-nav__item'}
              onClick={() => setTab('dashboard')}
            >
              Dashboard
            </button>

            <button
              className={tab === 'publications' ? 'admin-nav__item active' : 'admin-nav__item'}
              onClick={() => setTab('publications')}
            >
              Publicações
            </button>

            <button
              className={tab === 'coupons' ? 'admin-nav__item active' : 'admin-nav__item'}
              onClick={() => setTab('coupons')}
            >
              Cupons
            </button>

            <button
              className={tab === 'clients' ? 'admin-nav__item active' : 'admin-nav__item'}
              onClick={() => setTab('clients')}
            >
              Clientes
            </button>

            <button
              className={tab === 'admins' ? 'admin-nav__item active' : 'admin-nav__item'}
              onClick={() => setTab('admins')}
            >
              Admins
            </button>

            <button
              className={tab === 'purchases' ? 'admin-nav__item active' : 'admin-nav__item'}
              onClick={() => setTab('purchases')}
            >
              Compras
            </button>

            <button
              className={tab === 'certificates' ? 'admin-nav__item active' : 'admin-nav__item'}
              onClick={() => setTab('certificates')}
            >
              Certificados
            </button>
          </nav>

          <div className="admin-sidebar-actions">
            <button className="admin-primary-button" type="button" onClick={() => navigate('/')}>
              Ir para home
            </button>

            <button className="admin-secondary-button" type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </aside>

        <section className="admin-content">
          {errorMessage && <div className="admin-feedback admin-feedback-error">{errorMessage}</div>}
          {successMessage && (
            <div className="admin-feedback admin-feedback-success">{successMessage}</div>
          )}

          {tab === 'dashboard' && (
            <>
              <header className="admin-header">
                <div>
                  <span className="admin-overline">Dashboard executivo</span>
                  <h2>Visão geral da plataforma</h2>
                </div>

                <div className="admin-header-chip">Atualização ao vivo</div>
              </header>

              <section className="admin-metrics-grid stripe-metrics-grid">
                <article className="admin-metric-card stripe-card admin-card-animate">
                  <span>Faturamento</span>
                  <strong>{formatCurrency(summary.revenue)}</strong>
                  <small>Receita total da operação</small>
                </article>

                <article className="admin-metric-card stripe-card admin-card-animate">
                  <span>Ticket médio</span>
                  <strong>{formatCurrency(averageTicket)}</strong>
                  <small>Média por compra</small>
                </article>

                <article className="admin-metric-card stripe-card admin-card-animate">
                  <span>Progresso médio</span>
                  <strong>{summary.progress_avg}%</strong>
                  <small>Engajamento de leitura</small>
                </article>

                <article className="admin-metric-card admin-card-animate">
                  <span>Usuários</span>
                  <strong>{summary.users}</strong>
                  <small>Base cadastrada</small>
                </article>

                <article className="admin-metric-card admin-card-animate">
                  <span>Clientes</span>
                  <strong>{summary.clients}</strong>
                  <small>Contas não administrativas</small>
                </article>

                <article className="admin-metric-card admin-card-animate">
                  <span>Admins</span>
                  <strong>{summary.admins}</strong>
                  <small>Equipe de operação</small>
                </article>

                <article className="admin-metric-card admin-card-animate">
                  <span>E-books</span>
                  <strong>{summary.ebooks}</strong>
                  <small>Conteúdos publicados</small>
                </article>

                <article className="admin-metric-card admin-card-animate">
                  <span>Compras</span>
                  <strong>{summary.purchases}</strong>
                  <small>Transações registradas</small>
                </article>

                <article className="admin-metric-card admin-card-animate">
                  <span>Certificados</span>
                  <strong>{summary.certificates}</strong>
                  <small>Emissões geradas</small>
                </article>
              </section>

              <section className="admin-grid">
                <article className="admin-panel admin-panel-large admin-card-animate">
                  <div className="admin-panel__header">
                    <div>
                      <span className="admin-panel__overline">Receita</span>
                      <h3>Vendas por mês</h3>
                    </div>
                  </div>

                  <div className="stripe-chart-list">
                    {salesByMonth.length ? (
                      salesByMonth.map((item) => (
                        <div className="stripe-chart-row" key={item.month}>
                          <div className="stripe-chart-row__meta">
                            <strong>{item.month}</strong>
                            <span>{formatCurrency(item.revenue)}</span>
                          </div>

                          <SparkBar value={Number(item.revenue || 0)} max={salesMax} />
                        </div>
                      ))
                    ) : (
                      <div className="admin-empty-state">
                        Ainda não há dados suficientes de faturamento.
                      </div>
                    )}
                  </div>
                </article>

                <article className="admin-panel admin-card-animate">
                  <div className="admin-panel__header">
                    <div>
                      <span className="admin-panel__overline">Ranking</span>
                      <h3>E-books mais vendidos</h3>
                    </div>
                  </div>

                  <div className="admin-list">
                    {topEbooks.length ? (
                      topEbooks.map((item, index) => (
                        <div className="admin-list-item" key={`${item.publication_id}-${index}`}>
                          <div className="admin-list-item__rank">#{index + 1}</div>
                          <div className="admin-list-item__content">
                            <strong>{item.title}</strong>
                            <span>{item.total_sales} venda(s)</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="admin-empty-state">
                        Ainda não há vendas suficientes para ranking.
                      </div>
                    )}
                  </div>
                </article>
              </section>
            </>
          )}

          {tab === 'publications' && (
            <>
              <header className="admin-header">
                <div>
                  <span className="admin-overline">Publicações</span>
                  <h2>{isEditing ? 'Editar publicação' : 'Criar nova publicação'}</h2>
                </div>

                {isEditing && (
                  <div className="admin-header-actions">
                    <button className="admin-secondary-button" type="button" onClick={resetForm}>
                      Cancelar edição
                    </button>
                  </div>
                )}
              </header>

              <form className="admin-form admin-card-animate" onSubmit={handleSubmitPublication}>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Categoria</span>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-field">
                    <span>Preço</span>
                    <input
                      type="text"
                      name="price"
                      placeholder="29,90"
                      value={formData.price}
                      onChange={handleFormChange}
                      required
                    />
                  </label>

                  <label className="admin-field admin-field-full">
                    <span>Título</span>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                    />
                  </label>

                  <label className="admin-field admin-field-full">
                    <span>Descrição curta</span>
                    <input
                      type="text"
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label className="admin-field admin-field-full">
                    <span>Descrição completa</span>
                    <textarea
                      name="full_description"
                      value={formData.full_description}
                      onChange={handleFormChange}
                      rows="5"
                      required
                    />
                  </label>

                  <label className="admin-field">
                    <span>Capa</span>
                    <input
                      type="file"
                      name="cover"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFormChange}
                    />
                    <small className="admin-field-hint">
                      {isEditing
                        ? 'Envie uma nova capa apenas se quiser substituir a atual.'
                        : 'Envie a imagem de capa da publicação.'}
                    </small>
                  </label>

                  <label className="admin-field">
                    <span>PDF da publicação</span>
                    <input
                      type="file"
                      name="file"
                      accept=".pdf"
                      onChange={handleFormChange}
                    />
                    <small className="admin-field-hint">
                      {isEditing
                        ? 'Envie um novo PDF apenas se quiser substituir o atual.'
                        : 'Envie o arquivo PDF da publicação.'}
                    </small>
                  </label>

                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleFormChange}
                    />
                    <span>Publicação ativa</span>
                  </label>
                </div>

                <div className="admin-form-actions">
                  <button className="admin-primary-button" type="submit" disabled={isSaving}>
                    {isSaving
                      ? 'Salvando...'
                      : isEditing
                        ? 'Atualizar publicação'
                        : 'Criar publicação'}
                  </button>
                </div>
              </form>

              <section className="admin-table-section admin-card-animate">
                <div className="admin-panel__header">
                  <div>
                    <span className="admin-panel__overline">Catálogo</span>
                    <h3>Gerenciar publicações</h3>
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {publications.length ? (
                        publications.map((publication) => (
                          <tr key={publication.id}>
                            <td>{publication.title}</td>
                            <td>{publication.category?.name || 'Sem categoria'}</td>
                            <td>{formatCurrency(publication.price)}</td>
                            <td>{publication.is_published ? 'Publicado' : 'Rascunho'}</td>
                            <td>
                              <div className="admin-table-actions">
                                <button
                                  type="button"
                                  className="admin-inline-button"
                                  onClick={() => handleEditPublication(publication)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="admin-inline-button danger"
                                  onClick={() => handleDeletePublication(publication.id)}
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">Nenhuma publicação encontrada.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {tab === 'coupons' && (
            <AdminCoupons categories={categories} publications={publications} />
          )}

          {tab === 'clients' && (
            <section className="admin-table-section admin-card-animate">
              <div className="admin-panel__header">
                <div>
                  <span className="admin-panel__overline">Clientes</span>
                  <h3>Acompanhar progresso, compras e gastos</h3>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Telefone</th>
                      <th>E-mail</th>
                      <th>Gasto total</th>
                      <th>Compras</th>
                      <th>Biblioteca</th>
                      <th>Progresso médio</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clients.length ? (
                      clients.map((client) => (
                        <tr key={client.id}>
                          <td>{client.name}</td>
                          <td>{client.cpf}</td>
                          <td>{client.phone}</td>
                          <td>{client.email}</td>
                          <td>{formatCurrency(client.total_spent)}</td>
                          <td>{client.total_purchases}</td>
                          <td>{client.library_count}</td>
                          <td>{client.progress_avg}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">Nenhum cliente encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'admins' && <AdminUsers />}

          {tab === 'purchases' && (
            <section className="admin-table-section admin-card-animate">
              <div className="admin-panel__header">
                <div>
                  <span className="admin-panel__overline">Compras</span>
                  <h3>Histórico de transações</h3>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Título</th>
                      <th>Itens</th>
                      <th>Data</th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchases.length ? (
                      purchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td>{purchase.user?.name || 'Usuário'}</td>
                          <td>{purchase.items?.[0]?.publication?.title || 'Sem título'}</td>
                          <td>{purchase.items?.length || 0}</td>
                          <td>{new Date(purchase.created_at).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">Nenhuma compra encontrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'certificates' && (
            <section className="admin-table-section admin-card-animate">
              <div className="admin-panel__header">
                <div>
                  <span className="admin-panel__overline">Certificados</span>
                  <h3>Emissões registradas</h3>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Curso</th>
                      <th>Código</th>
                      <th>Data</th>
                    </tr>
                  </thead>

                  <tbody>
                    {certificates.length ? (
                      certificates.map((certificate) => (
                        <tr key={certificate.id}>
                          <td>{certificate.user?.name || certificate.student_name}</td>
                          <td>{certificate.publication?.title || certificate.course_name}</td>
                          <td>{certificate.certificate_code}</td>
                          <td>{new Date(certificate.created_at).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">Nenhum certificado encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  )
}