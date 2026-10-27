import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * AccessBlockedSheet - Bottom Sheet hiển thị khi gặp mã lỗi 403 (PAYMENT_REQUIRED)
 * Nêu rõ lý do, đặc quyền VIP, giá trọn bộ (nếu có), nút đăng ký VIP và nút Mua riêng trọn bộ.
 * Tuyệt đối không để lộ mã lỗi kỹ thuật như PAYMENT_REQUIRED hay US-xx lên giao diện.
 */
export default function AccessBlockedSheet({
  visible,
  accessInfo,
  message,
  onNavigateToSubscriptions,
  onBuyStory,
  onClose,
  onGoBack,
}) {
  if (!visible) return null;

  const storyPrice = accessInfo?.story_price ? Number(accessInfo.story_price) : 0;
  const formattedPrice = storyPrice > 0 ? `${storyPrice.toLocaleString('vi-VN')} đ` : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose || onGoBack}
    >
      <Pressable style={styles.backdrop} onPress={onClose || onGoBack}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          {/* Thanh gạt trên cùng của bottom sheet */}
          <View style={styles.dragHandle} />

          {/* Huy hiệu VIP Marvel */}
          <View style={styles.badgeRow}>
            <View style={styles.vipBadge}>
              <Ionicons name="sparkles" size={13} color="#FBBF24" style={{ marginRight: 5 }} />
              <Text style={styles.vipBadgeText}>ĐẶC QUYỀN HỘI VIÊN MARVEL VIP</Text>
            </View>
          </View>

          {/* Biểu tượng ổ khóa VIP */}
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={32} color="#FBBF24" />
          </View>

          {/* Tiêu đề & Thông điệp thân thiện */}
          <Text style={styles.sheetTitle}>Chương Truyện Khóa Bản Quyền</Text>
          <Text style={styles.sheetMessage}>
            {message || 'Chương này yêu cầu Gói Hội Viên VIP hoặc mua riêng trọn bộ truyện để đọc.'}
          </Text>

          {/* Thông tin tác phẩm & giá */}
          {accessInfo && (
            <View style={styles.infoBox}>
              {accessInfo.story_title && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tác phẩm:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {accessInfo.story_title}
                  </Text>
                </View>
              )}
              {accessInfo.chapter_number !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Chương số:</Text>
                  <Text style={[styles.infoValue, { color: '#FBBF24', fontWeight: '700' }]}>
                    Chương {accessInfo.chapter_number}
                  </Text>
                </View>
              )}
              {formattedPrice && (
                <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#2A2A38', paddingTop: 8, marginTop: 4 }]}>
                  <Text style={styles.infoLabel}>Giá mua trọn bộ:</Text>
                  <Text style={[styles.infoValue, { color: '#34D399', fontWeight: '800' }]}>
                    {formattedPrice}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Các nút hành động */}
          <View style={styles.actionsContainer}>
            {/* 1. Nút Đăng ký gói VIP */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onNavigateToSubscriptions}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Đăng Ký Gói Hội Viên VIP</Text>
            </TouchableOpacity>

            {/* 2. Nút Mua riêng truyện lẻ (Kích hoạt với dialog Sandbox) */}
            {formattedPrice && onBuyStory && (
              <TouchableOpacity
                style={styles.buyStoryBtn}
                onPress={onBuyStory}
                activeOpacity={0.85}
              >
                <Ionicons name="cart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.buyStoryBtnText}>
                  Mua Riêng Trọn Bộ ({formattedPrice})
                </Text>
              </TouchableOpacity>
            )}

            {/* 3. Nút Quay lại trang truyện */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
              <Text style={styles.backBtnText}>Quay lại trang truyện</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1A1A22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#374151',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4B5563',
    marginBottom: 16,
  },
  badgeRow: {
    marginBottom: 12,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  vipBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  sheetMessage: {
    color: '#D1D5DB',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#0F0F14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 14,
    marginBottom: 18,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    maxWidth: '65%',
    textAlign: 'right',
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  buyStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buyStoryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
