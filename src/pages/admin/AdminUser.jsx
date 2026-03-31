import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  }, [])

  async function load() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const data = await apiGet('/admin/users?type=admins')
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao carregar administradores.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSearch(event) {
    const value = event.target.value
    setSearchTerm(value)
    setFeedback('')
    setErrorMessage('')

    if (!value.trim()) {
      await load()
      return
    }

    try {
      setIsSearching(true)
      const data = await apiGet(`/admin/users/search?q=${encodeURIComponent(value)}`)
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao buscar usuários.')
    } finally {
      setIsSearching(false)
    }
  }

  async function toggle(user) {
    const isSelf = currentUser?.id === user.id

    if (isSelf && user.is_admin) {
      const confirmed = window.confirm(
        'Você está prestes a remover sua própria permissão de administrador. Deseja continuar?'
      )

      if (!confirmed) {
        return
      }
    }

    try {
      const data = await apiPost(`/admin/users/${user.id}/toggle-admin`)
      setFeedback(data.message || 'Permissão atualizada com sucesso.')
      setErrorMessage('')

      if (searchTerm.trim()) {
        const refreshed = await apiGet(`/admin/users/search?q=${encodeURIComponent(searchTerm)}`)
        setUsers(Array.isArray(refreshed) ? refreshed : [])
      } else {
        await load()
      }
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao alterar permissão.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="admin-users-panel">
      <div className="admin-users-panel__header">
        <div>
          <span className="admin-panel__overline">Permissões</span>
          <h3>Gerenciar administradores</h3>
        </div>
      </div>

      <div className="admin-search-box">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Buscar por nome completo, CPF ou e-mail"
          className="admin-search-input"
        />
      </div>

      {feedback && (
        <div className="admin-feedback admin-feedback-success">
          {feedback}
        </div>
      )}

      {errorMessage && (
        <div className="admin-feedback admin-feedback-error">
          {errorMessage}
        </div>
      )}

      {isLoading || isSearching ? (
        <div className="admin-empty-state">
          {isSearching ? 'Buscando usuários...' : 'Carregando administradores...'}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Admin</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {users.length ? (
                users.map((user) => {
                  const isSelf = currentUser?.id === user.id

                  return (
                    <tr key={user.id}>
                      <td>
                        {user.name}
                        {isSelf ? ' (você)' : ''}
                      </td>
                      <td>{user.cpf || '-'}</td>
                      <td>{user.phone || '-'}</td>
                      <td>{user.email}</td>
                      <td>{user.is_admin ? 'Sim' : 'Não'}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className={user.is_admin ? 'admin-inline-button danger' : 'admin-inline-button'}
                            onClick={() => toggle(user)}
                          >
                            {user.is_admin ? 'Remover admin' : 'Tornar admin'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}