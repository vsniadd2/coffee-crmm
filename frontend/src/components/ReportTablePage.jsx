import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { reportTableService } from '../services/reportTableService'
import { useAuth } from '../contexts/AuthContext'
import './ReportTablePage.css'

const ROWS_PER_PAGE = 80
const WEEKDAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

/** Агрегация по продукту: разбивка по типу оплаты (наличные/карта/смешанная) */
function aggregateByProduct(blocks) {
  const map = new Map()
  for (const block of blocks) {
    for (const row of block.rows) {
      const key = `${block.subcategoryId}-${block.subcategoryName}-${row.productName}-${row.price}`
      const qty = parseInt(row.quantity, 10) || 0
      const amount = (parseFloat(row.price) || 0) * qty
      const pay = (row.paymentType || '').toLowerCase()

      if (!map.has(key)) {
        map.set(key, {
          subcategoryName: block.subcategoryName,
          productName: row.productName,
          price: parseFloat(row.price) || 0,
          totalQty: 0,
          qtyCash: 0,
          qtyCard: 0,
          qtyMixed: 0,
          amountCash: 0,
          amountCard: 0,
          amountMixed: 0,
          amountTotal: 0
        })
      }
      const agg = map.get(key)
      agg.totalQty += qty
      agg.amountTotal += amount
      if (pay.includes('налич')) {
        agg.qtyCash += qty
        agg.amountCash += amount
      } else if (pay.includes('карт')) {
        agg.qtyCard += qty
        agg.amountCard += amount
      } else {
        agg.qtyMixed += qty
        agg.amountMixed += amount
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.subcategoryName.localeCompare(b.subcategoryName) || a.productName.localeCompare(b.productName)
  )
}

const formatNum = (n) => (n === 0 ? '' : Number(n).toFixed(2))
const formatInt = (n) => (n === 0 ? '' : String(n))

const todayDateString = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const currentMonthString = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

const monthToRange = (yyyyMm) => {
  const [y, m] = yyyyMm.split('-').map(Number)
  const first = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { dateFrom: first, dateTo: last }
}

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
}

const getWeekdayForDate = (dateStr) => {
  if (!dateStr) return '—'
  const [y, m, day] = dateStr.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  return WEEKDAY_NAMES[d.getDay()]
}

const getWeekdayForMonth = (yyyyMm) => {
  const [y, m] = yyyyMm.split('-').map(Number)
  return `${new Date(y, m - 1).toLocaleString('ru-RU', { month: 'long' })} ${y}`
}

const WEIGHT_COLUMN_TOOLTIP = 'Эта колонка показывает подкатегорию категории товара (например, вес упаковки или тип продукта).'

const ReportTablePage = () => {
  const { refreshAccessToken } = useAuth()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [periodType, setPeriodType] = useState('month')
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthString())
  const [selectedDate, setSelectedDate] = useState(() => todayDateString())
  const [weightInfoHover, setWeightInfoHover] = useState(false)
  const [weightInfoOpen, setWeightInfoOpen] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const weightInfoRef = useRef(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const options = periodType === 'month'
        ? monthToRange(selectedMonth)
        : { date: selectedDate }
      const data = await reportTableService.getReportTable(null, options)
      setBlocks(data.blocks || [])
      setPage(1)
    } catch (e) {
      if (e?.message === 'UNAUTHORIZED') {
        const ok = await refreshAccessToken()
        if (ok) return loadReport()
      }
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [refreshAccessToken, periodType, selectedMonth, selectedDate])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  useEffect(() => {
    if (!weightInfoOpen) return
    const close = (e) => {
      if (weightInfoRef.current && !weightInfoRef.current.contains(e.target)) {
        setWeightInfoOpen(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [weightInfoOpen])

  useEffect(() => {
    if (!weightInfoHover && !weightInfoOpen) return
    const el = weightInfoRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setTooltipPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2
    })
  }, [weightInfoHover, weightInfoOpen])

  const blocksWithData = blocks.filter((b) => b.rows.length > 0)
  const aggregatedProducts = aggregateByProduct(blocksWithData)
  const totalRows = aggregatedProducts.length
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE) || 1
  const start = (page - 1) * ROWS_PER_PAGE
  const visibleProducts = aggregatedProducts.slice(start, start + ROWS_PER_PAGE)
  const hasSubcategoriesButNoSales = blocks.length > 0 && blocksWithData.length === 0

  const reportDateLabel = periodType === 'month'
    ? getWeekdayForMonth(selectedMonth)
    : formatDateDisplay(selectedDate)
  const reportWeekday = periodType === 'day'
    ? getWeekdayForDate(selectedDate)
    : null

  const totals = aggregatedProducts.length > 0
    ? aggregatedProducts.reduce(
        (acc, p) => ({
          totalQty: acc.totalQty + p.totalQty,
          qtyCash: acc.qtyCash + p.qtyCash,
          qtyCard: acc.qtyCard + p.qtyCard,
          qtyMixed: acc.qtyMixed + p.qtyMixed,
          amountCash: acc.amountCash + p.amountCash,
          amountCard: acc.amountCard + p.amountCard,
          amountTotal: acc.amountTotal + p.amountTotal
        }),
        { totalQty: 0, qtyCash: 0, qtyCard: 0, qtyMixed: 0, amountCash: 0, amountCard: 0, amountTotal: 0 }
      )
    : null

  return (
    <div className="report-table-page">
      <div className="report-table-header">
        <h2>Таблица отчёта</h2>
        <div className="report-table-filters">
          <div className="report-table-period-toggle">
            <button
              type="button"
              className={`report-table-period-btn ${periodType === 'month' ? 'active' : ''}`}
              onClick={() => setPeriodType('month')}
            >
              За месяц
            </button>
            <button
              type="button"
              className={`report-table-period-btn ${periodType === 'day' ? 'active' : ''}`}
              onClick={() => setPeriodType('day')}
            >
              За день
            </button>
          </div>
          {periodType === 'month' ? (
            <div className="report-table-date-row">
              <label htmlFor="report-table-month" className="report-table-date-label">Месяц:</label>
              <input
                id="report-table-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="report-table-date-input"
              />
            </div>
          ) : (
            <div className="report-table-date-row">
              <label htmlFor="report-table-date" className="report-table-date-label">День:</label>
              <input
                id="report-table-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="report-table-date-input"
              />
            </div>
          )}
        </div>
      </div>
      {error && <div className="report-table-error">{error}</div>}
      {loading && <div className="report-table-loading">Загрузка...</div>}
      {!loading && !error && blocks.length === 0 && (
        <div className="report-table-empty">
          Нет подкатегорий с включённым учётом в таблице. Включите «Учёт в таблице отчёта» у подкатегорий в разделе «Категории и товары».
        </div>
      )}
      {!loading && !error && hasSubcategoriesButNoSales && (
        <div className="report-table-empty">
          {periodType === 'day'
            ? 'За выбранный день нет продаж.'
            : 'За выбранный месяц нет продаж.'}
        </div>
      )}
      {!loading && !error && aggregatedProducts.length > 0 && (
        <>
          <div className="report-table-excel-wrap">
            <div className="report-table-excel-sheet">
              <div className="report-table-excel-title-row">
                <span className="report-table-excel-title">Отчетный бланк</span>
                <span className="report-table-excel-meta">
                  Дата: <strong>{reportDateLabel}</strong>
                  {reportWeekday != null && (
                    <>
                      {' \u00A0\u00A0 '}
                      День недели: <strong>{reportWeekday}</strong>
                    </>
                  )}
                </span>
              </div>
              <div className="report-table-excel-table-wrap">
                <table className="report-table-excel report-table-excel-full">
                  <thead>
                    <tr>
                      <th className="report-table-excel-th-weight">
                        <span className="report-table-excel-th-weight-label">Вес</span>
                        <span
                          ref={weightInfoRef}
                          className="report-table-weight-info-wrap"
                        >
                          <button
                            type="button"
                            className="report-table-weight-info-btn"
                            aria-label="Подсказка о колонке Вес"
                            onClick={(e) => {
                              e.stopPropagation()
                              setWeightInfoOpen((v) => !v)
                            }}
                            onMouseEnter={() => setWeightInfoHover(true)}
                            onMouseLeave={() => setWeightInfoHover(false)}
                          >
                            i
                          </button>
                          {(weightInfoHover || weightInfoOpen) &&
                            createPortal(
                              <span
                                className="report-table-weight-info-tooltip report-table-weight-info-tooltip-portal"
                                role="tooltip"
                                style={{
                                  position: 'fixed',
                                  top: tooltipPos.top,
                                  left: tooltipPos.left,
                                  transform: 'translateX(-50%)'
                                }}
                              >
                                {WEIGHT_COLUMN_TOOLTIP}
                              </span>,
                              document.body
                            )}
                        </span>
                      </th>
                      <th className="report-table-excel-th-name">Наименование:</th>
                      <th className="report-table-excel-th-num">Входящий остаток, шт.</th>
                      <th className="report-table-excel-th-num">Цена за ед., руб.</th>
                      <th colSpan={4} className="report-table-excel-th-merged">
                        Продано (зерна/молотый, руб.)
                      </th>
                      <th className="report-table-excel-th-num">Итого продано, шт.</th>
                      <th className="report-table-excel-th-num">НАЛИЧ, руб</th>
                      <th className="report-table-excel-th-num">БЕЗНАЛ, руб</th>
                      <th className="report-table-excel-th-num">ИТОГО, руб.</th>
                      <th className="report-table-excel-th-num">Остаток на конец дня, шт.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p, idx) => (
                      <tr key={`${start}-${p.productName}-${p.price}`}>
                        <td className="report-table-excel-td-weight">{p.subcategoryName}</td>
                        <td className="report-table-excel-td-name">{p.productName}</td>
                        <td className="report-table-excel-num report-table-excel-td-num" />
                        <td className="report-table-excel-num report-table-excel-td-num">{p.price.toFixed(2)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatInt(p.qtyCash)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatInt(p.qtyCard)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatInt(p.qtyMixed)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatInt(p.totalQty)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatInt(p.totalQty)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatNum(p.amountCash)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatNum(p.amountCard)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{formatNum(p.amountTotal)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num" />
                      </tr>
                    ))}
                  </tbody>
                  {totals != null && (
                    <tfoot>
                      <tr className="report-table-excel-total-row">
                        <td className="report-table-excel-td-weight" />
                        <td className="report-table-excel-td-name">ИТОГО</td>
                        <td className="report-table-excel-num report-table-excel-td-num" />
                        <td className="report-table-excel-num report-table-excel-td-num" />
                        <td className="report-table-excel-num report-table-excel-td-num report-table-excel-td-total-group">{totals.qtyCash}</td>
                        <td className="report-table-excel-num report-table-excel-td-num report-table-excel-td-total-group">{totals.qtyCard}</td>
                        <td className="report-table-excel-num report-table-excel-td-num report-table-excel-td-total-group">{totals.qtyMixed}</td>
                        <td className="report-table-excel-num report-table-excel-td-num report-table-excel-td-total-group">{totals.totalQty}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{totals.totalQty}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{totals.amountCash.toFixed(2)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{totals.amountCard.toFixed(2)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num">{totals.amountTotal.toFixed(2)}</td>
                        <td className="report-table-excel-num report-table-excel-td-num" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="report-table-pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="report-table-pagination-btn"
              >
                Назад
              </button>
              <span className="report-table-pagination-info">
                Строки {start + 1}–{Math.min(start + ROWS_PER_PAGE, totalRows)} из {totalRows}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="report-table-pagination-btn"
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ReportTablePage
