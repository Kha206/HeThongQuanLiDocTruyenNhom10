import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Ban,
  RotateCcw,
  AlertTriangle,
  X,
  CreditCard,
  MessageSquare,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Crown
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import api from '../../services/api';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    user: null,
    targetStatus: null, // 'restricted' | 'suspended' | 'active'
    reason: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          search,
          role: roleFilter,
          status: statusFilter,
          page,
          limit: 10
        }
      });
      if (res.success) {
        setUsers(res.users || []);
        setTotalUsers(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showNotification('error', 'Không thể tải danh sách thành viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open User Detail Modal
  const handleViewDetail = async (userId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      if (res.success && res.user) {
        setDetailUser(res.user);
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
      showNotification('error', 'Lỗi tải chi tiết người dùng.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Confirmation Modal
  const openActionModal = (u, targetStatus) => {
    setActionModal({
      isOpen: true,
      user: u,
      targetStatus,
      reason: u.status_reason || ''
    });
  };

  // Confirm Status Change
  const handleConfirmAction = async () => {
    if (!actionModal.user || !actionModal.targetStatus) return;
    setActionLoading(true);

    try {
      const res = await api.patch(`/admin/users/${actionModal.user.id}/status`, {
        status: actionModal.targetStatus,
        reason: actionModal.reason
      });

      if (res.success) {
        showNotification(
          'success',
          `Đã chuyển trạng thái tài khoản ${actionModal.user.username} sang ${
            actionModal.targetStatus === 'active'
              ? 'Hoạt động'
              : actionModal.targetStatus === 'restricted'
              ? 'Hạn chế'
              : 'Tạm ngừng'
          }.`
        );
        setActionModal({ isOpen: false, user: null, targetStatus: null, reason: '' });
        fetchUsers();
      } else {
        showNotification('error', res.message || 'Lỗi cập nhật trạng thái.');
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'Lỗi máy chủ.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Hoạt động
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-3 h-3" /> Bị hạn chế
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
            <Ban className="w-3 h-3" /> Tạm ngừng
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all ${
            notification.type === 'error'
              ? 'bg-red-950/90 border-red-500 text-red-200'
              : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-italiana text-3xl sm:text-4xl text-white tracking-wide flex items-center gap-3">
            <Users className="w-8 h-8 text-[#ED1D24]" />
            <span>Quản Lý Thành Viên</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tra cứu, kiểm duyệt quyền và điều chỉnh trạng thái tài khoản người dùng trong hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#1A1A22] border border-[#2A2A38] px-4 py-2 rounded-2xl">
          <span className="text-xs text-gray-400 font-medium">Tổng thành viên:</span>
          <span className="text-base font-bold text-white font-mono">{totalUsers}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, username hoặc email..."
            className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        </form>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Vai trò:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0F0F14] text-xs text-gray-200 px-3 py-2 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="reader">Độc giả</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0F0F14] text-xs text-gray-200 px-3 py-2 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="restricted">Bị hạn chế</option>
            <option value="suspended">Tạm ngừng</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A38] bg-[#14141C] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Thành Viên</th>
                <th className="py-4 px-4">Vai Trò</th>
                <th className="py-4 px-4">Trạng Thái</th>
                <th className="py-4 px-4">Gói VIP / Tủ Sách</th>
                <th className="py-4 px-4">Bình Luận</th>
                <th className="py-4 px-4">Ngày Tham Gia</th>
                <th className="py-4 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A38]/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ED1D24] mb-2" />
                    <p className="text-xs">Đang tải danh sách thành viên...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    Không tìm thấy thành viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#23232E]/50 transition-colors">
                    {/* User Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} size="md" />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{u.full_name || u.username}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">{u.email}</p>
                          <p className="text-[11px] text-gray-500 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-[#ED1D24]/20 text-[#ED1D24] border-[#ED1D24]/40'
                            : 'bg-gray-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        {u.role === 'admin' ? 'Quản Trị' : 'Độc Giả'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">{renderStatusBadge(u.status || 'active')}</td>

                    {/* VIP / Purchases */}
                    <td className="py-4 px-4">
                      <div className="text-xs">
                        {u.active_plan_name ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> {u.active_plan_name}
                          </span>
                        ) : (
                          <span className="text-gray-500">Chưa đăng ký gói</span>
                        )}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {u.purchases_count || 0} truyện đã mua
                        </p>
                      </div>
                    </td>

                    {/* Comments */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-300 font-mono">
                        <MessageSquare className="w-3 h-3 text-cyan-400" />
                        {u.comments_count || 0}
                      </span>
                    </td>

                    {/* Join Date */}
                    <td className="py-4 px-4 text-xs text-gray-400 font-mono">
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(u.id)}
                          className="p-2 bg-[#23232E] hover:bg-[#2A2A38] text-gray-200 rounded-xl transition-colors"
                          title="Xem chi tiết thành viên"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {u.role !== 'admin' && (
                          <>
                            {u.status !== 'restricted' ? (
                              <button
                                type="button"
                                onClick={() => openActionModal(u, 'restricted')}
                                className="p-2 bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 border border-amber-500/30 rounded-xl transition-colors"
                                title="Hạn chế tài khoản (chặn bình luận & mua truyện)"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openActionModal(u, 'active')}
                                className="p-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-xl transition-colors"
                                title="Khôi phục trạng thái hoạt động"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {u.status !== 'suspended' ? (
                              <button
                                type="button"
                                onClick={() => openActionModal(u, 'suspended')}
                                className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 rounded-xl transition-colors"
                                title="Tạm ngừng tài khoản (chặn đăng nhập)"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openActionModal(u, 'active')}
                                className="p-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-xl transition-colors"
                                title="Khôi phục tài khoản (cho phép đăng nhập lại)"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#2A2A38] flex items-center justify-between text-xs text-gray-400">
            <span>
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 bg-[#23232E] hover:bg-[#2A2A38] disabled:opacity-40 rounded-lg text-white"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-[#23232E] hover:bg-[#2A2A38] disabled:opacity-40 rounded-lg text-white"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Action Modal */}
      {actionModal.isOpen && actionModal.user && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setActionModal({ isOpen: false, user: null, targetStatus: null, reason: '' })}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-3 rounded-2xl ${
                  actionModal.targetStatus === 'suspended'
                    ? 'bg-red-500/10 text-red-400'
                    : actionModal.targetStatus === 'restricted'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Xác Nhận Thay Đổi Trạng Thái</h3>
                <p className="text-xs text-gray-400">
                  Tài khoản: <strong className="text-white">{actionModal.user.username}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              {actionModal.targetStatus === 'suspended' &&
                'Tài khoản sẽ bị tạm ngừng ngay lập tức, không thể đăng nhập vào hệ thống cho đến khi được khôi phục.'}
              {actionModal.targetStatus === 'restricted' &&
                'Tài khoản vẫn đăng nhập và đọc truyện được nhưng sẽ bị chặn toàn bộ tính năng bình luận và giao dịch thanh toán.'}
              {actionModal.targetStatus === 'active' &&
                'Khôi phục mọi quyền hạn đọc truyện, bình luận và thanh toán về trạng thái bình thường.'}
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Lý Do / Ghi Chú (Hiển thị cho người dùng khi cố truy cập)
              </label>
              <textarea
                rows={3}
                value={actionModal.reason}
                onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Nhập lý do áp dụng trạng thái này..."
                className="w-full bg-[#0F0F14] text-xs text-gray-200 p-3 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, user: null, targetStatus: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg transition-all ${
                  actionModal.targetStatus === 'suspended'
                    ? 'bg-red-600 hover:bg-red-500'
                    : actionModal.targetStatus === 'restricted'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác Nhận Thực Hiện'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* User Profile Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#2A2A38]">
              <Avatar user={detailUser} size="xl" />
              <div>
                <h3 className="text-xl font-bold text-white">{detailUser.full_name || detailUser.username}</h3>
                <p className="text-xs text-gray-400 font-mono">{detailUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#ED1D24]/20 text-[#ED1D24]">
                    {detailUser.role}
                  </span>
                  {renderStatusBadge(detailUser.status || 'active')}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-[#14141C] rounded-2xl border border-[#2A2A38] text-center">
                <span className="text-[11px] text-gray-400 block">Số Bình Luận</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {detailUser.stats?.comments_count || 0}
                </span>
              </div>
              <div className="p-3 bg-[#14141C] rounded-2xl border border-[#2A2A38] text-center">
                <span className="text-[11px] text-gray-400 block">Số Đánh Giá</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {detailUser.stats?.ratings_count || 0}
                </span>
              </div>
              <div className="p-3 bg-[#14141C] rounded-2xl border border-[#2A2A38] text-center">
                <span className="text-[11px] text-gray-400 block">Số Giao Dịch</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {detailUser.stats?.payments_count || 0}
                </span>
              </div>
            </div>

            {/* Subscriptions History */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Lịch Sử Gói Hội Viên ({detailUser.subscriptions?.length || 0})</span>
              </h4>
              {detailUser.subscriptions && detailUser.subscriptions.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {detailUser.subscriptions.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 bg-[#0F0F14] rounded-xl border border-[#2A2A38] flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white">{s.plan?.name || 'Gói Hội Viên'}</span>
                      <span className="text-gray-400 font-mono">
                        {new Date(s.start_date).toLocaleDateString('vi-VN')} -{' '}
                        {new Date(s.end_date).toLocaleDateString('vi-VN')}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          s.status === 'active' && new Date(s.end_date) >= new Date()
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {s.status === 'active' && new Date(s.end_date) >= new Date() ? 'Còn hạn' : 'Hết hạn'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Chưa có lịch sử đăng ký gói VIP.</p>
              )}
            </div>

            {/* Purchased Stories */}
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[#ED1D24]" />
                <span>Truyện Đã Mua Bản Quyền ({detailUser.storyPurchases?.length || 0})</span>
              </h4>
              {detailUser.storyPurchases && detailUser.storyPurchases.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {detailUser.storyPurchases.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-2.5 bg-[#0F0F14] rounded-xl border border-[#2A2A38] flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white truncate max-w-[240px]">
                        {sp.story?.title || 'Truyện'}
                      </span>
                      <span className="text-emerald-400 font-mono">
                        {Number(sp.price_paid || 0).toLocaleString()} VNĐ
                      </span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        {new Date(sp.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Chưa mua truyện lẻ nào.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
