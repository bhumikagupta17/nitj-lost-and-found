import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Home from './pages/Home.jsx'
import ProtectedRoute from './components/guards/ProtectedRoute.jsx'
import ReportFound from './pages/found/ReportFound.jsx'
import ReportLost from './pages/lost/ReportLost.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'

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
        <Route path="/report-lost" element={<ReportLost />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}