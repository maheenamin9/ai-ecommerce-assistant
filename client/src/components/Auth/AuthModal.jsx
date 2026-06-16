import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Loader, MailCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../services/api';

const AuthModal = ({ mode }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  const { login, register } = useAuthStore();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/');
      } else {
        if (!form.name.trim()) return setError('Name is required');
        await register(form.name, form.email, form.password);
        setRegisteredEmail(form.email);
      }
    } catch (err) {
      if (mode === 'login' && err.response?.status === 403) {
        setRegisteredEmail(form.email); // unverified account — show resend screen
      } else {
        setError(err.response?.data?.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('sending');
    try {
      await authApi.resendVerification(registeredEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  if (registeredEmail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212] px-4">
        <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center mx-auto">
            <MailCheck size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">Check your email</h2>
          <p className="text-sm text-gray-400">
            We sent a verification link to <span className="text-white">{registeredEmail}</span>.
            Click it to activate your account, then sign in.
          </p>

          <button
            onClick={handleResend}
            disabled={resendStatus === 'sending'}
            className="text-xs text-green-500 hover:text-green-400 transition-colors disabled:opacity-50"
          >
            {resendStatus === 'sending' ? 'Sending...' : "Didn't get it? Resend email"}
          </button>
          {resendStatus === 'sent' && (
            <p className="text-xs text-green-500">Verification email resent.</p>
          )}
          {resendStatus === 'error' && (
            <p className="text-xs text-red-400">Failed to resend. Try again later.</p>
          )}

          <button
            onClick={() => { setRegisteredEmail(''); navigate('/login'); }}
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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center">
            <ShoppingBag size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">ShopAI</h1>
          <p className="text-sm text-gray-500">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                className="w-full bg-[#2a2a2a] border border-[#3f3f3f] focus:border-green-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full bg-[#2a2a2a] border border-[#3f3f3f] focus:border-green-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
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
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setError(''); navigate(mode === 'login' ? '/register' : '/login'); }}
            className="text-green-500 hover:text-green-400 transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
