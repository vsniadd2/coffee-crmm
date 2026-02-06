import React, { useEffect } from 'react'
import './PaymentMethodModal.css'

const PaymentMethodModal = ({ onSelect, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSelect = (method) => {
    onSelect(method)
  }

  return (
    <div className="modal" onClick={handleOverlayClick}>
      <div className="modal-overlay"></div>
      <div className="modal-content payment-method-modal">
        <div className="modal-header">
          <h2>Выберите способ оплаты</h2>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="payment-method-options">
          <button
            className="payment-method-btn payment-method-cash"
            onClick={() => handleSelect('cash')}
          >
            <div className="payment-method-icon">
              <img src="/img/money-svgrepo-com.svg" alt="Наличные" />
            </div>
            <div className="payment-method-label">Наличные</div>
          </button>
          <button
            className="payment-method-btn payment-method-card"
            onClick={() => handleSelect('card')}
          >
            <div className="payment-method-icon">
              <img src="/img/card-svgrepo-com.svg" alt="Карта" />
            </div>
            <div className="payment-method-label">Карта</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodModal
