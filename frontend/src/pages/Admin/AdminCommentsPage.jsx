import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  MessageSquare, AlertTriangle, ShieldCheck, Trash2,
  Eye, EyeOff, CheckCircle2, Filter, RefreshCw,
  Clock, BookOpen, AlertCircle
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import ProxiedImage from '../../components/ProxiedImage';

const AdminCommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('reported'); // reported | all | hidden
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/comments?filter=${filter}`);
      if (res.success && res.comments) {
        setComments(res.comments);
      }
    } catch (err) {
      console.error('Error fetching admin comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const handleUpdateStatus = async (commentId, newStatus) => {
    setActionLoadingId(commentId);
    try {
      const endpoint = newStatus === 'hidden'
        ? `/admin/comments/${commentId}/hide`
        : `/admin/comments/${commentId}/status`;
      const payload = newStatus === 'hidden' ? {} : { status: newStatus };
      const res = await api.patch(endpoint, payload);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setComments(prev => prev.map(c => c.id === commentId ? {
          ...c,
          status: newStatus,
          is_reported: newStatus === 'approved' ? false : c.is_reported
        } : c));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật trạng thái.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này?')) {
      return;
    }

    setActionLoadingId(commentId);
    try {
      const res = await api.delete(`/admin/comments/${commentId}`);
      if (res.success) {
        setMessage({ type: 'success', text: 'Đã xóa bình luận thành công.' });
        setComments(prev => prev.filter(c => c.id !== commentId));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi xóa bình luận.' });
    } finally {
      setActionLoadingId(null);
    }
  };


  const reportedCount = comments.filter(c => c.is_reported).length;

  return (
    <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg text-white pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#2A2A38] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link to="/" className="hover:text-white transition-colors">Trang Chủ</Link>
              <span>/</span>
              <span className="text-[#ED1D24]">Quản Trị</span>
              <span>/</span>
              <span className="text-gray-200">Kiểm Duyệt Bình Luận</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#ED1D24]" />
              <span>Kiểm Duyệt Bình Luận & Báo Cáo Vi Phạm</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Xem xét các nội dung bị báo cáo spam, xúc phạm hoặc spoiler và ẩn/xóa khỏi chương truyện.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchComments}
              className="p-2.5 rounded-xl bg-[#1A1A22] border border-[#2A2A38] hover:border-gray-500 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-2"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <Link
              to="/admin/stories"
              className="px-4 py-2.5 rounded-xl bg-[#23232E] hover:bg-[#2A2A38] text-white font-bold text-xs border border-[#2A2A38] transition-all"
            >
              Quản Trị Truyện
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div className={`my-6 p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 my-6">
          <span className="text-xs font-semibold text-gray-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#ED1D24]" /> Bộ lọc:
          </span>
          <button
            onClick={() => setFilter('reported')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'reported'
                ? 'bg-[#ED1D24] text-white shadow-md shadow-[#ED1D24]/20'
                : 'bg-[#1A1A22] text-gray-400 hover:text-white border border-[#2A2A38]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Bị Báo Cáo Vi Phạm</span>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#1A1A22] text-gray-400 hover:text-white border border-[#2A2A38]'
            }`}
          >
            Tất Cả Bình Luận
          </button>
          <button
            onClick={() => setFilter('hidden')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'hidden'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-[#1A1A22] text-gray-400 hover:text-white border border-[#2A2A38]'
            }`}
          >
            Đã Bị Ẩn
          </button>
        </div>

        {/* Content Table / List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ED1D24]"></div>
            <p className="text-xs text-gray-400 mt-4">Đang tải danh sách bình luận...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center bg-[#1A1A22] border border-[#2A2A38] rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Không có bình luận nào theo bộ lọc</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Khu vực bình luận thảo luận đang hoạt động trong trạng thái an toàn và lành mạnh!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => {
              const user = c.user || {};
              const story = c.story || {};
              const chapter = c.chapter || {};
              const isReported = c.is_reported;
              const isHidden = c.status === 'hidden';

              return (
                <div
                  key={c.id}
                  className={`p-5 rounded-2xl bg-[#1A1A22] border transition-all ${
                    isReported
                      ? 'border-red-500/50 shadow-lg shadow-red-950/20'
                      : isHidden
                      ? 'border-purple-500/30 opacity-70'
                      : 'border-[#2A2A38]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* User & Story info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar user={user} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {user.full_name || user.username || 'Thành viên'}
                          </span>
                          <span className="text-xs text-gray-500">({user.email || 'N/A'})</span>
                          {user.role === 'admin' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-[#ED1D24]">
                              ADMIN
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              READER
                            </span>
                          )}

                          {/* Status Badge */}
                          {isHidden ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/30">
                              ĐÃ ẨN
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                              HIỂN THỊ
                            </span>
                          )}
                        </div>

                        {/* Story Context */}
                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-2 flex-wrap font-medium">
                          <span className="text-gray-500">Truyện:</span>
                          <Link to={`/stories/${story.id}`} className="text-white hover:text-[#ED1D24] underline">
                            {story.title}
                          </Link>
                          <span>&bull;</span>
                          <span className="text-gray-500">Chương:</span>
                          <Link to={`/stories/${story.id}/chapters/${chapter.id}`} className="text-amber-400 hover:underline">
                            Chương {chapter.chapter_number}: {chapter.title}
                          </Link>
                          <span>&bull;</span>
                          <span className="text-gray-500 font-mono text-[11px]">
                            {new Date(c.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        {/* Reported Reason Banner */}
                        {isReported && (
                          <div className="mt-3 p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span>
                              <strong>Lý do bị báo cáo:</strong> {c.report_reason || 'Vi phạm tiêu chuẩn cộng đồng'}
                            </span>
                          </div>
                        )}

                        {/* Comment Content */}
                        <div className="mt-3 p-3.5 rounded-xl bg-[#0F0F14] border border-[#2A2A38] text-sm text-gray-200 whitespace-pre-line leading-relaxed">
                          {c.content}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col items-center justify-end gap-2 flex-shrink-0 pt-2 md:pt-0">
                      {isHidden ? (
                        <button
                          id={`restore-btn-${c.id}`}
                          data-testid={`restore-comment-${c.id}`}
                          onClick={() => handleUpdateStatus(c.id, 'approved')}
                          disabled={actionLoadingId === c.id}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Duyệt & Hiện Lại</span>
                        </button>
                      ) : (
                        <button
                          id={`hide-btn-${c.id}`}
                          data-testid={`hide-comment-${c.id}`}
                          onClick={() => handleUpdateStatus(c.id, 'hidden')}
                          disabled={actionLoadingId === c.id}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ẩn Bình Luận</span>
                        </button>
                      )}

                      <button
                        id={`delete-btn-${c.id}`}
                        data-testid={`delete-comment-${c.id}`}
                        onClick={() => handleDeleteComment(c.id)}
                        disabled={actionLoadingId === c.id}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Vĩnh Viễn</span>
                      </button>
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

export default AdminCommentsPage;
