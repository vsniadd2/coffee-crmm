import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Login from './Login'
import Header from './Header'
import ClientModal from './ClientModal'
import PurchaseModal from './PurchaseModal'
import CategoriesManageModal from './CategoriesManageModal'
import Footer from './Footer'
import HelloOverlay from './HelloOverlay'
import LoadingIndicator from './LoadingIndicator'
import DataRefreshWebSocket from './DataRefreshWebSocket'
import './Dashboard.css'

const PurchaseHistory = lazy(() => import('./PurchaseHistory'))
const NewClientPage = lazy(() => import('./NewClientPage'))
const StatsPage = lazy(() => import('./StatsPage'))
const CategoriesPage = lazy(() => import('./CategoriesPage'))
const ReportTablePage = lazy(() => import('./ReportTablePage'))
const ClientList = lazy(() => import('./ClientList'))

const AppRouter = () => {
  const { isAuthenticated, loading, showHelloAfterLogin, clearShowHello, ensureValidToken, user } = useAuth()
  const [currentPage, setCurrentPage] = useState(() => {
    // Загружаем последнюю открытую страницу из localStorage
    try {
      const savedPage = localStorage.getItem('currentPage') || 'new-client'
      // Миграция старых значений страниц
      if (savedPage === 'payment-stats' || savedPage === 'sales-stats' || savedPage === 'order-details' || savedPage === 'order-search') {
        return 'stats'
      }
      return savedPage
    } catch {
      return 'new-client'
    }
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      ensureValidToken()
    }
  }, [isAuthenticated, ensureValidToken])

  // Страница «Таблица» только для админа: при открытии не-админом перенаправляем на «Новый заказ»
  useEffect(() => {
    if (!isAuthenticated || loading) return
    if (currentPage === 'report-table' && user?.role !== 'admin') {
      setCurrentPage('new-client')
      try {
        localStorage.setItem('currentPage', 'new-client')
      } catch {}
    }
  }, [isAuthenticated, loading, currentPage, user?.role])

  // Сохраняем текущую страницу в localStorage при изменении
  const handleNavigate = (page) => {
    setCurrentPage(page)
    try {
      localStorage.setItem('currentPage', page)
    } catch (error) {
      console.error('Ошибка сохранения страницы:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Загрузка...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'clients':
        return <ClientList onSelectClient={(client) => setSelectedClient(client)} />
      case 'purchase-history':
        return <PurchaseHistory />
      case 'stats':
      case 'payment-stats':
      case 'sales-stats':
      case 'order-details':
        return <StatsPage />
      case 'categories':
        return <CategoriesPage />
      case 'report-table':
        return user?.role === 'admin' ? <ReportTablePage /> : <NewClientPage />
      case 'new-client':
      default:
        return <NewClientPage />
    }
  }

  return (
    <div className="main-screen">
      <DataRefreshWebSocket />
      {showHelloAfterLogin && (
        <HelloOverlay onEnd={clearShowHello} />
      )}
      <div className={`main-screen-content${showHelloAfterLogin ? ' hello-animation-active' : ''}`}>
        <Header
          onAddClient={() => setIsModalOpen(true)}
          onSelectClient={(client) => setSelectedClient(client)}
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
        <main className="main-content">
          <Suspense fallback={<LoadingIndicator />}>
            {renderPage()}
          </Suspense>
        </main>
        <Footer />
        {isModalOpen && (
          <ClientModal onClose={() => setIsModalOpen(false)} />
        )}
        {selectedClient && (
          <PurchaseModal client={selectedClient} onClose={() => setSelectedClient(null)} />
        )}
      </div>
    </div>
  )
}

export default AppRouter
