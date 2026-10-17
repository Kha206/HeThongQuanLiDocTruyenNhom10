import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.message || 'Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Quên Mật Khẩu</h2>
          <p className="text-xs text-gray-400 mt-1">
            Nhập email tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-emerald-300">Đã gửi yêu cầu thành công</p>
              <p className="text-xs text-gray-300 leading-relaxed">{message}</p>
              <p className="text-[11px] text-gray-400 mt-2 italic">
                (Lưu ý môi trường phát triển: link đặt lại đã được hiển thị trên console máy chủ backend)
              </p>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại trang Đăng Nhập</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Địa Chỉ Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@marvel.com"
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24] transition-colors"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#ED1D24] hover:bg-[#ff3333] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#ED1D24]/20 flex items-center justify-center gap-2 transition-all mt-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Link Đặt Lại</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại trang Đăng Nhập</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
