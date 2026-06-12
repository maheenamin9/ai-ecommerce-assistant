import { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart, Loader } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import CheckoutModal from './CheckoutModal';
import { reservationApi } from '../../services/api';

const CartDrawer = () => {
  const { items, cartOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState(null);

  const handleProceedToCheckout = async () => {
    setReserving(true);
    setReserveError(null);
    try {
      await reservationApi.reserve(
        items.map((i) => ({ product: i.productId, name: i.name, quantity: i.quantity }))
      );
      setCheckoutOpen(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.unavailable?.length) {
        data.unavailable
          .filter((u) => u.available === 0)
          .forEach((u) => {
            const cartItem = items.find((i) => i.name === u.name);
            if (cartItem) removeItem(cartItem.productId);
          });
        setReserveError(
          data.unavailable
            .map((u) => u.available > 0 ? `"${u.name}" has only ${u.available} left` : `"${u.name}" is out of stock`)
            .join('. ')
        );
      } else {
        setReserveError(data?.error || 'Could not reserve items. Please try again.');
      }
      setTimeout(() => setReserveError(null), 3000);
    } finally {
      setReserving(false);
    }
  };

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-[#1a1a1a] border-l border-[#2f2f2f] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f2f2f]">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-green-500" />
            <span className="font-semibold text-sm text-white">Your Cart</span>
            {items.length > 0 && (
              <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <ShoppingCart size={40} className="text-gray-600" />
              <p className="text-sm text-gray-500">Your cart is empty</p>
              <p className="text-xs text-gray-600">Ask the assistant to find products for you</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 bg-[#2f2f2f] rounded-xl p-3 border border-[#3f3f3f]">
                <div className="w-12 h-12 bg-[#404040] rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.brand || item.category}</p>
                  <p className="text-sm font-bold text-green-400 mt-0.5">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeItem(item.productId)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-5 h-5 rounded-full bg-[#404040] hover:bg-[#505050] flex items-center justify-center text-gray-300 transition-colors"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-5 h-5 rounded-full bg-[#404040] hover:bg-[#505050] flex items-center justify-center text-gray-300 transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-[#2f2f2f] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-base font-bold text-white">${totalPrice.toFixed(2)}</span>
            </div>
            {reserveError && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {reserveError}
              </p>
            )}
            <button
              onClick={handleProceedToCheckout}
              disabled={reserving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                reserving
                  ? 'bg-[#2f2f2f] text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {reserving && <Loader size={14} className="animate-spin" />}
              {reserving ? 'Checking availability…' : 'Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>

      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </>
  );
};

export default CartDrawer;
