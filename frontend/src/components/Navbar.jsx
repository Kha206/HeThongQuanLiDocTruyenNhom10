import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, LogOut, ShieldAlert, Menu, X, Sparkles,
  CreditCard, Crown, BookOpen, Bell, CheckCheck,
  Clock, MessageSquare, History
} from 'lucide-react';
import Avatar from './Avatar';
import api from '../services/api';
import socket, { joinUserRoom, requestPushPermission, showWebNotification } from '../services/socket';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
      joinUserRoom(user.id);

      // Listen for personal notification
      const handleNewNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        showWebNotification(notif.title, { body: notif.message });
      };

      // Listen for new chapter broadcast
      const handleNewChapter = (data) => {
        showWebNotification(`Chương mới: ${data.storyTitle}`, {
          body: `Chương ${data.chapter.chapter_number}: ${data.chapter.title} đã sẵn sàng!`
        });
        fetchNotifications();
      };

      socket.on('new_notification', handleNewNotification);
      socket.on('new_chapter_published', handleNewChapter);

      return () => {
        socket.off('new_notification', handleNewNotification);
        socket.off('new_chapter_published', handleNewChapter);
      };
    }
  }, [isAuthenticated, user?.id]);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    setNotificationOpen(false);
    if (notif.link_url) {
      navigate(notif.link_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleBellToggle = () => {
    setNotificationOpen(!notificationOpen);
    setDropdownOpen(false);
    // Request push permission on interaction
    requestPushPermission();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}#story-catalog`);
    }
  };

  const handleHomeClick = () => {
    if (location.pathname === '/' || location.pathname === '/stories') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStoriesClick = () => {
    if (location.pathname === '/' || location.pathname === '/stories') {
      const el = document.getElementById('story-catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleHero3DClick = () => {
    if (location.pathname === '/' || location.pathname === '/stories') {
      const el = document.getElementById('hero-3d');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F0F14]/90 backdrop-blur-md border-b border-[#2A2A38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link to="/" onClick={handleHomeClick} className="flex items-center group">
            <span className="bg-[#ED1D24] text-white font-extrabold text-xl px-2.5 py-1 tracking-tighter uppercase transition-transform group-hover:scale-105 duration-200">
              MARVEL
            </span>
            <span className="ml-2 font-bold tracking-wider text-sm text-gray-200 uppercase hidden sm:inline">
              COMICS HUB
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-300">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={`hover:text-[#ED1D24] transition-colors ${location.pathname === '/' && !location.hash ? 'text-white font-semibold' : ''}`}
            >
              Trang Chủ
            </Link>
            <Link
              to="/stories"
              onClick={handleStoriesClick}
              className={`hover:text-[#ED1D24] transition-colors ${location.pathname === '/stories' || location.hash === '#story-catalog' ? 'text-white font-semibold' : ''}`}
            >
              Kho Truyện
            </Link>
            <Link
              to="/subscriptions"
              className={`hover:text-[#ED1D24] transition-colors flex items-center gap-1.5 ${location.pathname === '/subscriptions' ? 'text-amber-400 font-bold' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gói Hội Viên</span>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                VIP
              </span>
            </Link>
            <Link
              to="/#hero-3d"
              onClick={handleHero3DClick}
              className="hover:text-[#4D6FFF] transition-colors flex items-center gap-1 text-blue-400"
            >
              <Sparkles className="w-3.5 h-3.5" /> Vũ Trụ 3D
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center relative max-w-xs w-full mx-4">
          <input
            type="text"
            placeholder="Tìm kiếm siêu anh hùng, arc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A22] text-sm text-gray-200 placeholder-gray-500 pl-9 pr-4 py-1.5 rounded-full border border-[#2A2A38] focus:outline-none focus:border-[#ED1D24] transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
        </form>

        {/* Right Section: Notification, Auth & Profile */}
        <div className="flex items-center space-x-3">
          
          {/* Notification Bell */}
          {isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={handleBellToggle}
                className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-[#1A1A22] transition-colors"
                title="Thông báo mới"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ED1D24] text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div
                  onMouseLeave={() => setNotificationOpen(false)}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1A1A22] border border-[#2A2A38] rounded-2xl shadow-2xl z-50 text-xs overflow-hidden animate-fade-in"
                >
                  <div className="p-3.5 border-b border-[#2A2A38] flex items-center justify-between bg-[#14141B]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#ED1D24]" />
                      <span className="font-bold text-white text-sm">Thông Báo</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ED1D24]/20 text-[#ED1D24] text-[10px] font-bold">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Đã đọc tất cả</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#2A2A38]/50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                        <p>Không có thông báo mới nào</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-white/5 cursor-pointer transition-colors flex items-start gap-3 ${
                            !n.is_read ? 'bg-[#ED1D24]/5' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            !n.is_read ? 'bg-[#ED1D24]' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-xs line-clamp-1">{n.title}</h4>
                            <p className="text-gray-300 text-[11px] line-clamp-2 mt-0.5 leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                              {new Date(n.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Dropdown */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); setNotificationOpen(false); }}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-[#1A1A22] transition-colors border border-transparent hover:border-[#2A2A38]"
              >
                <Avatar user={user} size="sm" />
                <span className="hidden sm:inline text-sm font-medium text-gray-200 max-w-[120px] truncate">
                  {user?.full_name || user?.username}
                </span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-64 bg-[#1A1A22] border border-[#2A2A38] rounded-xl shadow-2xl py-2 z-50 text-sm"
                >
                  <div className="px-4 py-3 border-b border-[#2A2A38]/50 flex items-center gap-3">
                    <Avatar user={user} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate text-sm">{user?.full_name || user?.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-[#ED1D24]/20 text-[#ED1D24]">
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 border-b border-[#2A2A38]/50">
                    <Link
                      to="/reading-history"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-[#ED1D24] transition-colors"
                    >
                      <BookOpen className="w-4 h-4 mr-2 text-[#ED1D24]" />
                      Truyện Đang Đọc
                    </Link>
                    <Link
                      to="/purchased-stories"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-amber-400 transition-colors"
                    >
                      <Crown className="w-4 h-4 mr-2 text-amber-400" />
                      Tủ Sách Đã Mua
                    </Link>
                    <Link
                      to="/transactions"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-emerald-400 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 mr-2 text-emerald-400" />
                      Lịch Sử Giao Dịch
                    </Link>
                    <Link
                      to="/subscriptions"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-amber-400 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
                      Gói Đọc Của Tôi
                    </Link>
                  </div>

                  {isAdmin && (
                    <div className="py-1 border-b border-[#2A2A38]/50">
                      <Link
                        to="/admin/stories"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-[#ED1D24] transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2 text-[#ED1D24]" />
                        Quản Trị Truyện
                      </Link>
                      <Link
                        to="/admin/chapters"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-emerald-400 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 mr-2 text-emerald-400" />
                        Quản Lý Chương Truyện
                      </Link>
                      <Link
                        to="/admin/plans"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-amber-400 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 mr-2 text-amber-400" />
                        Quản Trị Gói Đọc VIP
                      </Link>
                      <Link
                        to="/admin/comments"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#23232E] hover:text-cyan-400 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 mr-2 text-cyan-400" />
                        Kiểm Duyệt Bình Luận
                      </Link>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-red-400 hover:bg-[#23232E] transition-colors border-t border-[#2A2A38]/50 mt-1"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng Xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1A1A22] transition-colors"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-[#ED1D24] hover:bg-[#ff3333] text-white px-3.5 py-1.5 rounded-lg shadow-md transition-all duration-200"
              >
                Đăng Ký
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1A1A22] border-b border-[#2A2A38] px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F0F14] text-sm text-gray-200 pl-9 pr-4 py-2 rounded-lg border border-[#2A2A38]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </form>

          {isAuthenticated && (
            <div className="flex items-center gap-3 p-2.5 bg-[#0F0F14] rounded-xl border border-[#2A2A38]">
              <Avatar user={user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || user?.username}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link to="/" onClick={() => { setMobileMenuOpen(false); handleHomeClick(); }} className="py-1 text-gray-300 hover:text-[#ED1D24]">
              Trang Chủ
            </Link>
            <Link to="/stories" onClick={() => { setMobileMenuOpen(false); handleStoriesClick(); }} className="py-1 text-gray-300 hover:text-[#ED1D24]">
              Kho Truyện
            </Link>
            <Link to="/#hero-3d" onClick={() => { setMobileMenuOpen(false); handleHero3DClick(); }} className="py-1 text-blue-400 hover:text-[#4D6FFF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Vũ Trụ 3D
            </Link>
            <Link to="/subscriptions" onClick={() => setMobileMenuOpen(false)} className="py-1 text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Gói Hội Viên VIP
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/reading-history" onClick={() => setMobileMenuOpen(false)} className="py-1 text-gray-200 hover:text-[#ED1D24] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#ED1D24]" /> Truyện Đang Đọc
                </Link>
                <Link to="/purchased-stories" onClick={() => setMobileMenuOpen(false)} className="py-1 text-gray-200 hover:text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Tủ Sách Đã Mua
                </Link>
                <Link to="/transactions" onClick={() => setMobileMenuOpen(false)} className="py-1 text-gray-200 hover:text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Lịch Sử Giao Dịch
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link to="/admin/stories" onClick={() => setMobileMenuOpen(false)} className="py-1 text-[#ED1D24]">
                  Quản Trị Truyện
                </Link>
                <Link to="/admin/chapters" onClick={() => setMobileMenuOpen(false)} className="py-1 text-emerald-400">
                  Quản Lý Chương Truyện
                </Link>
                <Link to="/admin/plans" onClick={() => setMobileMenuOpen(false)} className="py-1 text-amber-400">
                  Quản Trị Gói Đọc VIP
                </Link>
                <Link to="/admin/comments" onClick={() => setMobileMenuOpen(false)} className="py-1 text-cyan-400">
                  Kiểm Duyệt Bình Luận
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
