import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import EbookDetail from './pages/EbookDetail'
import Checkout from './pages/Checkout'
import MyLibrary from './pages/MyLibrary'
import Reader from './pages/Reader'
import CertificateVerify from './pages/CertificateVerify'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import './App.css'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('auth_token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  return children
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('auth_token')
  const rawUser = localStorage.getItem('auth_user')
  const user = rawUser ? JSON.parse(rawUser) : null

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/certificate/verify" element={<CertificateVerify />} />
      <Route path="/certificate/verify/:code" element={<CertificateVerify />} />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/ebook/:id"
        element={
          <PrivateRoute>
            <EbookDetail />
          </PrivateRoute>
        }
      />

      <Route
        path="/checkout/:id"
        element={
          <PrivateRoute>
            <Checkout />
          </PrivateRoute>
        }
      />

      <Route
        path="/my-library"
        element={
          <PrivateRoute>
            <MyLibrary />
          </PrivateRoute>
        }
      />

      <Route
        path="/reader/:id"
        element={
          <PrivateRoute>
            <Reader />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}