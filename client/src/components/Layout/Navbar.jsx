import { Link, useLocation } from 'react-router-dom';
import { PanelLeftOpen, ShoppingCart, LogOut, User, ShoppingBag, LayoutGrid, MessageSquare } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';

const Navbar = ({ onToggleSidebar, showSidebarToggle }) => {
  const { items, toggleCart } = useCartStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2f2f2f] bg-[#212121] shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-[#2f2f2f] text-gray-400 transition-colors"
            title="Open sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {/* Nav links */}
        <div className="flex items-center gap-1 ml-1">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-[#2f2f2f] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            }`}
          >
            <MessageSquare size={14} />
            Chat
          </Link>
          <Link
            to="/products"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              location.pathname === '/products'
                ? 'bg-[#2f2f2f] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            }`}
          >
            <LayoutGrid size={14} />
            Products
          </Link>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
            <User size={13} className="text-white" />
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">{user?.name}</span>
        </div>

        <button
          onClick={toggleCart}
          className="relative p-2 rounded-lg hover:bg-[#2f2f2f] text-gray-400 hover:text-white transition-colors"
          title="Cart"
        >
          <ShoppingCart size={18} />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </button>

        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-[#2f2f2f] text-gray-400 hover:text-red-400 transition-colors"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
