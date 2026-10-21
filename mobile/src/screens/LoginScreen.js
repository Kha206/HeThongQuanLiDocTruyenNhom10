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

export default function LoginScreen() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!loginId.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản hoặc email.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await login(loginId, password);
    } catch (err) {
      setErrorMessage(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
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
        {/* Marvel Branding Header */}
        <View style={styles.header}>
          <View style={styles.marvelBadge}>
            <Text style={styles.marvelBadgeText}>MARVEL</Text>
          </View>
          <Text style={styles.appTitle}>COMICS HUB</Text>
          <Text style={styles.appSubtitle}>
            Đăng nhập để khám phá vũ trụ truyện tranh Marvel bản quyền
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ĐĂNG NHẬP</Text>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Login ID Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tài khoản hoặc Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập username hoặc email..."
                placeholderTextColor="#6B7280"
                value={loginId}
                onChangeText={(text) => {
                  setLoginId(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor="#6B7280"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hệ thống độc quyền đọc truyện Marvel Comics nhóm 10
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  marvelBadge: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 10,
  },
  marvelBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 2,
    fontFamily: 'Outfit_700Bold',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 3,
    marginBottom: 8,
  },
  appSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 1,
    marginBottom: 18,
    textAlign: 'center',
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
  eyeButton: {
    padding: 6,
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
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});
