import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen, Plus, Search, Upload, AlertTriangle, CheckCircle2,
  Trash2, Eye, EyeOff, ExternalLink, ShieldCheck, Sparkles,
  RefreshCw, Image as ImageIcon, FileText, Calendar, AlertCircle,
  X, Layers, ChevronRight
} from 'lucide-react';
import ProxiedImage from '../../components/ProxiedImage';


const parseCharacterCredits = (credits) => {
  if (!credits) return [];
  if (Array.isArray(credits)) return credits;
  if (typeof credits === 'string') {
    try {
      const parsed = JSON.parse(credits);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const AdminChaptersPage = () => {

  const [stories, setStories] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState('comicvine'); // 'comicvine' | 'manual'
  const [modalStoryId, setModalStoryId] = useState('');
  
  // ComicVine Search State (Mode A)
  const [cvQuery, setCvQuery] = useState('');
  const [cvSearching, setCvSearching] = useState(false);
  const [cvResults, setCvResults] = useState([]);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [volumeWarning, setVolumeWarning] = useState(null);

  // Manual Upload State (Mode B)
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    chapter_number: '',
    release_date: new Date().toISOString().split('T')[0],
    content: '',
    cover_image: '',
    is_preview: false,
    comicvine_issue_id: null,
    character_credits: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch all stories
  useEffect(() => {
    const fetchStories = async () => {
      setLoadingStories(true);
      try {
        const res = await api.get('/stories?limit=100');
        if (res.success && res.stories) {
          setStories(res.stories);
          if (res.stories.length > 0) {
            setSelectedStoryId(String(res.stories[0].id));
            setModalStoryId(String(res.stories[0].id));
          }
        }
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setLoadingStories(false);
      }
    };
    fetchStories();
  }, []);

  // Fetch chapters when selected story changes
  const fetchChapters = async (storyId) => {
    if (!storyId) return;
    setLoadingChapters(true);
    try {
      const res = await api.get(`/admin/stories/${storyId}/chapters`);
      if (res.success && res.chapters) {
        setChapters(res.chapters);
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
    } finally {
      setLoadingChapters(false);
    }
  };

  useEffect(() => {
    if (selectedStoryId) {
      fetchChapters(selectedStoryId);
    }
  }, [selectedStoryId]);

  // Open modal
  const handleOpenModal = () => {
    setModalStoryId(selectedStoryId || (stories[0] ? String(stories[0].id) : ''));
    setFormError('');
    setCvResults([]);
    setCvQuery('');
    setSelectedIssueId(null);
    setVolumeWarning(null);
    setUploadedImagePreview('');
    
    // Auto suggest next chapter number
    const maxNum = chapters.reduce((max, c) => Math.max(max, c.chapter_number || 0), 0);
    const nextChapterNumber = maxNum > 0 ? (maxNum + 1) : 1;

    setFormData({
      title: '',
      chapter_number: String(nextChapterNumber),
      release_date: new Date().toISOString().split('T')[0],
      content: '',
      cover_image: '',
      is_preview: false,
      comicvine_issue_id: null,
      character_credits: []
    });
    setIsModalOpen(true);
  };

  // ComicVine Link Search (Mode A)
  const handleSearchComicVine = async (e) => {
    if (e) e.preventDefault();
    setFormError('');
    setVolumeWarning(null);

    const queryVal = cvQuery || (typeof document !== 'undefined' ? document.getElementById('input-comicvine-search')?.value : '');
    const trimmed = (queryVal || '').trim();
    if (!trimmed) {
      setFormError('Vui lòng dán link ComicVine của issue.');
      return;
    }
    if (trimmed !== cvQuery) {
      setCvQuery(trimmed);
    }

    // Validate ComicVine issue URL format (must contain comicvine.gamespot.com and 4000-XXXX)
    const isComicVine = trimmed.includes('comicvine.gamespot.com') && /4000-\d+/.test(trimmed);
    if (!isComicVine) {
      setFormError('Link không hợp lệ, vui lòng dán đúng link issue từ comicvine.gamespot.com');
      return;
    }

    setCvSearching(true);
    setSelectedIssueId(null);
    setCvResults([]);
    try {
      const res = await api.get(`/admin/comicvine/issue-by-url?story_id=${modalStoryId}&url=${encodeURIComponent(trimmed)}`);
      console.log('=== [DEBUG COMICVINE FRONTEND] API Search Response ===', res);
      console.log('=== [DEBUG COMICVINE FRONTEND] Full issue object ===', res.issue);
      console.log('=== [DEBUG COMICVINE FRONTEND] "image" field ===', res.issue?.image);
      console.log('=== [DEBUG COMICVINE FRONTEND] "cover_image" field ===', res.issue?.cover_image);

      if (res.success && res.issue) {
        setCvResults([res.issue]);
        if (res.volume_matches === false) {
          setVolumeWarning('Issue này không thuộc bộ truyện đã chọn, bạn có chắc muốn tiếp tục?');
        }
      } else {
        setFormError('Không tìm thấy issue này trên ComicVine');
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('404') || errMsg.includes('Không tìm thấy')) {
        setFormError('Không tìm thấy issue này trên ComicVine');
      } else if (errMsg.includes('Link không hợp lệ')) {
        setFormError('Link không hợp lệ, vui lòng dán đúng link issue từ comicvine.gamespot.com');
      } else {
        setFormError(errMsg || 'Lỗi khi gọi API tìm kiếm ComicVine.');
      }
    } finally {
      setCvSearching(false);
    }
  };

  // Select Issue from ComicVine Search Results
  const handleSelectIssue = (issue) => {
    // 1. Log entire issue object to console with focus on id/issue_id and image sub-URLs
    console.log('=== [DEBUG COMICVINE SELECTION] Full issue object ===', issue);
    console.log('=== [DEBUG COMICVINE SELECTION] ID & Issue ID ===', {
      id: issue.id,
      comicvine_issue_id: issue.comicvine_issue_id,
      issue_number: issue.issue_number
    });
    console.log('=== [DEBUG COMICVINE SELECTION] Image sub-URLs ===', {
      raw_image_field: issue.image,
      icon_url: issue.image?.icon_url || null,
      medium_url: issue.image?.medium_url || (typeof issue.image === 'string' ? issue.image : null),
      original_url: issue.image?.original_url || (typeof issue.image === 'string' ? issue.image : null),
      cover_image: issue.cover_image || null
    });

    // 2. Resolve cover image from all possible field names with exact priority
    let resolvedCover = '';
    if (typeof issue.cover_image === 'string' && issue.cover_image.trim()) {
      resolvedCover = issue.cover_image.trim();
    } else if (issue.image && typeof issue.image === 'object') {
      resolvedCover = issue.image.medium_url ||
                     issue.image.original_url ||
                     issue.image.super_url ||
                     issue.image.screen_url ||
                     issue.image.icon_url ||
                     '';
    } else if (typeof issue.image === 'string' && issue.image.trim()) {
      resolvedCover = issue.image.trim();
    } else if (typeof issue.cover_url === 'string' && issue.cover_url.trim()) {
      resolvedCover = issue.cover_url.trim();
    } else if (typeof issue.image_url === 'string' && issue.image_url.trim()) {
      resolvedCover = issue.image_url.trim();
    }

    // 3. Resolve content / description from all possible field names
    let resolvedContent = '';
    const rawContent = issue.content || issue.description || issue.deck || issue.summary || '';
    if (typeof rawContent === 'string' && rawContent.trim()) {
      resolvedContent = rawContent.replace(/<[^>]*>?/gm, '').trim();
    }

    console.log('[AdminChapters] Autofilling form fields with selected issue:', {
      cover_image: resolvedCover,
      content: resolvedContent,
      issue_number: issue.issue_number,
      title: issue.title || issue.name
    });

    // Overwrite selection state cleanly to prevent any cache contamination
    setSelectedIssueId(issue.id || issue.comicvine_issue_id);
    setUploadedImagePreview(resolvedCover);

    setFormData(prev => ({
      ...prev,
      title: issue.title || issue.name || (issue.issue_number ? `Issue #${issue.issue_number}` : prev.title),
      chapter_number: (issue.issue_number !== undefined && issue.issue_number !== null) ? String(issue.issue_number) : prev.chapter_number,
      release_date: issue.release_date || issue.cover_date || prev.release_date,
      cover_image: resolvedCover,
      content: resolvedContent,
      comicvine_issue_id: issue.id || issue.comicvine_issue_id || null,
      character_credits: issue.character_credits || []
    }));
  };

  // Upload Cover Image (Mode B)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('File ảnh vượt quá giới hạn 5MB.');
      return;
    }

    setUploadingImage(true);
    setFormError('');
    const uploadFormData = new FormData();
    uploadFormData.append('cover', file);

    try {
      const res = await api.post('/admin/upload-cover', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success && res.url) {
        setFormData(prev => ({ ...prev, cover_image: res.url }));
        setUploadedImagePreview(res.url);
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi tải ảnh lên máy chủ.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Chapter Form
  const handleSubmitChapter = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tên chương truyện.');
      return;
    }
    if (formData.chapter_number === '' || isNaN(parseFloat(formData.chapter_number))) {
      setFormError('Vui lòng nhập số chương hợp lệ.');
      return;
    }

    const num = parseFloat(formData.chapter_number);
    // Validate duplicate chapter number against existing chapters of selected story
    const isDuplicate = chapters.some(c => parseFloat(c.chapter_number) === num);
    if (isDuplicate) {
      setFormError(`Số chương #${num} đã tồn tại trong bộ truyện này. Vui lòng chọn số chương khác.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        story_id: parseInt(modalStoryId, 10),
        chapter_number: num,
        title: formData.title.trim(),
        release_date: formData.release_date,
        is_preview: Boolean(formData.is_preview),
        cover_image: formData.cover_image || null,
        content: formData.content ? formData.content.trim() : '',
        character_credits: formData.character_credits,
        comicvine_issue_id: formData.comicvine_issue_id
      };

      const res = await api.post('/admin/chapters', payload);
      if (res.success) {
        setMessage({ type: 'success', text: `Đã thêm thành công Chương #${num}: ${formData.title}!` });
        setIsModalOpen(false);
        fetchChapters(modalStoryId);
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi khi tạo chương mới.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Preview
  const handleTogglePreview = async (chapterId, currentState) => {
    try {
      const res = await api.patch(`/admin/chapters/${chapterId}/preview`, { is_preview: !currentState });
      if (res.success) {
        setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, is_preview: !currentState } : c));
        setMessage({ type: 'success', text: 'Đã cập nhật trạng thái đọc thử.' });
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi cập nhật đọc thử.' });
    }
  };

  // Delete Chapter
  const handleDeleteChapter = async (chapterId, chapterNum) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Chương #${chapterNum}? Hành động này sẽ xóa dữ liệu bình luận và tiến độ đọc liên quan!`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/chapters/${chapterId}`);
      if (res.success) {
        setMessage({ type: 'success', text: `Đã xóa Chương #${chapterNum} thành công.` });
        setChapters(prev => prev.filter(c => c.id !== chapterId));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xóa chương.' });
    }
  };

  const selectedStory = stories.find(s => String(s.id) === String(selectedStoryId));

  return (
    <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg text-white pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#2A2A38] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link to="/" className="hover:text-white transition-colors">Trang Chủ</Link>
              <span>/</span>
              <span className="text-[#ED1D24]">Quản Trị</span>
              <span>/</span>
              <span className="text-gray-200">Quản Lý Chương Truyện</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#ED1D24]" />
              <span>Quản Lý Chương Truyện</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Hệ thống CMS tạo và quản lý các chương truyện theo liên kết ComicVine hoặc tải lên bản quyền.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="btn-open-add-chapter"
              onClick={handleOpenModal}
              className="px-4 py-2.5 rounded-xl bg-[#ED1D24] hover:bg-[#C4151B] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#ED1D24]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chương Mới</span>
            </button>
            <Link
              to="/admin/stories"
              className="px-4 py-2.5 rounded-xl bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] text-gray-300 hover:text-white font-bold text-xs transition-all"
            >
              Quản Trị Truyện
            </Link>
            <Link
              to="/admin/comments"
              className="px-4 py-2.5 rounded-xl bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] text-gray-300 hover:text-white font-bold text-xs transition-all"
            >
              Kiểm Duyệt Bình Luận
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

        {/* Story Selector Bar */}
        <div className="my-6 p-5 rounded-2xl bg-[#1A1A22] border border-[#2A2A38] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs font-bold text-gray-400 flex-shrink-0 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#ED1D24]" /> Chọn Bộ Truyện:
            </span>
            <select
              id="select-story-filter"
              value={selectedStoryId}
              onChange={(e) => setSelectedStoryId(e.target.value)}
              className="bg-[#0F0F14] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none max-w-md w-full"
            >
              {stories.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.access_policy === 'free' ? 'Miễn phí' : s.access_policy === 'paid' ? 'Trả phí' : 'Hỗn hợp'})
                </option>
              ))}
            </select>
          </div>

          {selectedStory && (
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0 font-medium">
              <span>Tổng số: <strong className="text-white font-mono">{chapters.length}</strong> chương</span>
              <span>&bull;</span>
              <span>Chính sách: <strong className="text-amber-400 uppercase">{selectedStory.access_policy}</strong></span>
              <span>&bull;</span>
              <Link to={`/stories/${selectedStory.id}`} className="text-white hover:text-[#ED1D24] flex items-center gap-1">
                <span>Xem trang độc giả</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Chapters Table */}
        {loadingChapters ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ED1D24]"></div>
            <p className="text-xs text-gray-400 mt-4">Đang tải danh sách chương...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="p-12 text-center bg-[#1A1A22] border border-[#2A2A38] rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#ED1D24]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Chưa có chương nào trong bộ truyện này</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-5">
              Hãy bấm "Thêm Chương Mới" để liên kết issue từ ComicVine hoặc nhập thủ công kèm ảnh bìa bản quyền.
            </p>
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 rounded-xl bg-[#ED1D24] text-white text-xs font-bold hover:bg-[#C4151B] transition-all"
            >
              Thêm Chương Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#15151C] text-gray-400 uppercase tracking-wider font-semibold border-b border-[#2A2A38]">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-20">Chương</th>
                    <th className="py-3.5 px-4 w-20">Bìa</th>
                    <th className="py-3.5 px-4">Tên Chương & Nội Dung</th>
                    <th className="py-3.5 px-4">Ngày Phát Hành</th>
                    <th className="py-3.5 px-4 text-center">Nguồn</th>
                    <th className="py-3.5 px-4 text-center">Quyền Đọc</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A38]/60 text-gray-300">
                  {chapters.map((c) => {
                    const isCv = Boolean(c.comicvine_issue_id);
                    const cover = c.cover_image || selectedStory?.cover_image;

                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 text-center font-bold font-mono text-white">
                          #{c.chapter_number}
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/40 border border-[#2A2A38] flex-shrink-0">
                            {cover ? (
                              <ProxiedImage src={cover} alt={c.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm hover:text-[#ED1D24] transition-colors">
                            <Link to={`/stories/${selectedStoryId}/chapters/${c.id}`}>
                              {c.title}
                            </Link>
                          </div>
                          {c.content && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-1 max-w-lg">
                              {c.content}
                            </p>
                          )}
                          {(() => {
                            const charCredits = parseCharacterCredits(c.character_credits);
                            if (charCredits.length === 0) return null;
                            return (
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-gray-500">Nhân vật:</span>
                                {charCredits.slice(0, 3).map((ch, idx) => (
                                  <span key={idx} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-300">
                                    {typeof ch === 'object' && ch !== null ? (ch.name || 'Nhân vật') : String(ch)}
                                  </span>
                                ))}
                                {charCredits.length > 3 && (
                                  <span className="text-[10px] text-gray-500">+{charCredits.length - 3}</span>
                                )}
                              </div>
                            );
                          })()}

                        </td>
                        <td className="py-4 px-4 text-gray-400 font-mono text-[11px]">
                          {c.release_date || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isCv ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30">
                              ComicVine #{c.comicvine_issue_id}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                              Thủ Công / Upload
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleTogglePreview(c.id, c.is_preview)}
                            title="Bấm để đổi quyền đọc thử"
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              c.is_preview
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900'
                                : 'bg-amber-950/80 text-amber-400 border-amber-500/40 hover:bg-amber-900'
                            }`}
                          >
                            {c.is_preview ? 'ĐỌC THỬ (FREE)' : 'VIP (KHÓA)'}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/stories/${selectedStoryId}/chapters/${c.id}`}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                              title="Xem trang đọc"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              id={`delete-chapter-btn-${c.id}`}
                              onClick={() => handleDeleteChapter(c.id, c.chapter_number)}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 transition-all cursor-pointer"
                              title="Xóa chương"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Thêm Chương Mới */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
              
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#ED1D24]/10 border border-[#ED1D24]/30 flex items-center justify-center text-[#ED1D24]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Thêm Chương Mới Vào Hệ Thống</h2>
                  <p className="text-xs text-gray-400">Chọn liên kết từ ComicVine hoặc tải lên ảnh bìa bản quyền thủ công.</p>
                </div>
              </div>

              {/* Story Target Selection in Modal */}
              <div className="mt-4 mb-6 p-4 rounded-xl bg-[#0F0F14] border border-[#2A2A38]">
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Bộ truyện sẽ thêm chương:
                </label>
                <select
                  id="modal-story-select"
                  value={modalStoryId}
                  onChange={(e) => {
                    setModalStoryId(e.target.value);
                    setCvResults([]);
                    setSelectedIssueId(null);
                    setVolumeWarning(null);
                  }}
                  className="w-full bg-[#1A1A22] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl px-3 py-2 outline-none font-medium"
                >
                  {stories.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Switch Tabs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  id="tab-mode-comicvine"
                  onClick={() => setInputMode('comicvine')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    inputMode === 'comicvine'
                      ? 'bg-[#ED1D24]/15 border-[#ED1D24] text-white shadow-md shadow-[#ED1D24]/10'
                      : 'bg-[#0F0F14] border-[#2A2A38] text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${inputMode === 'comicvine' ? 'text-[#ED1D24]' : 'text-gray-500'}`} />
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span>CÁCH A: Liên kết ComicVine</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">ƯU TIÊN</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                      Tự động điền metadata, issue #, ảnh bìa gốc, ngày phát hành và nhân vật từ ComicVine.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  id="tab-mode-manual"
                  onClick={() => setInputMode('manual')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    inputMode === 'manual'
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-900/10'
                      : 'bg-[#0F0F14] border-[#2A2A38] text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload className={`w-5 h-5 flex-shrink-0 mt-0.5 ${inputMode === 'manual' ? 'text-purple-400' : 'text-gray-500'}`} />
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span>CÁCH B: Nhập Thủ Công</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-bold">DỰ PHÒNG</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                      Tải file ảnh bìa từ máy tính qua máy chủ lưu trữ an toàn, tự nhập tóm tắt và mô tả.
                    </p>
                  </div>
                </button>
              </div>

              {/* Mode A Section: ComicVine Search */}
              {inputMode === 'comicvine' && (
                <div className="mb-6 p-4.5 rounded-2xl bg-[#0F0F14] border border-[#2A2A38]">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white">
                    <Search className="w-4 h-4 text-[#ED1D24]" />
                    <span>Dán link ComicVine của issue (ví dụ: https://comicvine.gamespot.com/avengers-11/4000-1142989/):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id="input-comicvine-search"
                      value={cvQuery}
                      onChange={(e) => setCvQuery(e.target.value)}
                      placeholder="Dán link ComicVine của issue (ví dụ: https://comicvine.gamespot.com/avengers-11/4000-1142989/)"
                      className="flex-1 bg-[#1A1A22] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchComicVine(e)}
                    />
                    <button
                      type="button"
                      id="btn-search-cv"
                      onClick={handleSearchComicVine}
                      disabled={cvSearching}
                      className="px-4 py-2.5 rounded-xl bg-[#ED1D24] hover:bg-[#C4151B] text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer flex-shrink-0"
                    >
                      {cvSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>{cvSearching ? 'Đang lấy...' : 'Tìm Issue'}</span>
                    </button>
                  </div>

                  {/* Volume mismatch warning */}
                  {volumeWarning && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Cảnh báo: </span>
                        {volumeWarning}
                        <span className="block text-[11px] text-amber-400/80 mt-0.5">
                          Bạn vẫn có thể bấm nút "Chọn" bên dưới nếu muốn thêm issue này vào truyện hiện tại.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Results list */}
                  {cvResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] text-gray-400 font-semibold mb-1">
                        Thông tin Issue tìm thấy từ link - Bấm "Chọn" để tự động điền form:
                      </div>
                      {cvResults.map(issue => (
                        <div
                          key={issue.id}
                          id="cv-issue-preview-card"
                          onClick={() => handleSelectIssue(issue)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            selectedIssueId === issue.id
                              ? 'bg-[#ED1D24]/20 border-[#ED1D24]'
                              : 'bg-[#1A1A22] border-[#2A2A38] hover:border-gray-500'
                          }`}
                        >
                          <div className="w-12 h-16 rounded bg-black/40 overflow-hidden flex-shrink-0 border border-white/10">
                            {(issue.cover_image || issue.image) && (
                              <ProxiedImage 
                                key={`preview-${issue.id}-${issue.cover_image || (typeof issue.image === 'string' ? issue.image : (issue.image?.medium_url || 'default'))}`}
                                src={issue.cover_image || (typeof issue.image === 'string' ? issue.image : (issue.image?.medium_url || issue.image?.original_url))} 
                                alt={issue.title || 'ComicVine Issue'} 
                                className="w-full h-full object-cover" 
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="font-bold text-white text-sm truncate">
                              {issue.title && !issue.title.startsWith(`Issue #${issue.issue_number}`)
                                ? `Issue #${issue.issue_number}: ${issue.title}`
                                : (issue.title || `Issue #${issue.issue_number}`)}
                            </div>
                            <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span>Phát hành: <strong className="text-gray-200">{issue.release_date || 'N/A'}</strong></span>
                              {issue.volume_name && (
                                <span>Volume: <strong className="text-gray-200">{issue.volume_name}</strong></span>
                              )}
                              <span>ID ComicVine: <code className="text-[#ED1D24]">{issue.comicvine_issue_id || issue.id}</code></span>
                            </div>
                          </div>
                          {selectedIssueId === issue.id ? (
                            <span className="text-xs font-bold text-[#ED1D24] px-3 py-1.5 rounded-lg bg-[#ED1D24]/10 border border-[#ED1D24]/30 flex-shrink-0">
                              ĐÃ CHỌN ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              id="btn-select-cv-issue"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectIssue(issue);
                              }}
                              className="text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-[#ED1D24] hover:bg-[#C4151B] transition-all flex-shrink-0 cursor-pointer shadow-sm shadow-[#ED1D24]/20"
                            >
                              Chọn
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mode B: Manual File Upload Section */}
              {inputMode === 'manual' && (
                <div className="mb-6 p-4.5 rounded-2xl bg-[#0F0F14] border border-[#2A2A38]">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Tải Lên Ảnh Bìa Chương Từ Máy Tính:</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/40 text-purple-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingImage ? 'Đang tải lên...' : 'Chọn file ảnh từ máy...'}</span>
                      <input
                        type="file"
                        id="input-chapter-cover-file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    {uploadedImagePreview && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã tải lên máy chủ!
                      </span>
                    )}
                  </div>

                  {/* Copyright Warning Mandatory Banner */}
                  <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Lưu ý bản quyền:</strong> Chỉ upload ảnh bạn có quyền sử dụng hợp pháp (ảnh tự thiết kế, ảnh minh họa gốc), không upload ảnh scan truyện có bản quyền từ nguồn khác.
                    </span>
                  </div>
                </div>
              )}

              {/* General Form Fields */}
              <form onSubmit={handleSubmitChapter} className="space-y-4">
                
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300 flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Số chương (Issue #) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="input-chapter-number"
                      value={formData.chapter_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, chapter_number: e.target.value }))}
                      required
                      placeholder="Ví dụ: 13"
                      className="w-full bg-[#0F0F14] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl px-3 py-2.5 outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Tên chương truyện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="input-chapter-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="Ví dụ: Spider-Man! & The Chameleon Strikes!"
                      className="w-full bg-[#0F0F14] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl px-3 py-2.5 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Ngày phát hành
                    </label>
                    <input
                      type="date"
                      id="input-chapter-release-date"
                      value={formData.release_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
                      className="w-full bg-[#0F0F14] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl px-3 py-2 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Chính sách xem
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0F0F14] border border-[#2A2A38] cursor-pointer hover:border-gray-500 transition-colors">
                      <input
                        type="checkbox"
                        id="checkbox-chapter-preview"
                        checked={formData.is_preview}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_preview: e.target.checked }))}
                        className="rounded text-[#ED1D24] focus:ring-0"
                      />
                      <span className="text-xs text-gray-300 font-medium">
                        Cho phép đọc thử miễn phí (Preview)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Cover image preview & URL */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Ảnh bìa chương (URL hoặc ảnh đã tải lên):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      id="input-chapter-cover-url"
                      value={formData.cover_image}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                      placeholder="https://... hoặc /uploads/chapters/..."
                      className="flex-1 bg-[#0F0F14] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl px-3 py-2 outline-none font-mono"
                    />
                    {formData.cover_image && (
                      <div className="w-10 h-14 rounded-lg overflow-hidden border border-[#2A2A38] flex-shrink-0 bg-black">
                        <ProxiedImage src={formData.cover_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content / Summary */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Tóm tắt nội dung chương:
                  </label>
                  <textarea
                    id="input-chapter-content"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Tóm tắt bối cảnh, diễn biến và kết thúc kịch tính của chương truyện này..."
                    className="w-full bg-[#0F0F14] border border-[#2A2A38] focus:border-[#ED1D24] text-white text-xs rounded-xl p-3 outline-none leading-relaxed resize-none"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A38]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-chapter"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#ED1D24] hover:bg-[#C4151B] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#ED1D24]/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lưu & Xuất Bản Chương Mới</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminChaptersPage;
