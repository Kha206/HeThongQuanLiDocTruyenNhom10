import React, { useState } from 'react';
import api from '../services/api';
import {
  CreditCard, Sparkles, ShieldCheck, CheckCircle2,
  AlertCircle, X, Loader2, ArrowRight, BookOpen, QrCode
} from 'lucide-react';

const PaymentModal = ({
  isOpen,
  onClose,
  paymentType, // 'subscription' | 'story_purchase'
  itemId, // plan_id hoặc story_id
  itemTitle,
  price,
  durationDays, // nếu là gói
  onSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  // Step 1: Tạo checkout
  const handleInitiateCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/payments/checkout', {
        payment_type: paymentType,
        item_id: itemId,
        payment_method: paymentMethod
      });

      if (res.success && res.data) {
        setCheckoutData(res.data);
      } else {
        setError(res.message || 'Không thể tạo đơn thanh toán.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi khởi tạo đơn thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Xử lý thanh toán Sandbox
  const handleProcessPayment = async (simulateFailure = false) => {
    if (!checkoutData?.transactionCode) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await api.post('/payments/process-sandbox', {
        transaction_code: checkoutData.transactionCode,
        simulate_failure: simulateFailure
      });

      if (res.success) {
        setSuccessInfo(res.message);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(res.payment);
          }, 1200);
        }
      } else {
        setError(res.message || 'Giao dịch bị từ chối hoặc thất bại.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi xử lý giao dịch.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCheckoutData(null);
    setError(null);
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ED1D24]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2A38] relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ED1D24]/10 text-[#ED1D24] border border-[#ED1D24]/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {paymentType === 'subscription' ? 'Đăng Ký Gói Hội Viên Marvel VIP' : 'Mua Bản Quyền Đọc Trọn Bộ'}
              </h3>
              <p className="text-xs text-gray-400">Cổng thanh toán Sandbox an toàn & bảo mật</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5 relative z-10">
          
          {/* Order Summary Box */}
          <div className="p-4 rounded-2xl bg-[#0F0F14] border border-[#2A2A38]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Sản phẩm thanh toán</p>
                <h4 className="text-base font-bold text-white mt-0.5">{itemTitle}</h4>
                {durationDays && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Thời hạn sử dụng: {durationDays} ngày</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Tổng tiền</span>
                <span className="text-xl font-extrabold text-[#ED1D24]">
                  {Number(price).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successInfo && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold">Giao dịch thành công!</p>
                <p className="text-xs opacity-90">{successInfo}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!successInfo && (
            <>
              {/* Step 1: Chọn cổng nếu chưa tạo checkout */}
              {!checkoutData ? (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Chọn Cổng Thanh Toán Sandbox:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* VNPay */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vnpay')}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'vnpay'
                          ? 'border-[#ED1D24] bg-[#ED1D24]/10 shadow-lg shadow-[#ED1D24]/10'
                          : 'border-[#2A2A38] bg-[#0F0F14] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-xs font-extrabold text-blue-400">VNPAY</span>
                        {paymentMethod === 'vnpay' && (
                          <div className="w-2 h-2 rounded-full bg-[#ED1D24]" />
                        )}
                      </div>
                      <span className="text-xs text-gray-300 font-medium">VNPay Sandbox</span>
                      <span className="text-[10px] text-gray-500">ATM / QR / Visa / Master</span>
                    </button>

                    {/* MoMo */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('momo')}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'momo'
                          ? 'border-[#ED1D24] bg-[#ED1D24]/10 shadow-lg shadow-[#ED1D24]/10'
                          : 'border-[#2A2A38] bg-[#0F0F14] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-xs font-extrabold text-pink-500">MOMO</span>
                        {paymentMethod === 'momo' && (
                          <div className="w-2 h-2 rounded-full bg-[#ED1D24]" />
                        )}
                      </div>
                      <span className="text-xs text-gray-300 font-medium">Ví MoMo Sandbox</span>
                      <span className="text-[10px] text-gray-500">Quét mã QR Siêu tốc</span>
                    </button>
                  </div>

                  <button
                    onClick={handleInitiateCheckout}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-[#ED1D24] hover:bg-[#ff3333] text-white font-bold rounded-xl shadow-lg shadow-[#ED1D24]/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Tiếp Tục Thanh Toán Sandbox</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Step 2: Xác nhận giao dịch Sandbox */
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-[#0F0F14] border border-[#2A2A38] text-center space-y-3">
                    <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-white mx-auto">
                      <QrCode className="w-16 h-16 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Mã giao dịch thử nghiệm:</p>
                      <p className="text-sm font-mono font-bold text-amber-400 tracking-wider">
                        {checkoutData.transactionCode}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleProcessPayment(false)}
                      disabled={processing}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Thanh Toán Thành Công</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleProcessPayment(true)}
                      disabled={processing}
                      className="py-3 px-4 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Hủy / Báo Thất Bại</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-2 border-t border-[#2A2A38]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Giao dịch an toàn và bảo mật 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
