import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  CreditCard, Plus, Edit, Trash2, CheckCircle,
  RefreshCw, X, ShieldAlert, BookOpen, Crown,
  ArrowLeft, Check, AlertCircle, Sparkles
} from 'lucide-react';

const AdminPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 49000,
    duration_days: 30,
    badge: '',
    features: ['Đọc toàn bộ chương truyện VIP không giới hạn', 'Không có quảng cáo xen kẽ'],
    is_active: true,
    display_order: 1
  });
  const [featureInput, setFeatureInput] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Pass all=true to load all plans including inactive ones
      const res = await api.get('/plans?all=true');
      if (res.success && res.plans) {
        setPlans(res.plans);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      setErrorMessage('Lỗi tải danh sách gói đọc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 49000,
      duration_days: 30,
      badge: '',
      features: ['Đọc toàn bộ chương truyện VIP không giới hạn', 'Không có quảng cáo xen kẽ'],
      is_active: true,
      display_order: (plans.length || 0) + 1
    });
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price || 0,
      duration_days: plan.duration_days || 30,
      badge: plan.badge || '',
      features: Array.isArray(plan.features) ? plan.features : [],
      is_active: plan.is_active,
      display_order: plan.display_order || 0
    });
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const handleAddFeature = (e) => {
    e.preventDefault();
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, formData);
        showSuccess('Cập nhật gói đọc thành công!');
      } else {
        await api.post('/plans', formData);
        showSuccess('Tạo gói đọc mới thành công!');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      showError(err.message || 'Lỗi thao tác gói đọc.');
    }
  };

  const handleToggleStatus = async (planId) => {
    try {
      const res = await api.patch(`/plans/${planId}/toggle`);
      if (res.success) {
        showSuccess(res.message);
        fetchPlans();
      }
    } catch (err) {
      showError(err.message || 'Lỗi cập nhật trạng thái.');
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa gói đọc "${planName}" không?`)) {
      try {
        await api.delete(`/plans/${planId}`);
        showSuccess(`Đã xóa gói "${planName}" thành công.`);
        fetchPlans();
      } catch (err) {
        showError(err.message || 'Lỗi khi xóa gói.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F14] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#2A2A38] gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CreditCard className="w-4 h-4" />
              Quản Trị Gói Hội Viên
            </div>
            <h1 className="text-3xl font-extrabold text-white">Quản Lý Gói Đọc Thành Viên</h1>
            <p className="text-xs text-gray-400 mt-1">
              Cấu hình các gói tháng, quý, năm, mức giá và danh sách đặc quyền dành cho độc giả Marvel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/stories"
              className="px-4 py-2.5 bg-[#23232E] hover:bg-[#2A2A38] text-gray-300 text-sm font-bold rounded-xl flex items-center gap-2 transition-all border border-[#2A2A38]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quản Trị Truyện</span>
            </Link>

            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-[#ED1D24] hover:bg-[#ff3333] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#ED1D24]/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Gói Đọc Mới</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-center gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Plans Table */}
        <div className="bg-[#1A1A22] rounded-2xl border border-[#2A2A38] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0F0F14] text-xs uppercase text-gray-400 border-b border-[#2A2A38]">
                <tr>
                  <th className="py-4 px-6">Gói Đọc</th>
                  <th className="py-4 px-4">Giá Niêm Yết</th>
                  <th className="py-4 px-4">Thời Hạn</th>
                  <th className="py-4 px-4">Đặc Quyền</th>
                  <th className="py-4 px-4">Thứ Tự</th>
                  <th className="py-4 px-4">Trạng Thái</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A38]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#ED1D24]" />
                      <span className="text-xs text-gray-400 mt-2 block">Đang nạp danh sách gói...</span>
                    </td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      Chưa có gói đọc nào được thiết lập. Hãy bấm nút "Tạo Gói Đọc Mới".
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-[#23232E]/60 transition-colors">
                      {/* Name & Badge */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-white flex items-center gap-2">
                              {plan.name}
                              {plan.badge && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                                  {plan.badge}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{plan.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-mono font-bold text-amber-400">
                        {Number(plan.price).toLocaleString()} VNĐ
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 font-mono text-gray-300">
                        {plan.duration_days} ngày
                      </td>

                      {/* Features */}
                      <td className="py-4 px-4">
                        <div className="text-xs text-gray-400">
                          {plan.features && Array.isArray(plan.features) ? (
                            <span>{plan.features.length} đặc quyền</span>
                          ) : (
                            <span>0</span>
                          )}
                        </div>
                      </td>

                      {/* Order */}
                      <td className="py-4 px-4 font-mono text-xs text-gray-400">
                        #{plan.display_order}
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(plan.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                            plan.is_active
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                              : 'bg-red-950/80 text-red-400 border-red-700 hover:bg-red-900'
                          }`}
                        >
                          {plan.is_active ? 'Đang mở' : 'Tạm ngưng'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-1.5 bg-[#2A2A38] hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                          title="Chỉnh sửa gói"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="p-1.5 bg-[#2A2A38] hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                          title="Xóa gói"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CREATE / EDIT PLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {editingPlan ? 'Chỉnh Sửa Gói Đọc' : 'Thêm Gói Hội Viên Marvel Mới'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tên gói hội viên *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Gói Siêu Anh Hùng (3 Tháng)"
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả giá trị nổi bật của gói..."
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Giá tiền (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Thời hạn (Ngày) *</label>
                  <input
                    type="number"
                    required
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Huy hiệu (Badge)</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="VD: Phổ Biến Nhất"
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>
              </div>

              {/* Dynamic Features List */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Danh sách quyền lợi / đặc quyền</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Thêm một quyền lợi (VD: Đọc sớm chapter mới)..."
                    className="flex-grow bg-[#0F0F14] text-xs text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-[#2A2A38] hover:bg-[#ED1D24] text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Thêm
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formData.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 bg-[#0F0F14] rounded-lg border border-[#2A2A38] text-xs"
                    >
                      <span className="text-gray-300 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400" />
                        {feat}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active_input"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#ED1D24] bg-[#0F0F14] border-[#2A2A38]"
                  />
                  <label htmlFor="is_active_input" className="text-xs text-gray-300 font-medium">
                    Kích hoạt cho phép mua (Active)
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#2A2A38]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#2A2A38] text-sm text-gray-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#ED1D24] hover:bg-[#ff3333] text-sm font-bold text-white shadow-lg shadow-[#ED1D24]/20"
                >
                  {editingPlan ? 'Lưu Gói Đọc' : 'Tạo Gói Đọc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPlansPage;
