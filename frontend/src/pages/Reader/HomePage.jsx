import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import HeroScene from '../../components/HeroScene';
import ComicCard from '../../components/ComicCard';
import api from '../../services/api';
import { Search, Filter, BookOpen, AlertCircle, RefreshCw, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [heroStories, setHeroStories] = useState([]);
  const [stories, setStories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStories, setTotalStories] = useState(0);

  // Auto-scroll logic depending on pathname and hash
  useEffect(() => {
    if (location.hash === '#story-catalog' || (location.pathname === '/stories' && !location.hash)) {
      const timer = setTimeout(() => {
        const el = document.getElementById('story-catalog');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (location.hash === '#hero-3d') {
      const timer = setTimeout(() => {
        const el = document.getElementById('hero-3d');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/' && !location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  // Filters State
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState('all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortOption, setSortOption] = useState('views');

  // Load Hero Stories
  useEffect(() => {
    const fetchHeroStories = async () => {
      try {
        const res = await api.get('/stories/hero');
        if (res.success && res.stories) {
          setHeroStories(res.stories);
        }
      } catch (err) {
        console.error('Failed to load hero stories:', err);
      }
    };
    fetchHeroStories();
  }, []);

  // Load Genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get('/genres');
        if (res.success && res.genres) {
          setGenres(res.genres);
        }
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    };
    fetchGenres();
  }, []);

  // Load Main Catalog Stories with debounce
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const params = {
          search: searchQuery || undefined,
          genre: selectedGenre || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          access_policy: selectedPolicy !== 'all' ? selectedPolicy : undefined,
          sort: sortOption
        };

        const res = await api.get('/stories', { params });
        if (res.success) {
          setStories(res.stories || []);
          setTotalStories(res.total || (res.stories || []).length);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load stories:', err);
        setError('Không thể tải danh sách truyện. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchStories();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, selectedStatus, selectedPolicy, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { search: searchQuery } : {});
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedStatus('all');
    setSelectedPolicy('all');
    setSortOption('views');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedGenre || selectedStatus !== 'all' || selectedPolicy !== 'all' || sortOption !== 'views';

  return (
    <div className="min-h-screen marvel-ambient-bg">
      {/* 3D WebGL Hero Section (400vh scroll container) */}
      <HeroScene stories={heroStories} />

      {/* Main Content Catalog: Seamless Tailwind Transition */}
      <section id="story-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ED1D24] mb-2 font-outfit">
              <BookOpen className="w-4 h-4" />
              Thư Viện Ấn Phẩm Marvel
            </div>
            <h2 className="font-italiana text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-wide leading-tight">
              Khám Phá Toàn Bộ Tác Phẩm
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-outfit font-light max-w-xl">
              Đọc trực tuyến các đầu truyện Marvel chính hãng có bản quyền từ Comic Vine, phân loại đa chiều theo trạng thái và chính sách phát hành.
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-outfit whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-[#1A1A22] text-sm text-gray-200 border border-[#2A2A38] rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#ED1D24] font-outfit shadow-sm"
            >
              <option value="views">Lượt xem nhiều nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="latest">Mới cập nhật</option>
              <option value="year">Năm phát hành</option>
              <option value="title">Tên truyện (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Subtle Marvel Red Gradient Divider */}
        <div className="marvel-divider mt-6 mb-8" />

        {/* Filter Controls Bar */}
        <div className="bg-[#1A1A22]/90 backdrop-blur-md p-5 rounded-2xl border border-[#2A2A38] mb-8 space-y-4 shadow-xl">
          
          {/* Top row: Search input & Status + Policy Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <form onSubmit={handleSearchSubmit} className="lg:col-span-5 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm siêu anh hùng (Spider-Man, Avengers, Iron Man...)"
                className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-10 pr-12 py-2.5 rounded-xl border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-gray-500 hover:text-white"
                >
                  Xóa
                </button>
              )}
            </form>

            {/* Status Tabs */}
            <div className="lg:col-span-4 flex items-center bg-[#0F0F14] p-1 rounded-xl border border-[#2A2A38]">
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
                  selectedStatus === 'all' ? 'bg-[#ED1D24] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('ongoing')}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
                  selectedStatus === 'ongoing' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Đang ra
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('completed')}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
                  selectedStatus === 'completed' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Trọn bộ
              </button>
            </div>

            {/* Policy Select */}
            <div className="lg:col-span-3">
              <select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="w-full bg-[#0F0F14] text-sm text-gray-200 border border-[#2A2A38] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#ED1D24]"
              >
                <option value="all">Tất cả chính sách</option>
                <option value="free">Miễn phí (Free)</option>
                <option value="mixed">Có đọc thử (Mixed)</option>
                <option value="paid">Gói VIP / Trả phí (Paid)</option>
              </select>
            </div>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <span className="text-gray-400 font-semibold whitespace-nowrap mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#ED1D24]" /> Thể loại:
            </span>
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedGenre === ''
                  ? 'bg-[#ED1D24] text-white font-bold shadow-md shadow-[#ED1D24]/30'
                  : 'bg-[#0F0F14] text-gray-400 hover:text-white hover:bg-[#23232E]'
              }`}
            >
              Tất cả
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.slug === selectedGenre ? '' : g.slug)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedGenre === g.slug
                    ? 'bg-[#ED1D24] text-white font-bold shadow-md shadow-[#ED1D24]/30'
                    : 'bg-[#0F0F14] text-gray-400 hover:text-white hover:bg-[#23232E]'
                }`}
              >
                {g.name}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="ml-auto px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-950/30 whitespace-nowrap flex items-center gap-1 border border-red-900/40 transition-colors"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3 h-3" /> Đặt lại
              </button>
            )}
          </div>

          {/* Active Summary */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-[#2A2A38]/50">
            <span>Hiển thị <strong className="text-white font-mono">{stories.length}</strong> / <span className="font-mono">{totalStories}</span> tác phẩm Marvel</span>
            {selectedStatus !== 'all' && (
              <span className="text-[11px] bg-[#23232E] px-2 py-0.5 rounded text-gray-300">
                Lọc trạng thái: {selectedStatus === 'ongoing' ? 'Đang ra' : 'Trọn bộ'}
              </span>
            )}
          </div>

        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#ED1D24]" />
            <p className="text-sm">Đang nạp truyện từ Marvel_db...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-red-300 gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16 bg-[#1A1A22] rounded-2xl border border-[#2A2A38] p-8">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Không tìm thấy truyện phù hợp</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại các bộ lọc trạng thái và thể loại.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-[#ED1D24] text-white text-xs font-semibold rounded-lg hover:bg-[#ff3333] transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {stories.map((story) => (
              <ComicCard key={story.id} story={story} />
            ))}
          </div>
        )}

      </section>
    </div>
  );
};

export default HomePage;
