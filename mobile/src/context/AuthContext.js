import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setUnauthorizedHandler } from '../services/api';
import { saveToken, getToken, removeToken } from '../services/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mySubscription, setMySubscription] = useState(null);
  const [isVip, setIsVip] = useState(false);
  const [purchasedStories, setPurchasedStories] = useState([]);

  const logout = useCallback(async () => {
    await removeToken();
    setToken(null);
    setUser(null);
    setMySubscription(null);
    setIsVip(false);
    setPurchasedStories([]);
  }, []);

  // Đăng ký callback khi gặp mã lỗi 401 ở bất kỳ đâu
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Nạp quyền VIP và danh sách truyện đã mua lẻ
  const loadUserBenefits = useCallback(async () => {
    try {
      const [subRes, purchasedRes] = await Promise.allSettled([
        api.get('/api/payments/my-subscription'),
        api.get('/api/payments/purchased-stories')
      ]);

      if (subRes.status === 'fulfilled' && subRes.value?.success) {
        setMySubscription(subRes.value.subscription || null);
        setIsVip(!!subRes.value.is_vip);
      } else {
        setMySubscription(null);
        setIsVip(false);
      }

      if (purchasedRes.status === 'fulfilled' && purchasedRes.value?.success) {
        setPurchasedStories(purchasedRes.value.purchases || []);
      } else {
        setPurchasedStories([]);
      }
    } catch (err) {
      console.warn('Lỗi khi tải thông tin gói VIP/mua lẻ:', err.message);
    }
  }, []);

  // Khởi động app: kiểm tra token trong SecureStore
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await getToken();
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        setToken(storedToken);

        // Kiểm tra tính hợp lệ của token qua /api/auth/me
        const res = await api.get('/api/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          // Tải thêm thông tin gói VIP và truyện đã mua lẻ
          await loadUserBenefits();
        } else {
          await logout();
        }
      } catch (err) {
        console.warn('Phiên đăng nhập không hợp lệ hoặc lỗi mạng:', err.message);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [loadUserBenefits, logout]);

  // Hàm đăng nhập
  const login = async (loginId, password) => {
    if (!loginId || !loginId.trim()) {
      throw new Error('Vui lòng nhập tài khoản hoặc email.');
    }
    if (!password) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    const res = await api.post('/api/auth/login', {
      loginId: loginId.trim(),
      password
    });

    if (res.success && res.token) {
      await saveToken(res.token);
      setToken(res.token);
      setUser(res.user);
      await loadUserBenefits();
      return res.user;
    }

    throw new Error(res.message || 'Đăng nhập không thành công.');
  };

  /**
   * Kiểm tra quyền đọc của một chương truyện
   * Logic giống Web:
   * 1. Truyện Free -> Mở
   * 2. Chương Đọc Thử (is_preview = true) -> Mở
   * 3. Đã đăng nhập:
   *    - Admin -> Mở
   *    - Có gói VIP còn hạn -> Mở
   *    - Đã mua lẻ bộ truyện này -> Mở
   * 4. Còn lại -> Khóa
   */
  const canAccessChapter = useCallback((story, chapter) => {
    if (!story || !chapter) return false;

    // 1. Truyện Free
    if (story.access_policy === 'free') return true;

    // 2. Chương đọc thử
    if (chapter.is_preview) return true;

    // 3. Nếu chưa đăng nhập -> Khóa
    if (!user) return false;

    // 4. Admin toàn quyền
    if (user.role === 'admin') return true;

    // 5. Gói VIP còn hạn
    if (isVip || mySubscription?.is_active) return true;

    // 6. Đã mua trọn bộ truyện này
    const isOwned = purchasedStories.some(
      (p) => Number(p.story_id) === Number(story.id)
    );
    if (isOwned) return true;

    return false;
  }, [user, isVip, mySubscription, purchasedStories]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isVip,
        mySubscription,
        purchasedStories,
        login,
        logout,
        loadUserBenefits,
        canAccessChapter
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
