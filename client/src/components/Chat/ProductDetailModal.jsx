import { useEffect, useState } from 'react';
import { X, ShoppingBag, Star, Package, Tag, ShoppingCart, Check } from 'lucide-react';
import { productApi } from '../../services/api';
import useCartStore from '../../store/cartStore';

const ProductDetailModal = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [stockError, setStockError] = useState(null);

  const { addItem, openCart, items } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productApi.getProduct(productId);
        setProduct(res.data);
      } catch {
        setError('Could not load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    setStockError(null);
    try {
      const { data: fresh } = await productApi.getProduct(product._id);
      const cartQty = items.find((i) => i.productId === product._id)?.quantity ?? 0;
      if (fresh.stock - cartQty <= 0) {
        setStockError('This item is no longer available');
        return;
      }
      addItem({ productId: product._id, name: product.name, price: product.price, brand: product.brand, category: product.category });
      setAdded(true);
      setTimeout(() => { onClose(); openCart(); }, 800);
    } catch {
      setStockError('Could not verify stock');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-[#3f3f3f] rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f2f2f]">
          <h2 className="text-sm font-semibold text-white">Product Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-red-400 py-8">{error}</p>
          )}

          {product && (
            <div className="space-y-4">
              {/* Image + name */}
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-[#2f2f2f] rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={32} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white leading-snug">{product.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{product.brand} · {product.category}</p>
                  <p className="text-xl font-bold text-green-400 mt-1">${product.price?.toFixed(2)}</p>
                </div>
              </div>

              {/* Rating + stock */}
              <div className="flex items-center gap-4">
                {product.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">{product.rating}</span>
                    <span className="text-xs text-gray-500">({product.numReviews} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Package size={13} className={product.stock > 0 ? 'text-green-500' : 'text-red-500'} />
                  <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-300 leading-relaxed">{product.description}</p>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={12} className="text-gray-500" />
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 bg-[#2f2f2f] text-gray-400 rounded-full border border-[#3f3f3f]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || added}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  added
                    ? 'bg-green-700 text-white'
                    : product.stock === 0
                    ? 'bg-[#2f2f2f] text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {added ? <Check size={16} /> : <ShoppingCart size={16} />}
                {added ? 'Added to Cart' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              {stockError && <p className="text-xs text-red-400 text-center">{stockError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
