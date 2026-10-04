# SPECIFICATION: SPRINT 4 - MUA TRUYỆN LẺ, TIẾN ĐỘ ĐỌC, TƯƠNG TÁC THEO DÕI & KIỂM DUYỆT BÌNH LUẬN

> **Dự án**: Marvel Comics Hub - Nền Tảng Đọc Truyện Tranh Điện Ảnh  
> **Phiên bản**: Sprint 4 (25 Story Points)  
> **Quy tắc vàng**: KHÔNG hiển thị bất kỳ mã số story kỹ thuật nào (dạng US-XX) lên giao diện web.  

---

## 1. Trình Tự Găng Bắt Buộc & Phạm Vi Chức Năng

### Găng 1: Mua Truyện Một Lần & Cổng Thanh Toán Sandbox
- Cung cấp tính năng mua đứt trọn bộ truyện bản quyền riêng lẻ với giá `Story.price`.
- Tích hợp cổng thanh toán Sandbox (VNPay/MoMo) bọc trong Sequelize Transaction bảo đảm toàn vẹn tài chính.
- Nút "Mua Trọn Bộ Truyện Này" trên trang chi tiết truyện (`StoryDetailPage.jsx`) và Paywall đọc chương (`ChapterReaderPage.jsx`).
- Sau khi thanh toán thành công, ghi nhận vào bảng `story_purchases`, mở khóa toàn bộ chương VIP vĩnh viễn (kiểm tra qua middleware `checkReadAccess`).

### Găng 2: Ghi Nhận & Khôi Phục Tiến Độ Đọc (Auto-Resume Reading)
- Bảng CSDL `reading_histories` (hoặc `reading_progress`): Lưu `user_id`, `story_id`, `chapter_id`, `progress_percent`, `scroll_y`, `updated_at`. Khóa kết hợp duy nhất `(user_id, story_id)`.
- Backend API:
  - `POST /api/reading-progress`: Cập nhật tiến độ đọc (debounce lưu khi cuộn trang hoặc chuyển chương).
  - `GET /api/reading-progress/:storyId`: Lấy chương và vị trí đọc gần nhất của truyện.
  - `GET /api/reading-progress`: Lấy danh sách toàn bộ truyện đang đọc dở kèm tiến độ.
- Trình đọc `ChapterReaderPage.jsx`: Tự động cuộn đến đúng vị trí đã dừng khi người dùng mở lại chương truyện; có thông báo "Đã khôi phục vị trí đọc gần nhất (XX%)".
- Trang "Truyện Đang Đọc" (`ReadingHistoryPage.jsx` - `/reading-history`): Hiển thị danh sách truyện đọc dở, thanh progress bar màu đỏ Marvel, nút "Đọc Tiếp" nhảy thẳng vào đúng chapter và vị trí dừng.

### Găng 3: Theo Dõi Truyện & Thông Báo Real-time (Socket.IO + Web Push API)
- Bảng CSDL:
  - `story_follows`: `user_id`, `story_id`, `created_at`.
  - `notifications`: `id`, `user_id`, `title`, `message`, `type`, `link_url`, `is_read`, `created_at`.
- Backend Socket.IO & Notification Service:
  - Khởi tạo Socket.IO trên Express server.
  - Nút "Theo Dõi" / "Đang Theo Dõi" trên `StoryDetailPage.jsx`.
  - API `POST /api/stories/:id/follow` (toggle follow) và `GET /api/stories/:id/follow-status`.
  - Khi Admin đăng chương mới hoặc khi phát hành chapter: Tạo thông báo trong DB cho tất cả followers và phát socket event `new_chapter_notification`.
  - Web Push Notification: Sử dụng HTML5 Notification API trên trình duyệt để hiện pop-up notification khi có sự kiện từ Socket.IO.
- Navbar Notification Bell:
  - Icon Chuông trên thanh Navbar hiển thị badge số lượng thông báo chưa đọc.
  - Dropdown xem danh sách thông báo, bấm vào đánh dấu đã đọc và điều hướng thẳng tới chương mới.

### Găng 4: Khu Vực Thảo Luận Theo Chương & Kiểm Duyệt Bình Luận
- Bảng CSDL `comments`: `id`, `user_id`, `story_id`, `chapter_id`, `content`, `status` (`approved`, `hidden`), `is_reported`, `report_reason`, `likes_count`, `created_at`, `updated_at`.
- Backend API:
  - `GET /api/chapters/:chapterId/comments`: Lấy bình luận đã duyệt.
  - `POST /api/chapters/:chapterId/comments`: Đăng bình luận mới.
  - `POST /api/comments/:id/like`: Thích bình luận.
  - `POST /api/comments/:id/report`: Báo cáo vi phạm / spam.
  - Admin: `GET /api/admin/comments` (lọc báo cáo), `PATCH /api/admin/comments/:id/status` (ẩn/duyệt), `DELETE /api/admin/comments/:id`.
- Frontend UI:
  - Khu vực bình luận trong `ChapterReaderPage.jsx` kết nối API thật, sử dụng Avatar Initials chuẩn Marvel.
  - Trang Quản trị bình luận `AdminCommentsPage.jsx` (`/admin/comments`) cho phép Admin xem báo cáo, ẩn hoặc xóa bình luận vi phạm.

### Tính Năng Song Song:
- **UI Lịch Sử Giao Dịch** (`TransactionHistoryPage.jsx` - `/transactions`):
  - API `GET /api/payments/my-transactions`.
  - Liệt kê toàn bộ lịch sử nạp/mua gói và mua truyện lẻ, số tiền, phương thức, mã đơn hàng, ngày giờ và trạng thái (Thành công / Thất bại).
