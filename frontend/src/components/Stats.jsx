import React, { useMemo } from 'react'
import './Stats.css'

const Stats = ({ clients, pagination }) => {
  // Используем useMemo для оптимизации вычислений
  const stats = useMemo(() => {
    const totalClients = pagination?.total ?? clients.length
    const goldClients = clients.filter(c => c.status === 'gold').length
    const standartClients = clients.filter(c => c.status !== 'gold').length
    return { totalClients, goldClients, standartClients }
  }, [clients, pagination])

  return (
    <div className="stats">
      <div className="stat-card">
        <span className="stat-label">Всего клиентов</span>
        <span className="stat-value">{stats.totalClients}</span>
      </div>
      <div className="stat-card standart">
        <span className="stat-label">Standart клиенты</span>
        <span className="stat-value">{stats.standartClients}</span>
      </div>
      <div className="stat-card gold">
        <span className="stat-label">Gold клиенты</span>
        <span className="stat-value">{stats.goldClients}</span>
      </div>
    </div>
  )
}

export default React.memo(Stats)
