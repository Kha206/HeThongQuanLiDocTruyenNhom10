import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles, Check, ShieldCheck, Zap,
  CreditCard, Crown, ChevronRight, HelpCircle,
  RefreshCw, CheckCircle2, X
} from 'lucide-react';
import PaymentModal from '../../components/PaymentModal';

const SubscriptionsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      if (res.success && res.plans) {
        setPlans(res.plans);
      } else {
        setError('Không thể tải danh sách gói đọc.');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Lỗi kết nối máy chủ khi tải gói đọc.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubscription = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/payments/my-subscription');
      if (res.success && res.subscription) {
        setMySubscription(res.subscription);
      } else {
        setMySubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchMySubscription();
  }, [isAuthenticated]);

  const handlePlanClick = (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedPlanForPayment(plan);
  };

  return (
    <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg text-white pb-24">
      
      {/* Hero Header */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ED1D24]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ED1D24]/10 border border-[#ED1D24]/30 text-[#ED1D24] text-xs font-extrabold uppercase tracking-widest mb-6">
            <Crown className="w-4 h-4 text-amber-400" />
            Đặc Quyền Hội Viên Marvel VIP
          </div>

          <h1 className="font-italiana text-5xl sm:text-6xl lg:text-7xl font-normal tracking-wide text-white leading-tight">
            Mở Khóa Toàn Bộ Đa Vũ Trụ
          </h1>

          <p className="text-gray-300 text-base sm:text-lg font-light mt-5 max-w-2xl mx-auto font-outfit leading-relaxed">
            Đọc không giới hạn toàn bộ truyện tranh Marvel bản quyền chất lượng gốc từ Comic Vine. Không quảng cáo, trải nghiệm đọc thượng hạng.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Kích hoạt tức thì
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Không tự động trừ tiền âm thầm
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hỗ trợ mọi thiết bị
            </span>
          </div>
        </div>
      </section>

      {/* ACTIVE VIP BANNER */}
      {mySubscription && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-10 mb-12">
          <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-[#1A1A22] border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/10">
                  <Crown className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Gói Hội Viên Đang Hoạt Động</span>
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      {mySubscription.badge || 'VIP'}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mt-0.5">{mySubscription.plan_name}</h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Hạn dùng đến: <strong className="text-amber-400">{new Date(mySubscription.end_date).toLocaleDateString('vi-VN')}</strong> • Còn lại <strong className="text-white bg-white/10 px-2 py-0.5 rounded">{mySubscription.days_remaining} ngày</strong>
                  </p>
                </div>
              </div>

              <div className="text-right text-xs bg-[#0F0F14] px-4 py-2.5 rounded-xl border border-[#2A2A38]">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Tự động cộng dồn
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Gia hạn sẽ cộng dồn số ngày tiếp nối.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Cards Grid */}
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${mySubscription ? 'mt-4' : '-mt-6'} pt-6`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin text-[#ED1D24] mb-3" />
            <p className="text-sm">Đang nạp các gói hội viên từ hệ thống...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-4 bg-red-950/30 border border-red-800/40 rounded-2xl text-center text-red-300 text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => {
              const isPopular = plan.badge && plan.badge.includes('Phổ Biến');
              const isBestValue = plan.duration_days >= 365 || (plan.badge && plan.badge.includes('Tiết Kiệm'));

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                    isPopular
                      ? 'bg-[#1F1B24] border-2 border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.25)] scale-105 z-20'
                      : isBestValue
                      ? 'bg-[#1D1B28] border border-purple-500/50 hover:border-purple-500 shadow-xl z-10'
                      : 'bg-[#1A1A22] border border-[#2A2A38] hover:border-[#ED1D24] shadow-xl z-10'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                      <span className={`px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg ${
                        isPopular
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
                          : isBestValue
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white'
                          : 'bg-[#ED1D24] text-white'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Plan Header */}
                    <div className="text-center pb-6 border-b border-white/10">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-gray-400 min-h-[32px] line-clamp-2">
                        {plan.description}
                      </p>

                      <div className="mt-6 flex items-baseline justify-center gap-1 font-mono">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white">
                          {Number(plan.price).toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-gray-400">VNĐ</span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        Thời hạn sử dụng: <strong className="text-gray-300">{plan.duration_days} ngày</strong>
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="py-6 space-y-3.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Quyền lợi bao gồm:
                      </p>

                      {plan.features && Array.isArray(plan.features) ? (
                        plan.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-200">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <span>{feature}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-3 text-xs text-gray-300">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>Đọc không giới hạn toàn bộ truyện VIP</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => handlePlanClick(plan)}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                        isPopular
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:opacity-95 shadow-amber-500/20'
                          : isBestValue
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                          : 'bg-[#ED1D24] hover:bg-[#ff3333] text-white shadow-[#ED1D24]/20'
                      }`}
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{mySubscription ? `Gia Hạn Gói Này (+${plan.duration_days} ngày)` : 'Đăng Ký Ngay'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center mb-10">
          <h2 className="font-italiana text-3xl sm:text-4xl text-white font-normal">
            Bảng So Sánh Quyền Lợi
          </h2>
          <p className="text-xs text-gray-400 mt-2">
            Tại sao bạn nên nâng cấp tài khoản Hội Viên Marvel VIP?
          </p>
        </div>

        <div className="bg-[#1A1A22] rounded-3xl border border-[#2A2A38] overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0F0F14] text-xs uppercase text-gray-400 border-b border-[#2A2A38]">
              <tr>
                <th className="py-4 px-6 font-semibold">Tính Năng / Đặc Quyền</th>
                <th className="py-4 px-4 text-center font-semibold text-gray-400">Độc Giả Thường</th>
                <th className="py-4 px-6 text-center font-bold text-amber-400 bg-amber-500/5">Hội Viên Marvel VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A38] text-xs sm:text-sm text-gray-300">
              <tr>
                <td className="py-4 px-6 font-medium text-white">Đọc truyện miễn phí (Free Comics)</td>
                <td className="py-4 px-4 text-center text-emerald-400 font-bold">Có</td>
                <td className="py-4 px-6 text-center text-emerald-400 font-bold bg-amber-500/5">Có</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Mở khóa toàn bộ chương VIP</td>
                <td className="py-4 px-4 text-center text-gray-600 font-bold">—</td>
                <td className="py-4 px-6 text-center text-amber-400 font-bold bg-amber-500/5 flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 fill-amber-400" /> Không giới hạn
                </td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Chất lượng ảnh bìa & trang truyện</td>
                <td className="py-4 px-4 text-center text-gray-400">Tiêu chuẩn</td>
                <td className="py-4 px-6 text-center text-white font-semibold bg-amber-500/5">Gốc nét cao (Comic Vine)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Quảng cáo & biểu ngữ tài trợ</td>
                <td className="py-4 px-4 text-center text-gray-400">Có xuất hiện</td>
                <td className="py-4 px-6 text-center text-emerald-400 font-bold bg-amber-500/5">100% Không quảng cáo</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Đọc sớm các chương mới nhất</td>
                <td className="py-4 px-4 text-center text-gray-600 font-bold">—</td>
                <td className="py-4 px-6 text-center text-emerald-400 font-bold bg-amber-500/5">Ưu tiên hàng đầu</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Huy hiệu VIP trong bình luận</td>
                <td className="py-4 px-4 text-center text-gray-600 font-bold">—</td>
                <td className="py-4 px-6 text-center text-amber-400 font-bold bg-amber-500/5">Huy hiệu Vàng độc quyền</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#ED1D24] uppercase mb-1">
            <HelpCircle className="w-4 h-4" />
            Hỗ Trợ & Giải Đáp
          </div>
          <h2 className="font-italiana text-3xl sm:text-4xl text-white font-normal">
            Câu Hỏi Thường Gặp
          </h2>
        </div>

        <div className="space-y-4 text-sm">
          <div className="bg-[#1A1A22] rounded-2xl border border-[#2A2A38] p-5">
            <h4 className="font-bold text-white mb-2">Tôi có thể thanh toán qua những hình thức nào?</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Hệ thống hỗ trợ cổng thanh toán Sandbox VNPay, MoMo và chuyển khoản qua mã QR an toàn. Quyền đọc sẽ được kích hoạt tức thì ngay khi giao dịch thành công.
            </p>
          </div>

          <div className="bg-[#1A1A22] rounded-2xl border border-[#2A2A38] p-5">
            <h4 className="font-bold text-white mb-2">Nếu tôi đã mua lẻ một bộ truyện rồi thì có cần mua gói tháng không?</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Theo quy tắc nghiệp vụ độc lập, nếu bạn đã mua lẻ bộ truyện đó thì bạn có quyền đọc trọn đời bộ truyện đó mà không cần bất kỳ gói tháng nào. Gói tháng dành cho độc giả muốn đọc toàn bộ hàng ngàn bộ truyện trên hệ thống.
            </p>
          </div>

          <div className="bg-[#1A1A22] rounded-2xl border border-[#2A2A38] p-5">
            <h4 className="font-bold text-white mb-2">Gói có tự động trừ tiền trong tài khoản của tôi khi hết hạn không?</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Tuyệt đối không. Hệ thống Marvel Comic Platform không lưu trữ thông tin thẻ tín dụng của bạn. Khi hết hạn gói đọc, bạn có thể chủ động chọn gia hạn gói mới hoặc tiếp tục đọc các chương truyện miễn phí.
            </p>
          </div>
        </div>
      </section>

      {/* PAYMENT SANDBOX MODAL */}
      {selectedPlanForPayment && (
        <PaymentModal
          isOpen={!!selectedPlanForPayment}
          onClose={() => setSelectedPlanForPayment(null)}
          paymentType="subscription"
          itemId={selectedPlanForPayment.id}
          itemTitle={`Gói Hội Viên: ${selectedPlanForPayment.name}`}
          price={selectedPlanForPayment.price}
          durationDays={selectedPlanForPayment.duration_days}
          onSuccess={() => {
            setSelectedPlanForPayment(null);
            fetchMySubscription();
          }}
        />
      )}

    </div>
  );
};

export default SubscriptionsPage;
