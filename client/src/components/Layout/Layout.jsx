import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import ChatInterface from '../Chat/ChatInterface';
import CartDrawer from '../Cart/CartDrawer';
import AuthModal from '../Auth/AuthModal';
import Navbar from './Navbar';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';

const Layout = () => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const { sessionId, sidebarOpen, initSession, loadConversation, toggleSidebar } = useChatStore();
  const { user, loading, init } = useAuthStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!user) return;
    if (urlSessionId) {
      loadConversation(urlSessionId);
    } else {
      initSession().then((newSessionId) => {
        if (newSessionId) navigate(`/chat/${newSessionId}`, { replace: true });
      });
    }
  }, [user, urlSessionId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121212]">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthModal />;

  return (
    <div className="flex h-screen bg-[#212121] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          showSidebarToggle={!sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <ChatInterface />
      </div>

      <CartDrawer />
    </div>
  );
};

export default Layout;
