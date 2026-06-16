import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { authApi } from '../services/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return; // StrictMode double-invokes effects in dev — the token is single-use
    hasRequested.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed.');
      });
  }, [searchParams]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212] px-4">
      <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center mx-auto">
          <ShoppingBag size={24} className="text-white" />
        </div>

        {status === 'verifying' && (
          <>
            <Loader size={28} className="animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-400">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={28} className="text-green-500 mx-auto" />
            <p className="text-sm text-gray-300">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Go to sign in
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={28} className="text-red-400 mx-auto" />
            <p className="text-sm text-gray-300">{message}</p>
            <Link
              to="/"
              className="block w-full py-2.5 bg-[#2a2a2a] hover:bg-[#333] text-white text-sm font-medium rounded-xl transition-colors"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
