import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import ChatInterface from '../Chat/ChatInterface';
import CartDrawer from '../Cart/CartDrawer';
import Navbar from './Navbar';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';

const Layout = () => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const { sessionId, sidebarOpen, initSession, loadConversation, toggleSidebar } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (urlSessionId) {
      loadConversation(urlSessionId);
    } else {
      initSession().then((newSessionId) => {
        if (newSessionId) navigate(`/chat/${newSessionId}`, { replace: true });
      });
    }
  }, [user, urlSessionId]);

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
