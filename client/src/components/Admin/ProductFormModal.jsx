import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { productApi } from '../../services/api';

const NEW_CATEGORY = '__new__';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  brand: '',
  stock: '',
  images: '',
  tags: '',
  isActive: true,
};

const toFormState = (product) =>
  product
    ? {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand || '',
        stock: product.stock,
        images: (product.images || []).join(', '),
        tags: (product.tags || []).join(', '),
        isActive: product.isActive,
      }
    : emptyForm;

const ProductFormModal = ({ product, onClose, onSaved }) => {
  const [form, setForm] = useState(toFormState(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [addingCategory, setAddingCategory] = useState(false);

  const isEdit = Boolean(product);

  useEffect(() => {
    productApi
      .getCategories()
      .then((res) => {
        setCategories(res.data);
        if (res.data.length === 0) setAddingCategory(true);
      })
      .catch(() => setAddingCategory(true));
  }, []);

  // getCategories only returns categories with at least one active product, so make sure
  // the value already on this product (e.g. an inactive-only category) still shows up.
  const categoryOptions =
    form.category && !categories.includes(form.category) ? [...categories, form.category] : categories;

  const handleChange = (field) => (e) => {
    const value = field === 'isActive' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (e) => {
    if (e.target.value === NEW_CATEGORY) {
      setAddingCategory(true);
      setForm((prev) => ({ ...prev, category: '' }));
    } else {
      setForm((prev) => ({ ...prev, category: e.target.value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category.trim(),
      brand: form.brand,
      stock: Number(form.stock),
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      isActive: form.isActive,
    };

    try {
      const res = isEdit
        ? await productApi.updateProduct(product._id, payload)
        : await productApi.createProduct(payload);
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-[#3f3f3f] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f2f2f]">
          <h2 className="text-sm font-semibold text-white">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={handleChange('description')}
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price ($)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange('price')}
                className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange('stock')}
                className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              {addingCategory ? (
                <div className="space-y-1">
                  <input
                    required
                    autoFocus
                    type="text"
                    placeholder="New category name"
                    value={form.category}
                    onChange={handleChange('category')}
                    className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2 placeholder:text-gray-600"
                  />
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingCategory(false);
                        setForm((prev) => ({ ...prev, category: '' }));
                      }}
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      ← choose existing category
                    </button>
                  )}
                </div>
              ) : (
                <select
                  required
                  value={form.category}
                  onChange={handleCategorySelect}
                  className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2"
                >
                  <option value="" disabled>
                    Select category…
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY}>+ Add new category…</option>
                </select>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={handleChange('brand')}
                className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Image URLs (comma-separated)</label>
            <input
              type="text"
              value={form.images}
              onChange={handleChange('images')}
              placeholder="https://example.com/a.jpg, https://example.com/b.jpg"
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2 placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={handleChange('tags')}
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-sm text-white px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 pt-1">
            <input type="checkbox" checked={form.isActive} onChange={handleChange('isActive')} />
            Active (visible to customers)
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors mt-2"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
