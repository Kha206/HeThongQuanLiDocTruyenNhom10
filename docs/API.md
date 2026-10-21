# TÀI LIỆU TOÀN DIỆN BACKEND API & ĐÁNH GIÁ SẴN SÀNG CHO MOBILE
**Dự án:** Marvel Comic Platform (Nhóm 10)  
**Cơ sở dữ liệu:** MySQL (`marvel_db`) + Sequelize ORM  
**Host lắng nghe:** `0.0.0.0:5000` (Hỗ trợ truy cập mạng nội bộ LAN, Android Emulator `10.0.2.2`, iOS Simulator, thiết bị vật lý cùng mạng Wi-Fi)

---

## 1. TỔNG QUAN HẠ TẦNG VÀ CƠ CHẾ KẾT NỐI CHO MOBILE

### 1.1. Địa chỉ truy cập Backend
- **Từ máy chủ phát triển (Localhost):** `http://localhost:5000`
- **Từ Android Emulator (AVD mặc định):** `http://10.0.2.2:5000`
- **Từ iOS Simulator:** `http://localhost:5000` hoặc IP mạng LAN
- **Từ điện thoại thật kết nối cùng Wi-Fi:** `http://<IP_LAN_CUA_MAY_TINH>:5000` (Ví dụ: `http://192.168.1.43:5000`)

### 1.2. Cấu hình CORS & Xác thực phía Mobile
- **CORS:** Backend đã được tinh chỉnh cho phép các request không có header `Origin` của trình duyệt (chuẩn hành vi của Flutter `http`/`dio`, React Native `fetch`/`axios`, Android/iOS Native HTTP Client) và phản hồi `Access-Control-Allow-Origin: *` cho các yêu cầu qua mạng nội bộ.
- **Xác thực:** Sử dụng Bearer Token (JWT). Các request cần xác thực gửi header:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Tải ảnh an toàn (Chống chặn CORS / Hotlink):** Mọi URL ảnh bìa, avatar từ ComicVine hoặc bên ngoài được nạp qua route proxy:
  ```http
  GET /api/image-proxy?url=<ENCODED_IMAGE_URL>
  ```
  Route hỗ trợ cache đĩa tự động, trả về đúng định dạng binary (`image/jpeg`, `image/png`, `image/webp`) và fallback vector SVG nếu ComicVine từ chối.

---

## 2. LUỒNG THANH TOÁN MÔ PHỎNG (SANDBOX PAYMENT FLOW)

### 2.1. Phân tích luồng thực tế trên Web hiện tại
Hệ thống hiện tại tích hợp cổng thanh toán mô phỏng Sandbox (chuẩn bị sẵn cấu trúc tích hợp VNPay / MoMo) với kiến trúc 2 bước an toàn:

1. **Bước 1: Khởi tạo đơn thanh toán (Checkout)**
   - **Client gọi:** `POST /api/payments/checkout`
   - **Xác thực:** Bắt buộc đăng nhập (`Bearer Token`).
   - **Tham số gửi lên (Body JSON):**
     - `payment_type`: `"subscription"` (mua gói thành viên) hoặc `"story_purchase"` (mua đứt bộ truyện).
     - `item_id`: ID của gói (`plan_id`) hoặc ID của truyện (`story_id`).
     - `payment_method`: `"vnpay"` | `"momo"` | `"sandbox"` (mặc định `"sandbox"`).
   - **Xử lý Backend:**
     - Kiểm tra trạng thái tài khoản: Nếu tài khoản bị giới hạn (`restricted`) hoặc tạm ngừng (`suspended`) sẽ từ chối giao dịch.
     - Kiểm tra chống mua trùng: Nếu đã sở hữu truyện bản quyền trước đó, hệ thống từ chối tạo đơn mới.
     - Tạo bản ghi trong bảng `payments` với trạng thái `pending` và mã giao dịch duy nhất:
       `[METHOD]_[TIMESTAMP]_[RANDOM4DIGIT]` (Ví dụ: `VNPAY_1792498800123_4821`).
   - **Phản hồi từ Backend:**
     - HTTP 201 Created kèm mã `transactionCode`, số tiền `amount`, tiêu đề sản phẩm `itemTitle`.

2. **Bước 2: Giao diện mô phỏng (Payment Modal)**
   - **Hành vi trên Web:**
     - Web **KHÔNG redirect** người dùng sang URL của bên thứ ba nào (như cổng VNPay/MoMo thật).
     - Thay vào đó, Web mở giao diện hộp thoại mô phỏng (`PaymentModal.jsx`), hiển thị:
       - Mã QR mô phỏng.
       - Mã giao dịch thử nghiệm (`transactionCode`).
       - Tóm tắt đơn hàng và số tiền.
       - 2 nút bấm hành động:
         - **Nút "Thanh Toán Thành Công"**: Mô phỏng kịch bản người dùng quét mã và thanh toán hợp lệ.
         - **Nút "Hủy / Báo Thất Bại"**: Mô phỏng kịch bản thẻ không đủ số dư, người dùng chủ động hủy hoặc ngân hàng từ chối.

3. **Bước 3: Xác nhận giao dịch & Cấp quyền đọc (Transaction Completion)**
   - **Client gọi:** `POST /api/payments/process-sandbox`
   - **Xác thực:** Bắt buộc đăng nhập (`Bearer Token`).
   - **Tham số gửi lên (Body JSON):**
     - `transaction_code`: Mã giao dịch đã nhận từ Bước 1.
     - `simulate_failure`: `false` (thành công) hoặc `true` (mô phỏng thất bại).
   - **Xử lý Backend (Đảm bảo ACID bằng Sequelize Transaction):**
     - **Nếu `simulate_failure: true`:**
       - Bản ghi `Payment` cập nhật trạng thái `failed`, lưu lý do hủy, **không cấp bất kỳ quyền nào**.
     - **Nếu `simulate_failure: false`:**
       - Bản ghi `Payment` cập nhật trạng thái `completed`.
       - **Kích hoạt quyền đọc ngay lập tức trong cùng 1 Transaction:**
         - Đối với `subscription`: Tìm gói `SubscriptionPlan`. Nếu người dùng đã có gói VIP còn hạn, hệ thống **cộng dồn thời hạn nối tiếp** (gia hạn thêm N ngày). Nếu chưa có, kích hoạt gói mới tính từ thời điểm hiện tại.
         - Đối với `story_purchase`: Thêm bản ghi vào bảng `story_purchases`, mở khóa vĩnh viễn trọn bộ truyện cho người dùng.
       - Nếu có lỗi trong quá trình cấp quyền, toàn bộ thay đổi tiền và quyền đều được Rollback về trạng thái ban đầu (US-08).
   - **Phản hồi:** Trả về `{ success: true, message, payment }`. Web lập tức đóng modal và cập nhật trạng thái giao diện (người dùng trở thành VIP hoặc mở khóa đọc truyện mà không cần reload trang).

### 2.2. Hướng dẫn áp dụng cho Ứng dụng Mobile
Ứng dụng mobile tái sử dụng nguyên vẹn 100% 2 API trên:
- **Màn hình Checkout trên Mobile:** Gọi `POST /api/payments/checkout`, nhận `transactionCode`.
- **Giao diện Thanh toán trên Mobile:** Hiển thị bottom sheet / dialog mô phỏng thanh toán quét QR với 2 nút: "Xác nhận thanh toán thành công" và "Hủy giao dịch".
- **Xác nhận:** Gọi `POST /api/payments/process-sandbox` để hoàn tất và nhận quyền ngay trên mobile.

---

## 3. DANH MỤC CHI TIẾT TẤT CẢ CÁC API HIỆN CÓ

### Bảng Ký Hiệu Đánh Dấu Mobile:
- ✅ **[DÙNG LẠI NGUYÊN]**: API hoàn toàn phù hợp, sẵn sàng gọi ngay từ ứng dụng di động.
- ⚠️ **[CẦN LƯU Ý CHO MOBILE]**: API dùng được nhưng cần chú ý định dạng dữ liệu, kích thước trả về hoặc phương thức upload.
- 🔒 **[ADMIN ONLY]**: Dành riêng cho bảng điều khiển quản trị web, không sử dụng cho mobile độc giả.

---

### Nhóm 1: Hệ Thống, Tiện Ích & Proxy Ảnh

#### 1.1. Kiểm tra trạng thái máy chủ
- **Route:** `GET /api/health`
- **Xác thực:** Không
- **Query Params:** Không
- **Body:** Không
- **Dữ liệu trả về (JSON):**
  ```json
  {
    "status": "OK",
    "uptime": 233.12,
    "timestamp": "2026-10-20T12:03:28.907Z",
    "service": "Marvel Comic Platform API"
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Dùng kiểm tra ping kết nối mạng khi mở app.

#### 1.2. Proxy nạp ảnh chống chặn bản quyền & CORS
- **Route:** `GET /api/image-proxy` (hoặc `GET /api/stories/proxy-image`)
- **Xác thực:** Không
- **Query Params:**
  - `url`: Chuỗi URL ảnh gốc (Cần URL-encode qua `encodeURIComponent`)
- **Body:** Không
- **Headers trả về:**
  - `Content-Type`: `image/jpeg` | `image/png` | `image/webp` | `image/svg+xml`
  - `Cache-Control`: `public, max-age=604800`
  - `Access-Control-Allow-Origin`: `*`
- **Dữ liệu trả về:** Dữ liệu nhị phân của ảnh (Binary Image Stream) hoặc ảnh vector SVG Marvel fallback khi nguồn ảnh ngoài bị chặn.
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Rất quan trọng cho Flutter `Image.network` / React Native `FastImage` để hiển thị ảnh truyện ComicVine mượt mà.

#### 1.3. Phục vụ tệp tĩnh tải lên
- **Route:** `GET /uploads/avatars/:filename`, `GET /uploads/chapters/:filename`
- **Xác thực:** Không
- **Dữ liệu trả về:** File tĩnh trực tiếp.
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

---

### Nhóm 2: Xác Thực & Tài Khoản Người Dùng (`/api/auth`)

#### 2.1. Đăng ký tài khoản
- **Route:** `POST /api/auth/register`
- **Xác thực:** Không
- **Body (JSON):**
  ```json
  {
    "username": "ironman99",
    "email": "tony@stark.com",
    "password": "SecretPassword123",
    "full_name": "Tony Stark"
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 201):**
  ```json
  {
    "success": true,
    "message": "Đăng ký tài khoản thành công!",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 15,
      "username": "ironman99",
      "email": "tony@stark.com",
      "full_name": "Tony Stark",
      "role": "reader",
      "avatar": null
    }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.2. Đăng nhập
- **Route:** `POST /api/auth/login`
- **Xác thực:** Không
- **Body (JSON):**
  ```json
  {
    "loginId": "ironman99", // hoặc email "tony@stark.com"
    "password": "SecretPassword123"
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công!",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 15,
      "username": "ironman99",
      "email": "tony@stark.com",
      "full_name": "Tony Stark",
      "role": "reader",
      "avatar": null,
      "status": "active"
    }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.3. Lấy thông tin tài khoản hiện tại
- **Route:** `GET /api/auth/me`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "user": {
      "id": 15,
      "username": "ironman99",
      "email": "tony@stark.com",
      "full_name": "Tony Stark",
      "role": "reader",
      "avatar": null,
      "status": "active"
    }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.4. Đăng xuất
- **Route:** `POST /api/auth/logout`
- **Xác thực:** Không bắt buộc
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đăng xuất thành công!"
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.5. Đổi mật khẩu
- **Route:** `POST /api/auth/change-password` (hoặc `PUT /api/auth/change-password`)
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "oldPassword": "CurrentPassword123",
    "newPassword": "NewStrongPassword456",
    "confirmPassword": "NewStrongPassword456"
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đổi mật khẩu thành công!"
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.6. Quên mật khẩu (Gửi email)
- **Route:** `POST /api/auth/forgot-password`
- **Xác thực:** Không
- **Body (JSON):**
  ```json
  {
    "email": "tony@stark.com"
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn."
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.7. Đặt lại mật khẩu bằng Token
- **Route:** `POST /api/auth/reset-password`
- **Xác thực:** Không
- **Body (JSON):**
  ```json
  {
    "token": "d748f349c83...",
    "newPassword": "NewStrongPassword456",
    "confirmPassword": "NewStrongPassword456"
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Mật khẩu của bạn đã được đặt lại thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới."
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.8. Cập nhật hồ sơ cá nhân
- **Route:** `PUT /api/auth/profile`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "full_name": "Tony Stark (Iron Man)"
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Cập nhật hồ sơ cá nhân thành công!",
    "user": { ... }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 2.9. Tải lên ảnh đại diện (Avatar)
- **Route:** `POST /api/auth/avatar`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Content-Type:** `multipart/form-data`
- **Body:** Field `avatar` chứa tệp tin ảnh (JPEG/PNG/WEBP, tối đa 5MB)
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Cập nhật ảnh đại diện thành công!",
    "avatar": "/uploads/avatars/avatar-15-1792499123.jpg",
    "avatarUrl": "/uploads/avatars/avatar-15-1792499123.jpg",
    "user": { ... }
  }
  ```
- **Đánh giá Mobile:** ⚠️ **[CẦN LƯU Ý CHO MOBILE]** — Cần gửi dạng `FormData` hoặc `MultipartFile` từ ứng dụng di động. Đường dẫn trả về là đường dẫn tương đối `/uploads/...`, mobile cần ghép nối với Base URL (ví dụ: `http://192.168.1.43:5000/uploads/...`) để hiển thị.

---

### Nhóm 3: Truyện & Thể Loại (`/api/stories`, `/api/genres`)

#### 3.1. Danh sách truyện (Kèm tìm kiếm, lọc, phân trang)
- **Route:** `GET /api/stories`
- **Xác thực:** Không
- **Query Params:**
  - `page`: Số trang (mặc định: `1`)
  - `limit`: Số truyện mỗi trang (mặc định: `12`)
  - `search`: Từ khóa tìm kiếm theo tên hoặc mô tả
  - `genre`: Lọc theo slug hoặc tên thể loại
  - `access_policy`: `'all'` | `'free'` | `'paid'` | `'mixed'`
  - `status`: `'all'` | `'ongoing'` | `'completed'`
  - `sort`: `'latest'` | `'views'` | `'rating'` | `'year'` | `'title'`
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "total": 8,
    "page": 1,
    "totalPages": 1,
    "stories": [
      {
        "id": 1,
        "title": "The Amazing Spider-Man",
        "original_title": "The Amazing Spider-Man (1963)",
        "slug": "the-amazing-spider-man",
        "description": "...",
        "cover_image": "https://comicvine.gamespot.com/...",
        "banner_image": "https://comicvine.gamespot.com/...",
        "publisher": "Marvel Comics",
        "release_year": 1963,
        "status": "ongoing",
        "access_policy": "mixed",
        "price": "49000.00",
        "view_count": 14204,
        "average_rating": "4.5",
        "rating_count": 4,
        "genres": [ { "id": 1, "name": "Action", "slug": "action" } ],
        "chapters": [
          {
            "id": 86,
            "chapter_number": 1,
            "title": "Spider-Man! & The Chameleon Strikes!",
            "is_preview": true,
            "release_date": "1963-03-01"
          }
        ]
      }
    ]
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Hỗ trợ đầy đủ `page` và `limit` cho danh sách cuộn vô tận (Infinite Scroll).

#### 3.2. Danh sách truyện tiêu điểm Hero (Top lượt xem)
- **Route:** `GET /api/stories/hero`
- **Xác thực:** Không
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "stories": [ /* 6 truyện có view_count cao nhất */ ]
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Sử dụng cho Carousel Banner màn hình Home.

#### 3.3. Chi tiết truyện
- **Route:** `GET /api/stories/:id` (hoặc slug)
- **Xác thực:** Không
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "story": {
      "id": 1,
      "title": "The Amazing Spider-Man",
      "genres": [...],
      "chapters": [
        {
          "id": 86,
          "chapter_number": 1,
          "title": "...",
          "is_preview": true,
          "release_date": "1963-03-01",
          "cover_image": "...",
          "accent_color": "#ED1D24"
        }
      ]
    }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 3.4. Ghi nhận lượt xem truyện
- **Route:** `POST /api/stories/:id/view`
- **Xác thực:** Không
- **Dữ liệu trả về:** `{ "success": true, "view_count": 14205 }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 3.5. Đánh giá sao truyện (Rating 1-5 sao)
- **Route:** `POST /api/stories/:id/rate` (hoặc `POST /api/stories/:id/rating`)
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "score": 5
  }
  ```
- **Dữ liệu trả về:** `{ "success": true, "message": "Đánh giá thành công!", "average_rating": "4.6", "rating_count": 5 }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 3.6. Lấy thông tin đánh giá truyện
- **Route:** `GET /api/stories/:id/rating`
- **Xác thực:** Tùy chọn (Nếu kèm Token sẽ trả về `user_rating`)
- **Dữ liệu trả về:**
  ```json
  {
    "success": true,
    "average_rating": "4.6",
    "rating_count": 5,
    "user_rating": 5
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 3.7. Danh sách thể loại
- **Route:** `GET /api/genres`
- **Xác thực:** Không
- **Dữ liệu trả về:** `{ "success": true, "genres": [...] }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

---

### Nhóm 4: Chương Truyện & Kiểm Tra Quyền Đọc

#### 4.1. Chi tiết chương truyện & Nội dung đọc
- **Route:** `GET /api/chapters/:chapterId`
- **Middleware kiểm soát:** `checkReadAccess`
- **Xác thực:**
  - Nếu chương thuộc truyện Miễn phí (`access_policy='free'`) hoặc là chương Đọc thử (`is_preview=true`): **Không cần đăng nhập**.
  - Nếu chương Trả phí: **Bắt buộc gửi Bearer Token**.
- **Kịch bản phản hồi:**
  - **Trường hợp 1: Được phép đọc (HTTP 200 OK):**
    ```json
    {
      "success": true,
      "chapter": {
        "id": 86,
        "chapter_number": 1,
        "title": "Spider-Man! & The Chameleon Strikes!",
        "content": "<p>Nội dung chi tiết chương truyện...</p>",
        "cover_image": "...",
        "accent_color": "#ED1D24",
        "release_date": "1963-03-01",
        "story_id": 1
      },
      "story": { "id": 1, "title": "The Amazing Spider-Man", ... },
      "readAccess": {
        "allowed": true,
        "reason": "preview" // hoặc "free_story" | "subscription" | "purchase" | "both" | "admin"
      }
    }
    ```
  - **Trường hợp 2: Chương VIP nhưng chưa đăng nhập (HTTP 401 UNAUTHORIZED):**
    ```json
    {
      "success": false,
      "code": "UNAUTHORIZED",
      "message": "Vui lòng đăng nhập để đọc chương trả phí này."
    }
    ```
  - **Trường hợp 3: Chương VIP, đã đăng nhập nhưng chưa mua gói / chưa mua truyện (HTTP 403 FORBIDDEN):**
    ```json
    {
      "success": false,
      "code": "PAYMENT_REQUIRED",
      "message": "Chương này yêu cầu Gói Hội Viên VIP hoặc mua riêng trọn bộ truyện để đọc.",
      "access_info": {
        "chapter_id": 88,
        "chapter_number": 3,
        "title": "Spider-Man Versus Doctor Octopus",
        "story_id": 1,
        "story_title": "The Amazing Spider-Man",
        "story_price": "49000.00",
        "access_policy": "mixed",
        "has_active_subscription": false,
        "has_purchased_story": false
      }
    }
    ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Ứng dụng mobile bắt mã HTTP `403` và `code: "PAYMENT_REQUIRED"` để kích hoạt Bottom Sheet chào mua Gói VIP hoặc Mua truyện lẻ ngay tại màn hình đọc.

---

### Nhóm 5: Gói Hội Viên & Thanh Toán Sandbox

#### 5.1. Danh sách các gói hội viên
- **Route:** `GET /api/plans`
- **Xác thực:** Không
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "plans": [
      {
        "id": 1,
        "name": "Marvel Pass Tháng",
        "description": "Đọc không giới hạn toàn bộ kho truyện bản quyền trong 30 ngày",
        "price": "59000.00",
        "duration_days": 30,
        "is_active": true
      }
    ]
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 5.2. Khởi tạo đơn thanh toán (Checkout)
- **Route:** `POST /api/payments/checkout`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "payment_type": "subscription", // hoặc "story_purchase"
    "item_id": 1,                  // plan_id hoặc story_id
    "payment_method": "sandbox"    // hoặc "vnpay" | "momo"
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 201):**
  ```json
  {
    "success": true,
    "message": "Tạo phiên thanh toán thành công.",
    "data": {
      "payment": { "id": 12, "status": "pending", ... },
      "transactionCode": "SANDBOX_1792499123_5412",
      "amount": 59000,
      "itemTitle": "Marvel Pass Tháng",
      "paymentType": "subscription",
      "paymentMethod": "sandbox"
    }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 5.3. Xử lý & Xác nhận giao dịch Sandbox
- **Route:** `POST /api/payments/process-sandbox`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "transaction_code": "SANDBOX_1792499123_5412",
    "simulate_failure": false
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Thanh toán thành công! Gói hội viên của bạn đã được kích hoạt.",
    "payment": { "id": 12, "status": "completed", ... }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 5.4. Lấy trạng thái Gói VIP hiện tại
- **Route:** `GET /api/payments/my-subscription`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "is_vip": true,
    "subscription": {
      "id": 5,
      "plan_id": 1,
      "start_date": "2026-10-20T12:00:00.000Z",
      "end_date": "2026-11-19T12:00:00.000Z",
      "status": "active",
      "plan": { "name": "Marvel Pass Tháng", "duration_days": 30 }
    }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Dùng hiển thị huy hiệu VIP, ngày hết hạn trên trang Profile.

#### 5.5. Danh sách truyện đã mua lẻ
- **Route:** `GET /api/payments/purchased-stories`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "purchases": [
      {
        "id": 2,
        "story_id": 1,
        "price_paid": "49000.00",
        "purchased_at": "2026-10-15T08:30:00.000Z",
        "story": { "id": 1, "title": "The Amazing Spider-Man", "cover_image": "..." }
      }
    ]
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 5.6. Lịch sử giao dịch nạp / thanh toán
- **Route:** `GET /api/payments/my-transactions`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "transactions": [
      {
        "id": 12,
        "transaction_code": "SANDBOX_1792499123_5412",
        "amount": "59000.00",
        "payment_method": "sandbox",
        "payment_type": "subscription",
        "item_title": "Marvel Pass Tháng",
        "status": "completed",
        "created_at": "2026-10-20T12:00:00.000Z"
      }
    ]
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** (Lưu ý: hiện chưa phân trang).

---

### Nhóm 6: Tiến Độ Đọc Truyện (`/api/reading-progress`)

#### 6.1. Lưu tiến độ đọc
- **Route:** `POST /api/reading-progress`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "story_id": 1,
    "chapter_id": 86,
    "scroll_y": 1450,
    "progress_percent": 65
  }
  ```
- **Dữ liệu trả về:** `{ "success": true, "message": "Lưu tiến độ đọc thành công.", "progress": { ... } }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Gọi định kỳ hoặc khi người dùng thoát màn hình đọc để đồng bộ vị trí đọc.

#### 6.2. Lấy toàn bộ danh sách truyện đang đọc dở
- **Route:** `GET /api/reading-progress`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về:** `{ "success": true, "history": [ ... ] }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** — Hiển thị mục "Đọc tiếp" ở màn hình chính hoặc tab Tủ sách.

#### 6.3. Lấy tiến độ đọc của một bộ truyện cụ thể
- **Route:** `GET /api/reading-progress/:storyId`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về:** `{ "success": true, "progress": { ... } | null }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 6.4. Xóa truyện khỏi danh sách đang đọc
- **Route:** `DELETE /api/reading-progress/:storyId`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về:** `{ "success": true, "message": "Đã xóa khỏi danh sách truyện đang đọc." }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

---

### Nhóm 7: Theo Dõi Truyện (Follow)

#### 7.1. Bật / Tắt theo dõi truyện (Toggle Follow)
- **Route:** `POST /api/stories/:id/follow`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body:** Không
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "is_following": true,
    "followers_count": 128,
    "message": "Đã thêm truyện vào danh sách theo dõi."
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 7.2. Lấy trạng thái theo dõi của người dùng đối với bộ truyện
- **Route:** `GET /api/stories/:id/follow-status`
- **Xác thực:** Tùy chọn (Nếu có Bearer Token sẽ kiểm tra theo user)
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "is_following": false,
    "followers_count": 128
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

---

### Nhóm 8: Bình Luận & Tương Tác

#### 8.1. Lấy danh sách bình luận của chương
- **Route:** `GET /api/chapters/:chapterId/comments`
- **Xác thực:** Không
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "comments": [
      {
        "id": 1,
        "content": "Chương này vẽ đẹp quá!",
        "likes_count": 12,
        "created_at": "2026-10-18T10:00:00.000Z",
        "user": {
          "id": 3,
          "username": "peter_parker",
          "full_name": "Peter Parker",
          "avatar": null,
          "role": "reader"
        }
      }
    ]
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]** (Lưu ý: hiện trả về toàn bộ, chưa phân trang).

#### 8.2. Đăng bình luận mới
- **Route:** `POST /api/chapters/:chapterId/comments`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "content": "Bình luận từ ứng dụng di động..."
  }
  ```
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đăng bình luận thành công!",
    "comment": { ... }
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 8.3. Thích bình luận
- **Route:** `POST /api/comments/:id/like`
- **Xác thực:** Không bắt buộc
- **Dữ liệu trả về:** `{ "success": true, "likes_count": 13 }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 8.4. Báo cáo bình luận vi phạm
- **Route:** `POST /api/comments/:id/report`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Body (JSON):**
  ```json
  {
    "reason": "Spam hoặc ngôn từ không phù hợp"
  }
  ```
- **Dữ liệu trả về:** `{ "success": true, "message": "Báo cáo của bạn đã được gửi tới ban quản trị để xem xét." }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

---

### Nhóm 9: Thông Báo (Notifications)

#### 9.1. Lấy danh sách thông báo
- **Route:** `GET /api/notifications`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về (JSON - HTTP 200):**
  ```json
  {
    "success": true,
    "unread_count": 2,
    "notifications": [
      {
        "id": 10,
        "user_id": 15,
        "title": "Chương mới ra mắt!",
        "message": "Truyện Civil War vừa cập nhật Chương 11.",
        "type": "new_chapter",
        "is_read": false,
        "data": { "story_id": 2, "chapter_id": 107 },
        "created_at": "2026-10-20T08:00:00.000Z"
      }
    ]
  }
  ```
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 9.2. Đánh dấu một thông báo đã đọc
- **Route:** `PATCH /api/notifications/:id/read`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về:** `{ "success": true, "message": "Đã đánh dấu đã đọc.", "unread_count": 1 }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

#### 9.3. Đánh dấu tất cả thông báo đã đọc
- **Route:** `PATCH /api/notifications/read-all`
- **Xác thực:** Bắt buộc (`Bearer Token`)
- **Dữ liệu trả về:** `{ "success": true, "message": "Đã đánh dấu tất cả thông báo là đã đọc.", "unread_count": 0 }`
- **Đánh giá Mobile:** ✅ **[DÙNG LẠI NGUYÊN]**

---

### Nhóm 10: Quản Trị Hệ Thống (Admin Only - Bảng Điều Khiển Web)
*Tất cả các route dưới đây yêu cầu `Bearer Token` với vai trò quản trị viên (`role === 'admin'`). Ứng dụng di động độc giả không tương tác với các route này.*

- `GET /api/admin/overview`: Thống kê số lượng truyện, chương, user, view tổng.
- `POST /api/admin/stories`: Thêm mới truyện.
- `PUT /api/admin/stories/:id`: Cập nhật truyện.
- `PATCH /api/admin/stories/:id/status`: Đổi trạng thái (`ongoing`/`completed`).
- `PATCH /api/admin/stories/:id/policy`: Đổi chính sách truy cập (`free`/`paid`/`mixed`).
- `POST /api/admin/stories/:id/quick-preview`: Thiết lập nhanh 3 chương đầu đọc thử.
- `DELETE /api/admin/stories/:id`: Xóa truyện.
- `POST /api/admin/upload-cover`: Tải lên ảnh bìa chương truyện.
- `GET /api/admin/comicvine/issues`: Tìm kiếm issue từ ComicVine.
- `GET /api/admin/comicvine/issue`: Lấy thông tin issue chi tiết từ ComicVine.
- `GET /api/admin/comicvine/character`: Lấy thông tin nhân vật từ ComicVine.
- `GET /api/admin/stories/:storyId/chapters`: Lấy danh sách chương của truyện cho admin.
- `POST /api/admin/chapters`: Thêm chương mới.
- `PUT /api/admin/chapters/:id`: Cập nhật chương.
- `PATCH /api/admin/chapters/:id/preview`: Bật/tắt đọc thử chương.
- `DELETE /api/admin/chapters/:id`: Xóa chương.
- `GET /api/admin/comments`: Lấy danh sách bình luận kiểm duyệt (lọc báo cáo vi phạm).
- `PATCH /api/admin/comments/:id/status` (hoặc `/hide`, `/restore`): Duyệt hoặc ẩn bình luận vi phạm.
- `DELETE /api/admin/comments/:id`: Xóa bình luận vi phạm.
- `GET /api/admin/users`: Danh sách người dùng (hỗ trợ phân trang `page`/`limit`, lọc vai trò/trạng thái).
- `GET /api/admin/users/:id`: Xem chi tiết hoạt động của một người dùng.
- `PATCH /api/admin/users/:id/status`: Thay đổi trạng thái tài khoản (`active`/`restricted`/`suspended`).
- `GET /api/admin/stats/overview`: Thống kê tổng hợp doanh thu, lượt đọc, tỷ lệ giao dịch.
- `GET /api/admin/stats/views`: Thống kê lượt đọc theo thời gian và theo truyện.
- `GET /api/admin/stats/revenue-monthly`: Doanh thu theo tháng.
- `GET /api/admin/stats/top-stories`: Xếp hạng top truyện theo view, rating, doanh thu.
- `GET /api/admin/stats/users-and-transactions`: Phân bổ người dùng và phương thức thanh toán.
- `POST /api/plans`, `PUT /api/plans/:id`, `PATCH /api/plans/:id/toggle`, `DELETE /api/plans/:id`: Quản trị danh mục gói VIP.

---

## 4. TỔNG HỢP CÁC API CÒN THIẾU CHO ỨNG DỤNG MOBILE

Qua quá trình rà soát toàn diện, dưới đây là các API mà một ứng dụng Mobile đọc truyện thương mại cần có nhưng backend hiện tại **chưa có**:

1. **API lấy danh sách truyện đang theo dõi của người dùng (`GET /api/stories/following` hoặc `GET /api/users/me/followed-stories`)**
   - *Hiện trạng:* Backend mới chỉ có `POST /api/stories/:id/follow` (bật/tắt theo dõi) và `GET /api/stories/:id/follow-status` (kiểm tra 1 truyện).
   - *Vấn đề trên Mobile:* Ứng dụng mobile luôn có màn hình "Tủ truyện / Truyện theo dõi" để độc giả theo dõi các đầu truyện mình quan tâm, hiện tại client không có API để lấy danh sách này.

2. **API kiểm tra trước quyền đọc chương (`GET /api/chapters/:chapterId/access-check`) hoặc gắn kèm trạng thái `can_read: boolean` trong danh sách chapters**
   - *Hiện trạng:* Hiện tại mobile phải gọi `GET /api/chapters/:chapterId` (tải toàn bộ nội dung chương truyện) mới biết được được đọc hay bị 403.
   - *Vấn đề trên Mobile:* Trên danh sách chương truyện ở màn hình Story Detail, app cần hiển thị icon ổ khóa mở/khóa cho từng chương. Nếu gắn kèm cờ hoặc có API kiểm tra nhẹ, mobile sẽ render giao diện danh sách chương trực quan hơn rất nhiều.

3. **API đăng ký nhận thông báo đẩy Mobile Push Notification (`POST /api/notifications/register-device`)**
   - *Hiện trạng:* Backend hiện chỉ đẩy thông báo thời gian thực qua Socket.IO (chỉ nhận được khi ứng dụng đang mở) và lưu vào database.
   - *Vấn đề trên Mobile:* Khi app đóng hoặc chạy ngầm, cần nhận thông báo qua Firebase Cloud Messaging (FCM) hoặc Apple Push Notification service (APNs). Cần API lưu `fcm_token` hoặc `device_token`.

4. **API tải trước chương đọc ngoại tuyến / Offline Reading (`GET /api/chapters/:chapterId/download`)**
   - *Hiện trạng:* Chưa có cơ chế đóng gói dữ liệu phục vụ lưu cache an toàn dưới bộ nhớ máy.
   - *Vấn đề trên Mobile:* Độc giả mobile thường có nhu cầu tải trước một vài chương truyện qua Wi-Fi để đọc khi không có mạng (trên máy bay, xe buýt).

5. **API kiểm tra phiên bản ứng dụng & trạng thái bảo trì (`GET /api/app/version` hoặc `/api/app/config`)**
   - *Hiện trạng:* Chưa có endpoint trả về phiên bản tối thiểu bắt buộc cập nhật (Force Update) và thông báo bảo trì hệ thống.

---

## 5. BÁO CÁO TÌNH TRẠNG PHÂN TRANG (PAGINATION) TRÊN CÁC DANH SÁCH DÀI

| Danh sách dữ liệu | Endpoint | Đã có `page` / `limit`? | Chi tiết hiện trạng |
| :--- | :--- | :---: | :--- |
| **Danh sách truyện** | `GET /api/stories` | **ĐÃ CÓ** ✅ | Hỗ trợ đầy đủ `page` (default 1) và `limit` (default 12), trả về `{ total, page, totalPages, stories }`. |
| **Bình luận độc giả** | `GET /api/chapters/:chapterId/comments` | **CHƯA CÓ** ❌ | Dùng `Comment.findAll()` lấy toàn bộ bình luận của chương, chưa nhận tham số `page`/`limit`. |
| **Bình luận quản trị** | `GET /api/admin/comments` | **CHƯA CÓ** ❌ | Dùng `Comment.findAll()` lấy toàn bộ bình luận theo bộ lọc, chưa hỗ trợ `page`/`limit`. |
| **Danh sách thông báo** | `GET /api/notifications` | **CHƯA NHẤT QUÁN** ⚠️ | Đang hardcode `limit: 30`, chưa có `offset` và chưa nhận tham số query `page` / `limit`. |
| **Lịch sử giao dịch** | `GET /api/payments/my-transactions` | **CHƯA CÓ** ❌ | Dùng `Payment.findAll()` lấy toàn bộ danh sách giao dịch của user, chưa có `page`/`limit`. |
| **Truyện đã mua lẻ** | `GET /api/payments/purchased-stories` | **CHƯA CÓ** ❌ | Dùng `StoryPurchase.findAll()` lấy toàn bộ, chưa có `page`/`limit`. |
| **Lịch sử đọc dở** | `GET /api/reading-progress` | **CHƯA CÓ** ❌ | Dùng `ReadingProgress.findAll()` lấy toàn bộ, chưa có `page`/`limit`. |
| **Thành viên (Admin)** | `GET /api/admin/users` | **ĐÃ CÓ** ✅ | Hỗ trợ đầy đủ `page` (default 1) và `limit` (default 10), trả về `{ total, page, totalPages, users }`. |

*(Tuân thủ chỉ thị: Chỉ ghi nhận và báo cáo danh sách chưa có, chưa tự ý sửa đổi logic nghiệp vụ khi chưa được yêu cầu).*
