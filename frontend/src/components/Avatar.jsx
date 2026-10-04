import React, { useState } from 'react';

/**
 * Bảng màu gradient vũ trụ Marvel (8 cặp màu tuyển chọn)
 */
const MARVEL_GRADIENTS = [
  'from-[#ED1D24] to-[#FF6B35]', // Scarlet Red -> Solar Flare
  'from-[#7928CA] to-[#FF0080]', // Cosmic Purple -> Fuchsia
  'from-[#0051FF] to-[#00D4FF]', // Captain Blue -> Cosmic Azure
  'from-[#6B11FF] to-[#11D3FF]', // Quantum Indigo -> Cyan
  'from-[#E52E71] to-[#FF8A00]', // Neon Ruby -> Sunset Amber
  'from-[#0096C7] to-[#023E8A]', // Wakanda Vibranium Blue
  'from-[#8338EC] to-[#3A86FF]', // Multiverse Violet -> Royal Blue
  'from-[#C1121F] to-[#780000]'  // Iron Man Deep Crimson
];

/**
 * Băm chuỗi (id, username, email, full_name) để chọn màu gradient nhất quán
 */
const getGradientIndex = (str) => {
  if (!str) return 0;
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % MARVEL_GRADIENTS.length;
};

/**
 * Trích xuất 1 hoặc 2 chữ cái đầu từ tên
 * - "Nguyễn Văn A" -> "NA" (chữ cái đầu từ đầu tiên + từ cuối cùng)
 * - "admin" -> "A"
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
};

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]' },
  sm: { box: 'w-8 h-8', text: 'text-xs' },
  md: { box: 'w-10 h-10', text: 'text-sm' },
  lg: { box: 'w-14 h-14', text: 'text-lg font-bold' },
  xl: { box: 'w-20 h-20', text: 'text-2xl font-bold' },
  '2xl': { box: 'w-24 h-24', text: 'text-3xl font-extrabold' }
};

/**
 * Component Avatar chuẩn dùng chung toàn hệ thống
 */
const Avatar = ({
  user,
  name,
  src,
  size = 'sm',
  className = '',
  ringColor = 'border-[#ED1D24]/40',
  alt
}) => {
  const [hasImgError, setHasImgError] = useState(false);

  // Lấy tên hiển thị
  const displayName =
    name ||
    user?.full_name ||
    user?.username ||
    user?.email ||
    'Marvel User';

  // Lấy chữ cái initials
  const initials = getInitials(displayName);

  // Lấy định danh duy nhất để hash màu (ưu tiên user.id -> username -> email -> displayName)
  const identifier = user?.id || user?.username || user?.email || displayName;
  const gradientClass = MARVEL_GRADIENTS[getGradientIndex(identifier)];

  // Kích thước chuẩn
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;

  // Lấy đường dẫn ảnh nếu có (hỗ trợ avatar_url, avatar, src)
  const imageSource = src || user?.avatar_url || user?.avatar;

  // Kiểm tra nếu là URL ảnh thật và chưa bị lỗi tải
  const shouldRenderImage = Boolean(imageSource && !hasImgError);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden border ${ringColor} ${sizeConfig.box} ${className}`}
      title={displayName}
    >
      {shouldRenderImage ? (
        <img
          src={imageSource}
          alt={alt || displayName}
          onError={() => setHasImgError(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientClass} text-white font-semibold font-outfit shadow-inner ${sizeConfig.text}`}
        >
          <span>{initials}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
