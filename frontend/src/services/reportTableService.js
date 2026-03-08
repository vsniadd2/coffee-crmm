import { API_URL, getAuthHeaders } from '../config/api'

export const reportTableService = {
  async getReportTable(pointId = null, options = {}) {
    const { date, dateFrom, dateTo } = options
    const params = new URLSearchParams()
    if (pointId != null && pointId !== '') params.append('pointId', pointId)
    if (date != null && date !== '') params.append('date', date)
    if (dateFrom != null && dateFrom !== '') params.append('dateFrom', dateFrom)
    if (dateTo != null && dateTo !== '') params.append('dateTo', dateTo)
    const qs = params.toString()
    const url = qs ? `${API_URL}/report-table?${qs}` : `${API_URL}/report-table`
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (response.status === 403) throw new Error('UNAUTHORIZED')
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Ошибка загрузки таблицы отчёта')
    }
    return response.json()
  }
}
