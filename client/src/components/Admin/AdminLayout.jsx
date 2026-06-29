import { Link, useLocation } from 'react-router-dom';
import { Package, Boxes } from 'lucide-react';
import Navbar from '../Layout/Navbar';

const TABS = [
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/products', label: 'Products', icon: Boxes },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col bg-[#212121] overflow-hidden">
      <Navbar />

      <div className="border-b border-[#2f2f2f] bg-[#1a1a1a] px-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-1">
          {TABS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                location.pathname === to
                  ? 'border-green-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
