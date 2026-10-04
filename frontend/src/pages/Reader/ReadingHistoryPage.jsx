import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Play, Trash2, Clock, Sparkles,
  ChevronRight, ArrowRight, RefreshCw, Star
} from 'lucide-react';
import ProxiedImage from '../../components/ProxiedImage';

const ReadingHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReadingHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reading-progress');
      if (res.success && res.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Error fetching reading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadingHistory();
  }, []);

  const handleDeleteHistory = async (storyId) => {
    if (!window.confirm('Bạn có chắc muốn xóa truyện này khỏi danh sách đang đọc?')) {
      return;
    }
    setDeletingId(storyId);
    try {
      const res = await api.delete(`/reading-progress/${storyId}`);
      if (res.success) {
        setHistory(prev => prev.filter(h => h.story_id !== storyId));
      }
    } catch (err) {
      console.error('Error deleting progress:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const averageProgress = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + Number(h.progress_percent || 0), 0) / history.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg text-white pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#2A2A38] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link to="/" className="hover:text-white transition-colors">Trang Chủ</Link>
              <span>/</span>
              <span className="text-[#ED1D24]">Truyện Đang Đọc</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#ED1D24]" />
              <span>Tiến Độ Đọc Truyện</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Hệ thống tự động ghi nhớ chương và vị trí cuộn trang để bạn tiếp tục đọc bất cứ lúc nào.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReadingHistory}
              className="p-2.5 rounded-xl bg-[#1A1A22] border border-[#2A2A38] hover:border-gray-500 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-2"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <Link
              to="/stories"
              className="px-4 py-2.5 rounded-xl bg-[#23232E] hover:bg-[#2A2A38] text-white font-bold text-xs border border-[#2A2A38] flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Kho Truyện Marvel</span>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38]">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Truyện Đang Đọc Dở</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{history.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">Được lưu trên máy chủ theo tài khoản</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38]">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Tiến Độ Trung Bình</div>
            <div className="text-2xl font-black text-[#ED1D24] mt-1 font-mono">{averageProgress}%</div>
            <div className="text-[11px] text-gray-500 mt-1">Tính theo các chương đang đọc</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38]">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Đọc Gần Nhất</div>
            <div className="text-sm font-bold text-gray-200 mt-2 line-clamp-1">
              {history[0]?.story?.title || 'Chưa có hoạt động'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
              {history[0]?.updated_at ? new Date(history[0].updated_at).toLocaleString('vi-VN') : '—'}
            </div>
          </div>
        </div>

        {/* Reading List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ED1D24]"></div>
            <p className="text-xs text-gray-400 mt-4">Đang tải lịch sử đọc...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center bg-[#1A1A22] border border-[#2A2A38] rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#ED1D24]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Chưa có truyện nào đang đọc dở</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
              Khi bạn mở và đọc bất kỳ chương truyện nào, hệ thống sẽ tự động lưu lại vị trí dừng chân chính xác để bạn tiếp tục đọc bất cứ lúc nào!
            </p>
            <Link
              to="/stories"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ED1D24] hover:bg-[#ff3333] text-white font-bold text-xs shadow-lg shadow-[#ED1D24]/20 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt Đầu Đọc Truyện Ngay</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((item) => {
              const story = item.story || {};
              const chapter = item.chapter || {};
              const percent = Math.min(100, Math.max(0, parseFloat(item.progress_percent || 0)));

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38] hover:border-gray-600 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden"
                >
                  {/* Subtle Accent Glow */}
                  <div
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none"
                    style={{ backgroundColor: chapter.accent_color || '#ED1D24' }}
                  />

                  <div>
                    {/* Top Row: Cover + Info */}
                    <div className="flex items-start gap-4">
                      {/* Cover Thumbnail */}
                      <Link
                        to={`/stories/${story.id}`}
                        className="w-20 h-28 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10 shadow-md relative group/cover block"
                      >
                        <ProxiedImage
                          src={story.cover_image}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-400 font-mono">
                          ★ {Number(story.rating || 5.0).toFixed(1)}
                        </div>
                      </Link>

                      {/* Story & Chapter Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/stories/${story.id}`}
                          className="text-base font-bold text-white hover:text-[#ED1D24] line-clamp-1 transition-colors block"
                        >
                          {story.title}
                        </Link>
                        {story.original_title && (
                          <p className="text-[11px] text-gray-500 italic truncate mt-0.5">
                            {story.original_title}
                          </p>
                        )}

                        <div className="mt-2.5 p-2 rounded-lg bg-[#0F0F14] border border-[#2A2A38]">
                          <div className="text-[11px] text-gray-400">Đang đọc:</div>
                          <div className="text-xs font-bold text-white line-clamp-1">
                            Chương {chapter.chapter_number}: {chapter.title || 'Mới cập nhật'}
                          </div>
                        </div>

                        <div className="text-[10px] text-gray-500 font-mono mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>Lần cuối: {new Date(item.updated_at).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar (Marvel Red Accent Theme) */}
                    <div className="mt-4 pt-4 border-t border-[#2A2A38]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-400 font-medium">Tiến độ hoàn thành:</span>
                        <span className="font-mono font-bold text-[#ED1D24] text-xs">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="w-full h-2.5 bg-[#0F0F14] rounded-full overflow-hidden border border-[#2A2A38]/80 p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#ED1D24] to-[#ff4a4a] transition-all duration-500 shadow-sm shadow-[#ED1D24]/50"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-5 pt-3 border-t border-[#2A2A38] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDeleteHistory(item.story_id)}
                      disabled={deletingId === item.story_id}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg text-xs transition-colors"
                      title="Xóa khỏi danh sách đọc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/stories/${story.id}`}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Chi Tiết
                      </Link>

                      <Link
                        to={`/stories/${story.id}/chapters/${chapter.id}?resume=true`}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#ED1D24] hover:bg-[#ff3333] shadow-md shadow-[#ED1D24]/20 flex items-center gap-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Đọc Tiếp</span>
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

export default ReadingHistoryPage;
