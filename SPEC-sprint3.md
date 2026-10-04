# SPEC: SPRINT 3 - Quyền Đọc Kết Hợp, Thanh Toán Sandbox & Trình Đọc Chương Trả Phí (25 Story Points)

## 1. Mục Tiêu & Trình Tự Găng Bắt Buộc
Sprint 3 tập trung giải quyết bài toán cốt lõi và nhạy cảm nhất về quyền truy cập nội dung và tính toàn vẹn tài chính theo chuẩn mực phần mềm nâng cao:

### Trình Tự Găng (Critical Path):
1. **Giai đoạn 1 (Cốt lõi - Bắt buộc hoàn thành trước):**
   - Thiết kế CSDL: Bảng `subscriptions`, `story_purchases`, `payments` và các quan hệ với `users`, `stories`, `subscription_plans`.
   - **Middleware kiểm tra quyền đọc kết hợp (`checkReadAccess`) (US-26):**
     - Độc giả được đọc chương trả phí nếu: Sở hữu gói hội viên tháng còn hạn (`end_date >= NOW()`) **HOẶC** đã mua riêng bộ truyện đó (`status = 'completed'`).
     - Có cờ xử lý chống thu phí trùng (nếu có cả 2 điều kiện thì không trừ tiền/kích hoạt 2 lần).
     - Chương miễn phí (`access_policy = 'free'`) hoặc chương đọc thử (`is_preview = true`) luôn mở tự do cho mọi độc giả không cần gói/mua.
   - **Bộ Unit Test độc lập 100% test cases cho middleware (BẮT BUỘC):**
     - Case 1: Chương free/preview -> Allowed không cần auth.
     - Case 2: Chương VIP + Chưa login -> 401 Unauthorized.
     - Case 3: Chương VIP + Đã login nhưng không có gói & chưa mua -> 403 Payment Required.
     - Case 4: Chương VIP + Gói đã hết hạn (`end_date < now`) & chưa mua -> 403 Payment Required.
     - Case 5: Chương VIP + CHỈ CÓ gói còn hạn -> 200 Allowed (via subscription).
     - Case 6: Chương VIP + CHỈ ĐÃ MUA truyện đó -> 200 Allowed (via purchase).
     - Case 7: Chương VIP + CÓ CẢ HAI (gói còn hạn VÀ đã mua truyện) -> 200 Allowed (via both, không thu phí trùng).
     - Case 8: Admin -> Luôn Allowed.
2. **Giai đoạn 2 (Tích hợp Thanh toán Sandbox & DB Transaction) (US-08):**
   - API tạo checkout và xử lý thanh toán VNPay / MoMo Sandbox.
   - Toàn bộ thao tác cập nhật tiền và quyền bọc trong `sequelize.transaction()`.
   - Kiểm thử rollback khi có lỗi xảy ra để đảm bảo không lệch tiền - quyền.
   - Hỗ trợ gia hạn gói (`end_date = old_end_date + days`) khi người dùng đã có gói còn hạn.
3. **Giai đoạn 3 (UI Đăng ký / Gia hạn gói đọc tháng) (US-27, US-28):**
   - Nâng cấp `SubscriptionsPage.jsx` với modal chọn cổng thanh toán Sandbox (VNPay / MoMo).
   - Xử lý gia hạn gói, hiển thị trạng thái VIP còn lại của người dùng.
4. **Giai đoạn 4 (UI Đọc chương trả phí & Chặn quyền) (US-25):**
   - Nâng cấp `ChapterReaderPage.jsx` kết nối với middleware `checkReadAccess`.
   - Hiển thị Paywall Marvel điện ảnh khi gặp 403, cung cấp 2 lựa chọn: Mua VIP tháng hoặc Mua lẻ truyện.
5. **Giai đoạn 5 (UI Danh sách truyện đã mua) (US-31):**
   - Xây dựng trang `PurchasedStoriesPage.jsx` hiển thị toàn bộ truyện đã mua bản quyền riêng.
   - Tích hợp link vào User menu trên Navbar.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu MySQL

### Bảng `payments`
```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('vnpay', 'momo', 'sandbox') DEFAULT 'vnpay',
  payment_type ENUM('subscription', 'story_purchase') NOT NULL,
  item_id INT NOT NULL COMMENT 'ID của SubscriptionPlan hoặc Story',
  transaction_code VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  payment_details JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Bảng `subscriptions`
```sql
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  payment_id INT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);
```

### Bảng `story_purchases`
```sql
CREATE TABLE story_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  payment_id INT NULL,
  price_paid DECIMAL(12, 2) NOT NULL,
  status ENUM('completed', 'refunded') DEFAULT 'completed',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_user_story (user_id, story_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);
```

---

## 3. Definition of Done (DoD) Cho Sprint 3
1. **Middleware Quyền Đọc:**
   - Đạt 100% pass trên bộ unit test riêng biệt.
   - Tuyệt đối không thu phí trùng khi user có cả 2 quyền.
2. **Giao Dịch DB Transaction:**
   - Mọi luồng mua gói / mua truyện đều dùng `sequelize.transaction()`.
   - Giả lập lỗi ở bước kích hoạt quyền phải rollback trạng thái giao dịch, không để dữ liệu tiền - quyền lệch nhau.
3. **Thanh Toán Sandbox:**
   - Đăng ký mới và gia hạn gói đọc thành công qua cổng Sandbox.
   - Mua truyện lẻ thành công qua cổng Sandbox.
4. **Trình Đọc Chương Trả Phí:**
   - Mở khóa đọc đầy đủ khi đủ quyền.
   - Chặn quyền với màn hình Paywall Marvel điện ảnh khi thiếu quyền.
5. **Giao Diện Độc Giả:**
   - Xem được hạn gói VIP hiện tại trên `SubscriptionsPage`.
   - Xem được danh sách truyện đã mua trên `PurchasedStoriesPage`.
6. Không phát sinh lỗi console ở cả Backend và Frontend.
