import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader, MailCheck } from 'lucide-react';
import { authApi } from '../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212] px-4">
        <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center mx-auto">
            <MailCheck size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">Check your email</h2>
          <p className="text-sm text-gray-400">
            If an account exists for <span className="text-white">{email}</span>, a password reset
            link has been sent. The link expires in 1 hour.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="block w-full text-xs text-gray-500 hover:text-gray-300 transition-colors pt-2"
          >
            Back to sign in
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
          <p className="text-sm text-gray-500">Reset your password</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] focus:border-green-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            {loading && <Loader size={15} className="animate-spin" />}
            {loading ? 'Please wait...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-green-500 hover:text-green-400 transition-colors"
          >
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
