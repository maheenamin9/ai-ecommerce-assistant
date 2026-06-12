import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquarePlus, ShoppingBag, Trash2, X, LayoutGrid } from 'lucide-react';
import useChatStore from '../../store/chatStore';

const Sidebar = () => {
  const { conversations, sessionId, sidebarOpen, loadConversations, deleteConversation, initSession, toggleSidebar } = useChatStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString();
  };

  if (!sidebarOpen) return null;

  return (
    <div className="w-64 h-full bg-[#171717] flex flex-col border-r border-[#2f2f2f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-green-500" />
          <span className="font-semibold text-sm text-white">ShopAI</span>
        </div>
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-[#2f2f2f] text-gray-400">
          <X size={16} />
        </button>
      </div>

      {/* Nav links */}
      <div className="px-3 pt-3 pb-1 space-y-1">
        <button
          onClick={async () => {
            const newId = await initSession();
            if (newId) navigate(`/chat/${newId}`);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#2f2f2f] transition-colors"
        >
          <MessageSquarePlus size={16} />
          New conversation
        </button>
        <Link
          to="/products"
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            location.pathname === '/products'
              ? 'bg-[#2f2f2f] text-white'
              : 'text-gray-400 hover:bg-[#2f2f2f] hover:text-gray-200'
          }`}
        >
          <LayoutGrid size={16} />
          Browse Products
        </Link>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-500 text-center mt-4">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.sessionId}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer mb-1 transition-colors ${
                sessionId === conv.sessionId ? 'bg-[#2f2f2f] text-white' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
              }`}
              onClick={() => navigate(`/chat/${conv.sessionId}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{conv.title || 'New Conversation'}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(conv.updatedAt)}</p>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const wasActive = sessionId === conv.sessionId;
                  await deleteConversation(conv.sessionId);
                  if (wasActive) navigate('/');
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-opacity ml-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[#2f2f2f] text-xs text-gray-600 text-center">
        AI-powered shopping
      </div>
    </div>
  );
};

export default Sidebar;
