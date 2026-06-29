import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import { orderApi } from '../services/api';

const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-blue-500/10 text-blue-400',
  shipped: 'bg-purple-500/10 text-purple-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

const ORDER_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

// Mirrors the server's forward-only transition rule so the dropdown only offers valid next states.
const nextStatusOptions = (current) => {
  if (current === 'delivered' || current === 'cancelled') return [];
  const options = ORDER_FLOW.slice(ORDER_FLOW.indexOf(current) + 1);
  return [...options, 'cancelled'];
};

const OrderRow = ({ order, onUpdated }) => {
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const options = nextStatusOptions(order.status);

  const handleUpdate = async () => {
    if (!status) return;
    setSaving(true);
    setError(null);
    try {
      const res = await orderApi.updateOrderStatus(order._id, { status, trackingNumber, carrier });
      onUpdated(res.data);
      setStatus('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl px-4 py-3.5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center shrink-0">
            <Package size={16} className="text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate font-mono">{order._id}</p>
            <p className="text-xs text-gray-500">
              {order.userId?.name} · {order.userId?.email} · ${order.totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#2a2a2a] text-gray-400 uppercase">
            {order.paymentMethod === 'cod' ? 'COD' : 'Card'}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
              STATUS_STYLES[order.status] || 'bg-gray-500/10 text-gray-400'
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {options.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#2f2f2f]">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-xs text-white px-2.5 py-1.5"
          >
            <option value="">Change status…</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {status === 'shipped' && (
            <>
              <input
                type="text"
                placeholder="Tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-xs text-white px-2.5 py-1.5 placeholder:text-gray-500"
              />
              <input
                type="text"
                placeholder="Carrier (optional)"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-xs text-white px-2.5 py-1.5 placeholder:text-gray-500"
              />
            </>
          )}

          <button
            onClick={handleUpdate}
            disabled={!status || saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
          >
            {saving ? 'Updating…' : 'Update'}
          </button>

          {error && <p className="text-xs text-red-400 w-full">{error}</p>}
        </div>
      )}

      {order.trackingNumber && (
        <p className="text-xs text-gray-500 pt-2">
          Tracking: {order.trackingNumber}
          {order.carrier ? ` (${order.carrier})` : ''}
        </p>
      )}
    </div>
  );
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    orderApi
      .getAllOrders(statusFilter ? { status: statusFilter } : {})
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleUpdated = (updated) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-white">Manage Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg text-xs text-white px-2.5 py-1.5"
        >
          <option value="">All statuses</option>
          {[...ORDER_FLOW, 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center py-16">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Package size={32} className="mb-3" />
          <p className="text-sm">No orders found.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <OrderRow key={order._id} order={order} onUpdated={handleUpdated} />
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
