import { useEffect, useState } from 'react';
import { Boxes, Pencil, Trash2, Plus } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import ProductFormModal from '../components/Admin/ProductFormModal';
import { productApi } from '../services/api';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = () => {
    setLoading(true);
    productApi
      .getProducts({ limit: 100 })
      .then((res) => setProducts(res.data.products))
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSaved = (saved) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p._id === saved._id);
      return exists ? prev.map((p) => (p._id === saved._id ? saved : p)) : [saved, ...prev];
    });
    setShowForm(false);
  };

  const handleDelete = async (product) => {
    if (!confirm(`Deactivate "${product.name}"? It will be hidden from customers but can be reactivated later.`)) {
      return;
    }
    setDeletingId(product._id);
    try {
      await productApi.deleteProduct(product._id);
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isActive: false } : p)));
    } catch {
      setError('Failed to deactivate product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-white">Manage Products</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
        >
          <Plus size={14} />
          Add Product
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center py-16">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Boxes size={32} className="mb-3" />
          <p className="text-sm">No products yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product._id}
            className="flex items-center justify-between gap-4 bg-[#1e1e1e] border border-[#2f2f2f] rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Boxes size={16} className="text-gray-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {product.category} · ${product.price.toFixed(2)} · Stock {product.stock}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  product.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => openEdit(product)}
                className="p-2 rounded-lg hover:bg-[#2f2f2f] text-gray-400 hover:text-white transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(product)}
                disabled={!product.isActive || deletingId === product._id}
                className="p-2 rounded-lg hover:bg-[#2f2f2f] text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={product.isActive ? 'Deactivate' : 'Already inactive'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </AdminLayout>
  );
};

export default AdminProductsPage;
