import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import PasswordInput from '../../components/PasswordInput';
import api from '../../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Mã token đặt lại mật khẩu không tồn tại trên đường dẫn.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Mật khẩu của bạn đã được đặt lại thành công!');
      } else {
        setError(res.message || 'Đặt lại mật khẩu không thành công.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Đặt Lại Mật Khẩu</h2>
          <p className="text-xs text-gray-400 mt-1">
            Nhập mật khẩu mới cho tài khoản của bạn (tối thiểu 8 ký tự).
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-emerald-300">Hoàn Tất Đặt Lại Mật Khẩu</p>
              <p className="text-xs text-gray-300 leading-relaxed">{successMessage}</p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#ED1D24] hover:bg-[#ff3333] text-white font-bold rounded-xl shadow-lg shadow-[#ED1D24]/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Đăng Nhập Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Mật Khẩu Mới
              </label>
              <PasswordInput
                id="reset-new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự..."
                leftIcon={KeyRound}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Xác Nhận Mật Khẩu Mới
              </label>
              <PasswordInput
                id="reset-confirm-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
              />
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
                  <span>Xác Nhận Đổi Mật Khẩu</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <span>Hủy và quay lại trang Đăng Nhập</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
