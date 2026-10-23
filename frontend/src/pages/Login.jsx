import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, error } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    // Dismiss virtual keyboard immediately on mobile
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (username && password) {
      try {
        setLoading(true);
        await login(username, password);
        // Force scroll reset
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        const mainScroll = document.getElementById('main-content-scroll');
        if (mainScroll) mainScroll.scrollTop = 0;
        const root = document.getElementById('root');
        if (root) root.scrollTop = 0;
        navigate('/dashboard');
      } catch (err) {
        console.error("Login failed", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] md:min-h-screen md:h-screen md:overflow-hidden px-3 sm:px-4 py-6 sm:py-8 md:py-0 w-full max-w-full overflow-x-hidden">
      <div className="bg-[#f7f1e5] border border-[#ebdccb] p-5 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[28px] shadow-[0_20px_50px_-10px_rgba(70,40,20,0.2)] w-full max-w-[420px] box-border transition-all">
        {/* Logo */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <img
            src="/logo.svg"
            alt="Vairavan Koil"
            className="w-[160px] sm:w-[200px] h-auto drop-shadow-sm"
          />
        </div>

        <h2 className="text-[22px] sm:text-[24px] font-barlow font-bold text-center text-[#5c292c] mb-5 sm:mb-6 tracking-wide">
          Sign In
        </h2>

        <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-[#5c292c] font-barlow text-sm font-semibold mb-1.5 px-1.5 sm:px-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-[42px] sm:h-[40px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all shadow-sm hover:border-[#cfc2b2]"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-[#5c292c] font-barlow text-sm font-semibold mb-1.5 px-1.5 sm:px-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[42px] sm:h-[40px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all shadow-sm hover:border-[#cfc2b2]"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[42px] sm:h-[40px] rounded-full bg-[#5c292c] text-white font-barlow font-semibold text-[15px] hover:bg-[#4a2123] transition-all duration-300 shadow-sm hover:shadow disabled:opacity-70 active:scale-[0.99]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-[12px] text-sm text-center font-barlow border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 text-center text-sm font-barlow">
          <span className="text-[#786c62]">Don't have an account? </span>
          <Link to="/signup" className="text-[#f37435] hover:text-[#d05c24] font-semibold transition-colors">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
