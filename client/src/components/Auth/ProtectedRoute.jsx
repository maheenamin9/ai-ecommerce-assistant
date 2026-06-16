import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121212]">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
