import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ShoppingCart, Star, Package, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import CartDrawer from '../components/Cart/CartDrawer';
import ProductDetailModal from '../components/Chat/ProductDetailModal';
import { productApi } from '../services/api';
import useCartStore from '../store/cartStore';

const PRICE_RANGES = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under $50', min: '', max: '50' },
  { label: '$50 – $150', min: '50', max: '150' },
  { label: '$150 – $300', min: '150', max: '300' },
  { label: 'Over $300', min: '300', max: '' },
];

const ProductCard = ({ product, onViewDetails }) => {
  const { addItem, openCart, items } = useCartStore();
  const [adding, setAdding] = useState(false);
  const [stockError, setStockError] = useState(null);

  const cartQty = items.find((i) => i.productId === product._id)?.quantity ?? 0;
  const availableStock = product.stock;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setAdding(true);
    setStockError(null);
    try {
      const { data: fresh } = await productApi.getProduct(product._id);
      if (fresh.stock - cartQty <= 0) {
        setStockError('Out of stock');
        return;
      }
      addItem({ productId: product._id, name: product.name, price: product.price, brand: product.brand, category: product.category });
      openCart();
    } catch {
      setStockError('Could not verify stock');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      onClick={() => onViewDetails(product._id)}
      className="bg-[#1e1e1e] border border-[#2f2f2f] hover:border-green-600/40 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all group"
    >
      {/* Image placeholder */}
      <div className="w-full h-36 bg-[#2a2a2a] rounded-xl flex items-center justify-center">
        <ShoppingCart size={32} className="text-gray-600" />
      </div>

      {/* Info */}
      <div className="flex-1 space-y-1">
        <p className="text-xs text-gray-500">{product.brand} · {product.category}</p>
        <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">{product.name}</h3>

        <div className="flex items-center gap-2 pt-0.5">
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[11px] text-yellow-400">{product.rating}</span>
              <span className="text-[11px] text-gray-600">({product.numReviews})</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Package size={11} className={availableStock > 0 ? 'text-green-500' : 'text-red-500'} />
            <span className={`text-[11px] ${availableStock > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {availableStock > 0 ? `${availableStock} left` : 'Out of stock'}
            </span>
          </div>
        </div>
      </div>

      {/* Price + Add to cart */}
      <div className="flex items-center justify-between pt-1 border-t border-[#2a2a2a]">
        <span className="text-base font-bold text-green-400">${product.price.toFixed(2)}</span>
        <button
          onClick={handleAddToCart}
          disabled={availableStock === 0 || adding}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            availableStock > 0 && !adding
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
          }`}
        >
          {adding
            ? <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            : <ShoppingCart size={13} />}
          {adding ? 'Checking…' : 'Add to Cart'}
        </button>
      </div>
      {stockError && <p className="text-[10px] text-red-400 -mt-1">{stockError}</p>}
    </div>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(PRICE_RANGES[0]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    productApi.getCategories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setFetching(true);
    try {
      const params = {
        page,
        limit: 12,
        ...(selectedCategory && { category: selectedCategory }),
        ...(search && { search }),
        ...(selectedPrice.min && { minPrice: selectedPrice.min }),
        ...(selectedPrice.max && { maxPrice: selectedPrice.max }),
      };
      const res = await productApi.getProducts(params);
      setProducts(res.data.products);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch {
      setProducts([]);
    } finally {
      setFetching(false);
    }
  }, [page, selectedCategory, search, selectedPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPrice(PRICE_RANGES[0]);
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const hasFilters = selectedCategory || selectedPrice.label !== 'All Prices' || search;

  return (
    <div className="flex h-screen flex-col bg-[#212121] overflow-hidden">
      <Navbar />
      <CartDrawer />

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar */}
        <aside className={`${filtersOpen ? 'flex' : 'hidden'} md:flex w-56 shrink-0 flex-col gap-5 px-4 py-5 border-r border-[#2f2f2f] overflow-y-auto`}>
          {/* Category */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
            <div className="space-y-1">
              <button
                onClick={() => { setSelectedCategory(''); setPage(1); }}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setPage(1); }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Range</p>
            <div className="space-y-1">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => { setSelectedPrice(range); setPage(1); }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                    selectedPrice.label === range.label ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2f2f2f] shrink-0">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-[#2a2a2a] text-gray-400 transition-colors"
            >
              <SlidersHorizontal size={16} />
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-[#2a2a2a] border border-[#3f3f3f] focus-within:border-green-600 rounded-xl px-3 py-2 transition-colors">
              <Search size={15} className="text-gray-500 shrink-0" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>
                  <X size={13} className="text-gray-500 hover:text-white" />
                </button>
              )}
            </form>

            <span className="text-xs text-gray-500 shrink-0">{total} product{total !== 1 ? 's' : ''}</span>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {fetching ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <ShoppingCart size={40} className="text-gray-600" />
                <p className="text-sm text-gray-500">No products found</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-green-500 hover:text-green-400">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onViewDetails={setSelectedProductId}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
