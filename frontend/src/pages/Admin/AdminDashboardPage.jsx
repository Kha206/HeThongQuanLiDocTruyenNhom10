import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, BookOpen, Users,
  CheckCircle, AlertTriangle, ShieldX, CreditCard,
  Star, Eye, RefreshCw, Calendar, ArrowUpRight,
  Shield, Layers, MessageSquare, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import api from '../../services/api';
import { getProxiedImageUrl } from '../../utils/imageProxy';

const STATUS_COLORS = {
  active: '#10B981',     // emerald
  restricted: '#F59E0B', // amber
  suspended: '#EF4444'   // red
};

const PAYMENT_COLORS = ['#ED1D24', '#3B82F6', '#10B981', '#8B5CF6'];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30days');

  // Stats Data
  const [overview, setOverview] = useState(null);
  const [revenueMonthly, setRevenueMonthly] = useState([]);
  const [viewsData, setViewsData] = useState({ by_story: [], by_chapter: [] });
  const [topStories, setTopStories] = useState({ top_views: [], top_ratings: [], top_revenue: [] });
  const [usersTxData, setUsersTxData] = useState({
    user_status: [],
    transaction_status: [],
    payment_methods: [],
    user_growth: []
  });

  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('views');

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resOverview, resRev, resViews, resTop, resUsersTx] = await Promise.all([
        api.get('/admin/stats/overview'),
        api.get('/admin/stats/revenue-monthly'),
        api.get(`/admin/stats/views?period=${period}`),
        api.get('/admin/stats/top-stories'),
        api.get('/admin/stats/users-and-transactions')
      ]);

      if (resOverview.success) setOverview(resOverview.data);
      if (resRev.success) setRevenueMonthly(resRev.data || []);
      if (resViews.success) setViewsData(resViews.data || { by_story: [], by_chapter: [] });
      if (resTop.success) setTopStories(resTop.data || { top_views: [], top_ratings: [], top_revenue: [] });
      if (resUsersTx.success) setUsersTxData(resUsersTx.data || {});
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, [period]);

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const formatCompactNumber = (number) => {
    return new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(number || 0);
  };

  // Pie chart data for user status
  const userStatusPieData = (usersTxData.user_status || []).map(item => ({
    name: item.status === 'active' ? 'Hoạt Động' : item.status === 'restricted' ? 'Bị Hạn Chế' : 'Tạm Ngừng',
    status: item.status,
    value: parseInt(item.count, 10)
  }));

  // Pie chart data for payment methods
  const paymentMethodPieData = (usersTxData.payment_methods || []).map(item => ({
    name: item.payment_method?.toUpperCase() || 'KHÁC',
    value: parseInt(item.count, 10),
    amount: parseFloat(item.total_amount || 0)
  }));

  return (
    <div className="min-h-screen bg-[#0F0F14] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Quick Links */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#2A2A38] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ED1D24] mb-1">
              <Shield className="w-4 h-4" /> Bảng Điều Khiển Quản Trị
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Thống Kê & Báo Cáo Toàn Diện
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Dữ liệu thời gian thực được tổng hợp từ doanh thu, người dùng và lượt đọc thực tế trong hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={fetchAllStats}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ED1D24]' : ''}`} />
              <span>Làm Mới</span>
            </button>

            <Link
              to="/admin/users"
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Thành Viên</span>
            </Link>

            <Link
              to="/admin/stories"
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#ED1D24]" />
              <span>Kho Truyện</span>
            </Link>

            <Link
              to="/admin/plans"
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>Gói VIP</span>
            </Link>

            <Link
              to="/admin/comments"
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1A1A22] hover:bg-[#23232E] border border-[#2A2A38] rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bình Luận</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center justify-between text-sm text-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchAllStats}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
            >
              Thử Lại
            </button>
          </div>
        )}

        {/* SECTION 1: KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Tổng Doanh Thu */}
          <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 relative overflow-hidden group hover:border-[#ED1D24]/50 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ED1D24]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-3">
              <span>Tổng Doanh Thu Tích Lũy</span>
              <div className="w-8 h-8 rounded-xl bg-[#ED1D24]/20 flex items-center justify-center text-[#ED1D24]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white">
              {formatVND(overview?.revenue?.total)}
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2A38]/50 flex items-center justify-between text-[11px] text-gray-400">
              <span>Gói VIP: <strong className="text-amber-400 font-mono">{formatCompactNumber(overview?.revenue?.subscription)}đ</strong></span>
              <span>Mua lẻ: <strong className="text-emerald-400 font-mono">{formatCompactNumber(overview?.revenue?.story_purchase)}đ</strong></span>
            </div>
          </div>

          {/* Card 2: Doanh Thu Tháng Này */}
          <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-3">
              <span>Doanh Thu Tháng Này</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-400 font-mono">
              {formatVND(overview?.revenue?.monthly)}
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2A38]/50 flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> GD hoàn tất
              </span>
              <span className="text-emerald-300 font-bold">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Card 3: Lượt Đọc & Nội Dung */}
          <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-3">
              <span>Tổng Lượt Đọc</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white font-mono">
              {(overview?.reading?.total_views || 0).toLocaleString('vi-VN')}
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2A38]/50 flex items-center justify-between text-[11px] text-gray-400">
              <span>{overview?.content?.stories || 0} Truyện</span>
              <span>{overview?.content?.chapters || 0} Chương</span>
              <span>{overview?.reading?.total_sessions || 0} Lượt lưu tiến trình</span>
            </div>
          </div>

          {/* Card 4: Thành Viên & Giao Dịch */}
          <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-3">
              <span>Thành Viên & Tỷ Lệ GD</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{overview?.users?.total || 0}</span>
              <span className="text-xs font-semibold text-emerald-400">
                ({overview?.transactions?.success_rate || 100}% GD thành công)
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2A38]/50 flex items-center justify-between text-[11px] text-gray-400">
              <span className="text-emerald-400">● {overview?.users?.active || 0} Hoạt động</span>
              <span className="text-amber-400">● {overview?.users?.restricted || 0} Hạn chế</span>
              <span className="text-red-400">● {overview?.users?.suspended || 0} Tạm ngừng</span>
            </div>
          </div>

        </div>

        {/* SECTION 2: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Doanh thu 12 tháng gần nhất (Span 2 cols) */}
          <div className="lg:col-span-2 bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#ED1D24]" />
                  Doanh Thu 12 Tháng Gần Nhất
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Phân bổ doanh thu từ Gói Hội Viên VIP và Mua truyện lẻ (VNĐ)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ED1D24]" />
                  <span className="text-gray-300">Gói Hội Viên</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-gray-300">Mua Truyện Lẻ</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ED1D24" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ED1D24" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorStory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" vertical={false} />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(v) => formatCompactNumber(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A22', borderColor: '#2A2A38', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val, name) => [
                      formatVND(val),
                      name === 'subscription' ? 'Gói Hội Viên' : name === 'story_purchase' ? 'Mua Truyện Lẻ' : 'Tổng Doanh Thu'
                    ]}
                    labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="subscription" stroke="#ED1D24" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
                  <Area type="monotone" dataKey="story_purchase" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorStory)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Distribution & Transactions Pie (Span 1 col) */}
          <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-purple-400" />
                Cơ Cấu Thành Viên
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Phân bổ trạng thái tài khoản người đọc trong cơ sở dữ liệu
              </p>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              {userStatusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userStatusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {userStatusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A22', borderColor: '#2A2A38', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val) => [`${val} tài khoản`, 'Số lượng']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-gray-500">Chưa có dữ liệu thành viên</div>
              )}
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-[#2A2A38]/50">
              {userStatusPieData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] }} />
                    <span className="text-gray-300">{entry.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 3: VIEWS STATS & GROWTH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Views by Story Filtered (Span 2 cols) */}
          <div className="lg:col-span-2 bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Lượt Đọc Theo Truyện (Tiến trình đọc)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Thống kê các truyện có nhiều lượt lưu tiến trình đọc nhất theo khoảng thời gian
                </p>
              </div>

              {/* Period Filter Selector */}
              <div className="flex items-center bg-[#1A1A22] border border-[#2A2A38] rounded-xl p-1 text-xs">
                <button
                  onClick={() => setPeriod('7days')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    period === '7days' ? 'bg-[#ED1D24] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  7 Ngày
                </button>
                <button
                  onClick={() => setPeriod('30days')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    period === '30days' ? 'bg-[#ED1D24] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  30 Ngày
                </button>
                <button
                  onClick={() => setPeriod('year')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    period === 'year' ? 'bg-[#ED1D24] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Năm Nay
                </button>
                <button
                  onClick={() => setPeriod('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    period === 'all' ? 'bg-[#ED1D24] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tất Cả
                </button>
              </div>
            </div>

            {viewsData.by_story.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewsData.by_story.slice(0, 7)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" vertical={false} />
                    <XAxis
                      dataKey="title"
                      stroke="#6B7280"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      tick={({ x, y, payload }) => (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={0} dy={14} textAnchor="end" fill="#9CA3AF" fontSize={10} transform="rotate(-20)">
                            {payload.value.length > 15 ? `${payload.value.substring(0, 15)}...` : payload.value}
                          </text>
                        </g>
                      )}
                    />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A22', borderColor: '#2A2A38', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val) => [`${val} lượt đọc`, 'Lượt đọc']}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="read_count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-gray-500 border border-dashed border-[#2A2A38] rounded-xl">
                Chưa có dữ liệu lượt đọc trong khoảng thời gian này.
              </div>
            )}
          </div>

          {/* User Growth Line Chart (Span 1 col) */}
          <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Tăng Trưởng Thành Viên Mới
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Số lượng tài khoản độc giả đăng ký 6 tháng gần nhất
              </p>
            </div>

            <div className="h-48 w-full">
              {usersTxData.user_growth && usersTxData.user_growth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usersTxData.user_growth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" vertical={false} />
                    <XAxis dataKey="month_key" stroke="#6B7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A22', borderColor: '#2A2A38', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val) => [`+${val} thành viên`, 'Đăng ký mới']}
                    />
                    <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  Chưa có dữ liệu tăng trưởng.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2A2A38]/50 flex items-center justify-between text-xs text-gray-400">
              <span>Độc giả mới:</span>
              <span className="font-bold text-white font-mono">
                +{(usersTxData.user_growth || []).reduce((acc, c) => acc + parseInt(c.count || 0, 10), 0)} tài khoản
              </span>
            </div>
          </div>

        </div>

        {/* SECTION 4: LEADERBOARDS & RANKINGS */}
        <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A2A38] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Bảng Xếp Hạng Nội Dung Nổi Bật
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Xếp hạng dựa trên dữ liệu thật: lượt đọc, đánh giá sao từ độc giả và doanh thu mua truyện
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex items-center bg-[#1A1A22] border border-[#2A2A38] rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveLeaderboardTab('views')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
                  activeLeaderboardTab === 'views' ? 'bg-[#ED1D24] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Lượt Đọc Nhiều
              </button>
              <button
                onClick={() => setActiveLeaderboardTab('ratings')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
                  activeLeaderboardTab === 'ratings' ? 'bg-[#ED1D24] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5" /> Đánh Giá Cao Nhất
              </button>
              <button
                onClick={() => setActiveLeaderboardTab('revenue')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
                  activeLeaderboardTab === 'revenue' ? 'bg-[#ED1D24] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Doanh Thu Cao Nhất
              </button>
            </div>
          </div>

          {/* TAB 1: TOP VIEWS */}
          {activeLeaderboardTab === 'views' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-[#2A2A38] pb-3 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-4">Truyện</th>
                    <th className="py-3 px-4">Chính Sách</th>
                    <th className="py-3 px-4 text-right">Lượt Xem Toàn Bộ</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A38]/50">
                  {topStories.top_views.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">Chưa có dữ liệu xếp hạng</td>
                    </tr>
                  ) : (
                    topStories.top_views.map((story, idx) => (
                      <tr key={story.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-bold font-mono">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            idx === 0 ? 'bg-amber-400 text-black font-extrabold' :
                            idx === 1 ? 'bg-gray-300 text-black font-bold' :
                            idx === 2 ? 'bg-amber-700 text-white font-bold' : 'text-gray-500'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProxiedImageUrl(story.cover_image)}
                              alt={story.title}
                              className="w-10 h-14 object-cover rounded-md border border-[#2A2A38]"
                              onError={(e) => { e.currentTarget.src = '/placeholder-cover.svg'; }}
                            />
                            <div>
                              <p className="font-bold text-white text-sm line-clamp-1">{story.title}</p>
                              <p className="text-gray-400 text-[11px] font-mono">ID: {story.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            story.access_policy === 'free' ? 'bg-blue-500/20 text-blue-400' :
                            story.access_policy === 'vip' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {story.access_policy}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-400 text-sm">
                          {(story.view_count || 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            to={`/stories/${story.id}`}
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-[#1A1A22] transition-colors"
                          >
                            <span>Xem</span> <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: TOP RATINGS */}
          {activeLeaderboardTab === 'ratings' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-[#2A2A38] pb-3 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-4">Truyện</th>
                    <th className="py-3 px-4 text-center">Điểm Trung Bình (Thật)</th>
                    <th className="py-3 px-4 text-center">Số Lượt Đánh Giá</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A38]/50">
                  {topStories.top_ratings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">Chưa có truyện nào được đánh giá</td>
                    </tr>
                  ) : (
                    topStories.top_ratings.map((story, idx) => {
                      const avg = story.getDataValue ? story.getDataValue('average_rating') : story.average_rating;
                      const count = story.getDataValue ? story.getDataValue('rating_count') : story.rating_count;
                      return (
                        <tr key={story.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 font-bold font-mono">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                              idx === 0 ? 'bg-amber-400 text-black font-extrabold' :
                              idx === 1 ? 'bg-gray-300 text-black font-bold' :
                              idx === 2 ? 'bg-amber-700 text-white font-bold' : 'text-gray-500'
                            }`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getProxiedImageUrl(story.cover_image)}
                                alt={story.title}
                                className="w-10 h-14 object-cover rounded-md border border-[#2A2A38]"
                                onError={(e) => { e.currentTarget.src = '/placeholder-cover.svg'; }}
                              />
                              <div>
                                <p className="font-bold text-white text-sm line-clamp-1">{story.title}</p>
                                <p className="text-gray-400 text-[11px] font-mono">ID: {story.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {avg ? (
                              <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-lg font-bold font-mono">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{Number(avg).toFixed(1)} / 5</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">Chưa có đánh giá</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-gray-300">
                            {count || 0} lượt
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              to={`/stories/${story.id}`}
                              className="inline-flex items-center gap-1 text-gray-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-[#1A1A22] transition-colors"
                            >
                              <span>Xem</span> <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: TOP REVENUE */}
          {activeLeaderboardTab === 'revenue' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-[#2A2A38] pb-3 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-4">Truyện</th>
                    <th className="py-3 px-4 text-center">Giá Bán Lẻ</th>
                    <th className="py-3 px-4 text-center">Số Lượt Mua</th>
                    <th className="py-3 px-4 text-right">Tổng Doanh Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A38]/50">
                  {topStories.top_revenue.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">Chưa có lượt mua truyện lẻ nào</td>
                    </tr>
                  ) : (
                    topStories.top_revenue.map((item, idx) => (
                      <tr key={item.story_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-bold font-mono">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            idx === 0 ? 'bg-amber-400 text-black font-extrabold' :
                            idx === 1 ? 'bg-gray-300 text-black font-bold' :
                            idx === 2 ? 'bg-amber-700 text-white font-bold' : 'text-gray-500'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProxiedImageUrl(item.cover_image)}
                              alt={item.title}
                              className="w-10 h-14 object-cover rounded-md border border-[#2A2A38]"
                              onError={(e) => { e.currentTarget.src = '/placeholder-cover.svg'; }}
                            />
                            <div>
                              <p className="font-bold text-white text-sm line-clamp-1">{item.title}</p>
                              <p className="text-gray-400 text-[11px] font-mono">ID: {item.story_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-gray-300">
                          {formatVND(item.price)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                          {item.purchase_count} lượt mua
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-400 text-sm">
                          {formatVND(item.total_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
