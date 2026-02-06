import React, { useState, useEffect, useCallback } from 'react'
import { adminProductsService } from '../services/adminProductsService'
import { useAuth } from '../contexts/AuthContext'
import { useDataRefresh } from '../contexts/DataRefreshContext'
import CategoriesManageModal from './CategoriesManageModal'
import ConfirmDialog from './ConfirmDialog'
import ImageUploader from './ImageUploader'
import './CategoriesPage.css'

const CategoriesPage = () => {
  const { refreshAccessToken } = useAuth()
  const { refreshAll } = useDataRefresh()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedSubcategory, setExpandedSubcategory] = useState(null)
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({})
  const [productsBySubcategory, setProductsBySubcategory] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
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
  const [imageCompressing, setImageCompressing] = useState(false)

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

  const handleToggleTrackCharts = async (cat) => {
    if (saving) return
    setSaving(true)
    try {
      await adminProductsService.updateCategory(cat.id, {
        name: cat.name,
        color: cat.color || DEFAULT_CATEGORY_COLOR,
        displayOrder: cat.display_order ?? 0,
        trackCharts: !cat.track_charts
      })
      await loadCategories()
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка обновления')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCategory = async () => {
    setSaving(true)
    try {
      if (editCategory) {
        await adminProductsService.updateCategory(editCategory.id, {
          name: formData.name,
          color: DEFAULT_CATEGORY_COLOR,
          displayOrder: editCategory.display_order ?? 0,
          trackCharts: editCategory.track_charts
        })
        setEditCategory(null)
      } else {
        await adminProductsService.createCategory({
          name: formData.name,
          color: DEFAULT_CATEGORY_COLOR,
          icon: '/img/coffee-beans-filled-roast-brew-svgrepo-com.svg',
          displayOrder: 0
        })
      }
      setFormData({ name: '', displayOrder: 0 })
      await loadCategories()
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
      if (editSubcategory) {
        await adminProductsService.updateSubcategory(editSubcategory.id, {
          name: formData.name,
          displayOrder: editSubcategory.display_order ?? 0
        })
        setEditSubcategory(null)
      } else {
        await adminProductsService.createSubcategory({
          categoryId: addSubcategory,
          name: formData.name,
          displayOrder: formData.displayOrder || 0
        })
        setAddSubcategory(null)
      }
      setFormData({ name: '', displayOrder: 0 })
      if (addSubcategory) {
        await loadSubcategories(addSubcategory)
      }
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProduct = async () => {
    setSaving(true)
    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        displayOrder: formData.displayOrder || 0
      }

      if (imagePreview && imagePreview.startsWith('data:')) {
        productData.imageData = imagePreview
      }

      if (editProduct) {
        await adminProductsService.updateProduct(editProduct.id, productData)
        setEditProduct(null)
      } else {
        await adminProductsService.createProduct({
          subcategoryId: addProduct,
          ...productData
        })
        setAddProduct(null)
      }
      setFormData({ name: '', displayOrder: 0, price: '', imageUrl: '' })
      setImagePreview(null)
      if (addProduct) {
        await loadProducts(addProduct)
      }
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      switch (confirmDelete.type) {
        case 'category':
          await adminProductsService.deleteCategory(confirmDelete.id)
          break
        case 'subcategory':
          await adminProductsService.deleteSubcategory(confirmDelete.id)
          break
        case 'product':
          await adminProductsService.deleteProduct(confirmDelete.id)
          break
      }
      setConfirmDelete({ type: null, id: null, name: '' })
      await loadCategories()
      setTimeout(() => refreshAll(), 100)
    } catch (e) {
      setError(e?.message || 'Ошибка удаления')
    }
  }

  if (loading) {
    return (
      <div className="categories-page">
        <div className="categories-loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <h2>Категории и товары</h2>
        <button
          type="button"
          className="categories-add-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Добавить
        </button>
      </div>

      {error && <div className="categories-error">{error}</div>}

      <div className="categories-hint">
        Нажмите на категорию — откроются подгруппы. Нажмите на подгруппу — отобразятся товары. У каждой записи есть кнопки «Изменить» и «Удалить».
      </div>

      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="categories-empty">Нет категорий. Добавьте первую категорию.</div>
        ) : (
          <ul className="categories-tree">
            {categories.map(cat => (
              <li key={cat.id} className="categories-item">
                <div className="categories-item-header">
                  <button
                    type="button"
                    className="categories-toggle"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className={`categories-arrow ${expandedCategory === cat.id ? 'expanded' : ''}`}>▶</span>
                    <span className="categories-name">Группа {cat.name}</span>
                  </button>
                  <div className="categories-actions">
                    <label className="categories-track-checkbox">
                      <input
                        type="checkbox"
                        checked={!!cat.track_charts}
                        onChange={() => handleToggleTrackCharts(cat)}
                      />
                      <span>Учёт в графиках</span>
                    </label>
                    <button
                      type="button"
                      className="categories-btn-edit"
                      onClick={() => {
                        setEditCategory(cat)
                        setFormData({ name: cat.name, displayOrder: cat.display_order || 0 })
                      }}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="categories-btn-delete"
                      onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                {editCategory?.id === cat.id && (
                  <div className="categories-edit-form">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Название категории"
                      className="categories-input"
                    />
                    <div className="categories-form-actions">
                      <button
                        type="button"
                        className="categories-btn-save"
                        onClick={handleSaveCategory}
                        disabled={saving || !formData.name.trim()}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="categories-btn-cancel"
                        onClick={() => {
                          setEditCategory(null)
                          setFormData({ name: '', displayOrder: 0 })
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {expandedCategory === cat.id && (
                  <div className="categories-subcategories">
                    <button
                      type="button"
                      className="categories-add-subcategory"
                      onClick={() => {
                        setAddSubcategory(cat.id)
                        setFormData({ name: '', displayOrder: 0 })
                      }}
                    >
                      + Подкатегория
                    </button>

                    {addSubcategory === cat.id && (
                      <div className="categories-edit-form">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Название подкатегории"
                          className="categories-input"
                        />
                        <div className="categories-form-actions">
                          <button
                            type="button"
                            className="categories-btn-save"
                            onClick={handleSaveSubcategory}
                            disabled={saving || !formData.name.trim()}
                          >
                            Сохранить
                          </button>
                          <button
                            type="button"
                            className="categories-btn-cancel"
                            onClick={() => {
                              setAddSubcategory(null)
                              setFormData({ name: '', displayOrder: 0 })
                            }}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}

                    <ul className="subcategories-list">
                      {(subcategoriesByCategory[cat.id] || []).map(sub => (
                        <li key={sub.id} className="subcategories-item">
                          <div className="subcategories-item-header">
                            <button
                              type="button"
                              className="subcategories-toggle"
                              onClick={() => toggleSubcategory(sub.id)}
                            >
                              <span className={`subcategories-arrow ${expandedSubcategory === sub.id ? 'expanded' : ''}`}>▶</span>
                              <span className="subcategories-name">{sub.name}</span>
                            </button>
                            <div className="subcategories-actions">
                              <button
                                type="button"
                                className="categories-btn-edit"
                                onClick={() => {
                                  setEditSubcategory(sub)
                                  setFormData({ name: sub.name, displayOrder: sub.display_order || 0 })
                                }}
                              >
                                Изменить
                              </button>
                              <button
                                type="button"
                                className="categories-btn-delete"
                                onClick={() => setConfirmDelete({ type: 'subcategory', id: sub.id, name: sub.name, categoryId: cat.id })}
                              >
                                Удалить
                              </button>
                            </div>
                          </div>

                          {editSubcategory?.id === sub.id && (
                            <div className="categories-edit-form">
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Название подкатегории"
                                className="categories-input"
                              />
                              <div className="categories-form-actions">
                                <button
                                  type="button"
                                  className="categories-btn-save"
                                  onClick={handleSaveSubcategory}
                                  disabled={saving}
                                >
                                  Сохранить
                                </button>
                                <button
                                  type="button"
                                  className="categories-btn-cancel"
                                  onClick={() => {
                                    setEditSubcategory(null)
                                    setFormData({ name: '', displayOrder: 0 })
                                  }}
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}

                          {expandedSubcategory === sub.id && (
                            <div className="products-list">
                              <button
                                type="button"
                                className="categories-add-product"
                                onClick={() => {
                                  setAddProduct(sub.id)
                                  setFormData({ name: '', price: '', displayOrder: 0, imageUrl: '' })
                                  setImagePreview(null)
                                }}
                              >
                                + Товар
                              </button>

                              {addProduct === sub.id && (
                                <div className="categories-edit-form">
                                  <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Название товара"
                                    className="categories-input"
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="Цена"
                                    className="categories-input"
                                  />
                                  <ImageUploader
                                    value={imagePreview}
                                    onChange={(data) => {
                                      setImagePreview(data)
                                      setFormData({ ...formData, imageUrl: data || '' })
                                    }}
                                    onCompressingChange={setImageCompressing}
                                  />
                                  <div className="categories-form-actions">
                                    <button
                                      type="button"
                                      className="categories-btn-save"
                                      onClick={handleSaveProduct}
                                      disabled={saving || imageCompressing || !formData.name.trim()}
                                    >
                                      Сохранить
                                    </button>
                                    <button
                                      type="button"
                                      className="categories-btn-cancel"
                                      onClick={() => {
                                        setAddProduct(null)
                                        setImagePreview(null)
                                        setFormData({ name: '', displayOrder: 0, price: '', imageUrl: '' })
                                      }}
                                    >
                                      Отмена
                                    </button>
                                  </div>
                                </div>
                              )}

                              <ul className="products-list-items">
                                {(productsBySubcategory[sub.id] || []).map(prod => (
                                  <li key={prod.id} className="products-item">
                                    <div className="products-item-content">
                                      {prod.image_data && (
                                        <img src={prod.image_data} alt={prod.name} className="products-item-image" />
                                      )}
                                      <div className="products-item-info">
                                        <span className="products-item-name">{prod.name}</span>
                                        <span className="products-item-price">{prod.price} BYN</span>
                                      </div>
                                    </div>
                                    <div className="products-item-actions">
                                      <button
                                        type="button"
                                        className="categories-btn-edit"
                                        onClick={() => {
                                          setEditProduct(prod)
                                          setFormData({ name: prod.name, price: prod.price, displayOrder: prod.display_order || 0, imageUrl: prod.image_data || '' })
                                          setImagePreview(prod.image_data || null)
                                        }}
                                      >
                                        Изменить
                                      </button>
                                      <button
                                        type="button"
                                        className="categories-btn-delete"
                                        onClick={() => setConfirmDelete({ type: 'product', id: prod.id, name: prod.name, subcategoryId: sub.id })}
                                      >
                                        Удалить
                                      </button>
                                    </div>

                                    {editProduct?.id === prod.id && (
                                      <div className="categories-edit-form">
                                        <input
                                          type="text"
                                          value={formData.name}
                                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                          placeholder="Название товара"
                                          className="categories-input"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={formData.price}
                                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                          placeholder="Цена"
                                          className="categories-input"
                                        />
                                        <ImageUploader
                                          value={imagePreview}
                                          onChange={(data) => {
                                            setImagePreview(data)
                                            setFormData({ ...formData, imageUrl: data || '' })
                                          }}
                                          onCompressingChange={setImageCompressing}
                                        />
                                        <div className="categories-form-actions">
                                          <button
                                            type="button"
                                            className="categories-btn-save"
                                            onClick={handleSaveProduct}
                                            disabled={saving || imageCompressing}
                                          >
                                            Сохранить
                                          </button>
                                          <button
                                            type="button"
                                            className="categories-btn-cancel"
                                            onClick={() => {
                                              setEditProduct(null)
                                              setImagePreview(null)
                                              setFormData({ name: '', displayOrder: 0, price: '', imageUrl: '' })
                                            }}
                                          >
                                            Отмена
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddModal && (
        <CategoriesManageModal onClose={() => {
          setShowAddModal(false)
          loadCategories()
        }} />
      )}

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

export default CategoriesPage
