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
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    setGeneralError(null);

    // 1. Tên đăng nhập
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      errors.username = 'Vui lòng nhập tên đăng nhập.';
    } else if (trimmedUsername.length < 3) {
      errors.username = 'Tên đăng nhập phải có tối thiểu 3 ký tự.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      errors.username = 'Tên đăng nhập chỉ gồm chữ cái, số và dấu gạch dưới (_).';
    }

    // 2. Email
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ (ví dụ: name@example.com).';
    }

    // 3. Mật khẩu
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
    }

    // 4. Xác nhận mật khẩu
    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp với mật khẩu đã nhập.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (loading) return; // Chặn bấm 2 lần
    if (!validate()) return;

    setLoading(true);
    setGeneralError(null);

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined
      });

      // Đăng ký thành công -> Vào thẳng màn hình chính
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      const msg = err.message || '';
      // Phân loại lỗi trả về từ backend thân thiện bằng tiếng Việt
      if (msg.includes('Username đã được sử dụng') || err.data?.message?.includes('Username đã được sử dụng')) {
        setFieldErrors((prev) => ({
          ...prev,
          username: 'Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác.'
        }));
      } else if (msg.includes('Email đã được đăng ký') || err.data?.message?.includes('Email đã được đăng ký')) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'Địa chỉ email này đã được đăng ký. Vui lòng sử dụng email khác.'
        }));
      } else if (msg.includes('Mật khẩu') || err.data?.message?.includes('Mật khẩu')) {
        setFieldErrors((prev) => ({
          ...prev,
          password: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.'
        }));
      } else if (msg.includes('kết nối') || msg.includes('máy chủ') || msg.includes('Network')) {
        setGeneralError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
      } else {
        setGeneralError(msg || 'Đăng ký tài khoản không thành công. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Back Navigation Button */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Marvel Branding Header */}
        <View style={styles.header}>
          <View style={styles.marvelBadge}>
            <Text style={styles.marvelBadgeText}>MARVEL</Text>
          </View>
          <Text style={styles.appTitle}>TẠO TÀI KHOẢN MỚI</Text>
          <Text style={styles.appSubtitle}>
            Gia nhập cộng đồng độc giả Marvel Comics Hub để đọc truyện và trải nghiệm VIP
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* General Error Banner */}
          {generalError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và Tên (Tùy chọn)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-circle-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Peter Parker"
                placeholderTextColor="#6B7280"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên Đăng Nhập (Username) *</Text>
            <View style={[styles.inputWrapper, fieldErrors.username && styles.inputWrapperError]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={fieldErrors.username ? '#F87171' : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: spiderman_ny"
                placeholderTextColor="#6B7280"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: null }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {fieldErrors.username ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.username}</Text>
            ) : null}
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa Chỉ Email *</Text>
            <View style={[styles.inputWrapper, fieldErrors.email && styles.inputWrapperError]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={fieldErrors.email ? '#F87171' : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: spiderman@dailybugle.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: null }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {fieldErrors.email ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          {/* Password Input (Independent Show/Hide) */}
          <PasswordInput
            label="Mật Khẩu (Tối thiểu 6 ký tự) *"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: null }));
              }
            }}
            error={fieldErrors.password}
          />

          {/* Confirm Password Input (Independent Show/Hide) */}
          <PasswordInput
            label="Xác Nhận Mật Khẩu *"
            placeholder="Nhập lại mật khẩu..."
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
              }
            }}
            error={fieldErrors.confirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>ĐĂNG KÝ TÀI KHOẢN</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.loginPromptRow}>
            <Text style={styles.loginPromptText}>Đã có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.loginLinkText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Marvel Comic Platform Nhóm 10 • Thông tin bảo mật an toàn
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topNavRow: {
    marginBottom: 12,
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  marvelBadge: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 8,
  },
  marvelBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 2,
    fontFamily: 'Outfit_700Bold',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  appSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Inter_600SemiBold',
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
  inputWrapperError: {
    borderColor: '#EF4444',
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
  fieldErrorText: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  button: {
    backgroundColor: '#ED1D24',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#ED1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Outfit_700Bold',
  },
  loginPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  loginPromptText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  loginLinkText: {
    color: '#ED1D24',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});
