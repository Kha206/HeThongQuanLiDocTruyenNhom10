import React, { useState } from 'react';
import { getProxiedImageUrl } from '../utils/imageProxy';

const SIZE_MAP = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20'
};

/**
 * CharacterAvatar - Component chuyên biệt để hiển thị ảnh nhân vật truyện (character_credits)
 * 
 * NGUYÊN TẮC BẤT DI BẤT DỊCH:
 * 1. KHÔNG sử dụng Avatar Initials (chữ cái đầu viết tắt) - cơ chế initials CHỈ dành cho tài khoản người dùng cá nhân.
 * 2. Luôn ưu tiên hiển thị ảnh thật của nhân vật từ ComicVine thông qua image proxy.
 * 3. Nếu nhân vật không có ảnh hoặc ảnh bị lỗi, hiển thị icon placeholder nhân vật siêu anh hùng chuyên biệt (/placeholder-character.svg).
 */
const CharacterAvatar = ({
  name = 'Nhân vật',
  src,
  icon_url,
  size = 'md',
  className = '',
  style = {}
}) => {
  const [hasImgError, setHasImgError] = useState(false);

  const rawUrl = src || icon_url;
  const proxiedUrl = rawUrl ? getProxiedImageUrl(rawUrl) : null;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const shouldRenderRealImage = Boolean(proxiedUrl && !hasImgError);

  if (shouldRenderRealImage) {
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden border border-white/10 bg-[#161622] flex-shrink-0 flex items-center justify-center ${className}`}
        style={style}
      >
        <img
          src={proxiedUrl}
          alt={name}
          onError={() => setHasImgError(true)}
          className="w-full h-full object-cover object-top transition-transform duration-300"
        />
      </div>
    );
  }

  // Placeholder chuyên biệt cho nhân vật truyện (KHÔNG DÙNG INITIALS CHỮ CÁI)
  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-[#2A2A38] bg-[#12121A] flex-shrink-0 flex items-center justify-center p-1 shadow-inner ${className}`}
      style={style}
      title={`${name} (Hình đại diện mặc định)`}
    >
      <img
        src="/placeholder-character.svg"
        alt={name}
        className="w-full h-full object-contain opacity-80"
      />
    </div>
  );
};

export default CharacterAvatar;
