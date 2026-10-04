import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Plus, Edit, Trash2, ShieldAlert,
  CheckCircle, RefreshCw, X, Layers,
  BookOpen, Eye, Check, CreditCard, Sparkles, Filter
} from 'lucide-react';
import ProxiedImage from '../../components/ProxiedImage';

const AdminStoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Table Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [policyFilter, setPolicyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Story Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    original_title: '',
    description: '',
    cover_image: '',
    publisher: 'Marvel Comics',
    release_year: 2024,
    status: 'ongoing',
    access_policy: 'free',
    price: 0,
    genre_ids: []
  });

  // Chapter Modal State (Add Single Chapter)
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [selectedStoryForChapter, setSelectedStoryForChapter] = useState(null);
  const [chapterFormData, setChapterFormData] = useState({
    chapter_number: 1,
    title: '',
    release_date: new Date().toISOString().split('T')[0],
    is_preview: false
  });

  // Chapter Management Modal: List & Toggle is_preview
  const [isManageChaptersModalOpen, setIsManageChaptersModalOpen] = useState(false);
  const [selectedStoryForManage, setSelectedStoryForManage] = useState(null);
  const [managedChapters, setManagedChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storyRes, genreRes] = await Promise.all([
        api.get('/stories?limit=100'),
        api.get('/genres')
      ]);
      if (storyRes.success) setStories(storyRes.stories || []);
      if (genreRes.success) setGenres(genreRes.genres || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setErrorMessage('Lỗi tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  // Quick Status Update
  const handleQuickStatusChange = async (storyId, newStatus) => {
    try {
      const res = await api.patch(`/admin/stories/${storyId}/status`, { status: newStatus });
      if (res.success) {
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, status: newStatus } : s));
        showSuccess('Đã cập nhật trạng thái truyện thành công!');
      }
    } catch (err) {
      showError(err.message || 'Lỗi cập nhật trạng thái.');
    }
  };

  // Quick Access Policy Update
  const handleQuickPolicyChange = async (storyId, newPolicy, currentPrice) => {
    try {
      const res = await api.patch(`/admin/stories/${storyId}/policy`, {
        access_policy: newPolicy,
        price: currentPrice
      });
      if (res.success) {
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, access_policy: newPolicy } : s));
        showSuccess('Đã cập nhật chính sách truy cập!');
      }
    } catch (err) {
      showError(err.message || 'Lỗi cập nhật chính sách.');
    }
  };

  // Open Chapter Management Modal
  const openManageChaptersModal = async (story) => {
    setSelectedStoryForManage(story);
    setIsManageChaptersModalOpen(true);
    setLoadingChapters(true);
    try {
      const res = await api.get(`/stories/${story.id}`);
      if (res.success && res.story) {
        setManagedChapters(res.story.chapters || []);
      }
    } catch (err) {
      showError('Không thể tải danh sách chương.');
    } finally {
      setLoadingChapters(false);
    }
  };

  // Toggle Chapter Preview
  const handleTogglePreview = async (chapterId, currentState) => {
    try {
      const res = await api.patch(`/admin/chapters/${chapterId}/preview`, {
        is_preview: !currentState
      });
      if (res.success) {
        setManagedChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, is_preview: !currentState } : ch));
        showSuccess('Đã cập nhật quyền đọc thử chương!');
        fetchData();
      }
    } catch (err) {
      showError(err.message || 'Lỗi cập nhật quyền đọc thử.');
    }
  };

  // Set 3 Chapters Quick Preview
  const handleQuickPreviewBatch = async (storyId, count = 3) => {
    try {
      const res = await api.post(`/admin/stories/${storyId}/quick-preview`, { preview_count: count });
      if (res.success) {
        setManagedChapters(res.chapters || []);
        showSuccess(`Đã đặt ${count} chương đầu là đọc thử miễn phí!`);
        fetchData();
      }
    } catch (err) {
      showError(err.message || 'Lỗi cấu hình đọc thử nhanh.');
    }
  };

  const openCreateModal = () => {
    setEditingStory(null);
    setFormData({
      title: '',
      original_title: '',
      description: '',
      cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_large/6/67663/3052825-442.jpg',
      publisher: 'Marvel Comics',
      release_year: new Date().getFullYear(),
      status: 'ongoing',
      access_policy: 'free',
      price: 0,
      genre_ids: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (story) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      original_title: story.original_title || '',
      description: story.description || '',
      cover_image: story.cover_image || '',
      publisher: story.publisher || 'Marvel Comics',
      release_year: story.release_year || new Date().getFullYear(),
      status: story.status || 'ongoing',
      access_policy: story.access_policy || 'free',
      price: story.price || 0,
      genre_ids: story.genres ? story.genres.map(g => g.id) : []
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStory) {
        await api.put(`/admin/stories/${editingStory.id}`, formData);
        showSuccess('Cập nhật truyện thành công!');
      } else {
        await api.post('/admin/stories', formData);
        showSuccess('Tạo truyện mới thành công!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.message || 'Lỗi thao tác truyện.');
    }
  };

  const handleDeleteStory = async (id, title) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ truyện "${title}" không?`)) {
      try {
        await api.delete(`/admin/stories/${id}`);
        showSuccess(`Đã xóa truyện "${title}" thành công.`);
        fetchData();
      } catch (err) {
        showError(err.message || 'Lỗi khi xóa truyện.');
      }
    }
  };

  const openAddChapterModal = (story) => {
    setSelectedStoryForChapter(story);
    const existingCount = story.chapters?.length || 0;
    setChapterFormData({
      chapter_number: existingCount + 1,
      title: `Issue #${existingCount + 1}`,
      release_date: new Date().toISOString().split('T')[0],
      is_preview: false
    });
    setIsChapterModalOpen(true);
  };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/chapters', {
        ...chapterFormData,
        story_id: selectedStoryForChapter.id
      });
      showSuccess('Thêm chương mới thành công!');
      setIsChapterModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.message || 'Lỗi thêm chương.');
    }
  };

  const toggleGenre = (genreId) => {
    setFormData(prev => {
      const exists = prev.genre_ids.includes(genreId);
      return {
        ...prev,
        genre_ids: exists
          ? prev.genre_ids.filter(id => id !== genreId)
          : [...prev.genre_ids, genreId]
      };
    });
  };

  // Filtered stories for admin view
  const filteredStories = stories.filter(story => {
    const matchSearch = searchTerm === '' ||
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.original_title && story.original_title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'all' || story.status === statusFilter;
    const matchPolicy = policyFilter === 'all' || story.access_policy === policyFilter;
    return matchSearch && matchStatus && matchPolicy;
  });

  return (
    <div className="min-h-screen bg-[#0F0F14] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#2A2A38] gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[#ED1D24] text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              Bảng Điều Khiển Quản Trị Hệ Thống
            </div>
            <h1 className="text-3xl font-extrabold text-white">Quản Lý Danh Mục & Chính Sách Truyện</h1>
            <p className="text-xs text-gray-400 mt-1">
              Quản lý trạng thái phát hành, cấu hình chương đọc thử và định giá bán lẻ trọn bộ truyện.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/plans"
              className="px-4 py-2.5 bg-[#23232E] hover:bg-[#2A2A38] text-amber-400 border border-amber-500/30 text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <CreditCard className="w-4 h-4" />
              <span>Quản Lý Gói Đọc VIP</span>
            </Link>

            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-[#ED1D24] hover:bg-[#ff3333] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#ED1D24]/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Truyện Mới</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-center gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="bg-[#1A1A22] p-4 rounded-2xl border border-[#2A2A38] mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Tìm kiếm tác phẩm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F0F14] text-xs text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Filter className="w-3.5 h-3.5 text-[#ED1D24]" />
              <span>Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0F0F14] text-xs text-gray-200 border border-[#2A2A38] rounded-lg px-2.5 py-1.5"
              >
                <option value="all">Tất cả ({stories.length})</option>
                <option value="ongoing">Đang ra</option>
                <option value="completed">Trọn bộ</option>
                <option value="dropped">Tạm ngưng</option>
              </select>
            </div>

            {/* Policy Filter */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>Chính sách:</span>
              <select
                value={policyFilter}
                onChange={(e) => setPolicyFilter(e.target.value)}
                className="bg-[#0F0F14] text-xs text-gray-200 border border-[#2A2A38] rounded-lg px-2.5 py-1.5"
              >
                <option value="all">Tất cả</option>
                <option value="free">Miễn phí (Free)</option>
                <option value="mixed">Có đọc thử (Mixed)</option>
                <option value="paid">Trả phí (Paid)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stories Table */}
        <div className="bg-[#1A1A22] rounded-2xl border border-[#2A2A38] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0F0F14] text-xs uppercase text-gray-400 border-b border-[#2A2A38]">
                <tr>
                  <th className="py-4 px-6">Truyện Marvel</th>
                  <th className="py-4 px-4">Thể Loại</th>
                  <th className="py-4 px-4">Trạng Thái</th>
                  <th className="py-4 px-4">Chính Sách & Giá</th>
                  <th className="py-4 px-4">Chương</th>
                  <th className="py-4 px-4">Lượt Xem</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A38]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#ED1D24]" />
                      <span className="text-xs text-gray-400 mt-2 block">Đang nạp dữ liệu...</span>
                    </td>
                  </tr>
                ) : filteredStories.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      Không tìm thấy bộ truyện nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStories.map((story) => (
                    <tr key={story.id} className="hover:bg-[#23232E]/60 transition-colors">
                      {/* Story Info */}
                      <td className="py-4 px-6 flex items-center gap-3">
                        <ProxiedImage
                          src={story.cover_image}
                          alt={story.title}
                          className="w-10 h-14 object-cover rounded-md border border-[#2A2A38] flex-shrink-0"
                          fallbackSrc="https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg"
                        />
                        <div>
                          <p className="font-bold text-white hover:text-[#ED1D24] transition-colors line-clamp-1">
                            {story.title}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono">CV-ID: {story.comicvine_id || 'N/A'}</p>
                        </div>
                      </td>

                      {/* Genres */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {story.genres && story.genres.map(g => (
                            <span key={g.id || g.name} className="text-[10px] bg-[#2A2A38] px-2 py-0.5 rounded text-gray-300">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4">
                        <select
                          value={story.status || 'ongoing'}
                          onChange={(e) => handleQuickStatusChange(story.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded border transition-colors ${
                            story.status === 'ongoing' ? 'bg-cyan-950/60 border-cyan-800 text-cyan-400' :
                            story.status === 'completed' ? 'bg-purple-950/60 border-purple-800 text-purple-400' :
                            'bg-gray-800/80 border-gray-700 text-gray-400'
                          }`}
                        >
                          <option value="ongoing" className="bg-[#1A1A22] text-cyan-400">Đang ra</option>
                          <option value="completed" className="bg-[#1A1A22] text-purple-400">Trọn bộ</option>
                          <option value="dropped" className="bg-[#1A1A22] text-gray-400">Tạm ngưng</option>
                        </select>
                      </td>

                      {/* Access Policy & Price */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <select
                            value={story.access_policy || 'free'}
                            onChange={(e) => handleQuickPolicyChange(story.id, e.target.value, story.price)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                              story.access_policy === 'free' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' :
                              story.access_policy === 'paid' ? 'bg-amber-950/60 border-amber-800 text-amber-400' :
                              'bg-blue-950/60 border-blue-800 text-blue-400'
                            }`}
                          >
                            <option value="free" className="bg-[#1A1A22] text-emerald-400">Free</option>
                            <option value="mixed" className="bg-[#1A1A22] text-blue-400">Mixed</option>
                            <option value="paid" className="bg-[#1A1A22] text-amber-400">Paid VIP</option>
                          </select>
                          {story.access_policy !== 'free' && (
                            <p className="text-[11px] font-mono text-gray-400">
                              {Number(story.price || 0).toLocaleString()} VNĐ
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Chapters & Quick Preview Management */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => openManageChaptersModal(story)}
                          className="px-2.5 py-1 bg-[#2A2A38] hover:bg-[#ED1D24] text-xs font-mono text-white rounded-lg flex items-center gap-1.5 transition-colors"
                          title="Xem danh sách chương và cấu hình đọc thử"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{story.chapters?.length || 0} chap</span>
                        </button>
                      </td>

                      {/* Views */}
                      <td className="py-4 px-4 text-xs font-mono text-gray-300">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-gray-500" />
                          {(story.view_count || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openAddChapterModal(story)}
                          className="p-1.5 bg-[#2A2A38] hover:bg-emerald-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                          title="Thêm chương mới"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(story)}
                          className="p-1.5 bg-[#2A2A38] hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                          title="Chỉnh sửa truyện"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStory(story.id, story.title)}
                          className="p-1.5 bg-[#2A2A38] hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                          title="Xóa truyện"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MANAGE CHAPTERS & PREVIEW MODAL */}
      {isManageChaptersModalOpen && selectedStoryForManage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsManageChaptersModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ED1D24] uppercase">
                <BookOpen className="w-4 h-4" />
                Cấu Hình Chương Đọc Thử
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {selectedStoryForManage.title}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Chính sách truyện: <strong className="uppercase text-amber-400">{selectedStoryForManage.access_policy}</strong> • Nhấp vào nút trạng thái đọc thử để bật/tắt quyền đọc miễn phí cho từng chương.
              </p>
            </div>

            {/* Quick Batch Setup */}
            <div className="bg-[#0F0F14] p-3 rounded-xl border border-[#2A2A38] flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-xs text-gray-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Thao tác nhanh cho truyện Mixed:
              </span>
              <button
                type="button"
                onClick={() => handleQuickPreviewBatch(selectedStoryForManage.id, 3)}
                className="px-3 py-1.5 bg-[#ED1D24] hover:bg-[#ff3333] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Đặt 3 chương đầu là đọc thử
              </button>
            </div>

            {/* Chapter List */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-2">
              {loadingChapters ? (
                <div className="text-center py-10 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#ED1D24] mb-2" />
                  Đang tải danh sách chương...
                </div>
              ) : managedChapters.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Chưa có chương nào được thêm cho truyện này.
                </div>
              ) : (
                managedChapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-3 bg-[#0F0F14] rounded-xl border border-[#2A2A38] hover:border-[#3A3A4D] transition-all"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center font-bold text-xs text-[#ED1D24] flex-shrink-0">
                        {ch.chapter_number}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-white truncate">
                          {ch.title || `Issue #${ch.chapter_number}`}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {ch.release_date || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      {/* Toggle Preview Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePreview(ch.id, ch.is_preview)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          ch.is_preview
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                            : 'bg-[#23232E] text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        {ch.is_preview ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đọc thử (Free)</span>
                          </>
                        ) : (
                          <span>Khóa (VIP/Trả phí)</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-[#2A2A38] mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageChaptersModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#2A2A38] text-sm text-gray-300 hover:text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT STORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {editingStory ? 'Chỉnh Sửa Thông Tin Truyện' : 'Thêm Đầu Truyện Marvel Mới'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Tiêu đề truyện *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Tiêu đề gốc</label>
                  <input
                    type="text"
                    value={formData.original_title}
                    onChange={(e) => setFormData({ ...formData, original_title: e.target.value })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mô tả tác phẩm</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Link Ảnh Bìa (Cover Image URL)</label>
                <input
                  type="text"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="https://comicvine.gamespot.com/a/uploads/..."
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Năm phát hành</label>
                  <input
                    type="number"
                    value={formData.release_year}
                    onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) || 2024 })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  >
                    <option value="ongoing">Đang ra (Ongoing)</option>
                    <option value="completed">Trọn bộ (Completed)</option>
                    <option value="dropped">Tạm ngưng (Dropped)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Chính sách</label>
                  <select
                    value={formData.access_policy}
                    onChange={(e) => setFormData({ ...formData, access_policy: e.target.value })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  >
                    <option value="free">Miễn phí (Free)</option>
                    <option value="mixed">Có đọc thử (Mixed)</option>
                    <option value="paid">Trả phí (Paid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Giá bán lẻ (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                  />
                </div>
              </div>

              {/* Genre selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Chọn thể loại</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => {
                    const selected = formData.genre_ids.includes(g.id);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => toggleGenre(g.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          selected
                            ? 'bg-[#ED1D24] text-white border-[#ED1D24] font-bold'
                            : 'bg-[#0F0F14] text-gray-400 border-[#2A2A38] hover:text-white'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#2A2A38] text-sm text-gray-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#ED1D24] hover:bg-[#ff3333] text-sm font-bold text-white shadow-lg shadow-[#ED1D24]/20"
                >
                  {editingStory ? 'Lưu Thay Đổi' : 'Tạo Truyện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SINGLE CHAPTER MODAL */}
      {isChapterModalOpen && selectedStoryForChapter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsChapterModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-2">Thêm Chương Mới</h2>
            <p className="text-xs text-gray-400 mb-6 truncate">
              Truyện: <span className="text-[#ED1D24] font-semibold">{selectedStoryForChapter.title}</span>
            </p>

            <form onSubmit={handleChapterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Số chương / Issue Number *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={chapterFormData.chapter_number}
                  onChange={(e) => setChapterFormData({ ...chapterFormData, chapter_number: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tiêu đề chương *</label>
                <input
                  type="text"
                  required
                  value={chapterFormData.title}
                  onChange={(e) => setChapterFormData({ ...chapterFormData, title: e.target.value })}
                  placeholder="Ví dụ: Whose Side Are You On?"
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Ngày phát hành</label>
                <input
                  type="date"
                  value={chapterFormData.release_date}
                  onChange={(e) => setChapterFormData({ ...chapterFormData, release_date: e.target.value })}
                  className="w-full bg-[#0F0F14] text-sm text-gray-200 px-3.5 py-2 rounded-xl border border-[#2A2A38] focus:border-[#ED1D24]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_preview_check"
                  checked={chapterFormData.is_preview}
                  onChange={(e) => setChapterFormData({ ...chapterFormData, is_preview: e.target.checked })}
                  className="w-4 h-4 rounded text-[#ED1D24] focus:ring-[#ED1D24] bg-[#0F0F14] border-[#2A2A38]"
                />
                <label htmlFor="is_preview_check" className="text-xs text-gray-300 font-medium">
                  Đặt làm chương đọc thử miễn phí (Preview)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#2A2A38] text-sm text-gray-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#ED1D24] hover:bg-[#ff3333] text-sm font-bold text-white shadow-lg shadow-[#ED1D24]/20"
                >
                  Thêm Chương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStoriesPage;
