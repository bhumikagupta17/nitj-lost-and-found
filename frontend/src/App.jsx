import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Home from './pages/Home.jsx'
import ProtectedRoute from './components/guards/ProtectedRoute.jsx'
import ReportFound from './pages/found/ReportFound.jsx'

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
        <Route path="/report-found" element={<ReportFound />} />
      </Routes>
    </BrowserRouter>
  )
}