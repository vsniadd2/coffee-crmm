import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

const Header = ({ onAddClient, onSelectClient, currentPage, onNavigate }) => {
  const { logout } = useAuth()

  return (
    <header className="header">
      <div className="header-left">
        <div 
          className="logo"
          onClick={() => onNavigate?.('new-client')}
          style={{ cursor: 'pointer' }}
        >
          <img src="/img/coffee-svgrepo-com.svg" alt="Coffee" className="coffee-icon" />
          <h1>Coffee Life Roasters CRM</h1>
        </div>
      </div>
      <div className="header-right">
        <nav className="header-nav">
          <button
            type="button"
            onClick={() => onNavigate?.('new-client')}
            className={`nav-link nav-link-primary ${currentPage === 'new-client' ? 'active' : ''}`}
          >
            Новый заказ
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('clients')}
            className={`nav-link ${currentPage === 'clients' ? 'active' : ''}`}
          >
            Клиенты
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('purchase-history')}
            className={`nav-link ${currentPage === 'purchase-history' ? 'active' : ''}`}
          >
            История
          </button>
        </nav>
        <button onClick={logout} className="logout-btn">
          Выйти
        </button>
      </div>
    </header>
  )
}

export default Header
