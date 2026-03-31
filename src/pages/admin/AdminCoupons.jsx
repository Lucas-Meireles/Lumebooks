import { useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '../../services/api'

const initialForm = {
  id: null,
  name: '',
  code: '',
  type: 'percentage',
  value: '',
  minimum_amount: '',
  usage_limit: '',
  usage_limit_per_user: '1',
  first_purchase_only: false,
  is_active: true,
  category_id: '',
  publication_id: '',
  starts_at: '',
  expires_at: '',
}

function formatMoneyInput(value) {
  const cleaned = value.replace(/\D/g, '')

  if (!cleaned) return ''

  const numeric = cleaned.padStart(3, '0')
  const integer = numeric.slice(0, -2)
  const decimal = numeric.slice(-2)

  return `${Number(integer)},${decimal}`
}

export default function AdminCoupons({ categories = [], publications = [] }) {
  const [coupons, setCoupons] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadCoupons()
  }, [])

  async function loadCoupons() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const data = await apiGet('/admin/coupons')
      setCoupons(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao carregar cupons.')
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setFormData(initialForm)
    setIsEditing(false)
    setSuccessMessage('')
    setErrorMessage('')
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    if (name === 'code') {
      setFormData((prev) => ({
        ...prev,
        code: value.toUpperCase().replace(/\s+/g, ''),
      }))
      return
    }

    if (name === 'value' || name === 'minimum_amount') {
      setFormData((prev) => ({
        ...prev,
        [name]: formatMoneyInput(value),
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleEdit(coupon) {
    setIsEditing(true)
    setSuccessMessage('')
    setErrorMessage('')

    setFormData({
      id: coupon.id,
      name: coupon.name || '',
      code: coupon.code || '',
      type: coupon.type || 'percentage',
      value: coupon.value
        ? Number(coupon.value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '',
      minimum_amount: coupon.minimum_amount
        ? Number(coupon.minimum_amount).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '',
      usage_limit: coupon.usage_limit || '',
      usage_limit_per_user: coupon.usage_limit_per_user || '1',
      first_purchase_only: Boolean(coupon.first_purchase_only),
      is_active: Boolean(coupon.is_active),
      category_id: coupon.category_id || '',
      publication_id: coupon.publication_id || '',
      starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Deseja realmente excluir este cupom?')
    if (!confirmed) return

    try {
      await apiDelete(`/admin/coupons/${id}`)
      setSuccessMessage('Cupom excluído com sucesso.')
      setErrorMessage('')
      await loadCoupons()
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao excluir cupom.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setIsSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: formData.value.replace(',', '.'),
        minimum_amount: formData.minimum_amount
          ? formData.minimum_amount.replace(',', '.')
          : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        usage_limit_per_user: formData.usage_limit_per_user
          ? Number(formData.usage_limit_per_user)
          : 1,
        first_purchase_only: Boolean(formData.first_purchase_only),
        is_active: Boolean(formData.is_active),
        category_id: formData.category_id ? Number(formData.category_id) : null,
        publication_id: formData.publication_id ? Number(formData.publication_id) : null,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
      }

      if (isEditing && formData.id) {
        await apiPut(`/admin/coupons/${formData.id}`, payload)
        setSuccessMessage('Cupom atualizado com sucesso.')
      } else {
        await apiPost('/admin/coupons', payload)
        setSuccessMessage('Cupom criado com sucesso.')
      }

      resetForm()
      await loadCoupons()
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao salvar cupom.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-users-panel">
      <header className="admin-header">
        <div>
          <span className="admin-overline">Cupons</span>
          <h2>{isEditing ? 'Editar cupom' : 'Criar cupom'}</h2>
        </div>

        {isEditing && (
          <div className="admin-header-actions">
            <button className="admin-secondary-button" type="button" onClick={resetForm}>
              Cancelar edição
            </button>
          </div>
        )}
      </header>

      {errorMessage && (
        <div className="admin-feedback admin-feedback-error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="admin-feedback admin-feedback-success">
          {successMessage}
        </div>
      )}

      <form className="admin-form admin-card-animate" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Nome interno</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Cupom de boas-vindas"
              required
            />
          </label>

          <label className="admin-field">
            <span>Código</span>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="BEMVINDO10"
              required
            />
          </label>

          <label className="admin-field">
            <span>Tipo</span>
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="percentage">Percentual</option>
              <option value="fixed">Valor fixo</option>
            </select>
          </label>

          <label className="admin-field">
            <span>Valor</span>
            <input
              type="text"
              name="value"
              value={formData.value}
              onChange={handleChange}
              placeholder={formData.type === 'percentage' ? '10,00' : '15,00'}
              required
            />
          </label>

          <label className="admin-field">
            <span>Valor mínimo da compra</span>
            <input
              type="text"
              name="minimum_amount"
              value={formData.minimum_amount}
              onChange={handleChange}
              placeholder="29,90"
            />
          </label>

          <label className="admin-field">
            <span>Limite total de usos</span>
            <input
              type="number"
              min="1"
              name="usage_limit"
              value={formData.usage_limit}
              onChange={handleChange}
              placeholder="100"
            />
          </label>

          <label className="admin-field">
            <span>Limite por usuário</span>
            <input
              type="number"
              min="1"
              name="usage_limit_per_user"
              value={formData.usage_limit_per_user}
              onChange={handleChange}
              required
            />
          </label>

          <label className="admin-field">
            <span>Categoria</span>
            <select name="category_id" value={formData.category_id} onChange={handleChange}>
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Publicação</span>
            <select name="publication_id" value={formData.publication_id} onChange={handleChange}>
              <option value="">Todas</option>
              {publications.map((publication) => (
                <option key={publication.id} value={publication.id}>
                  {publication.title}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Início</span>
            <input
              type="datetime-local"
              name="starts_at"
              value={formData.starts_at}
              onChange={handleChange}
            />
          </label>

          <label className="admin-field">
            <span>Fim</span>
            <input
              type="datetime-local"
              name="expires_at"
              value={formData.expires_at}
              onChange={handleChange}
            />
          </label>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              name="first_purchase_only"
              checked={formData.first_purchase_only}
              onChange={handleChange}
            />
            <span>Somente primeira compra</span>
          </label>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Cupom ativo</span>
          </label>
        </div>

        <div className="admin-form-actions">
          <button className="admin-primary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Atualizar cupom' : 'Criar cupom'}
          </button>
        </div>
      </form>

      <section className="admin-table-section admin-card-animate">
        <div className="admin-panel__header">
          <div>
            <span className="admin-panel__overline">Lista</span>
            <h3>Cupons cadastrados</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-empty-state">Carregando cupons...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>1ª compra</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {coupons.length ? (
                  coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td>{coupon.code}</td>
                      <td>{coupon.name}</td>
                      <td>{coupon.type === 'percentage' ? 'Percentual' : 'Valor fixo'}</td>
                      <td>
                        {coupon.type === 'percentage'
                          ? `${Number(coupon.value)}%`
                          : Number(coupon.value).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                      </td>
                      <td>{coupon.first_purchase_only ? 'Sim' : 'Não'}</td>
                      <td>{coupon.is_active ? 'Ativo' : 'Inativo'}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="admin-inline-button"
                            onClick={() => handleEdit(coupon)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="admin-inline-button danger"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">Nenhum cupom cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}