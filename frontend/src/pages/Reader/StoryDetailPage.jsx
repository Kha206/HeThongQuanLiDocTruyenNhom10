import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Star, Eye, Calendar, BookOpen, ShieldCheck,
  ChevronLeft, Play, Lock, ArrowRight, Sparkles,
  CreditCard, CheckCircle2, ShieldAlert, Heart,
  ShoppingBag, Bookmark
} from 'lucide-react';
import ProxiedImage from '../../components/ProxiedImage';
import PaymentModal from '../../components/PaymentModal';

const StoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sprint 4 States: Mua trọn bộ & Theo dõi truyện
  const [isPurchased, setIsPurchased] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchStoryDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stories/${id}`);
        if (res.success && res.story) {
          setStory(res.story);
        } else {
          setError('Không tìm thấy thông tin truyện.');
        }
      } catch (err) {
        console.error('Error fetching story detail:', err);
        setError('Không thể tải chi tiết truyện. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoryDetail();
  }, [id]);

  // Check purchase ownership & follow status
  useEffect(() => {
    if (!id) return;

    // Follow status
    const fetchFollowStatus = async () => {
      try {
        const res = await api.get(`/stories/${id}/follow-status`);
        if (res.success) {
          setIsFollowing(res.is_following);
          setFollowersCount(res.followers_count);
        }
      } catch (err) {
        console.warn('Error fetching follow status:', err);
      }
    };

    // Purchased status
    const fetchPurchasedStatus = async () => {
      if (!user) return;
      try {
        const res = await api.get('/payments/purchased-stories');
        if (res.success && res.purchases) {
          const owned = res.purchases.some(p => Number(p.story_id) === Number(id));
          setIsPurchased(owned);
        }
      } catch (err) {
        console.warn('Error fetching purchase status:', err);
      }
    };

    fetchFollowStatus();
    fetchPurchasedStatus();
  }, [id, user]);

  // Anti-Abuse View Counter: Trigger after 15 seconds of reading
  useEffect(() => {
    if (!id) return;
    const viewTimer = setTimeout(async () => {
      try {
        const res = await api.post(`/stories/${id}/view`, { duration_seconds: 15 });
        if (res.success && res.view_count) {
          setStory(prev => prev ? { ...prev, view_count: res.view_count } : prev);
        }
      } catch (err) {
        // Silently handle if debounced
      }
    }, 15000);

    return () => clearTimeout(viewTimer);
  }, [id]);

  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFollowLoading(true);
    try {
      const res = await api.post(`/stories/${id}/follow`);
      if (res.success) {
        setIsFollowing(res.is_following);
        setFollowersCount(res.followers_count);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ED1D24]"></div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg flex flex-col items-center justify-center px-4">
        <p className="text-red-400 mb-4">{error || 'Truyện không tồn tại.'}</p>
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A22] border border-[#2A2A38] text-white rounded-lg hover:border-[#ED1D24] text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại kho truyện</span>
        </Link>
      </div>
    );
  }

  const firstChapter = story.chapters && story.chapters.length > 0 ? story.chapters[0] : null;

  return (
    <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg text-white pb-20">
      
      {/* Back Button Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
        <Link
          to="/stories"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-[#1A1A22] px-3.5 py-1.5 rounded-lg border border-[#2A2A38]"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại kho truyện
        </Link>

        {story.access_policy !== 'free' && !isPurchased && (
          <Link
            to="/subscriptions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-lg transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Nâng cấp Gói VIP để đọc không giới hạn
          </Link>
        )}
      </div>

      {/* Main Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-[#1A1A22] rounded-3xl border border-[#2A2A38] p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ED1D24]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-8 relative z-10">
            
            {/* Cover Column */}
            <div className="w-full sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0">
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group marvel-card-glow">
                <ProxiedImage
                  src={story.cover_image}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fallbackSrc="https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg"
                />
                
                {/* Status Badge (Top-Left) */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded backdrop-blur-md border ${
                    story.status === 'ongoing' ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' :
                    story.status === 'completed' ? 'bg-purple-950/80 border-purple-500/40 text-purple-300' :
                    'bg-gray-900/80 border-gray-600 text-gray-300'
                  }`}>
                    {story.status === 'ongoing' ? 'Đang ra' : story.status === 'completed' ? 'Trọn bộ' : 'Tạm ngưng'}
                  </span>
                </div>

                {/* Policy Badge (Top-Right) */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded backdrop-blur-md border ${
                    story.access_policy === 'free' ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' :
                    story.access_policy === 'paid' ? 'bg-amber-950/80 border-amber-500/40 text-amber-400' :
                    'bg-blue-950/80 border-blue-500/40 text-blue-400'
                  }`}>
                    {story.access_policy === 'free' ? 'Miễn phí' : story.access_policy === 'paid' ? 'Gói VIP' : 'Có đọc thử'}
                  </span>
                </div>
              </div>

              {/* Retail Price Box / Ownership Badge */}
              {isPurchased ? (
                <div className="mt-4 p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-500/40 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ĐÃ SỞ HỮU BẢN QUYỀN TRỌN BỘ</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Bạn có thể đọc toàn bộ các chương bất cứ lúc nào không cần gói tháng.
                  </p>
                </div>
              ) : story.access_policy !== 'free' && (
                <div className="mt-4 p-3.5 bg-[#0F0F14] rounded-xl border border-[#2A2A38] text-center">
                  <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Định giá mua đứt trọn bộ</p>
                  <p className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
                    {Number(story.price || 0) > 0 ? `${Number(story.price).toLocaleString()} VNĐ` : 'Đi kèm Gói Hội Viên'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Hoặc sở hữu <Link to="/subscriptions" className="text-[#ED1D24] underline hover:text-white">Gói Hội Viên Tháng</Link> để đọc toàn bộ
                  </p>
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="flex flex-col justify-between flex-grow">
              <div>
                {/* Meta badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                  <span className="bg-[#ED1D24]/20 text-[#ED1D24] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                    {story.publisher || 'Marvel Comics'}
                  </span>
                  <span className="flex items-center gap-1 bg-[#23232E] text-gray-300 px-2.5 py-1 rounded font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#ED1D24]" /> {story.release_year || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded font-semibold font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {Number(story.rating || 5.0).toFixed(1)} / 5.0
                  </span>
                  <span className="flex items-center gap-1 bg-[#23232E] text-gray-300 px-2.5 py-1 rounded font-mono">
                    <Eye className="w-3.5 h-3.5 text-[#ED1D24]" /> {(story.view_count || 0).toLocaleString()} lượt đọc
                  </span>
                  {followersCount > 0 && (
                    <span className="flex items-center gap-1 bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded font-semibold font-mono">
                      <Heart className="w-3.5 h-3.5 fill-rose-400" /> {followersCount} người theo dõi
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-italiana text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-wide leading-tight">
                  {story.title}
                </h1>
                {story.original_title && (
                  <p className="text-sm font-medium text-gray-400 mt-1 italic">
                    Tên gốc: {story.original_title}
                  </p>
                )}

                {/* Genre Tags */}
                {story.genres && story.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {story.genres.map(g => (
                      <span key={g.id || g.name} className="text-xs bg-[#2A2A38] text-gray-200 px-3 py-1 rounded-full font-medium">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div className="mt-6 text-sm sm:text-base text-gray-300 leading-relaxed font-light space-y-2">
                  <p>{story.description || 'Chưa có mô tả chi tiết cho ấn phẩm này.'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-[#2A2A38] flex flex-wrap items-center gap-4">
                {firstChapter && (
                  <Link
                    to={`/stories/${story.id}/chapters/${firstChapter.id}`}
                    className="px-8 py-3.5 bg-[#ED1D24] hover:bg-[#ff3333] text-white font-bold rounded-xl shadow-xl shadow-[#ED1D24]/20 flex items-center gap-2 group transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Đọc Ngay Chương 1</span>
                  </Link>
                )}

                {/* Nút Mua Trọn Bộ Riêng Lẻ */}
                {!isPurchased && story.access_policy !== 'free' && Number(story.price || 0) > 0 && (
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate('/login');
                      } else {
                        setIsPurchaseModalOpen(true);
                      }
                    }}
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-600/20 flex items-center gap-2 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Mua Trọn Bộ ({Number(story.price).toLocaleString('vi-VN')} đ)</span>
                  </button>
                )}

                {/* Nút Theo Dõi Truyện */}
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`px-5 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${
                    isFollowing
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-[#23232E] border-[#2A2A38] text-gray-300 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFollowing ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isFollowing ? 'Đang Theo Dõi' : 'Theo Dõi Truyện'}</span>
                  {followersCount > 0 && (
                    <span className="text-xs bg-black/40 px-2 py-0.5 rounded-full font-mono">
                      {followersCount}
                    </span>
                  )}
                </button>

                {story.access_policy !== 'free' && !isPurchased && (
                  <Link
                    to="/subscriptions"
                    className="px-6 py-3.5 bg-[#23232E] hover:bg-[#2A2A38] text-amber-400 font-bold rounded-xl border border-amber-500/30 flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4 fill-amber-400" />
                    <span>Xem Các Gói Hội Viên</span>
                  </Link>
                )}

                <div className="text-xs text-gray-400 flex items-center gap-1.5 ml-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Dữ liệu xác thực từ Comic Vine (ID: {story.comicvine_id})</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#ED1D24]" />
            <h2 className="font-italiana text-3xl sm:text-4xl font-normal text-white tracking-wide">Danh Sách Chương Truyện</h2>
            <span className="text-xs bg-[#23232E] text-gray-400 px-2.5 py-0.5 rounded-full font-mono border border-white/5">
              {story.chapters?.length || 0} chương
            </span>
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Đọc thử miễn phí
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Yêu cầu VIP / Mua lẻ
            </span>
          </div>
        </div>
        <div className="marvel-divider mb-8" />

        {story.chapters && story.chapters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {story.chapters.map((ch) => {
              const chapterAccent = ch.accent_color || '#ED1D24';
              const chapterCover = ch.cover_image || story.cover_image;
              return (
                <Link
                  key={ch.id}
                  to={`/stories/${story.id}/chapters/${ch.id}`}
                  className="cursor-pointer group flex items-center justify-between p-3.5 bg-[#1A1A22] rounded-xl border border-[#2A2A38] hover:border-gray-500 hover:bg-[#23232E] transition-all relative overflow-hidden shadow-sm"
                >
                  {/* Dải màu nhỏ accent_color của chapter làm điểm nhấn viền trái */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2.5"
                    style={{ backgroundColor: chapterAccent }}
                  />

                  <div className="flex items-center space-x-3.5 overflow-hidden pl-2">
                    {/* Thumbnail nhỏ cover_image qua ProxiedImage */}
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#0F0F14] border border-[#2A2A38] flex-shrink-0 relative shadow-sm">
                      <ProxiedImage
                        src={chapterCover}
                        alt={ch.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        fallbackSrc={story.cover_image}
                      />
                      <div className="absolute top-1 left-1 px-1 bg-black/80 rounded text-[9px] font-mono text-white font-bold">
                        #{ch.chapter_number}
                      </div>
                    </div>

                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-white group-hover:text-[#ED1D24] truncate transition-colors">
                        {ch.title || `Chương ${ch.chapter_number}`}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {ch.release_date || 'Phát hành chính thức'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    {ch.is_preview ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                        Đọc thử
                      </span>
                    ) : isPurchased ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã Mua
                      </span>
                    ) : story.access_policy === 'free' ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                        Free
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                        <Lock className="w-3 h-3" /> VIP
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#1A1A22] rounded-xl border border-[#2A2A38] text-gray-400">
            Chưa có chương nào được nạp cho truyện này.
          </div>
        )}
      </div>

      {/* Modal Mua Truyện Lẻ Bản Quyền */}
      {story && (
        <PaymentModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          paymentType="story_purchase"
          itemId={story.id}
          itemTitle={`Trọn Bộ: ${story.title}`}
          price={story.price}
          onSuccess={() => {
            setIsPurchaseModalOpen(false);
            setIsPurchased(true);
          }}
        />
      )}

    </div>
  );
};

export default StoryDetailPage;
