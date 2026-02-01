import React, { useState, useEffect, useCallback } from 'react'
import { adminProductsService } from '../services/adminProductsService'
import { useAuth } from '../contexts/AuthContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import ConfirmDialog from './ConfirmDialog'
import ImageUploader from './ImageUploader'
import './CategoriesManageModal.css'

const CategoriesManageModal = ({ onClose }) => {
  const { refreshAccessToken } = useAuth()
  const { refreshAll } = useDataRefresh()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedSubcategory, setExpandedSubcategory] = useState(null)
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({})
  const [productsBySubcategory, setProductsBySubcategory] = useState({})
  const [addCategory, setAddCategory] = useState(false)
  const [addSubcategory, setAddSubcategory] = useState(null)
  const [addProduct, setAddProduct] = useState(null)
  const [editCategory, setEditCategory] = useState(null)
  const [editSubcategory, setEditSubcategory] = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ type: null, id: null, name: '' })
  const DEFAULT_CATEGORY_COLOR = '#6b7280'
  const [formData, setFormData] = useState({ name: '', displayOrder: 0, price: '', subcategoryId: '', categoryId: '', imageUrl: '' })
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      setError(null)
      const data = await adminProductsService.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e) {
      if (e?.message === 'UNAUTHORIZED') {
        const ok = await refreshAccessToken()
        if (ok) return loadCategories()
      }
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [refreshAccessToken])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const loadSubcategories = useCallback(async (categoryId) => {
    try {
      const data = await adminProductsService.getSubcategories(categoryId)
      setSubcategoriesByCategory(prev => ({ ...prev, [categoryId]: Array.isArray(data) ? data : [] }))
    } catch (e) {
      if (e?.message === 'UNAUTHORIZED') {
        await refreshAccessToken()
        return loadSubcategories(categoryId)
      }
      setSubcategoriesByCategory(prev => ({ ...prev, [categoryId]: [] }))
    }
  }, [refreshAccessToken])

  const loadProducts = useCallback(async (subcategoryId) => {
    try {
      const data = await adminProductsService.getProducts(subcategoryId)
      setProductsBySubcategory(prev => ({ ...prev, [subcategoryId]: Array.isArray(data) ? data : [] }))
    } catch (e) {
      if (e?.message === 'UNAUTHORIZED') {
        await refreshAccessToken()
        return loadProducts(subcategoryId)
      }
      setProductsBySubcategory(prev => ({ ...prev, [subcategoryId]: [] }))
    }
  }, [refreshAccessToken])

  const toggleCategory = (id) => {
    setExpandedCategory(prev => (prev === id ? null : id))
    if (!subcategoriesByCategory[id]) loadSubcategories(id)
  }

  const toggleSubcategory = (id) => {
    setExpandedSubcategory(prev => (prev === id ? null : id))
    if (!productsBySubcategory[id]) loadProducts(id)
  }

  const handleSaveCategory = async () => {
    setSaving(true)
    try {
      if (editCategory) {
        await adminProductsService.updateCategory(editCategory.id, {
          name: formData.name,
          color: DEFAULT_CATEGORY_COLOR,
          displayOrder: editCategory.display_order ?? 0
        })
        setEditCategory(null)
      } else {
        await adminProductsService.createCategory({
          name: formData.name,
          color: DEFAULT_CATEGORY_COLOR,
          displayOrder: 0
        })
        setAddCategory(false)
      }
      setFormData({ name: '', displayOrder: 0 })
      await loadCategories()
      // Обновляем данные в других компонентах без перезагрузки страницы
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSubcategory = async () => {
    setSaving(true)
    try {
      const categoryId = editSubcategory ? editSubcategory.category_id : addSubcategory
      if (editSubcategory) {
        await adminProductsService.updateSubcategory(editSubcategory.id, {
          name: formData.name,
          displayOrder: editSubcategory.display_order ?? 0
        })
        setEditSubcategory(null)
      } else {
        await adminProductsService.createSubcategory({
          categoryId,
          name: formData.name,
          displayOrder: 0
        })
        setAddSubcategory(null)
      }
      setFormData({ name: '', displayOrder: 0 })
      loadSubcategories(categoryId)
      // Обновляем данные в других компонентах без перезагрузки страницы
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  // Функция для сжатия изображения
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Вычисляем новые размеры с сохранением пропорций
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Конвертируем в base64 с заданным качеством
          const base64String = canvas.toDataURL('image/jpeg', quality)
          resolve(base64String)
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Функция для обработки выбранного файла из ImageUploader
  const handleImageSelect = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10 МБ')
      return
    }

    try {
      setSaving(true)
      // Сжимаем изображение перед сохранением
      const compressedBase64 = await compressImage(file, 800, 800, 0.85)
      setFormData(prev => ({ ...prev, imageUrl: compressedBase64 }))
      setImagePreview(compressedBase64)
      setError(null)
    } catch (err) {
      setError('Ошибка обработки изображения: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleImageSelect(file)
    }
  }

  const handleSaveProduct = async () => {
    setSaving(true)
    try {
      const subcategoryId = editProduct ? editProduct.subcategory_id : addProduct
      if (editProduct) {
        await adminProductsService.updateProduct(editProduct.id, {
          name: formData.name,
          price: parseFloat(formData.price) || 0,
          imageUrl: formData.imageUrl || null,
          displayOrder: editProduct.display_order ?? 0
        })
        setEditProduct(null)
      } else {
        await adminProductsService.createProduct({
          subcategoryId,
          name: formData.name,
          price: parseFloat(formData.price) || 0,
          imageUrl: formData.imageUrl || null,
          displayOrder: 0
        })
        setAddProduct(null)
      }
      setFormData({ name: '', price: '', displayOrder: 0, imageUrl: '' })
      setImagePreview(null)
      loadProducts(subcategoryId)
      // Обновляем данные в других компонентах без перезагрузки страницы
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete.type || !confirmDelete.id) return
    setSaving(true)
    try {
      if (confirmDelete.type === 'category') await adminProductsService.deleteCategory(confirmDelete.id)
      else if (confirmDelete.type === 'subcategory') await adminProductsService.deleteSubcategory(confirmDelete.id)
      else if (confirmDelete.type === 'product') await adminProductsService.deleteProduct(confirmDelete.id)
      setConfirmDelete({ type: null, id: null, name: '' })
      await loadCategories()
      if (confirmDelete.type === 'subcategory') loadSubcategories(confirmDelete.categoryId)
      if (confirmDelete.type === 'product') loadProducts(confirmDelete.subcategoryId)
      // Обновляем данные в других компонентах без перезагрузки страницы
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка удаления')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const onEscape = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="modal categories-manage-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-overlay" />
      <div className="modal-content modal-content-large categories-manage-content">
        <div className="modal-header">
          <h2>Категории и товары</h2>
          <button type="button" className="close-modal" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        {error && <div className="categories-manage-error">{error}</div>}
        {loading ? (
          <div className="categories-manage-loading">Загрузка...</div>
        ) : (
          <div className="categories-manage-body">
            <p className="categories-manage-hint">
              Нажмите на категорию — откроются подгруппы. Нажмите на подгруппу — отобразятся товары. У каждой записи есть кнопки «Изменить» и «Удалить».
            </p>
            <div className="categories-manage-actions">
              <button
                type="button"
                className="categories-manage-btn-add"
                onClick={() => { setAddCategory(true); setFormData({ name: '', displayOrder: 0 }) }}
              >
                + Добавить категорию
              </button>
            </div>

            {addCategory && (
              <div className="categories-manage-form-block">
                <div className="categories-manage-form-title">Новая категория</div>
                <div className="categories-manage-form">
                  <div className="categories-manage-form-group">
                    <label>Название категории — отображается в выборе товаров</label>
                    <input
                      type="text"
                      className="categories-manage-input-main"
                      placeholder="Например: КОФЕ ФАСОВАННЫЙ"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="categories-manage-form-actions">
                    <button type="button" className="categories-manage-btn-save" onClick={handleSaveCategory} disabled={saving || !formData.name.trim()}>Сохранить</button>
                    <button type="button" className="categories-manage-btn-cancel" onClick={() => setAddCategory(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}

            <ul className="categories-manage-list">
              {categories.map(cat => (
                <li key={cat.id} className="categories-manage-item">
                  {editCategory?.id === cat.id ? (
                    <div className="categories-manage-form-block">
                      <div className="categories-manage-form-title">Редактирование категории</div>
                      <div className="categories-manage-form">
                        <div className="categories-manage-form-group">
                          <label>Название категории</label>
                          <input
                            type="text"
                            className="categories-manage-input-main"
                            placeholder="Название категории"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="categories-manage-form-actions">
                          <button type="button" className="categories-manage-btn-save" onClick={handleSaveCategory} disabled={saving}>Сохранить</button>
                          <button type="button" className="categories-manage-btn-cancel" onClick={() => setEditCategory(null)}>Отмена</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="categories-manage-row categories-manage-row-card categories-manage-row-clickable"
                        onClick={() => toggleCategory(cat.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCategory(cat.id); } }}
                        aria-expanded={expandedCategory === cat.id}
                        aria-label={expandedCategory === cat.id ? `Свернуть: ${cat.name}` : `Раскрыть подгруппы: ${cat.name}`}
                      >
                        <span className="categories-manage-expand" aria-hidden="true">
                          {expandedCategory === cat.id ? '▼' : '▶'}
                        </span>
                        <div className="categories-manage-name-block">
                          <span className="categories-manage-label">Группа</span>
                          <span className="categories-manage-name">{cat.name}</span>
                        </div>
                        <span className="categories-manage-actions-row" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="categories-manage-btn-sm" onClick={() => { setEditCategory(cat); setFormData({ name: cat.name, displayOrder: cat.display_order || 0 }) }}>Изменить</button>
                          <button type="button" className="categories-manage-btn-sm danger" onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}>Удалить</button>
                        </span>
                      </div>
                      {expandedCategory === cat.id && (
                        <div className="categories-manage-children">
                          <button type="button" className="categories-manage-btn-add-sm" onClick={() => { setAddSubcategory(cat.id); setFormData({ name: '', displayOrder: 0 }) }}>+ Подкатегория</button>
                          {addSubcategory === cat.id && (
                            <div className="categories-manage-form-block">
                              <div className="categories-manage-form-title">Новая подкатегория</div>
                              <div className="categories-manage-form">
                                <div className="categories-manage-form-group">
                                  <label>Название подкатегории — например: Группа КОФЕ: 250ГР</label>
                                  <input placeholder="Название подкатегории" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                                </div>
                                <div className="categories-manage-form-actions">
                                  <button type="button" className="categories-manage-btn-save" onClick={handleSaveSubcategory} disabled={saving || !formData.name.trim()}>Сохранить</button>
                                  <button type="button" className="categories-manage-btn-cancel" onClick={() => setAddSubcategory(null)}>Отмена</button>
                                </div>
                              </div>
                            </div>
                          )}
                          <ul>
                            {(subcategoriesByCategory[cat.id] || []).map(sub => (
                              <li key={sub.id} className="categories-manage-item sub">
                                {editSubcategory?.id === sub.id ? (
                                  <div className="categories-manage-form-block">
                                    <div className="categories-manage-form-title">Редактирование подкатегории</div>
                                    <div className="categories-manage-form">
                                      <div className="categories-manage-form-group">
                                        <label>Название подкатегории</label>
                                        <input placeholder="Название" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                                      </div>
                                      <div className="categories-manage-form-actions">
                                        <button type="button" className="categories-manage-btn-save" onClick={handleSaveSubcategory} disabled={saving}>Сохранить</button>
                                        <button type="button" className="categories-manage-btn-cancel" onClick={() => setEditSubcategory(null)}>Отмена</button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div
                                      className="categories-manage-row categories-manage-row-clickable"
                                      onClick={() => toggleSubcategory(sub.id)}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSubcategory(sub.id); } }}
                                      aria-expanded={expandedSubcategory === sub.id}
                                      aria-label={expandedSubcategory === sub.id ? `Свернуть: ${sub.name}` : `Раскрыть товары: ${sub.name}`}
                                    >
                                      <span className="categories-manage-expand" aria-hidden="true">{expandedSubcategory === sub.id ? '▼' : '▶'}</span>
                                      <span className="categories-manage-name">{sub.name}</span>
                                      <span className="categories-manage-actions-row" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className="categories-manage-btn-sm" onClick={() => { setEditSubcategory(sub); setFormData({ name: sub.name, displayOrder: sub.display_order || 0 }) }}>Изменить</button>
                                        <button type="button" className="categories-manage-btn-sm danger" onClick={() => setConfirmDelete({ type: 'subcategory', id: sub.id, name: sub.name, categoryId: cat.id })}>Удалить</button>
                                      </span>
                                    </div>
                                    {expandedSubcategory === sub.id && (
                                      <div className="categories-manage-children">
                                        <button type="button" className="categories-manage-btn-add-sm" onClick={() => { setAddProduct(sub.id); setFormData({ name: '', price: '', displayOrder: 0, imageUrl: '' }); setImagePreview(null) }}>+ Товар</button>
                                        {addProduct === sub.id && (
                                          <div className="categories-manage-form-block">
                                            <div className="categories-manage-form-title">Новый товар</div>
                                            <div className="categories-manage-form">
                                              <div className="categories-manage-form-group">
                                                <label>Название товара — как будет отображаться в заказе</label>
                                                <input placeholder="Например: Кофе арабика 250г" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                                              </div>
                                              <div className="categories-manage-form-group">
                                                <label>Цена (BYN) — число, можно с копейками (например 18.00)</label>
                                                <input type="number" step="0.01" min="0" placeholder="0.00" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} />
                                              </div>
                                              <div className="categories-manage-form-group">
                                                <label>Фотография товара (необязательно, макс. 10 МБ)</label>
                                                <ImageUploader
                                                  onImageSelect={handleImageSelect}
                                                  currentImage={imagePreview}
                                                  maxSizeMB={10}
                                                />
                                                {imagePreview && (
                                                  <button 
                                                    type="button" 
                                                    onClick={() => { 
                                                      setImagePreview(null); 
                                                      setFormData(prev => ({ ...prev, imageUrl: '' })) 
                                                    }} 
                                                    style={{ 
                                                      marginTop: 10, 
                                                      padding: '8px 16px', 
                                                      fontSize: '0.9rem',
                                                      backgroundColor: '#dc2626',
                                                      color: 'white',
                                                      border: 'none',
                                                      borderRadius: '6px',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    Удалить изображение
                                                  </button>
                                                )}
                                              </div>
                                              <div className="categories-manage-form-actions">
                                                <button type="button" className="categories-manage-btn-save" onClick={handleSaveProduct} disabled={saving || !formData.name.trim()}>Сохранить</button>
                                                <button type="button" className="categories-manage-btn-cancel" onClick={() => { setAddProduct(null); setImagePreview(null) }}>Отмена</button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        <ul>
                                          {(productsBySubcategory[sub.id] || []).map(prod => (
                                            <li key={prod.id} className="categories-manage-item product">
                                              {editProduct?.id === prod.id ? (
                                                <div className="categories-manage-form-block">
                                                  <div className="categories-manage-form-title">Редактирование товара</div>
                                                  <div className="categories-manage-form">
                                                    <div className="categories-manage-form-group">
                                                      <label>Название товара</label>
                                                      <input placeholder="Название" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                                                    </div>
                                                    <div className="categories-manage-form-group">
                                                      <label>Цена (BYN)</label>
                                                      <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} />
                                                    </div>
                                                    <div className="categories-manage-form-group">
                                                      <label>Фотография товара (необязательно, макс. 10 МБ)</label>
                                                      <ImageUploader
                                                        onImageSelect={handleImageSelect}
                                                        currentImage={imagePreview || prod.image_data}
                                                        maxSizeMB={10}
                                                      />
                                                      {(imagePreview || prod.image_data) && (
                                                        <button 
                                                          type="button" 
                                                          onClick={() => { 
                                                            setImagePreview(null); 
                                                            setFormData(prev => ({ ...prev, imageUrl: '' })) 
                                                          }} 
                                                          style={{ 
                                                            marginTop: 10, 
                                                            padding: '8px 16px', 
                                                            fontSize: '0.9rem',
                                                            backgroundColor: '#dc2626',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer'
                                                          }}
                                                        >
                                                          Удалить изображение
                                                        </button>
                                                      )}
                                                    </div>
                                                    <div className="categories-manage-form-actions">
                                                      <button type="button" className="categories-manage-btn-save" onClick={handleSaveProduct} disabled={saving}>Сохранить</button>
                                                      <button type="button" className="categories-manage-btn-cancel" onClick={() => { setEditProduct(null); setImagePreview(null) }}>Отмена</button>
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="categories-manage-row">
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    {prod.image_data && (
                                                      <img src={prod.image_data} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                                    )}
                                                    <span className="categories-manage-name">{prod.name}</span>
                                                  </div>
                                                  <span className="categories-manage-price">{Number(prod.price).toFixed(2)} BYN</span>
                                                  <span className="categories-manage-actions-row">
                                                    <button type="button" className="categories-manage-btn-sm" onClick={() => { setEditProduct(prod); setFormData({ name: prod.name, price: prod.price, displayOrder: prod.display_order || 0, imageUrl: prod.image_data || '' }); setImagePreview(prod.image_data || null) }}>Изменить</button>
                                                    <button type="button" className="categories-manage-btn-sm danger" onClick={() => setConfirmDelete({ type: 'product', id: prod.id, name: prod.name, subcategoryId: sub.id })}>Удалить</button>
                                                  </span>
                                                </div>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete.type}
        title="Удаление"
        message={`Удалить «${confirmDelete.name}»?`}
        confirmText="Удалить"
        cancelText="Отмена"
        confirmType="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ type: null, id: null, name: '' })}
      />
    </div>
  )
}

export default CategoriesManageModal
