import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

const Header = ({ onAddClient, onSelectClient, currentPage, onNavigate }) => {
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleNav = (page) => {
    onNavigate?.(page)
    closeMenu()
  }

  const handleLogout = () => {
    logout()
    closeMenu()
  }

  return (
    <header className={`header ${menuOpen ? 'menu-open' : ''}`}>
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
        <nav className="header-nav header-nav-desktop">
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
        <button onClick={logout} className="logout-btn logout-btn-desktop">
          Выйти
        </button>
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
        >
          <span className="mobile-menu-toggle-bars">
            <span className="mobile-menu-toggle-bar" />
            <span className="mobile-menu-toggle-bar" />
            <span className="mobile-menu-toggle-bar" />
          </span>
        </button>
      </div>

      <div
        className="mobile-menu-backdrop"
        aria-hidden="true"
        onClick={closeMenu}
      />
      <nav className="mobile-nav" aria-label="Основное меню">
        <div className="mobile-nav-inner">
          <button
            type="button"
            onClick={() => handleNav('new-client')}
            className={`mobile-nav-link mobile-nav-link-primary ${currentPage === 'new-client' ? 'active' : ''}`}
          >
            Новый заказ
          </button>
          <button
            type="button"
            onClick={() => handleNav('clients')}
            className={`mobile-nav-link ${currentPage === 'clients' ? 'active' : ''}`}
          >
            Клиенты
          </button>
          <button
            type="button"
            onClick={() => handleNav('purchase-history')}
            className={`mobile-nav-link ${currentPage === 'purchase-history' ? 'active' : ''}`}
          >
            История
          </button>
          <button type="button" onClick={handleLogout} className="mobile-nav-link mobile-nav-logout">
            Выйти
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Header
