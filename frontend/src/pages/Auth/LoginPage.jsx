import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(loginId, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin/stories');
      } else {
        navigate(location.state?.from || '/');
      }
    } else {
      setError(res.message || 'Đăng nhập không thành công.');
    }
  };

  const handleAdminQuickFill = () => {
    setLoginId('admin@marvel.local');
    setPassword('admin123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#1A1A22] rounded-3xl border border-[#2A2A38] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ED1D24]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="inline-block bg-[#ED1D24] text-white font-extrabold text-2xl px-3 py-1 uppercase tracking-tighter mb-4">
            MARVEL
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Đăng Nhập Tài Khoản</h2>
          <p className="text-xs text-gray-400 mt-1">
            Đăng nhập để theo dõi truyện, lưu tiến độ đọc và quản trị.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Email hoặc Tên Đăng Nhập
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="admin@marvel.local hoặc username"
                className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Mật Khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#ED1D24] hover:bg-[#ff3333] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#ED1D24]/20 flex items-center justify-center gap-2 transition-all mt-6"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Đăng Nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Admin Quick Login Helper */}
        <div className="mt-6 pt-6 border-t border-[#2A2A38] text-center">
          <button
            type="button"
            onClick={handleAdminQuickFill}
            className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Điền nhanh tài khoản Admin mẫu
          </button>
          <p className="text-[11px] text-gray-500 mt-2">
            admin@marvel.local / admin123
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-[#ED1D24] font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
