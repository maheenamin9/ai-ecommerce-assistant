import { useEffect, useState } from 'react';
import { Package, ChevronRight } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import CartDrawer from '../components/Cart/CartDrawer';
import OrderDetailModal from '../components/Orders/OrderDetailModal';
import { orderApi } from '../services/api';

const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-blue-500/10 text-blue-400',
  shipped: 'bg-purple-500/10 text-purple-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    orderApi
      .getOrders()
      .then((res) => setOrders(res.data))
      .catch(() => setError('Could not load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#212121] overflow-hidden">
      <Navbar />
      <CartDrawer />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-white mb-6">My Orders</h1>

          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && <p className="text-sm text-red-400 text-center py-16">{error}</p>}

          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Package size={32} className="mb-3" />
              <p className="text-sm">You haven't placed any orders yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order._id}
                onClick={() => setSelectedOrderId(order._id)}
                className="w-full flex items-center justify-between gap-4 bg-[#1e1e1e] border border-[#2f2f2f] hover:border-[#3f3f3f] rounded-2xl px-4 py-3.5 text-left transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center shrink-0">
                    <Package size={16} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                      ${order.totalPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                      STATUS_STYLES[order.status] || 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {order.status}
                  </span>
                  <ChevronRight size={16} className="text-gray-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedOrderId && (
        <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </div>
  );
};

export default OrdersPage;
