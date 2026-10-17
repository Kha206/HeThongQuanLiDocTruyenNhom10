import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Save,
  ShieldAlert
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import PasswordInput from '../../components/PasswordInput';
import api from '../../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // Profile Form States
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Avatar Upload States
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const res = await api.put('/auth/profile', { full_name: fullName });
      if (res.success && res.user) {
        updateUser(res.user);
        setProfileMsg({ type: 'success', text: 'Cập nhật tên hiển thị thành công!' });
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Lỗi cập nhật hồ sơ.' });
      }
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Lỗi máy chủ khi cập nhật hồ sơ.'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Avatar File Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'Kích thước ảnh đại diện không được vượt quá 2MB.' });
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarMsg({ type: 'error', text: 'Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP.' });
      return;
    }

    setAvatarLoading(true);
    setAvatarMsg(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.success && res.user) {
        updateUser(res.user);
        setAvatarMsg({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
      } else {
        setAvatarMsg({ type: 'error', text: res.message || 'Lỗi tải ảnh lên.' });
      }
    } catch (err) {
      setAvatarMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Lỗi kết nối khi tải ảnh đại diện.'
      });
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Xác nhận mật khẩu mới không khớp.' });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: res.message || 'Lỗi khi đổi mật khẩu.' });
      }
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Mật khẩu cũ không chính xác hoặc lỗi hệ thống.'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động bình thường
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Bị hạn chế (Không thể bình luận & mua)
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/60 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> Tạm ngừng hoạt động
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-italiana text-3xl sm:text-4xl text-white tracking-wide">
          Hồ Sơ Cá Nhân & Bảo Mật
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Quản lý thông tin tài khoản, ảnh đại diện và mật khẩu bảo mật của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Account Summary */}
        <div className="space-y-6">
          <div className="bg-[#1A1A22] rounded-3xl border border-[#2A2A38] p-6 text-center relative overflow-hidden shadow-xl">
            <div className="relative inline-block mx-auto mb-4 group">
              <Avatar user={user} size="2xl" className="shadow-2xl border-2 border-[#ED1D24]/50" />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute bottom-0 right-0 p-2.5 bg-[#ED1D24] hover:bg-[#ff3333] text-white rounded-full shadow-lg border-2 border-[#1A1A22] transition-transform group-hover:scale-110 disabled:opacity-50"
                title="Tải ảnh đại diện mới từ máy tính"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">
              {user?.full_name || user?.username}
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ED1D24]/20 text-[#ED1D24] border border-[#ED1D24]/30">
                {user?.role === 'admin' ? 'Quản Trị Viên' : 'Độc Giả'}
              </span>
              {getStatusBadge(user?.status || 'active')}
            </div>

            {user?.status_reason && (
              <p className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-500/20 p-2.5 rounded-xl mt-4 text-left">
                <strong>Ghi chú:</strong> {user.status_reason}
              </p>
            )}

            {avatarMsg && (
              <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
                avatarMsg.type === 'error'
                  ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
              }`}>
                {avatarMsg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                <span>{avatarMsg.text}</span>
              </div>
            )}

            <p className="text-[11px] text-gray-500 mt-4">
              Định dạng hỗ trợ: JPG, PNG, WEBP. Tối đa 2MB. Nếu chưa tải ảnh thì hệ thống tự động hiển thị chữ cái đại diện.
            </p>
          </div>
        </div>

        {/* Right Column: Profile Edit & Change Password Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Form 1: Edit Profile */}
          <div className="bg-[#1A1A22] rounded-3xl border border-[#2A2A38] p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2A2A38]">
              <div className="p-2.5 bg-[#ED1D24]/10 rounded-xl text-[#ED1D24]">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Thông Tin Tài Khoản</h3>
                <p className="text-xs text-gray-400">Cập nhật họ tên hiển thị của bạn trong nền tảng.</p>
              </div>
            </div>

            {profileMsg && (
              <div className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                profileMsg.type === 'error'
                  ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
              }`}>
                {profileMsg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Tên Hiển Thị (Họ & Tên)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Tên Đăng Nhập
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ''}
                    className="w-full bg-[#12121A] text-sm text-gray-400 px-4 py-2.5 rounded-xl border border-[#2A2A38] cursor-not-allowed font-mono opacity-80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-[#12121A] text-sm text-gray-400 px-4 py-2.5 rounded-xl border border-[#2A2A38] cursor-not-allowed font-mono opacity-80"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-[#ED1D24] hover:bg-[#ff3333] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#ED1D24]/20 flex items-center gap-2 transition-all text-sm"
                >
                  {profileLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Change Password */}
          <div className="bg-[#1A1A22] rounded-3xl border border-[#2A2A38] p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2A2A38]">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Đổi Mật Khẩu</h3>
                <p className="text-xs text-gray-400">
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn (tối thiểu 8 ký tự).
                </p>
              </div>
            </div>

            {passwordMsg && (
              <div className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                passwordMsg.type === 'error'
                  ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
              }`}>
                {passwordMsg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Mật Khẩu Cũ (Hiện Tại)
                </label>
                <PasswordInput
                  id="profile-old-password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Mật Khẩu Mới
                  </label>
                  <PasswordInput
                    id="profile-new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Xác Nhận Mật Khẩu Mới
                  </label>
                  <PasswordInput
                    id="profile-confirm-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all text-sm"
                >
                  {passwordLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Cập Nhật Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
