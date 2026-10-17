import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * PasswordInput - Component input mật khẩu dùng chung
 * 
 * Tính năng:
 * 1. State showPassword độc lập cho từng ô input (đổi giữa 'password' và 'text').
 * 2. Nút con mắt type="button" (tránh submit form ngoài ý muốn).
 * 3. Icon đổi giữa Eye (mắt mở - bấm để hiện) và EyeOff (mắt gạch chéo - bấm để ẩn).
 * 4. Hỗ trợ đầy đủ aria-label, title, focus states, left icon tùy biến.
 */
const PasswordInput = ({
  id,
  name,
  value = '',
  onChange,
  placeholder = 'Nhập mật khẩu...',
  required = false,
  minLength,
  disabled = false,
  autoComplete,
  className = '',
  containerClassName = '',
  leftIcon: LeftIcon = Lock,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`relative ${containerClassName}`}>
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-10 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24] transition-colors disabled:opacity-50 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${className}`}
        {...rest}
      />

      {LeftIcon && (
        <LeftIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
      )}

      <button
        type="button"
        onClick={toggleShowPassword}
        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        tabIndex={0}
        className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors p-0.5 rounded focus:outline-none cursor-pointer flex items-center justify-center"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-gray-300 hover:text-white" />
        ) : (
          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-200" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
