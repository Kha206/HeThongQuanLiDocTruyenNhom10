import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import PasswordInput from '../components/PasswordInput';
import api from '../services/api';

export default function ProfileEditScreen({ navigation }) {
  const { user, updateUser } = useAuth();

  // 1. Profile State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState(null);

  // 2. Avatar State
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState(null);
  const [avatarErrorMsg, setAvatarErrorMsg] = useState(null);

  // 3. Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState(null);

  // === HANDLER 1: ĐỔI HỌ TÊN (PUT /api/auth/profile) ===
  const handleUpdateProfile = async () => {
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setProfileErrorMsg('Vui lòng nhập họ và tên.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.put('/api/auth/profile', { full_name: trimmedName });
      if (res.success && res.user) {
        updateUser(res.user);
        setProfileSuccessMsg('Cập nhật họ và tên thành công!');
      } else {
        setProfileErrorMsg(res.message || 'Cập nhật hồ sơ không thành công.');
      }
    } catch (err) {
      setProfileErrorMsg(err.message || 'Lỗi khi cập nhật hồ sơ cá nhân.');
    } finally {
      setProfileLoading(false);
    }
  };

  // === HANDLER 2: CHỌN & TẢI ẢNH ĐẠI DIỆN (POST /api/auth/avatar) ===
  const handlePickAvatar = async () => {
    setAvatarSuccessMsg(null);
    setAvatarErrorMsg(null);

    try {
      // 1. Xin quyền truy cập thư viện
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Quyền Truy Cập Thư Viện',
          'Marvel Comics Hub cần quyền truy cập thư viện ảnh để bạn có thể chọn và tải ảnh đại diện lên tài khoản.',
          [{ text: 'Đã hiểu' }]
        );
        return;
      }

      // 2. Mở trình chọn ảnh
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const asset = pickerResult.assets[0];
      const uri = asset.uri;

      // 3. Kiểm tra định dạng (JPEG, PNG, WEBP)
      const fileName = asset.fileName || uri.split('/').pop() || 'avatar.jpg';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const mimeType = asset.mimeType || (fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg');

      const isAllowedFormat = validExtensions.includes(fileExt) || ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);

      if (!isAllowedFormat) {
        setAvatarErrorMsg('Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP.');
        Alert.alert('Định Dạng Không Hỗ Trợ', 'Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP.');
        return;
      }

      // 4. Kiểm tra kích thước (Backend & Web áp dụng giới hạn tối đa 2MB)
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
        setAvatarErrorMsg('Kích thước ảnh đại diện không được vượt quá 2MB.');
        Alert.alert('Kích Thước Quá Lớn', 'Kích thước ảnh đại diện không được vượt quá 2MB. Vui lòng chọn ảnh nhẹ hơn.');
        return;
      }

      // 5. Gửi multipart FormData
      setAvatarLoading(true);
      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: fileName.includes('.') ? fileName : `${fileName}.jpg`,
        type: mimeType
      });

      const res = await api.upload('/api/auth/avatar', formData);
      if (res.success && res.user) {
        updateUser(res.user);
        setAvatarSuccessMsg('Cập nhật ảnh đại diện thành công!');
      } else {
        setAvatarErrorMsg(res.message || 'Lỗi khi tải ảnh đại diện lên.');
      }
    } catch (err) {
      setAvatarErrorMsg(err.message || 'Không thể tải ảnh đại diện lên máy chủ.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // === HANDLER 3: ĐỔI MẬT KHẨU (POST /api/auth/change-password) ===
  const handleChangePassword = async () => {
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!oldPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMsg('Mật khẩu mới phải có độ dài tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post('/api/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setPasswordSuccessMsg('Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordErrorMsg(res.message || 'Đổi mật khẩu không thành công.');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Mật khẩu cũ không chính xác')) {
        setPasswordErrorMsg('Mật khẩu cũ không chính xác. Vui lòng kiểm tra lại.');
      } else {
        setPasswordErrorMsg(msg || 'Lỗi hệ thống khi đổi mật khẩu.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CHỈNH SỬA HỒ SƠ</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* PHẦN 1: ẢNH ĐẠI DIỆN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="camera-outline" size={20} color="#ED1D24" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Ảnh Đại Diện</Text>
          </View>

          <View style={styles.avatarCenterBox}>
            <View style={styles.avatarWrapper}>
              <UserAvatar user={user} size={96} />
              <TouchableOpacity
                style={styles.cameraIconBadge}
                onPress={handlePickAvatar}
                disabled={avatarLoading}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {avatarLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.changeAvatarBtn, avatarLoading && styles.btnDisabled]}
              onPress={handlePickAvatar}
              disabled={avatarLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.changeAvatarBtnText}>
                {avatarLoading ? 'Đang Tải Ảnh...' : 'Chọn Ảnh Từ Thư Viện'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.avatarHelperText}>
              Chấp nhận định dạng JPG, PNG, WEBP (tối đa 2MB). Nếu chưa có ảnh, hệ thống hiển thị chữ cái đại diện.
            </Text>

            {avatarSuccessMsg ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#34D399" style={{ marginRight: 6 }} />
                <Text style={styles.successBannerText}>{avatarSuccessMsg}</Text>
              </View>
            ) : null}

            {avatarErrorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#F87171" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{avatarErrorMsg}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* PHẦN 2: THÔNG TIN TÀI KHOẢN (ĐỔI HỌ TÊN) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={20} color="#ED1D24" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Thông Tin Tài Khoản</Text>
          </View>

          {profileSuccessMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#34D399" style={{ marginRight: 6 }} />
              <Text style={styles.successBannerText}>{profileSuccessMsg}</Text>
            </View>
          ) : null}

          {profileErrorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{profileErrorMsg}</Text>
            </View>
          ) : null}

          {/* Tên Đăng Nhập (Readonly) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Tên Đăng Nhập</Text>
              <Text style={styles.readonlyBadge}>Không thể thay đổi</Text>
            </View>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
              <Ionicons name="lock-closed" size={16} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.username || ''}
                editable={false}
              />
            </View>
          </View>

          {/* Email (Readonly) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Địa Chỉ Email</Text>
              <Text style={styles.readonlyBadge}>Không thể thay đổi</Text>
            </View>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
              <Ionicons name="mail" size={16} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                editable={false}
              />
            </View>
          </View>

          {/* Họ và Tên (Cho phép sửa) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và Tên (Tên Hiển Thị) *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="create-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên hiển thị..."
                placeholderTextColor="#6B7280"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (profileErrorMsg) setProfileErrorMsg(null);
                  if (profileSuccessMsg) setProfileSuccessMsg(null);
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Nút Lưu Họ Tên */}
          <TouchableOpacity
            style={[styles.saveBtn, profileLoading && styles.btnDisabled]}
            onPress={handleUpdateProfile}
            disabled={profileLoading}
            activeOpacity={0.8}
          >
            {profileLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Lưu Thay Đổi Họ Tên</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* PHẦN 3: ĐỔI MẬT KHẨU */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="key-outline" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Đổi Mật Khẩu</Text>
          </View>

          <Text style={styles.passwordHintText}>
            Để bảo vệ an toàn cho tài khoản của bạn, mật khẩu mới cần có tối thiểu 8 ký tự.
          </Text>

          {passwordSuccessMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#34D399" style={{ marginRight: 6 }} />
              <Text style={styles.successBannerText}>{passwordSuccessMsg}</Text>
            </View>
          ) : null}

          {passwordErrorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{passwordErrorMsg}</Text>
            </View>
          ) : null}

          {/* Mật khẩu cũ (Independent toggle) */}
          <PasswordInput
            label="Mật Khẩu Hiện Tại *"
            placeholder="Nhập mật khẩu cũ..."
            value={oldPassword}
            onChangeText={(text) => {
              setOldPassword(text);
              if (passwordErrorMsg) setPasswordErrorMsg(null);
              if (passwordSuccessMsg) setPasswordSuccessMsg(null);
            }}
          />

          {/* Mật khẩu mới (Independent toggle) */}
          <PasswordInput
            label="Mật Khẩu Mới (Tối thiểu 8 ký tự) *"
            placeholder="Nhập mật khẩu mới..."
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (passwordErrorMsg) setPasswordErrorMsg(null);
              if (passwordSuccessMsg) setPasswordSuccessMsg(null);
            }}
          />

          {/* Xác nhận mật khẩu mới (Independent toggle) */}
          <PasswordInput
            label="Xác Nhận Mật Khẩu Mới *"
            placeholder="Nhập lại mật khẩu mới..."
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (passwordErrorMsg) setPasswordErrorMsg(null);
              if (passwordSuccessMsg) setPasswordSuccessMsg(null);
            }}
            returnKeyType="done"
            onSubmitEditing={handleChangePassword}
          />

          {/* Nút Đổi Mật Khẩu */}
          <TouchableOpacity
            style={[styles.passwordBtn, passwordLoading && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={passwordLoading}
            activeOpacity={0.8}
          >
            {passwordLoading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.passwordBtnText}>Cập Nhật Mật Khẩu</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
    paddingBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  avatarCenterBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ED1D24',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1A1A22',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A38',
    borderWidth: 1,
    borderColor: '#3E3E50',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 10,
  },
  changeAvatarBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  avatarHelperText: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  readonlyBadge: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A38',
    paddingHorizontal: 12,
  },
  inputWrapperDisabled: {
    backgroundColor: '#13131A',
    borderColor: '#232330',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#ED1D24',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#ED1D24',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  passwordHintText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: 'Inter_400Regular',
  },
  passwordBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  passwordBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  successBannerText: {
    color: '#34D399',
    fontSize: 12,
    flex: 1,
    fontFamily: 'Inter_500Medium',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: 12,
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
});
