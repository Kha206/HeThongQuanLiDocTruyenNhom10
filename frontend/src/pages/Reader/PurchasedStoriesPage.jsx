import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Calendar, Clock, DollarSign,
  ChevronLeft, Sparkles, AlertCircle, RefreshCw, ShoppingBag, ArrowRight
} from 'lucide-react';
import ProxiedImage from '../../components/ProxiedImage';
import Avatar from '../../components/Avatar';

const PurchasedStoriesPage = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchasedStories = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/payments/purchased-stories');
        if (res.success && res.purchases) {
          setPurchases(res.purchases);
        } else {
          setPurchases([]);
        }
      } catch (err) {
        console.error('Error fetching purchased stories:', err);
        setError(err.message || 'Không thể tải danh sách truyện đã mua.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedStories();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg text-white pb-24">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/stories"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-[#1A1A22] px-3.5 py-1.5 rounded-lg border border-[#2A2A38]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại kho truyện</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Avatar user={user} size="xs" />
            <span className="text-xs text-gray-400">
              Tài khoản: <strong className="text-white">{user?.full_name || user?.username}</strong>
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ED1D24]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ED1D24]/10 border border-[#ED1D24]/30 text-[#ED1D24] text-xs font-bold uppercase tracking-wider mb-4">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bộ Sưu Tập Cá Nhân</span>
            </div>

            <h1 className="font-italiana text-4xl sm:text-5xl font-normal text-white tracking-wide leading-tight">
              Tủ Sách Truyện Đã Mua
            </h1>

            <p className="text-sm text-gray-400 mt-3 font-light leading-relaxed">
              Toàn bộ các tác phẩm Marvel bạn đã mua bản quyền riêng lẻ vĩnh viễn. Mở khóa toàn bộ chương truyện không giới hạn thời gian.
            </p>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin text-[#ED1D24] mb-3" />
            <p className="text-sm">Đang tải tủ sách của bạn...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-4 bg-red-950/30 border border-red-800/40 rounded-2xl text-center text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 mx-auto mb-2 text-red-400" />
            <p>{error}</p>
          </div>
        ) : purchases.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto text-center py-16 px-4 bg-[#1A1A22] border border-[#2A2A38] rounded-3xl shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chưa Có Truyện Nào Được Mua</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Bạn chưa mua bản quyền riêng lẻ tác phẩm nào. Bạn có thể đăng ký Gói Hội Viên để đọc không giới hạn hoặc mua lẻ từng bộ truyện yêu thích.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/stories"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ED1D24] hover:bg-[#ff3333] text-white text-xs font-bold transition-all shadow-lg shadow-[#ED1D24]/20"
              >
                Khám Phá Kho Truyện
              </Link>
              <Link
                to="/subscriptions"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#23232E] hover:bg-[#2A2A38] text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
              >
                Xem Gói Hội Viên VIP
              </Link>
            </div>
          </div>
        ) : (
          /* Grid of Purchased Stories */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchases.map((item) => {
              const story = item.story;
              if (!story) return null;

              return (
                <div
                  key={item.purchase_id}
                  className="bg-[#1A1A22] border border-[#2A2A38] hover:border-[#ED1D24]/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
                >
                  {/* Cover */}
                  <div className="aspect-[2/3] w-full relative overflow-hidden bg-[#0F0F14]">
                    <ProxiedImage
                      src={story.cover_image}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      fallbackSrc="https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg"
                    />

                    <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm">
                      Đã Sở Hữu
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A22] via-transparent to-transparent opacity-80" />
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                        {story.publisher || 'Marvel Comics'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1 group-hover:text-[#ED1D24] transition-colors line-clamp-1">
                        {story.title}
                      </h3>
                      {story.original_title && (
                        <p className="text-xs text-gray-400 italic line-clamp-1">
                          {story.original_title}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{new Date(item.purchased_at).toLocaleDateString('vi-VN')}</span>
                        </span>
                        <span className="font-bold text-white font-mono">
                          {Number(item.price_paid).toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <Link
                        to={`/stories/${story.id}`}
                        className="w-full py-2.5 px-4 bg-[#ED1D24] hover:bg-[#ff3333] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#ED1D24]/10"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Đọc Truyện Ngay</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default PurchasedStoriesPage;
