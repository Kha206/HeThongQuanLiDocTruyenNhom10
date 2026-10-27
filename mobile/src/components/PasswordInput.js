import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * PasswordInput - Component ô nhập mật khẩu dùng chung
 * 
 * Tính năng chuẩn:
 * 1. State showPassword độc lập cho từng instance (đổi giữa secureTextEntry={true/false}).
 * 2. Icon chuyển đổi giữa 'eye-outline' và 'eye-off-outline'.
 * 3. Hỗ trợ icon bên trái (mặc định lock-closed-outline).
 * 4. Hỗ trợ hiển thị nhãn (label) và thông báo lỗi (error).
 * 5. Tuân thủ chuẩn theme tối Marvel (#0F0F14, border #2A2A38, focus #ED1D24).
 */
export default function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder = 'Nhập mật khẩu...',
  error,
  leftIcon = 'lock-closed-outline',
  containerStyle,
  inputStyle,
  editable = true,
  autoFocus = false,
  returnKeyType = 'done',
  onSubmitEditing,
  testID
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
          !editable && styles.inputWrapperDisabled
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={error ? '#F87171' : isFocused ? '#ED1D24' : '#9CA3AF'}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          testID={testID}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={showPassword ? '#ED1D24' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  inputWrapperFocused: {
    borderColor: '#ED1D24',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  leftIcon: {
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
  errorText: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
});
