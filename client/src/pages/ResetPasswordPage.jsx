import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Loader, CheckCircle2 } from 'lucide-react';
import { authApi } from '../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212] px-4">
        <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm text-gray-300">Missing reset token.</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-2.5 bg-[#2a2a2a] hover:bg-[#333] text-white text-sm font-medium rounded-xl transition-colors"
          >
            Request a new link
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212] px-4">
        <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 text-center space-y-4">
          <CheckCircle2 size={28} className="text-green-500 mx-auto" />
          <p className="text-sm text-gray-300">Password reset successfully. You can now log in.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center">
            <ShoppingBag size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">ShopAI</h1>
          <p className="text-sm text-gray-500">Set a new password</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] focus:border-green-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            {loading && <Loader size={15} className="animate-spin" />}
            {loading ? 'Please wait...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
