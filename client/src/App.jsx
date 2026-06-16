import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProductsPage from './pages/ProductsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import useAuthStore from './store/authStore';

function App() {
  const init = useAuthStore((state) => state.init);

  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
        <Route path="/chat/:sessionId" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
