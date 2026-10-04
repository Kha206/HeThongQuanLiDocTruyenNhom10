import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register({
      username,
      email,
      password,
      full_name: fullName
    });

    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Đăng ký không thành công.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#1A1A22] rounded-3xl border border-[#2A2A38] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#4D6FFF]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="inline-block bg-[#ED1D24] text-white font-extrabold text-2xl px-3 py-1 uppercase tracking-tighter mb-4">
            MARVEL
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tạo Tài Khoản Mới</h2>
          <p className="text-xs text-gray-400 mt-1">
            Gia nhập cộng đồng độc giả Marvel Comics Hub hôm nay.
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
              Họ và Tên
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Peter Parker"
                className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Tên Đăng Nhập (Username) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="spiderman_ny"
                className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Email *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="spiderman@dailybugle.com"
                className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Mật Khẩu *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
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
                <span>Đăng Ký Tài Khoản</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-[#ED1D24] font-semibold hover:underline">
            Đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
