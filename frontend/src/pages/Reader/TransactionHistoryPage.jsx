import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard, CheckCircle2, XCircle, Clock,
  ArrowRight, ShieldCheck, Sparkles, BookOpen,
  Filter, ChevronRight, RefreshCw, ShoppingBag
} from 'lucide-react';
import ProxiedImage from '../../components/ProxiedImage';

const TransactionHistoryPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | completed | failed

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/my-transactions');
      if (res.success && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'failed') return t.status === 'failed' || t.status === 'cancelled';
    return true;
  });

  const totalSpent = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg text-white pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb / Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#2A2A38] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link to="/" className="hover:text-white transition-colors">Trang Chủ</Link>
              <span>/</span>
              <span className="text-[#ED1D24]">Lịch Sử Giao Dịch</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-[#ED1D24]" />
              <span>Lịch Sử Giao Dịch & Thanh Toán</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Xem lại toàn bộ hóa đơn mua gói hội viên VIP và bản quyền truyện đã thực hiện.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTransactions}
              className="p-2.5 rounded-xl bg-[#1A1A22] border border-[#2A2A38] hover:border-gray-500 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-2"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Cập nhật</span>
            </button>
            <Link
              to="/subscriptions"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Nâng Cấp Hội Viên</span>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38] relative overflow-hidden">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Tổng Đơn Đã Giao Dịch</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{transactions.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">Bao gồm cả thành công & hủy</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38] relative overflow-hidden">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Giao Dịch Thành Công</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {transactions.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-1">Đã kích hoạt quyền đọc đầy đủ</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38] relative overflow-hidden">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Tổng Chi Tiêu Bản Quyền</div>
            <div className="text-2xl font-black text-[#ED1D24] mt-1 font-mono">
              {totalSpent.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Ủng hộ tác quyền Marvel Hub</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-semibold text-gray-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#ED1D24]" /> Bộ lọc:
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#ED1D24] text-white shadow-md shadow-[#ED1D24]/20'
                : 'bg-[#1A1A22] text-gray-400 hover:text-white border border-[#2A2A38]'
            }`}
          >
            Tất cả ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-[#1A1A22] text-gray-400 hover:text-white border border-[#2A2A38]'
            }`}
          >
            Thành công ({transactions.filter(t => t.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'failed'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-[#1A1A22] text-gray-400 hover:text-white border border-[#2A2A38]'
            }`}
          >
            Thất bại / Hủy ({transactions.filter(t => t.status === 'failed' || t.status === 'cancelled').length})
          </button>
        </div>

        {/* Transactions Table / List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ED1D24]"></div>
            <p className="text-xs text-gray-400 mt-4">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center bg-[#1A1A22] border border-[#2A2A38] rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-500">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Chưa có giao dịch nào</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
              Bạn chưa thực hiện giao dịch nào theo bộ lọc đã chọn. Hãy khám phá các gói hội viên hoặc mua bản quyền truyện yêu thích!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/subscriptions"
                className="px-5 py-2.5 rounded-xl bg-[#ED1D24] hover:bg-[#ff3333] text-white font-bold text-xs transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xem Gói Đọc VIP</span>
              </Link>
              <Link
                to="/stories"
                className="px-5 py-2.5 rounded-xl bg-[#23232E] hover:bg-[#2A2A38] text-white font-bold text-xs border border-[#2A2A38] transition-all flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Khám Phá Kho Truyện</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A38] bg-[#14141B] text-[11px] text-gray-400 uppercase font-bold tracking-wider">
                    <th className="py-4 px-5">Mã Giao Dịch</th>
                    <th className="py-4 px-5">Sản Phẩm / Ấn Phẩm</th>
                    <th className="py-4 px-5">Phân Loại</th>
                    <th className="py-4 px-5">Cổng Thanh Toán</th>
                    <th className="py-4 px-5">Số Tiền</th>
                    <th className="py-4 px-5">Trạng Thái</th>
                    <th className="py-4 px-5">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A38] text-xs">
                  {filteredTransactions.map((t) => {
                    const isSubscription = t.payment_type === 'subscription';
                    const isCompleted = t.status === 'completed';
                    const isFailed = t.status === 'failed' || t.status === 'cancelled';

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Transaction Code */}
                        <td className="py-4 px-5 font-mono text-gray-300 font-medium">
                          {t.transaction_code}
                        </td>

                        {/* Item Title & Cover */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {t.item_cover ? (
                              <div className="w-9 h-12 rounded-md overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
                                <ProxiedImage
                                  src={t.item_cover}
                                  alt={t.item_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-12 rounded-md bg-[#23232E] border border-white/5 flex items-center justify-center flex-shrink-0 text-amber-400">
                                {isSubscription ? <Sparkles className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white line-clamp-1 max-w-xs">
                                {t.item_title || (isSubscription ? 'Gói Hội Viên Marvel VIP' : 'Truyện bản quyền')}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                ID: #{t.item_id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Payment Type */}
                        <td className="py-4 px-5">
                          {isSubscription ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <Sparkles className="w-3 h-3" /> Gói Hội Viên
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ED1D24]/15 text-[#ED1D24] border border-[#ED1D24]/30">
                              <ShoppingBag className="w-3 h-3" /> Mua Truyện Lẻ
                            </span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-5 font-medium">
                          <span className="uppercase text-gray-300 font-mono text-[11px] bg-[#0F0F14] px-2 py-1 rounded border border-[#2A2A38]">
                            {t.payment_method === 'momo' ? 'MOMO SANDBOX' : 'VNPAY SANDBOX'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5 font-mono font-bold text-white text-sm">
                          {Number(t.amount).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Thành Công
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/60 text-red-400 border border-red-500/30">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              Thất Bại
                            </span>
                          )}
                          {!isCompleted && !isFailed && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Đang Xử Lý
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 text-gray-400 text-[11px] font-mono whitespace-nowrap">
                          {new Date(t.created_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security / Legal notice */}
        <div className="mt-8 p-4 rounded-xl bg-[#14141B] border border-[#2A2A38] flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Mọi giao dịch thanh toán đều được mã hóa và bảo mật tuân theo tiêu chuẩn quốc tế.</span>
          </div>
          <Link to="/subscriptions" className="text-[#ED1D24] hover:underline font-medium hidden sm:inline">
            Tìm hiểu thêm về chính sách hội viên & hoàn tiền &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryPage;
