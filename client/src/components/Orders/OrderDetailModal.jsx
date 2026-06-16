import { useEffect, useState } from 'react';
import { X, Package } from 'lucide-react';
import { orderApi } from '../../services/api';

const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-blue-500/10 text-blue-400',
  shipped: 'bg-purple-500/10 text-purple-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

const OrderDetailModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    orderApi
      .getOrder(orderId)
      .then((res) => setOrder(res.data))
      .catch(() => setError('Could not load order details.'))
      .finally(() => setLoading(false));
  }, [orderId]);

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
          <h2 className="text-sm font-semibold text-white">Order Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && <p className="text-sm text-red-400 text-center py-8">{error}</p>}

          {order && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="text-sm text-white font-mono">{order._id}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                    STATUS_STYLES[order.status] || 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="text-xs text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </div>

              <div className="border-t border-[#2f2f2f] pt-4 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0">
                      <Package size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm text-gray-300">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#2f2f2f] pt-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-base font-semibold text-white">${order.totalPrice.toFixed(2)}</span>
              </div>

              {order.shippingAddress?.street && (
                <div className="border-t border-[#2f2f2f] pt-4">
                  <p className="text-xs text-gray-500 mb-1">Shipping Address</p>
                  <p className="text-sm text-gray-300">
                    {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                    {order.shippingAddress.state} {order.shippingAddress.zipCode},{' '}
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
