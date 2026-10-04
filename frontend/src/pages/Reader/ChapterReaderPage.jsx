import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Crown,
  Sparkles,
  CreditCard,
  LogIn,
  MessageSquare,
  Send,
  Heart,
  Flag,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import ProxiedImage from '../../components/ProxiedImage';
import PaymentModal from '../../components/PaymentModal';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import socket, { joinChapterRoom } from '../../services/socket';

const ChapterReaderPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { storyId, chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [chapter, setChapter] = useState(null);
  const [prevChapter, setPrevChapter] = useState(null);
  const [nextChapter, setNextChapter] = useState(null);
  const [story, setStory] = useState(null);
  const [readAccess, setReadAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessBlocked, setAccessBlocked] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Parallax scroll effect offset & Reading progress
  const [scrollY, setScrollY] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-Resume Toast state
  const [resumeToast, setResumeToast] = useState(null);

  // Cộng đồng thảo luận & bình luận chương thật
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Báo cáo vi phạm comment
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [reportReason, setReportReason] = useState('Nội dung phản cảm hoặc spam');
  const [reportingLoading, setReportingLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Fetch comments from API & join socket room
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await api.get(`/chapters/${chapterId}/comments`);
      if (res.success && res.comments) {
        setComments(res.comments);
      }
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (!chapterId) return;
    fetchComments();
    joinChapterRoom(chapterId);

    const handleNewComment = (comment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [comment, ...prev];
      });
    };

    socket.on('new_comment_posted', handleNewComment);
    return () => {
      socket.off('new_comment_posted', handleNewComment);
    };
  }, [chapterId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/chapters/${chapterId}/comments`, {
        content: newCommentText.trim()
      });
      if (res.success && res.comment) {
        setComments((prev) => [res.comment, ...prev.filter((c) => c.id !== res.comment.id)]);
        setNewCommentText('');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      if (res.success) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, likes_count: res.likes_count } : c))
        );
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleReportComment = async () => {
    if (!reportingCommentId || reportingLoading) return;
    setReportingLoading(true);
    try {
      const res = await api.post(`/comments/${reportingCommentId}/report`, {
        reason: reportReason
      });
      if (res.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportSuccess(false);
          setReportingCommentId(null);
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setReportingLoading(false);
    }
  };

  // Track window scroll for parallax & progress bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
        setReadingProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-save reading progress with debounce (2s)
  useEffect(() => {
    if (!isAuthenticated || !chapter) return;
    const currentStoryId = storyId || chapter.story_id;
    if (!currentStoryId) return;

    const timer = setTimeout(async () => {
      if (scrollY <= 0 && readingProgress <= 0) return;
      try {
        await api.post('/reading-progress', {
          story_id: currentStoryId,
          chapter_id: Number(chapterId),
          scroll_y: Math.round(scrollY),
          progress_percent: Math.round(readingProgress)
        });
      } catch (err) {
        // Silently catch background sync
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [scrollY, readingProgress, isAuthenticated, chapter, chapterId, storyId]);

  // Fetch Chapter Detail & Story Chapters
  const fetchChapter = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessBlocked(null);

      // 1. Fetch current chapter details (via api service with token)
      const chapterRes = await api.get(`/chapters/${chapterId}`);
      const currentChapter = chapterRes.chapter;
      setChapter(currentChapter);
      setPrevChapter(chapterRes.prev_chapter);
      setNextChapter(chapterRes.next_chapter);
      setReadAccess(chapterRes.read_access);

      // 2. Fetch parent story
      const currentStoryId = storyId || currentChapter.story_id;
      const storyRes = await api.get(`/stories/${currentStoryId}`);
      if (storyRes.success && storyRes.story) {
        setStory(storyRes.story);
      }

      // 3. Auto-Resume reading progress from backend
      if (isAuthenticated) {
        try {
          const progRes = await api.get(`/reading-progress/${currentStoryId}`);
          if (progRes.success && progRes.progress) {
            const p = progRes.progress;
            if (Number(p.chapter_id) === Number(chapterId) && p.scroll_y > 150) {
              setTimeout(() => {
                window.scrollTo({ top: p.scroll_y, behavior: 'smooth' });
                setResumeToast({
                  percent: Number(p.progress_percent || 0).toFixed(0),
                  scrollY: p.scroll_y
                });
                setTimeout(() => setResumeToast(null), 6000);
              }, 400);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Failed to load chapter reader:', err);
      if (err.code === 'PAYMENT_REQUIRED' || err.code === 'UNAUTHORIZED') {
        setAccessBlocked(err);
      } else {
        setError(err.message || 'Không thể tải chương truyện này.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapter();
  }, [chapterId, storyId]);

  // Accent Color Fallback
  const accentColor = useMemo(() => {
    if (chapter?.accent_color && /^#[0-9A-Fa-f]{6}$/.test(chapter.accent_color)) {
      return chapter.accent_color;
    }
    return '#ED1D24'; // Marvel Red Fallback
  }, [chapter?.accent_color]);

  // Extract Pull Quote and Body Paragraphs
  const { pullQuote, paragraphs } = useMemo(() => {
    if (!chapter?.content) {
      return {
        pullQuote: 'With great power there must also come great responsibility.',
        paragraphs: ['Đang cập nhật nội dung chi tiết cho chương truyện này...']
      };
    }

    // Split content by double newlines or single newlines
    const rawParagraphs = chapter.content
      .split(/\n\s*\n|\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (rawParagraphs.length === 0) {
      return {
        pullQuote: chapter.title || 'Hồi ký siêu anh hùng',
        paragraphs: []
      };
    }

    // Pick first sentence of the first paragraph or the longest sentence as Pull Quote
    const firstPara = rawParagraphs[0];
    const sentences = firstPara.match(/[^.!?]+[.!?]+/g) || [firstPara];
    const quote = sentences[0].trim();

    // The rest of the content becomes the reading paragraphs
    let remainingText = rawParagraphs.slice();
    if (sentences.length > 1) {
      remainingText[0] = sentences.slice(1).join(' ').trim();
    } else {
      remainingText = rawParagraphs.slice(1);
    }

    if (remainingText.length === 0) {
      remainingText = rawParagraphs;
    }

    return {
      pullQuote: quote,
      paragraphs: remainingText
    };
  }, [chapter?.content, chapter?.title]);

  // Determine Layout: Even (2-column sticky) vs Odd (Hero full-width)
  const isEvenChapter = useMemo(() => {
    if (!chapter) return false;
    const num = Math.floor(Number(chapter.chapter_number || 1));
    return num % 2 === 0;
  }, [chapter?.chapter_number]);

  // Safe Image Cover with Fallback to Story Cover
  const coverImage = useMemo(() => {
    return chapter?.cover_image || story?.cover_image || 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg';
  }, [chapter?.cover_image, story?.cover_image]);

  // Safely parse character credits whether array or JSON string
  const characterCredits = useMemo(() => {
    if (!chapter?.character_credits) return [];
    if (Array.isArray(chapter.character_credits)) return chapter.character_credits;
    if (typeof chapter.character_credits === 'string') {
      try {
        const parsed = JSON.parse(chapter.character_credits);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [chapter?.character_credits]);

  // First character avatar for texture background
  const backdropAvatar = useMemo(() => {
    if (characterCredits && characterCredits.length > 0) {
      return characterCredits[0].icon_url;
    }
    return null;
  }, [characterCredits]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex flex-col items-center justify-center text-white px-4">
        <div
          className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mb-4"
          style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }}
        />
        <h2 className="font-italiana text-2xl tracking-wider text-gray-200">Đang khởi tạo không gian đọc...</h2>
        <p className="text-xs text-gray-500 mt-2">Dữ liệu chính thức từ Comic Vine</p>
      </div>
    );
  }

  if (accessBlocked) {
    const isUnauth = accessBlocked.code === 'UNAUTHORIZED';
    const accessInfo = accessBlocked.access_info;

    return (
      <div className="min-h-screen bg-[#0F0F14] marvel-ambient-bg flex flex-col items-center justify-center text-white px-4 py-12 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-[#1A1A22] border border-amber-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative z-10 animate-fade-in">
          
          {/* Badge VIP */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-6">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Đặc Quyền Hội Viên Marvel VIP</span>
          </div>

          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-xl shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white tracking-tight">
            Chương Truyện Khóa Bản Quyền
          </h2>

          <p className="text-sm text-gray-300 mb-6 leading-relaxed">
            {accessBlocked.message || 'Chương này yêu cầu Gói Hội Viên VIP hoặc mua riêng trọn bộ truyện để đọc.'}
          </p>

          {accessInfo && (
            <div className="p-4 bg-[#0F0F14] border border-[#2A2A38] rounded-2xl mb-6 text-left space-y-1.5 text-xs text-gray-400">
              <p><span className="text-gray-500">Tác phẩm:</span> <strong className="text-white">{accessInfo.story_title}</strong></p>
              <p><span className="text-gray-500">Chương số:</span> <strong className="text-amber-400">Chương {accessInfo.chapter_number}</strong></p>
              {accessInfo.story_price > 0 && (
                <p><span className="text-gray-500">Giá mua trọn bộ:</span> <strong className="text-[#ED1D24] text-sm">{Number(accessInfo.story_price).toLocaleString('vi-VN')} đ</strong></p>
              )}
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3">
            {isUnauth ? (
              <Link
                to="/login"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#ED1D24] hover:bg-[#ff3333] shadow-lg shadow-[#ED1D24]/20 flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Để Tiếp Tục</span>
              </Link>
            ) : (
              <>
                {/* 1. Mua gói VIP tháng */}
                <Link
                  to="/subscriptions"
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Nâng Cấp Gói VIP (Từ 49.000đ/tháng)</span>
                </Link>

                {/* 2. Mua trọn bộ truyện này */}
                {accessInfo?.story_price > 0 && (
                  <button
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#23232E] hover:bg-[#2A2A38] border border-[#2A2A38] flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <BookOpen className="w-4 h-4 text-[#ED1D24]" />
                    <span>Mua Riêng Trọn Bộ ({Number(accessInfo.story_price).toLocaleString('vi-VN')} đ)</span>
                  </button>
                )}
              </>
            )}

            <Link
              to={storyId || accessInfo?.story_id ? `/stories/${storyId || accessInfo?.story_id}` : '/stories'}
              className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white pt-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang truyện</span>
            </Link>
          </div>
        </div>

        {/* Modal Mua Truyện Lẻ */}
        {accessInfo && (
          <PaymentModal
            isOpen={isPurchaseModalOpen}
            onClose={() => setIsPurchaseModalOpen(false)}
            paymentType="story_purchase"
            itemId={accessInfo.story_id}
            itemTitle={`Trọn Bộ: ${accessInfo.story_title}`}
            price={accessInfo.story_price}
            onSuccess={() => {
              setIsPurchaseModalOpen(false);
              fetchChapter();
            }}
          />
        )}
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex flex-col items-center justify-center text-white px-4">
        <div className="max-w-md w-full bg-[#1A1A22] border border-[#2A2A38] rounded-2xl p-8 text-center shadow-2xl">
          <BookOpen className="w-12 h-12 text-[#ED1D24] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không tìm thấy chương truyện</h2>
          <p className="text-sm text-gray-400 mb-6">{error || 'Chương truyện có thể đã bị thay đổi hoặc không tồn tại.'}</p>
          <Link
            to={storyId ? `/stories/${storyId}` : '/stories'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang truyện</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0F0F14] text-white selection:text-white relative overflow-x-hidden"
      style={{
        '--dynamic-accent': accentColor,
        selectionBackgroundColor: accentColor
      }}
    >
      {/* Top Floating Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black/40 z-50 pointer-events-none">
        <div
          className="h-full transition-all duration-150 ease-out"
          style={{
            width: `${readingProgress}%`,
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`
          }}
        />
      </div>

      {/* Reader Floating Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0F0F14]/90 backdrop-blur-md border-b border-[#2A2A38]/60 px-4 sm:px-8 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <Link
            to={story?.id || storyId ? `/stories/${story?.id || storyId}` : '/stories'}
            className="p-2 rounded-lg bg-[#1A1A22] hover:bg-[#23232E] text-gray-300 hover:text-white border border-[#2A2A38] transition-all flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
            title="Quay lại danh sách chương"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trang truyện</span>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="truncate">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 truncate">
              <span>{story?.title}</span>
              <span className="text-gray-600">•</span>
              <span style={{ color: accentColor }}>Chương {chapter.chapter_number}</span>
            </p>
            <h1 className="text-sm sm:text-base font-bold text-white truncate">
              {chapter.title}
            </h1>
          </div>
        </div>

        {/* Quick Chapter Selector & Share */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {story?.chapters && story.chapters.length > 0 && (
            <div className="relative">
              <select
                aria-label="Chọn chương đọc nhanh"
                value={chapter.id}
                onChange={(e) => navigate(`/stories/${story.id}/chapters/${e.target.value}`)}
                className="bg-[#1A1A22] text-xs font-medium text-gray-300 border border-[#2A2A38] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 cursor-pointer transition-all hover:border-gray-500"
                style={{ focusRingColor: accentColor }}
              >
                {story.chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Chương {ch.chapter_number}: {ch.title.substring(0, 24)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-[#1A1A22] hover:bg-[#23232E] text-gray-400 hover:text-white border border-[#2A2A38] transition-all relative"
            title="Sao chép liên kết"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* BACKDROP TRANG TRÍ (Yêu cầu 3e & Vấn đề 1): Đi qua ProxiedImage, blur 28px, opacity 0.07, fixed */}
      {backdropAvatar && (
        <div
          className="fixed inset-0 pointer-events-none -z-10 overflow-hidden flex items-center justify-center"
          aria-hidden="true"
        >
          <ProxiedImage
            src={backdropAvatar}
            alt=""
            className="w-[600px] h-[600px] object-cover rounded-full filter blur-[28px] opacity-[0.07] scale-150 transform-gpu"
          />
          <div className="absolute inset-0 bg-[#0F0F14]/70" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER SỐ LẺ: BỐ CỤC HERO FULL-WIDTH PHÍA TRÊN -> NỘI DUNG CUỘN PHÍA DƯỚI */}
      {/* ========================================================================= */}
      {!isEvenChapter && (
        <div>
          {/* HERO HEADER: 50-60vh (mobile ~35vh), Parallax translateY, gradient tối */}
          <section className="relative w-full h-[35vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden bg-black flex items-end">
            {/* Parallax Image Container (Vấn đề 1: ProxiedImage) */}
            <div
              className="absolute inset-0 w-full h-[120%] -top-[10%] transform-gpu will-change-transform"
              style={{
                transform: `translateY(${scrollY * 0.35}px)`
              }}
            >
              <ProxiedImage
                src={coverImage}
                alt={chapter.title}
                className="w-full h-full object-cover object-center filter brightness-[0.85]"
                loading="eager"
              />
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F14] via-[#0F0F14]/60 to-transparent" />
            <div
              className="absolute inset-0 opacity-20 mix-blend-color"
              style={{ backgroundColor: accentColor }}
            />

            {/* Hero Metadata Title at Bottom */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 w-full">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider text-black shadow-md"
                  style={{ backgroundColor: accentColor }}
                >
                  Issue #{chapter.chapter_number}
                </span>

                {chapter.release_date && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 font-mono">
                    <Calendar className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    {chapter.release_date}
                  </span>
                )}

                {chapter.is_preview ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                    Đọc Thử Miễn Phí
                  </span>
                ) : (
                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Bản Quyền VIP
                  </span>
                )}
              </div>

              <h1 className="font-italiana text-3xl sm:text-5xl lg:text-6xl font-normal text-white tracking-wide leading-tight drop-shadow-lg">
                {chapter.title}
              </h1>

              {/* VẤN ĐỀ 2 ĐÃ GIẢI QUYẾT: Ẩn hoàn toàn các dòng text kỹ thuật (Màu chủ đạo / Bố cục) khỏi UI */}
            </div>
          </section>

          {/* MAIN CONTENT WRAPPER */}
          <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {/* PULL QUOTE (Yêu cầu 3c) */}
            {pullQuote && (
              <div
                className="relative my-10 sm:my-14 py-8 px-6 sm:px-12 text-center rounded-2xl bg-[#1A1A22]/40 border-l-4 transition-all"
                style={{
                  borderLeftColor: accentColor,
                  boxShadow: `0 10px 30px -10px ${accentColor}15`
                }}
              >
                {/* Dấu ngoặc kép trang trí lớn mờ phía sau */}
                <span
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-8xl sm:text-9xl pointer-events-none select-none opacity-10"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                >
                  “
                </span>

                <blockquote className="relative z-10 font-italiana text-2xl sm:text-3xl lg:text-4xl text-white font-normal italic tracking-wide leading-relaxed">
                  "{pullQuote}"
                </blockquote>
                <p className="mt-3 text-xs uppercase tracking-widest text-gray-400 font-semibold">
                  — Trích yếu chương #{chapter.chapter_number}
                </p>
              </div>
            )}

            {/* NỘI DUNG CHÍNH (Yêu cầu 3d): Font Merriweather, max-width 680px, line-height 1.8 */}
            <article className="max-w-[680px] mx-auto space-y-6 text-gray-200 font-merriweather text-base sm:text-lg leading-[1.8] font-light">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="first-letter:text-4xl first-letter:font-italiana first-letter:mr-2 first-letter:float-left first-letter:font-bold first-letter:leading-none">
                  {p}
                </p>
              ))}
            </article>

            {/* SECTION NHÂN VẬT (Yêu cầu 3f & Vấn đề 1: ProxiedImage) */}
            {characterCredits && characterCredits.length > 0 && (
              <section className="mt-16 pt-12 border-t border-[#2A2A38]">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5" style={{ color: accentColor }} />
                  <h3 className="font-italiana text-2xl font-normal text-white tracking-wide">
                    Nhân Vật Xuất Hiện
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">({characterCredits.length})</span>
                </div>

                {/* Mobile: scroll ngang, Desktop: grid responsive */}
                <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-x-auto pb-4 sm:pb-0 scrollbar-thin">
                  {characterCredits.map((char, index) => (
                    <div
                      key={index}
                      className="group flex-shrink-0 w-32 sm:w-auto bg-[#1A1A22] border border-[#2A2A38] hover:border-gray-500 rounded-xl p-3 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1"
                    >
                      <div className="relative mb-2.5">
                        <ProxiedImage
                          src={char.icon_url}
                          alt={char.name}
                          className="w-16 h-16 rounded-full object-cover border-2 shadow-md group-hover:scale-105 transition-transform"
                          style={{ borderColor: accentColor }}
                          fallbackSrc="https://comicvine.gamespot.com/a/uploads/scale_small/0/3848/127622-130694-spider-man.jpg"
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                        {char.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ĐIỀU HƯỚNG CUỐI TRANG (Yêu cầu 3g & Vấn đề 1: ProxiedImage) */}
            <div className="mt-16 pt-10 border-t border-[#2A2A38]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prev Chapter Card */}
                {prevChapter ? (
                  <Link
                    to={`/stories/${story?.id || storyId}/chapters/${prevChapter.id}`}
                    className="group flex items-center gap-3 p-3.5 bg-[#1A1A22] rounded-xl border border-[#2A2A38] hover:border-gray-500 transition-all text-left"
                  >
                    <ProxiedImage
                      src={prevChapter.cover_image || coverImage}
                      alt={prevChapter.title}
                      className="w-14 h-20 object-cover rounded-lg flex-shrink-0 shadow-md border border-white/5"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 font-semibold uppercase">
                        <ChevronLeft className="w-3.5 h-3.5" style={{ color: accentColor }} />
                        Chương trước
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#ED1D24] transition-colors truncate mt-0.5">
                        {prevChapter.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Issue #{prevChapter.chapter_number}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {/* Next Chapter Card */}
                {nextChapter ? (
                  <Link
                    to={`/stories/${story?.id || storyId}/chapters/${nextChapter.id}`}
                    className="group flex items-center justify-end gap-3 p-3.5 bg-[#1A1A22] rounded-xl border border-[#2A2A38] hover:border-gray-500 transition-all text-right"
                  >
                    <div className="overflow-hidden">
                      <span className="text-[11px] text-gray-400 flex items-center justify-end gap-1 font-semibold uppercase">
                        Chương tiếp theo
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#ED1D24] transition-colors truncate mt-0.5">
                        {nextChapter.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Issue #{nextChapter.chapter_number}
                      </p>
                    </div>
                    <ProxiedImage
                      src={nextChapter.cover_image || coverImage}
                      alt={nextChapter.title}
                      className="w-14 h-20 object-cover rounded-lg flex-shrink-0 shadow-md border border-white/5"
                    />
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER SỐ CHẴN: BỐ CỤC 2 CỘT CỐ ĐỊNH (STICKY COVER 40% TRÁI, 60% PHẢI)    */}
      {/* ========================================================================= */}
      {isEvenChapter && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Main 2-column Grid (Mobile auto converts to single column) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Sticky Cover 40% (lg:col-span-5) */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-[#1A1A22] rounded-2xl p-4 sm:p-5 border border-[#2A2A38] shadow-2xl relative overflow-hidden">
                {/* Background Accent Glow */}
                <div
                  className="absolute -top-24 -left-24 w-64 h-64 rounded-full filter blur-[70px] opacity-25 pointer-events-none"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Cover Image Frame (Vấn đề 1: ProxiedImage) */}
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 group aspect-[2/3]">
                  <ProxiedImage
                    src={coverImage}
                    alt={chapter.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  <div className="absolute bottom-4 left-4 right-4">
                    {/* VẤN ĐỀ 2 ĐÃ GIẢI QUYẾT: Bỏ "(Chẵn)", chỉ giữ "Issue #X" */}
                    <span
                      className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider text-black shadow"
                      style={{ backgroundColor: accentColor }}
                    >
                      Issue #{chapter.chapter_number}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 drop-shadow leading-snug">
                      {chapter.title}
                    </h3>
                  </div>
                </div>

                {/* Metadata Sidebar details (VẤN ĐỀ 2 ĐÃ GIẢI QUYẾT: Ẩn thông tin kỹ thuật nội bộ) */}
                <div className="mt-4 pt-4 border-t border-[#2A2A38] space-y-2.5 text-xs text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Bộ truyện:</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{story?.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Ngày phát hành:</span>
                    <span className="font-mono text-gray-200">{chapter.release_date || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Nhà xuất bản:</span>
                    <span className="font-semibold text-[#ED1D24]">Marvel Comics</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Nguồn xác thực:</span>
                    <span className="text-gray-400 font-mono">Comic Vine (Issue #{chapter.chapter_number})</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT COLUMN: Scrolling Content 60% (lg:col-span-7) */}
            <main className="lg:col-span-7 space-y-8">
              {/* Header Title inside Right Column */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2.5 py-0.5 rounded text-xs font-extrabold uppercase tracking-wider text-black"
                    style={{ backgroundColor: accentColor }}
                  >
                    Chương #{chapter.chapter_number}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {chapter.release_date}
                  </span>
                </div>

                <h1 className="font-italiana text-3xl sm:text-5xl font-normal text-white tracking-wide leading-tight">
                  {chapter.title}
                </h1>
              </div>

              {/* PULL QUOTE (Yêu cầu 3c) */}
              {pullQuote && (
                <div
                  className="relative p-6 sm:p-8 rounded-2xl bg-[#1A1A22]/50 border-l-4 transition-all"
                  style={{
                    borderLeftColor: accentColor,
                    boxShadow: `0 10px 25px -10px ${accentColor}20`
                  }}
                >
                  <span
                    className="absolute -top-3 left-4 font-serif text-6xl pointer-events-none select-none opacity-20"
                    style={{ color: accentColor }}
                    aria-hidden="true"
                  >
                    “
                  </span>
                  <blockquote className="relative z-10 font-italiana text-xl sm:text-2xl lg:text-3xl text-white font-normal italic tracking-wide leading-relaxed">
                    "{pullQuote}"
                  </blockquote>
                </div>
              )}

              {/* NỘI DUNG CHÍNH (Yêu cầu 3d): Font Merriweather, line-height 1.8 */}
              <article className="space-y-6 text-gray-200 font-merriweather text-base sm:text-lg leading-[1.8] font-light">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="first-letter:text-3xl first-letter:font-italiana first-letter:mr-2 first-letter:float-left first-letter:font-bold first-letter:leading-none">
                    {p}
                  </p>
                ))}
              </article>

              {/* SECTION NHÂN VẬT (Yêu cầu 3f & Vấn đề 1: ProxiedImage) */}
              {characterCredits && characterCredits.length > 0 && (
                <section className="pt-8 border-t border-[#2A2A38]">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4" style={{ color: accentColor }} />
                    <h3 className="font-italiana text-xl font-normal text-white tracking-wide">
                      Nhân Vật Xuất Hiện Trong Tập Này
                    </h3>
                  </div>

                  <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-x-auto pb-3 sm:pb-0 scrollbar-thin">
                    {characterCredits.map((char, index) => (
                      <div
                        key={index}
                        className="group flex-shrink-0 w-28 sm:w-auto bg-[#1A1A22] border border-[#2A2A38] hover:border-gray-500 rounded-xl p-3 flex flex-col items-center text-center transition-all hover:-translate-y-0.5"
                      >
                        <ProxiedImage
                          src={char.icon_url}
                          alt={char.name}
                          className="w-14 h-14 rounded-full object-cover border-2 shadow mb-2 group-hover:scale-105 transition-transform"
                          style={{ borderColor: accentColor }}
                          fallbackSrc="https://comicvine.gamespot.com/a/uploads/scale_small/0/3848/127622-130694-spider-man.jpg"
                        />
                        <span className="text-xs font-semibold text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                          {char.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ĐIỀU HƯỚNG CUỐI TRANG (Yêu cầu 3g & Vấn đề 1: ProxiedImage) */}
              <div className="pt-8 border-t border-[#2A2A38]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prevChapter ? (
                    <Link
                      to={`/stories/${story?.id || storyId}/chapters/${prevChapter.id}`}
                      className="group flex items-center gap-3 p-3.5 bg-[#1A1A22] rounded-xl border border-[#2A2A38] hover:border-gray-500 transition-all text-left"
                    >
                      <ProxiedImage
                        src={prevChapter.cover_image || coverImage}
                        alt={prevChapter.title}
                        className="w-12 h-16 object-cover rounded-lg flex-shrink-0 shadow-md border border-white/5"
                      />
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold uppercase">
                          <ChevronLeft className="w-3 h-3" style={{ color: accentColor }} />
                          Chương trước
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#ED1D24] transition-colors truncate mt-0.5">
                          {prevChapter.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-mono">
                          Issue #{prevChapter.chapter_number}
                        </p>
                      </div>
                    </Link>
                  ) : <div />}

                  {nextChapter ? (
                    <Link
                      to={`/stories/${story?.id || storyId}/chapters/${nextChapter.id}`}
                      className="group flex items-center justify-end gap-3 p-3.5 bg-[#1A1A22] rounded-xl border border-[#2A2A38] hover:border-gray-500 transition-all text-right"
                    >
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-gray-400 flex items-center justify-end gap-1 font-semibold uppercase">
                          Chương kế tiếp
                          <ChevronRight className="w-3 h-3" style={{ color: accentColor }} />
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#ED1D24] transition-colors truncate mt-0.5">
                          {nextChapter.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-mono">
                          Issue #{nextChapter.chapter_number}
                        </p>
                      </div>
                      <ProxiedImage
                        src={nextChapter.cover_image || coverImage}
                        alt={nextChapter.title}
                        className="w-12 h-16 object-cover rounded-lg flex-shrink-0 shadow-md border border-white/5"
                      />
                    </Link>
                  ) : <div />}
                </div>
              </div>
            </main>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHU VỰC THẢO LUẬN & BÌNH LUẬN CHƯƠNG (ÁP DỤNG AVATAR CHỮ CÁI ĐẦU CHUẨN)    */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 mt-8 border-t border-[#2A2A38]/60">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Thảo Luận Chương Truyện
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-normal">
                  {comments.length}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Góc giao lưu, chia sẻ giả thuyết cùng cộng đồng độc giả Marvel
              </p>
            </div>
          </div>
        </div>

        {/* Ô nhập bình luận */}
        <div className="bg-[#1A1A22] rounded-2xl p-5 border border-[#2A2A38] shadow-xl mb-8">
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar user={user} size="md" />
                <div className="flex-1">
                  <textarea
                    rows={3}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Chia sẻ cảm nghĩ hoặc giả thuyết của bạn về chương truyện này..."
                    className="w-full bg-[#0F0F14] border border-[#2A2A38] rounded-xl p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#ED1D24] transition-colors resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500">
                  Đang bình luận với tư cách: <strong className="text-gray-300">{user?.full_name || user?.username}</strong>
                </span>
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#ED1D24] hover:bg-[#ff3333] transition-all flex items-center gap-2 shadow-lg shadow-[#ED1D24]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Bình Luận</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-3">Đăng nhập để tham gia thảo luận cùng các fan Marvel</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#ED1D24] text-white hover:bg-[#ff3333] transition-all shadow-lg"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập Ngay</span>
              </Link>
            </div>
          )}
        </div>

        {/* Danh sách bình luận */}
        {commentsLoading && comments.length === 0 ? (
          <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-[#ED1D24]" />
            <span>Đang tải bình luận thảo luận...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center bg-[#1A1A22] rounded-2xl border border-[#2A2A38] text-gray-400 text-xs">
            Chưa có bình luận nào cho chương này. Hãy là người đầu tiên chia sẻ cảm nghĩ!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-[#1A1A22]/80 border border-[#2A2A38] hover:border-gray-600 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar user={c.user} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {c.user?.full_name || c.user?.username || c.user_name || 'Độc Giả Marvel'}
                        </span>
                        {c.user?.role === 'admin' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-[#ED1D24] border border-red-500/30">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : (c.time || 'Vừa xong')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Nút Thích */}
                    <button
                      type="button"
                      onClick={() => handleLikeComment(c.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ED1D24] transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5"
                      title="Thích bình luận này"
                    >
                      <Heart className="w-3.5 h-3.5 fill-[#ED1D24]/20 text-[#ED1D24]" />
                      <span className="font-mono">{c.likes_count ?? c.likes ?? 0}</span>
                    </button>

                    {/* Nút Báo Cáo Vi Phạm */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        setReportingCommentId(c.id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors text-xs"
                      title="Báo cáo vi phạm / Spam"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-300 pl-13 leading-relaxed whitespace-pre-line">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER ACTION BAR */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center border-t border-[#2A2A38]/50 mt-12">
        <Link
          to={story?.id || storyId ? `/stories/${story?.id || storyId}` : '/stories'}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] transition-all hover:scale-105 shadow-xl"
        >
          <BookOpen className="w-4 h-4" style={{ color: accentColor }} />
          <span>Về trang danh sách của "{story?.title}"</span>
        </Link>
      </footer>

      {/* FLOATING TOAST: AUTO-RESUME READING PROGRESS */}
      {resumeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A22] border-2 border-[#ED1D24] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 animate-bounce">
          <div className="w-9 h-9 rounded-xl bg-[#ED1D24]/20 border border-[#ED1D24]/30 flex items-center justify-center text-[#ED1D24] flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              Đã khôi phục vị trí đọc gần nhất ({resumeToast.percent}%)
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setResumeToast(null);
              }}
              className="text-[11px] text-[#ED1D24] hover:text-[#ff6666] font-semibold underline mt-0.5"
            >
              Cuộn lên đọc lại từ đầu trang
            </button>
          </div>
          <button
            onClick={() => setResumeToast(null)}
            className="text-gray-400 hover:text-white p-1 text-sm transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL BÁO CÁO BÌNH LUẬN VI PHẠM */}
      {reportingCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1A22] border border-[#2A2A38] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A38]">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Báo Cáo Bình Luận Vi Phạm</span>
              </div>
              <button
                onClick={() => setReportingCommentId(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center text-emerald-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="font-bold">Đã gửi báo cáo vi phạm tới Ban Quản Trị!</p>
                <p className="text-xs text-gray-400">Cảm ơn bạn đã giữ gìn cộng đồng Marvel văn minh.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-gray-300">
                  Vui lòng chọn lý do vi phạm để quản trị viên kiểm duyệt:
                </p>

                <div className="space-y-2">
                  {[
                    'Spam / Quảng cáo liên kết độc hại',
                    'Ngôn từ kích động thù địch / Xúc phạm',
                    'Tiết lộ nội dung cốt truyện (Spoiler)',
                    'Nội dung không liên quan đến tác phẩm'
                  ].map((r) => (
                    <label
                      key={r}
                      onClick={() => setReportReason(r)}
                      className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        reportReason === r
                          ? 'border-[#ED1D24] bg-[#ED1D24]/10 text-white font-semibold'
                          : 'border-[#2A2A38] bg-[#0F0F14] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={reportReason === r}
                        onChange={() => setReportReason(r)}
                        className="hidden"
                      />
                      {r}
                    </label>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReportingCommentId(null)}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleReportComment}
                    disabled={reportingLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#ED1D24] hover:bg-[#ff3333] shadow-lg shadow-[#ED1D24]/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {reportingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Gửi Báo Cáo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterReaderPage;
