const API_BASE_URL = 'http://127.0.0.1:8000/api'

function getHeaders(options = {}) {
  const { isFormData = false } = options
  const token = localStorage.getItem('auth_token')

  return {
    Accept: 'application/json',
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  let data = null

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    const text = await response.text()
    data = text || null
  }

  if (!response.ok) {
    let message = 'Erro na requisição.'

    if (typeof data === 'object' && data) {
      if (data.message) {
        message = data.message
      } else if (data.errors) {
        const firstError = Object.values(data.errors)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          message = firstError[0]
        }
      }
    }

    throw new Error(message)
  }

  return data
}

function isFormData(body) {
  return body instanceof FormData
}

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  return handleResponse(response)
}

export async function apiPost(endpoint, body = {}) {
  const formDataRequest = isFormData(body)

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders({ isFormData: formDataRequest }),
    body: formDataRequest ? body : JSON.stringify(body),
  })

  return handleResponse(response)
}

export async function apiPut(endpoint, body = {}) {
  const formDataRequest = isFormData(body)

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getHeaders({ isFormData: formDataRequest }),
    body: formDataRequest ? body : JSON.stringify(body),
  })

  return handleResponse(response)
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  return handleResponse(response)
}

export { API_BASE_URL }