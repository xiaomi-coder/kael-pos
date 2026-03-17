import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SysAuth from './pages/sys/SysAuth'
import SysDashboard from './pages/sys/SysDashboard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/sys-xiaomi-auth-2026" element={<SysAuth />} />
        <Route path="/sys-dashboard-internal" element={<SysDashboard />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
