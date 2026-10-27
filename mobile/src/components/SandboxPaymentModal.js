import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * SandboxPaymentModal - Dialog mô phỏng thanh toán Sandbox tái sử dụng cho:
 * 1. Gói hội viên VIP (payment_type: 'subscription')
 * 2. Mua lẻ trọn bộ truyện bản quyền (payment_type: 'story_purchase')
 * 
 * ĐẶC ĐIỂM:
 * - Không chuyển hướng trình duyệt ngoài, không dùng WebView, không trừ tiền thật.
 * - Hiển thị nhãn môi trường Sandbox rõ ràng.
 * - Gọi POST /api/payments/checkout lấy transactionCode.
 * - 2 nút lựa chọn: "Thanh toán thành công" và "Hủy / Báo thất bại".
 * - Chặn bấm 2 lần khi đang xử lý (isProcessing).
 * - Tự động gọi loadUserBenefits() để cập nhật ngay quyền VIP và danh sách truyện đã mua trong AuthContext.
 */
export default function SandboxPaymentModal({
  visible,
  plan,
  story,
  paymentType,
  onClose,
  onSuccess,
}) {
  const { loadUserBenefits } = useAuth();

  const [checkoutData, setCheckoutData] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Xác định loại giao dịch thực tế
  const isStoryPurchase = paymentType === 'story_purchase' || (!plan && !!story);
  const targetItem = isStoryPurchase ? story : plan;

  // Khởi tạo checkout khi mở modal
  useEffect(() => {
    let isMounted = true;

    if (visible && targetItem) {
      setCheckoutData(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsInitializing(true);

      const itemId = isStoryPurchase ? (targetItem.id || targetItem.story_id) : targetItem.id;
      const type = isStoryPurchase ? 'story_purchase' : 'subscription';

      api.post('/api/payments/checkout', {
        payment_type: type,
        item_id: itemId,
        payment_method: 'sandbox',
      })
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setCheckoutData(res.data);
          } else {
            setErrorMessage(res.message || 'Không thể tạo phiên thanh toán.');
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setErrorMessage(err.message || 'Lỗi khi khởi tạo phiên thanh toán.');
        })
        .finally(() => {
          if (isMounted) setIsInitializing(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [visible, targetItem, isStoryPurchase]);

  // Xử lý gửi kết quả mô phỏng Sandbox (thành công hoặc thất bại)
  const handleProcess = async (simulateFailure) => {
    if (!checkoutData?.transactionCode || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/api/payments/process-sandbox', {
        transaction_code: checkoutData.transactionCode,
        simulate_failure: simulateFailure,
      });

      if (res.success && !simulateFailure) {
        const msg = isStoryPurchase
          ? 'Thanh toán thành công! Bạn đã sở hữu bản quyền trọn bộ truyện này.'
          : 'Thanh toán thành công! Gói hội viên của bạn đã được kích hoạt.';
        setSuccessMessage(msg);

        // Làm mới quyền VIP và danh sách mua lẻ ngay lập tức trong AuthContext
        await loadUserBenefits();

        setTimeout(() => {
          if (typeof onSuccess === 'function') {
            onSuccess(res.payment);
          }
          if (typeof onClose === 'function') {
            onClose();
          }
        }, 1200);
      } else {
        // Nhánh thất bại hoặc bị từ chối
        setErrorMessage(res.message || 'Giao dịch thanh toán không thành công. Quyền đọc chưa được kích hoạt.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi kết nối khi xử lý giao dịch.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isProcessing ? undefined : onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={isProcessing ? undefined : onClose}
      >
        <Pressable style={styles.dialogContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconWrapper}>
                <Ionicons
                  name={isStoryPurchase ? 'cart-outline' : 'card-outline'}
                  size={20}
                  color={isStoryPurchase ? '#34D399' : '#ED1D24'}
                />
              </View>
              <View>
                <Text style={styles.dialogTitle}>Thanh Toán Thử Nghiệm</Text>
                <Text style={styles.dialogSubtitle}>Môi trường Sandbox (Không trừ tiền thật)</Text>
              </View>
            </View>
            {!isProcessing && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Trạng thái đang khởi tạo checkout */}
          {isInitializing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#ED1D24" />
              <Text style={styles.loadingText}>Đang tạo phiên giao dịch Sandbox an toàn...</Text>
            </View>
          ) : (
            <View style={styles.contentBody}>
              {/* Box tóm tắt đơn hàng */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>
                      {isStoryPurchase ? 'BẢN QUYỀN TRỌN BỘ' : 'GÓI HỘI VIÊN VIP'}
                    </Text>
                    <Text style={styles.summaryItemTitle} numberOfLines={2}>
                      {checkoutData?.itemTitle || targetItem?.title || targetItem?.name || 'Vật phẩm Marvel'}
                    </Text>

                    {isStoryPurchase ? (
                      <View style={styles.durationRow}>
                        <Ionicons name="infinite-outline" size={13} color="#34D399" style={{ marginRight: 4 }} />
                        <Text style={[styles.durationText, { color: '#34D399' }]}>Sở hữu vĩnh viễn trọn bộ</Text>
                      </View>
                    ) : plan?.duration_days ? (
                      <View style={styles.durationRow}>
                        <Ionicons name="time-outline" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                        <Text style={styles.durationText}>Thời hạn: {plan.duration_days} ngày</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Tổng tiền</Text>
                    <Text style={[styles.priceValue, isStoryPurchase && { color: '#34D399' }]}>
                      {Number(checkoutData?.amount || targetItem?.price || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </View>

                {/* Mã giao dịch Sandbox */}
                {checkoutData?.transactionCode && (
                  <View style={styles.codeRow}>
                    <Text style={styles.codeLabel}>Mã giao dịch:</Text>
                    <Text style={styles.codeValue} numberOfLines={1}>
                      {checkoutData.transactionCode}
                    </Text>
                  </View>
                )}
              </View>

              {/* Thông báo Thành công */}
              {successMessage && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#34D399" style={{ marginRight: 8 }} />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {/* Thông báo Lỗi / Thất bại */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#F87171" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Hướng dẫn Sandbox */}
              {!successMessage && (
                <View style={styles.sandboxNoticeBox}>
                  <Ionicons name="flask-outline" size={16} color="#60A5FA" style={{ marginRight: 6 }} />
                  <Text style={styles.sandboxNoticeText}>
                    Chọn trạng thái mô phỏng cổng thanh toán để kiểm tra quy trình:
                  </Text>
                </View>
              )}

              {/* Nút thao tác Sandbox */}
              {!successMessage && (
                <View style={styles.buttonGroup}>
                  {/* Nút 1: Thành công */}
                  <TouchableOpacity
                    style={[styles.btnSuccess, isProcessing && styles.btnDisabled]}
                    onPress={() => handleProcess(false)}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.btnSuccessText}>Thanh Toán Thành Công</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Nút 2: Thất bại / Hủy */}
                  <TouchableOpacity
                    style={[styles.btnFailure, isProcessing && styles.btnDisabled]}
                    onPress={() => handleProcess(true)}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#F87171" style={{ marginRight: 6 }} />
                    <Text style={styles.btnFailureText}>Hủy / Báo Thất Bại</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Cam kết an toàn */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark" size={14} color="#34D399" style={{ marginRight: 5 }} />
            <Text style={styles.footerNoteText}>
              Giao dịch Sandbox được bảo vệ bằng Sequelize Transaction toàn vẹn dữ liệu
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1A1A22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
    paddingBottom: 14,
    marginBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 29, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(237, 29, 36, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  dialogSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
  contentBody: {
    marginBottom: 14,
  },
  summaryBox: {
    backgroundColor: '#0F0F14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 14,
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryItemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  durationText: {
    color: '#FBBF24',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  priceLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  priceValue: {
    color: '#ED1D24',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginTop: 1,
  },
  codeRow: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  codeValue: {
    color: '#FBBF24',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: '#34D399',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    lineHeight: 18,
  },
  sandboxNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  sandboxNoticeText: {
    color: '#93C5FD',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  buttonGroup: {
    gap: 10,
  },
  btnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnSuccessText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  btnFailure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnFailureText: {
    color: '#F87171',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
    paddingTop: 12,
  },
  footerNoteText: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    flex: 1,
  },
});
