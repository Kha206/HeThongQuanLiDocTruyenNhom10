import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import ProxiedImage from './ProxiedImage';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const ComicCard = ({ story }) => {
  const getPolicyBadge = (policy, price) => {
    switch (policy) {
      case 'free':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-md">
            Miễn phí
          </span>
        );
      case 'paid':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> VIP {price > 0 ? `• ${Number(price).toLocaleString()}đ` : ''}
          </span>
        );
      case 'mixed':
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-md">
            Có đọc thử
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ongoing':
        return (
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md">
            Đang ra
          </span>
        );
      case 'completed':
        return (
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Trọn bộ
          </span>
        );
      case 'dropped':
        return (
          <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md">
            Tạm ngưng
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Link
      to={`/stories/${story.id}`}
      className="group relative flex flex-col bg-[#1A1A22] rounded-2xl overflow-hidden border border-[#2A2A38] marvel-card-glow hover:border-[#ED1D24] transition-all duration-300"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0A0A0E]">
        <ProxiedImage
          src={story.cover_image}
          alt={story.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackSrc="https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A22] via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />

        {/* Status Badge (Top-Left) */}
        <div className="absolute top-2.5 left-2.5">
          {getStatusBadge(story.status)}
        </div>

        {/* Policy Badge (Top-Right) */}
        <div className="absolute top-2.5 right-2.5">
          {getPolicyBadge(story.access_policy, story.price)}
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-amber-400 font-semibold border border-white/10">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{Number(story.rating || 5.0).toFixed(1)}</span>
        </div>

        {/* View Count */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-gray-300 border border-white/10" title={`${(story.view_count || 0).toLocaleString()} lượt đọc`}>
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono">{formatNumber(story.view_count || 0)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Year & Publisher */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-[#ED1D24]" />
              {story.release_year || 'Marvel'}
            </span>
            <span className="text-[11px] text-gray-500 truncate max-w-[120px]">
              {story.publisher || 'Marvel Comics'}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-white group-hover:text-[#ED1D24] transition-colors line-clamp-1">
            {story.title}
          </h3>

          {/* Original Title / Deck */}
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {story.description || story.original_title || 'Ấn phẩm truyện tranh đặc sắc từ vũ trụ Marvel Comics.'}
          </p>
        </div>

        {/* Genres tag pill list */}
        {story.genres && story.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#2A2A38]/50">
            {story.genres.slice(0, 2).map((g) => (
              <span
                key={g.id || g.name}
                className="text-[10px] bg-[#23232E] text-gray-300 px-2 py-0.5 rounded-full font-medium"
              >
                {g.name}
              </span>
            ))}
            {story.chapters && story.chapters.length > 0 && (
              <span className="text-[10px] bg-[#0F0F14] text-gray-400 px-2 py-0.5 rounded-full font-mono ml-auto">
                {story.chapters.length} chap
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ComicCard;
