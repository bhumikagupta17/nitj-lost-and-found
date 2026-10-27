import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/layout/Navbar.jsx'
import ProtectedRoute from './components/guards/ProtectedRoute.jsx'

import Login from './pages/auth/Login.jsx'
import Home from './pages/Home.jsx'
import ReportFound from './pages/found/ReportFound.jsx'
import ReportLost from './pages/lost/ReportLost.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import ItemDetail from './pages/item/ItemDetail.jsx'
import ClaimForm from './pages/item/ClaimForm.jsx'
import ChatWindow from './pages/chat/ChatWindow.jsx'
import AdminPanel from './pages/admin/AdminPanel.jsx'
import SecurityDesk from './pages/security/SecurityDesk.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute><Home /></ProtectedRoute>
        } />
        <Route path="/report-found" element={
          <ProtectedRoute><ReportFound /></ProtectedRoute>
        } />
        <Route path="/report-lost" element={
          <ProtectedRoute><ReportLost /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/item/:id" element={
          <ProtectedRoute><ItemDetail /></ProtectedRoute>
        } />
        <Route path="/item/:id/claim" element={
          <ProtectedRoute><ClaimForm /></ProtectedRoute>
        } />
        <Route path="/chat/:claimId" element={
          <ProtectedRoute><ChatWindow /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute><AdminPanel /></ProtectedRoute>
        } />
        <Route path="/security" element={
          <ProtectedRoute><SecurityDesk /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}