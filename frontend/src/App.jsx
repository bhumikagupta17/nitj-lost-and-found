import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Home from './pages/Home.jsx'
import ProtectedRoute from './components/guards/ProtectedRoute.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}