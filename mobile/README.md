# 📱 ỨNG DỤNG MOBILE: MARVEL COMICS HUB
**Giai đoạn:** Bước 1 - Nền tảng ứng dụng di động đọc truyện tranh Marvel  
**Công nghệ:** React Native (Expo SDK 58), viết hoàn toàn bằng JavaScript.  
**Theme:** Giao diện tối Marvel (Nền `#0F0F14`, Thẻ `#1A1A22`, Màu nhấn `#ED1D24`).  
**Backend:** Node.js Express + MySQL (`marvel_db`), chạy tại cổng `5000`.

---

## 1. HƯỚNG DẪN CÀI ĐẶT & CHẠY TRÊN ANDROID EMULATOR

### 1.1. Cấu hình biến môi trường
1. Tạo file `mobile/.env` từ file mẫu `mobile/.env.example`:
   ```bash
   cp mobile/.env.example mobile/.env
   ```
2. Nội dung mặc định trong `mobile/.env`:
   ```env
   # Địa chỉ máy tính host khi chạy trên Android Emulator:
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
   
   # Nếu chạy trên điện thoại thật cùng mạng Wi-Fi:
   # EXPO_PUBLIC_API_URL=http://<IP_LAN_MAY_TINH>:5000
   ```

### 1.2. Khởi chạy ứng dụng
1. Đảm bảo backend đang chạy ở máy tính host:
   ```bash
   cd backend
   npm run dev
   ```
2. Mở Android Emulator (Android Studio AVD).
3. Tại thư mục `mobile/`, khởi động Expo:
   ```bash
   cd mobile
   npx expo start --android
   ```
4. Expo sẽ tự động biên dịch và mở ứng dụng Marvel Comics Hub trên máy ảo Android.

---

## 2. DANH SÁCH THƯ VIỆN ĐÃ CÀI ĐẶT VÀ LÝ DO

Mỗi thư viện cài đặt đều phục vụ đúng yêu cầu kỹ thuật, không cài đặt thừa:

| Thư viện | Phiên bản | Lý do sử dụng |
| :--- | :--- | :--- |
| `expo` | `~58.0.16` | Nền tảng framework chính của ứng dụng di động. |
| `expo-secure-store` | `~58.0.2` | Lưu trữ an toàn JWT Access Token trong Keychain (iOS) / Keystore (Android) theo yêu cầu. |
| `expo-font` | `~58.0.9` | Nạp font tùy chỉnh từ Google Fonts vào ứng dụng Expo. |
| `@expo-google-fonts/italiana` | `^0.4.1` | Font Italiana dùng cho tiêu đề lớn nghệ thuật (Hero/Header) theo yêu cầu. |
| `@expo-google-fonts/outfit` | `^0.4.3` | Font Outfit dùng cho tiêu đề thẻ, tên truyện và giao diện chính. |
| `@expo-google-fonts/inter` | `^0.4.2` | Font Inter dùng cho văn bản hiển thị, nhãn, nút bấm, mô tả. |
| `@expo-google-fonts/merriweather`| `^0.4.2` | Font Merriweather dùng cho nội dung đọc truyện và thông điệp chương. |
| `@expo/vector-icons` | `~15.0.3` | Cung cấp icon vector tĩnh (Ionicons: khóa/mở, ngôi sao, mắt xem, tìm kiếm, v.v.), không dùng ảnh placeholder từ internet. |
| `@react-navigation/native` | `^7.5.1` | Thư viện điều hướng chuẩn cho React Native. |
| `@react-navigation/native-stack`| `^7.21.0` | Quản lý ngăn xếp màn hình (Login, Home -> StoryDetail -> ComingSoon). |
| `@react-navigation/bottom-tabs` | `^7.21.0` | Thanh điều hướng tab dưới cùng (Kho Truyện và Tài Khoản). |
| `expo-image-picker` | `~58.0.10` | Cho phép người dùng chọn ảnh đại diện từ thư viện ảnh thiết bị (Android/iOS) hoặc chụp mới, hỗ trợ crop 1:1 và nén chất lượng an toàn. |
| `react-native-screens` | `~4.30.0` | Tối ưu hóa bộ nhớ native cho các màn hình điều hướng của React Navigation. |
| `react-native-safe-area-context`| `~5.10.1` | Xử lý vùng an toàn (tai thỏ, notch, thanh điều hướng dưới) trên Android/iOS. |
| `socket.io-client` | `^4.8.4` | Kết nối WebSocket/polling hai chiều thời gian thực tới backend Node.js để nhận sự kiện thông báo mới (`new_notification`) và chương mới (`new_chapter_published`) khi app đang mở, tự kết nối lại khi mất mạng và ngắt an toàn khi đăng xuất. |

---


## 3. CÁC API ĐÃ KIỂM CHỨNG THỰC TẾ

Tất cả các API dưới đây đã được gọi thử nghiệm trực tiếp đến backend đang chạy tại `http://localhost:5000` và xác thực cấu trúc trường dữ liệu thực tế (Response JSON rút gọn và tên field thực):

### 3.1. `GET /api/stories?limit=2`
- **Mục đích:** Danh sách truyện trang chủ, hỗ trợ phân trang và tìm kiếm.
- **Trạng thái HTTP:** `200 OK`
- **Cấu trúc trường thực tế (Fields):**
  - Cấp gốc: `success` (boolean), `total` (number), `page` (number), `totalPages` (number), `stories` (array).
  - Từng phần tử trong `stories`:
    - `id`: number
    - `comicvine_id`: number
    - `comicvine_volume_id`: number
    - `title`: string
    - `original_title`: string
    - `slug`: string
    - `description`: string
    - `cover_image`: string (URL ComicVine)
    - `banner_image`: string
    - `publisher`: string
    - `release_year`: number
    - `status`: string (`"ongoing"` | `"completed"`)
    - `access_policy`: string (`"free"` | `"paid"` | `"mixed"`)
    - `price`: string (ví dụ: `"79000.00"`)
    - `view_count`: number
    - `rating`: number
    - `average_rating`: string hoặc null (ví dụ: `"5.0"`)
    - `rating_count`: number
    - `genres`: array of `{ id, name, slug, description }`
    - `chapters`: array of `{ id, chapter_number, title, is_preview, release_date }`

### 3.2. `GET /api/stories/:id` (Kiểm chứng với ID 1: The Amazing Spider-Man)
- **Mục đích:** Trang thông tin chi tiết truyện và toàn bộ danh sách chương.
- **Trạng thái HTTP:** `200 OK`
- **Cấu trúc trường thực tế (Fields):**
  - `success`: boolean
  - `story`: object
    - `id`: number
    - `title`: string
    - `status`: string
    - `access_policy`: string
    - `price`: string
    - `view_count`: number
    - `rating`: number
    - `average_rating`: string (ví dụ: `"4.5"`)
    - `rating_count`: number
    - `cover_image`: string
    - `banner_image`: string
    - `genres`: array
    - `chapters`: array of:
      - `id`: number
      - `chapter_number`: number
      - `title`: string
      - `release_date`: string
      - `is_preview`: boolean
      - `comicvine_issue_id`: number
      - `cover_image`: string (ảnh bìa RIÊNG của từng chương)
      - `accent_color`: string (mã màu hex, ví dụ: `"#d92021"`)

### 3.3. `POST /api/auth/login`
- **Mục đích:** Đăng nhập người dùng bằng tài khoản hoặc email.
- **Body gửi lên:** `{ "loginId": "...", "password": "..." }`
- **Trạng thái HTTP:** `200 OK`
- **Cấu trúc trường thực tế (Fields):**
  - `success`: boolean
  - `message`: string ("Đăng nhập thành công!")
  - `token`: string (JWT string)
  - `user`: object
    - `id`: number
    - `username`: string
    - `email`: string
    - `full_name`: string
    - `role`: string (`"reader"` | `"admin"`)
    - `status`: string (`"active"`)
    - `status_reason`: null hoặc string
    - `avatar`: null hoặc string

### 3.4. `GET /api/auth/me`
- **Mục đích:** Kiểm tra tính hợp lệ của token khi khởi động app.
- **Header:** `Authorization: Bearer <token>`
- **Trạng thái HTTP:** `200 OK`
- **Cấu trúc trường thực tế (Fields):**
  - `success`: boolean
  - `user`: object (`id`, `username`, `email`, `full_name`, `role`, `status`, `avatar`)

### 3.5. `GET /api/payments/my-subscription`
- **Mục đích:** Lấy thông tin gói hội viên VIP để xác định quyền đọc và huy hiệu tài khoản.
- **Header:** `Authorization: Bearer <token>`
- **Trạng thái HTTP:** `200 OK`
- **Cấu trúc trường thực tế (Fields):**
  - `success`: boolean
  - `is_vip`: boolean
  - `subscription`: object (hoặc null nếu chưa có gói):
    - `id`: number
    - `plan_name`: string (ví dụ: `"Gói Siêu Anh Hùng (3 Tháng)"`)
    - `plan_slug`: string
    - `badge`: string (ví dụ: `"Phổ Biến Nhất"`)
    - `start_date`: ISO Date string
    - `end_date`: ISO Date string
    - `days_remaining`: number (ví dụ: `193`)
    - `status`: string (`"active"`)
    - `is_active`: boolean (`true`)

### 3.6. `GET /api/payments/purchased-stories`
- **Mục đích:** Lấy danh sách các bộ truyện người dùng đã mua lẻ bản quyền trọn bộ.
- **Header:** `Authorization: Bearer <token>`
- **Trạng thái HTTP:** `200 OK`
- **Cấu trúc trường thực tế (Fields):**
  - `success`: boolean
  - `purchases`: array of:
    - `purchase_id`: number (Lưu ý: trường ID thực tế là `purchase_id`, không phải `id`)
    - `story_id`: number (ID bộ truyện để đối chiếu quyền đọc)
    - `price_paid`: string (ví dụ: `"79000.00"`)
    - `story`: object (`id`, `title`, `cover_image`, ...)

### 3.7. `GET /api/image-proxy`
- **Mục đích:** Tải ảnh ComicVine vượt tường lửa và bảo mật bản quyền.
- **Query:** `?url=<URL_ENCODED_COMICVINE_IMAGE>`
- **Trạng thái HTTP:** `200 OK`
- **Cấu trúc Header thực tế:**
  - `Content-Type`: `image/jpeg` (hoặc `image/png`, `image/webp`, `image/svg+xml`)
  - `Content-Length`: `162717` bytes
  - `X-Proxy-Cache`: `HIT`
  - `Access-Control-Allow-Origin`: `*`
  - Body: Binary stream dữ liệu ảnh thực tế.

### 3.8. `GET /api/chapters/:id` (Kiểm chứng quyền đọc và nội dung chương)
- **Mục đích:** Đọc chi tiết chương truyện Comic Vine, ảnh bìa riêng, tóm tắt và danh sách nhân vật xuất hiện.
- **Header:** `Authorization: Bearer <token>` (nếu có)
- **Các trường hợp kiểm chứng thực tế:**
  1. **Khách vãng lai (không có token) vào chương trả phí:**
     - **Trạng thái HTTP:** `401 Unauthorized`
     - **Response:**
       ```json
       {
         "success": false,
         "code": "UNAUTHORIZED",
         "message": "Vui lòng đăng nhập để đọc chương trả phí này."
       }
       ```
  2. **Tài khoản độc giả chưa có VIP và chưa mua truyện lẻ:**
     - **Trạng thái HTTP:** `403 Forbidden`
     - **Response:**
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
  3. **Tài khoản VIP / Chương đọc thử (Preview) thành công:**
     - **Trạng thái HTTP:** `200 OK`
     - **Response Fields:**
       - `success`: boolean (`true`)
       - `chapter`: object
         - `id`: number
         - `story_id`: number
         - `chapter_number`: number
         - `title`: string
         - `release_date`: string
         - `is_preview`: boolean
         - `cover_image`: string (ảnh bìa riêng của chương)
         - `content`: string (nội dung tóm tắt cốt truyện Comic Vine)
         - `accent_color`: string (ví dụ `"#c61c23"`)
         - `character_credits`: array of `{ name, icon_url }` (danh sách nhân vật xuất hiện)
         - `story`: object (`id`, `title`, `cover_image`, `access_policy`, `price`)
       - `prev_chapter`: object hoặc null (`id`, `chapter_number`, `title`, `cover_image`)
       - `next_chapter`: object hoặc null (`id`, `chapter_number`, `title`, `cover_image`)
       - `read_access`: object (`allowed: true`, `via: "subscription" | "purchase" | "free"`)

### 3.9. `GET /api/plans`
- **Mục đích:** Lấy danh sách các gói hội viên VIP đang hoạt động.
- **Trạng thái HTTP:** `200 OK`
- **Response Fields:**
  - `success`: boolean (`true`)
  - `plans`: array of:
    - `id`: number
    - `name`: string (ví dụ: `"Gói Độc Giả Marvel (1 Tháng)"`)
    - `price`: string (ví dụ: `"49000.00"`)
    - `duration_days`: number (ví dụ: `30`, `90`, `365`)
    - `badge`: string (ví dụ: `"Tiêu Chuẩn"`, `"Phổ Biến Nhất"`, `"Tiết Kiệm 35%"`)
    - `description`: string

### 3.10. `POST /api/payments/checkout`
- **Mục đích:** Khởi tạo đơn thanh toán gói hội viên.
- **Header:** `Authorization: Bearer <token>`
- **Body:** `{ "payment_type": "subscription", "item_id": 1, "payment_method": "sandbox" }`
- **Trạng thái HTTP:** `201 Created`
- **Response Fields:**
  - `success`: boolean (`true`)
  - `message`: string (`"Tạo phiên thanh toán thành công."`)
  - `data`: object
    - `transactionCode`: string (ví dụ: `"SANDBOX_1792651018353_7975"`)
    - `amount`: string (ví dụ: `"49000.00"`)
    - `itemTitle`: string (ví dụ: `"Gói Độc Giả Marvel (1 Tháng)"`)
    - `paymentType`: string (`"subscription"`)
    - `paymentMethod`: string (`"sandbox"`)

### 3.11. `POST /api/payments/process-sandbox`
- **Mục đích:** Xử lý kết quả giao dịch thanh toán mô phỏng Sandbox.
- **Header:** `Authorization: Bearer <token>`
- **Body gửi lên:** `{ "transaction_code": "...", "simulate_failure": true | false }`
- **Nhánh thất bại / người dùng hủy (`simulate_failure: true`):**
  - **Trạng thái HTTP:** `400 Bad Request`
  - **Response:**
    ```json
    {
      "success": false,
      "message": "Giao dịch thanh toán không thành công. Quyền đọc chưa được kích hoạt.",
      "payment": { "status": "failed", ... }
    }
    ```
  - **Kiểm chứng:** Quyền VIP không được cấp, `my-subscription` giữ nguyên `null`.
- **Nhánh thành công (`simulate_failure: false`):**
  - **Trạng thái HTTP:** `200 OK`
  - **Kiểm chứng:** Kích hoạt gói VIP qua Sequelize transaction, cộng dồn ngày sử dụng.

### 3.12. `POST /api/payments/checkout` (Loại mua truyện lẻ bản quyền: `story_purchase`)
- **Mục đích:** Khởi tạo phiên thanh toán mua đứt bản quyền trọn bộ truyện tranh.
- **Header:** `Authorization: Bearer <token>`
- **Body:** `{ "payment_type": "story_purchase", "item_id": 1, "payment_method": "sandbox" }`
- **Trạng thái HTTP:** `201 Created`
- **Response Fields:**
  - `success`: boolean (`true`)
  - `message`: string (`"Tạo phiên thanh toán thành công."`)
  - `data`: object
    - `transactionCode`: string (ví dụ: `"SANDBOX_1792672351293_1699"`)
    - `amount`: string (ví dụ: `"49000.00"`)
    - `itemTitle`: string (`"The Amazing Spider-Man"`)
    - `paymentType`: string (`"story_purchase"`)
    - `paymentMethod`: string (`"sandbox"`)
- **Kiểm tra chống mua trùng:** Nếu người dùng đã sở hữu bản quyền bộ truyện trước đó, backend trả về HTTP 400 kèm message: `"Bạn đã sở hữu bản quyền bộ truyện này rồi, không cần mua lại!"`.
- **Kiểm tra tài khoản hạn chế:** Nếu tài khoản có `status: 'restricted'`, backend chặn với HTTP 400: `"Tài khoản của bạn đang bị giới hạn, không thể thực hiện giao dịch thanh toán hoặc mua nội dung."`.

### 3.13. `GET /api/stories/:id/follow-status` & `POST /api/stories/:id/follow`
- **Mục đích:** Kiểm tra và Bật/Tắt trạng thái theo dõi (yêu thích) bộ truyện tranh Marvel.
- **Lấy trạng thái (`GET /api/stories/:id/follow-status`):**
  - Header: `Authorization: Bearer <token>` (tùy chọn)
  - Trạng thái HTTP: `200 OK`
  - Response:
    ```json
    {
      "success": true,
      "is_following": false,
      "followers_count": 0
    }
    ```
- **Bật/Tắt theo dõi (`POST /api/stories/:id/follow`):**
  - Header: `Authorization: Bearer <token>` (bắt buộc)
  - Trạng thái HTTP: `200 OK`
  - Response khi BẬT theo dõi:
    ```json
    {
      "success": true,
      "is_following": true,
      "followers_count": 1,
      "message": "Đã thêm truyện vào danh sách theo dõi."
    }
    ```
  - Response khi HỦY theo dõi:
    ```json
    {
      "success": true,
      "is_following": false,
      "followers_count": 0,
      "message": "Đã hủy theo dõi truyện."
    }
    ```

### 3.14. `GET /api/chapters/:chapterId/comments`
- **Mục đích:** Lấy danh sách bình luận đã duyệt của chương truyện.
- **Trạng thái HTTP:** `200 OK`
- **Lưu ý:** Backend đã tự động lọc `status: 'approved'` trong câu truy vấn, các bình luận bị ẩn (`hidden`) không bao giờ được trả về.
- **Response Fields:**
  - `success`: boolean (`true`)
  - `comments`: array of:
    - `id`: number
    - `user_id`: number
    - `story_id`: number
    - `chapter_id`: number
    - `content`: string
    - `status`: string (`"approved"`)
    - `likes_count`: number (mặc định 0)
    - `createdAt`: ISO Date string
    - `user`: object
      - `id`: number
      - `username`: string
      - `full_name`: string
      - `avatar`: string hoặc null
      - `role`: string (`"reader"` | `"admin"`)

### 3.15. `POST /api/chapters/:chapterId/comments`
- **Mục đích:** Đăng bình luận mới cho chương truyện.
- **Header:** `Authorization: Bearer <token>`
- **Body:** `{ "content": "Nội dung bình luận..." }`
- **Kiểm tra hợp lệ:**
  - Nội dung rỗng: HTTP 400 `"Nội dung bình luận không được để trống."`
  - Vượt quá 1000 ký tự: HTTP 400 `"Bình luận không được vượt quá 1000 ký tự."`
  - Tài khoản bị hạn chế (`restricted`): HTTP 403 `"Tài khoản của bạn đang bị giới hạn, không thể gửi bình luận."`
- **Trạng thái HTTP thành công:** `201 Created`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Bình luận thành công!",
    "comment": { ... }
  }
  ```

### 3.16. `POST /api/comments/:id/like` & `POST /api/comments/:id/report`
- **Thích bình luận (`POST /api/comments/:id/like`):**
  - Trạng thái HTTP: `200 OK`
  - Response: `{ "success": true, "likes_count": 1 }`
- **Báo cáo vi phạm (`POST /api/comments/:id/report`):**
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "reason": "Nội dung spam hoặc phản cảm" }`
  - Trạng thái HTTP: `200 OK`
  - Response: `{ "success": true, "message": "Đã gửi báo cáo vi phạm tới ban quản trị để xem xét." }`

### 3.17. `POST /api/auth/register` (Đăng ký tài khoản độc giả mới)
- **Mục đích:** Tạo tài khoản độc giả mới, nhận ngay Bearer token và đăng nhập tự động.
- **Body JSON gửi lên:**
  ```json
  {
    "username": "ironspider_99",
    "email": "ironspider_99@marvel.test",
    "password": "Password123",
    "full_name": "Peter Benjamin Parker"
  }
  ```
- **Kiểm tra hợp lệ phía Backend:**
  - Thiếu username, email hoặc password: HTTP 400 `"Vui lòng cung cấp username, email và password."`
  - Mật khẩu < 6 ký tự: HTTP 400 `"Mật khẩu phải có độ dài tối thiểu 6 ký tự."`
  - Trùng email: HTTP 409 `"Email đã được đăng ký."`
  - Trùng username: HTTP 409 `"Username đã được sử dụng."`
- **Trạng thái HTTP thành công:** `201 Created`
- **Response Fields thực tế:**
  - `success`: boolean (`true`)
  - `message`: string (`"Đăng ký tài khoản thành công!"`)
  - `token`: string (JWT string, app tự động lưu an toàn vào `SecureStore`)
  - `user`: object
    - `id`: number
    - `username`: string
    - `email`: string
    - `full_name`: string
    - `role`: string (`"reader"`)
    - `avatar`: null
    - `status`: string (`"active"`)
    - `createdAt`: ISO Date string
    - `updatedAt`: ISO Date string

### 3.18. `PUT /api/auth/profile` (Cập nhật họ tên hiển thị)
- **Mục đích:** Đổi tên hiển thị (`full_name`) của người dùng hiện tại.
- **Header:** `Authorization: Bearer <token>`
- **Body JSON gửi lên:**
  ```json
  {
    "full_name": "Tony Edward Stark"
  }
  ```
- **Trạng thái HTTP:** `200 OK`
- **Response Fields thực tế:**
  - `success`: boolean (`true`)
  - `message`: string (`"Cập nhật hồ sơ cá nhân thành công!"`)
  - `user`: object (`id`, `username`, `email`, `full_name`, `role`, `status`, `avatar`, `updatedAt`, ...)

### 3.19. `POST /api/auth/avatar` (Tải ảnh đại diện qua Multipart FormData)
- **Mục đích:** Cập nhật ảnh đại diện người dùng từ thư viện thiết bị máy ảo/thật.
- **Header:**
  - `Authorization: Bearer <token>`
  - `Content-Type`: `multipart/form-data; boundary=...` (fetch tự động sinh boundary)
- **Body FormData:** Field `avatar` chứa tệp tin ảnh `{ uri, name, type }` (JPEG, PNG, WEBP, tối đa 2MB).
- **Trạng thái HTTP:** `200 OK`
- **Response Fields thực tế:**
  - `success`: boolean (`true`)
  - `message`: string (`"Cập nhật ảnh đại diện thành công!"`)
  - `avatar`: string (đường dẫn tương đối, ví dụ: `"/uploads/avatars/avatar_268_1792832876645_211283849.png"`)
  - `avatarUrl`: string (giá trị tương tự `avatar`)
  - `user`: object đầy đủ đã cập nhật trường `avatar`

### 3.20. `POST /api/auth/change-password` (Đổi mật khẩu tài khoản)
- **Mục đích:** Đổi mật khẩu cho người dùng đã đăng nhập với xác thực mật khẩu cũ.
- **Header:** `Authorization: Bearer <token>`
- **Body JSON gửi lên:**
  ```json
  {
    "oldPassword": "CurrentPassword123",
    "newPassword": "NewStrongPassword456",
    "confirmPassword": "NewStrongPassword456"
  }
  ```
- **Kiểm tra hợp lệ phía Backend:**
  - Thiếu oldPassword hoặc newPassword: HTTP 400 `"Vui lòng cung cấp mật khẩu cũ và mật khẩu mới."`
  - Mật khẩu mới < 8 ký tự: HTTP 400 `"Mật khẩu mới phải có độ dài tối thiểu 8 ký tự."`
  - Mật khẩu xác nhận không khớp: HTTP 400 `"Xác nhận mật khẩu mới không khớp."`
  - Mật khẩu cũ sai: HTTP 400 `"Mật khẩu cũ không chính xác."`
- **Trạng thái HTTP thành công:** `200 OK`
- **Response Fields thực tế:**
  - `success`: boolean (`true`)
  - `message`: string (`"Đổi mật khẩu thành công!"`)

### 3.21. `GET /api/notifications` (Lấy danh sách thông báo & số lượng chưa đọc)
- **Mục đích:** Tải tối đa 30 thông báo gần nhất của người dùng đã đăng nhập và đếm số thông báo chưa đọc (`unread_count`).
- **Header:** `Authorization: Bearer <token>`
- **Trạng thái HTTP:** `200 OK`
- **Response Fields thực tế (Đã kiểm chứng runtime):**
  ```json
  {
    "success": true,
    "unread_count": 2,
    "notifications": [
      {
        "id": 30,
        "user_id": 269,
        "title": "Chương mới: The Amazing Spider-Man",
        "message": "Chương 10: Trận chiến tại New York đã chính thức phát hành!",
        "type": "new_chapter",
        "link_url": "/stories/1/chapters/88",
        "is_read": false,
        "createdAt": "2026-10-27T08:33:30.000Z",
        "updatedAt": "2026-10-27T08:33:30.000Z"
      }
    ]
  }
  ```

### 3.22. `PATCH /api/notifications/:id/read` (Đánh dấu 1 thông báo là đã đọc)
- **Mục đích:** Cập nhật trạng thái `is_read = true` cho thông báo cụ thể thuộc quyền sở hữu của người dùng.
- **Header:** `Authorization: Bearer <token>`
- **Trạng thái HTTP:** `200 OK`
- **Response Fields thực tế:**
  ```json
  {
    "success": true,
    "message": "Đã đánh dấu đã đọc.",
    "unread_count": 1
  }
  ```

### 3.23. `PATCH /api/notifications/read-all` (Đánh dấu tất cả thông báo là đã đọc)
- **Mục đích:** Đánh dấu toàn bộ thông báo chưa đọc của người dùng thành đã đọc một lượt.
- **Header:** `Authorization: Bearer <token>`
- **Trạng thái HTTP:** `200 OK`
- **Response Fields thực tế:**
  ```json
  {
    "success": true,
    "message": "Đã đánh dấu tất cả thông báo là đã đọc.",
    "unread_count": 0
  }
  ```

### 3.24. Kết nối và Sự kiện Socket.IO Thời Gian Thực
- **Địa chỉ kết nối:** `EXPO_PUBLIC_API_URL` (ví dụ: `http://10.0.2.2:5000` trên Android Emulator).
- **Cơ chế truyền tải (Transports):** `['websocket', 'polling']` với tự động phục hồi kết nối (`reconnection: true`, `reconnectionDelay: 1000`).
- **Gia nhập phòng (Client -> Server):**
  - `socket.emit('join_user', userId)`: Sau khi kết nối thành công, app gửi sự kiện này để gia nhập phòng riêng `user_${userId}`.
  - `socket.emit('join_story', storyId)`: Gia nhập phòng bộ truyện `story_${storyId}` để nhận sự kiện phát hành chương mới.
- **Sự kiện từ máy chủ phát xuống (Server -> Client):**
  - Sự kiện `new_notification`: Phát tới phòng `user_${userId}` khi hệ thống tạo thông báo mới (ví dụ khi admin phát hành chương mới của bộ truyện mà người dùng đang bấm theo dõi).
    - Payload gửi kèm: Object bản ghi `Notification` đầy đủ (`id`, `title`, `message`, `type`, `link_url`, `is_read`, `createdAt`).
  - Sự kiện `new_chapter_published`: Phát tới phòng `story_${storyId}` khi admin vừa thêm chương mới.
    - Payload gửi kèm: `{ storyId, storyTitle, chapter }`.
- **Hành vi xử lý phía Mobile:**
  - Ngay khi nhận được `new_notification`: Tự động tăng `unreadCount` thêm 1, chèn thông báo vào đầu danh sách, đồng thời kích hoạt banner nổi thông báo trong ứng dụng (`InAppNotificationBanner`) trượt xuống từ cạnh trên màn hình.
  - Khi bấm vào banner hoặc thông báo trong danh sách: Đánh dấu đã đọc và tự động mở đúng màn hình đọc chương truyện (`ChapterReaderScreen`) hoặc chi tiết truyện (`StoryDetailScreen`). Nếu chương bị khóa quyền đọc, app chuyển ngay vào luồng xử lý `AccessBlockedSheet` đã có.
  - Khi người dùng đăng xuất: Tự động ngắt kết nối (`disconnectSocket()`), xóa danh sách thông báo và đưa `unreadCount` về 0. Không bao giờ tạo trùng lặp kết nối.

---

## 4. ĐIỂM KHÁC BIỆT THỰC TẾ SO VỚI TÀI LIỆU CŨ VÀ CÁCH XỬ LÝ TRONG APP

1. **Điểm đánh giá truyện (Rating fields):**
   - Tài liệu sơ bộ ghi `rating`. Thực tế backend trả về cả 3 field: `rating` (số float), `average_rating` (chuỗi số thực chính xác tính từ đánh giá người dùng thực), và `rating_count` (số lượng vote). 
   - Ứng dụng ưu tiên dùng `average_rating` kết hợp hiển thị `rating_count` để phản ánh đúng số sao thực.
2. **Khóa chính bảng truyện đã mua (`purchased-stories`):**
   - Trong phản hồi thực tế, mỗi bản ghi trả về `purchase_id` và `story_id` (chứ không phải `id`). App sử dụng `Number(item.story_id)` để đối chiếu mở khóa chương truyện chính xác 100%.
3. **Cấu trúc gói hội viên (`my-subscription`):**
   - Phản hồi thực tế chứa trực tiếp `plan_name`, `badge`, `days_remaining`, `is_active` ngay trong object `subscription`, app lấy trực tiếp các field này để hiển thị hạn dùng gói VIP.
4. **Mã phản hồi kiểm tra quyền đọc chương (`checkReadAccess`):**
   - Khi chưa có quyền đọc: backend trả về HTTP 403 kèm `code: 'PAYMENT_REQUIRED'` và object `access_info` (chứa `story_title`, `chapter_number`, `story_price`). App xử lý mở `AccessBlockedSheet` thân thiện bằng tiếng Việt, tuyệt đối không lộ chuỗi mã kỹ thuật lên UI.
5. **Lọc bình luận vi phạm phía Backend:**
   - Route `GET /api/chapters/:chapterId/comments` đã lọc cứng `status: 'approved'`. Bình luận bị admin ẩn (`hidden`) sẽ tự động không hiển thị, app không cần lọc thủ công.
6. **Không phân trang bình luận phía Backend:**
   - Backend trả về toàn bộ mảng `comments`. App xử lý phân trang 10 bình luận đầu tiên kèm nút "Xem thêm bình luận" để tối ưu hiệu năng hiển thị.
7. **Giới hạn dung lượng ảnh đại diện (Avatar Size Limit):**
   - Tài liệu `docs/API.md` ghi tối đa 5MB. Tuy nhiên, code thực tế backend tại `backend/src/middlewares/uploadMiddleware.js` (dòng 72) cấu hình `limits: { fileSize: 2 * 1024 * 1024 }` (2MB) và Web frontend (`frontend/src/pages/Reader/ProfilePage.jsx` dòng 70) kiểm tra nghiêm ngặt `file.size > 2 * 1024 * 1024` với thông báo "Kích thước ảnh đại diện không được vượt quá 2MB.".
   - Mobile app tuân thủ chặt chẽ theo backend thực tế và Web: kiểm tra dung lượng không vượt quá 2MB trước khi gửi, đồng thời nén ảnh (`quality: 0.8`) qua `expo-image-picker` để đảm bảo tệp tải lên mượt mà và không bao giờ gặp lỗi `MulterError: File too large`.
8. **Đường dẫn ảnh đại diện trả về dạng tương đối (`/uploads/avatars/...`):**
   - Backend trả về đường dẫn tương đối `/uploads/avatars/...`. App mobile tự động ghép với Base URL thông qua tiện ích `getProxiedImageUrl` (`${API_BASE_URL}/uploads/...`) và component `UserAvatar` để ảnh hiển thị chuẩn xác ở mọi màn hình (Header, Tab Tài Khoản, Thảo luận chương, Chỉnh sửa hồ sơ).
9. **Nhóm Route Thông Báo và Socket.IO Chưa Được Tài Liệu Hóa Trong `docs/API.md`:**
   - Trong tài liệu sơ bộ `docs/API.md`, nhóm route `/api/notifications` và toàn bộ cơ chế Socket.IO hoàn toàn không được liệt kê.
   - Bằng việc đọc trực tiếp mã nguồn backend thực tế (`notificationRoutes.js`, `notificationController.js`, `Notification.js`, `socketService.js`, `adminController.js`) kết hợp chạy kiểm thử độc lập với tài khoản độc giả mới, toàn bộ cấu trúc phản hồi (`notifications`, `unread_count`, `id`, `link_url`, `is_read`, v.v.) và cơ chế phòng (`user_${userId}`, `story_${storyId}`) cùng 2 sự kiện thời gian thực (`new_notification`, `new_chapter_published`) đã được xác nhận chính xác 100% và đưa vào ứng dụng mobile.

---


## 5. LOGIC TÍNH TOÁN BIỂU TƯỢNG KHÓA / MỞ KHÓA CHƯƠNG (PHÍA MOBILE)

Chương truyện được xác định là **MỞ KHÓA** khi thỏa mãn một trong các điều kiện sau:
1. Truyện có chính sách miễn phí: `story.access_policy === 'free'`
2. Chương được cấu hình đọc thử: `chapter.is_preview === true`
3. Người dùng đã đăng nhập VÀ:
   - Là tài khoản quản trị: `user.role === 'admin'`
   - HOẶC có gói VIP còn hạn: `isVip === true` hoặc `mySubscription.is_active === true`
   - HOẶC đã mua riêng trọn bộ truyện: `purchasedStories.some(p => Number(p.story_id) === Number(story.id))`
4. Tất cả các trường hợp còn lại: biểu tượng **KHÓA (VIP)** màu hổ phách.

---

## 6. HƯỚNG DẪN KIỂM THỬ THỰC TẾ TRÊN ANDROID EMULATOR

### 6.1. Khởi động môi trường
1. Đảm bảo MySQL đang chạy tại cổng `3306` và backend chạy tại cổng `5000` (`http://localhost:5000` trên máy tính host).
2. Khởi động ứng dụng Expo trên Android Emulator:
   ```bash
   cd mobile
   npx expo start --android
   ```

### 6.2. Kiểm thử Tính năng 1: Mua truyện lẻ (Story purchase)
1. **Kiểm tra trên trang chi tiết truyện (`StoryDetailScreen`):**
   - Mở bộ truyện có tính phí hoặc hỗn hợp (ví dụ: The Amazing Spider-Man).
   - Thấy nút **"Mua Trọn Bộ ([Giá] đ)"** màu xanh ngọc.
   - Bấm nút: dialog Sandbox hiện lên với tiêu đề "BẢN QUYỀN TRỌN BỘ", thời hạn "Sở hữu vĩnh viễn trọn bộ".
   - Bấm **"Hủy / Báo Thất Bại"**: giao dịch bị từ chối, thông báo lỗi tiếng Việt hiển thị, quyền đọc không được cấp.
   - Bấm **"Thanh Toán Thành Công"**: sau khi kích hoạt thành công, danh sách truyện đã mua trong `AuthContext` tự động được làm mới mà không cần đăng nhập lại.
   - Nút "Mua Trọn Bộ" biến mất, thay bằng huy hiệu **"ĐÃ SỞ HỮU BẢN QUYỀN TRỌN BỘ"** kèm dấu tích xanh. Toàn bộ các ổ khóa chương chuyển sang trạng thái mở khóa.
   - Chuyển sang Tab "Tài Khoản": danh sách "Truyện Đã Mua Lẻ" hiển thị bộ truyện vừa mua.
2. **Kiểm tra tại Bottom Sheet chặn quyền đọc (`AccessBlockedSheet`):**
   - Đăng nhập tài khoản chưa sở hữu truyện và chưa có VIP (hoặc tài khoản độc giả mới).
   - Bấm vào chương trả phí (ví dụ Chương 3).
   - Bottom sheet hiện lên với thông tin truyện, giá trọn bộ và 2 nút: "Đăng Ký Gói Hội Viên VIP" và "Mua Riêng Trọn Bộ".
   - Bấm "Mua Riêng Trọn Bộ": mở dialog Sandbox ngay tại chỗ. Sau khi bấm thanh toán thành công, sheet tự đóng và nội dung chương truyện mở khóa ngay lập tức.

### 6.3. Kiểm thử Tính năng 2: Theo dõi / yêu thích truyện
1. Tại `StoryDetailScreen`, quan sát nút **"Theo Dõi"** kèm số lượng người theo dõi hiện tại.
2. Nếu chưa đăng nhập: bấm vào nút sẽ tự động chuyển sang màn hình Đăng Nhập.
3. Nếu đã đăng nhập:
   - Bấm nút: trạng thái chuyển ngay sang **"Đang Theo Dõi"** (màu hồng rose, icon tim đỏ đặc) và số đếm tăng lên 1.
   - Bấm lần nữa: hủy theo dõi, trạng thái trở về bình thường và số đếm giảm 1.
4. Thoát khỏi màn hình chi tiết rồi vào lại: trạng thái theo dõi được gọi lại từ API qua `useFocusEffect`, đảm bảo đồng bộ với Web mà không bị cache cứng.

### 6.4. Kiểm thử Tính năng 3: Thảo luận theo chương
1. Mở bất kỳ chương truyện nào (ví dụ: The Amazing Spider-Man Chapter 1).
2. Cuộn xuống dưới cùng, qua phần nhân vật và điều hướng chương, sẽ thấy khu vực **"Thảo Luận Chương"**.
3. **Khi chưa đăng nhập:**
   - Hiển thị hộp thông báo "Đăng nhập để tham gia thảo luận cùng cộng đồng độc giả Marvel" và nút "Đăng Nhập Ngay".
4. **Khi đã đăng nhập:**
   - Hiển thị avatar người dùng (ảnh hoặc chữ cái đầu), nhãn "Bình luận với tư cách: [Tên bạn]".
   - Ô nhập văn bản hỗ trợ nhiều dòng, bộ đếm `0/1000 ký tự`.
   - Bấm "Gửi Bình Luận" khi ô trống: cảnh báo không được để trống.
   - Nhập nội dung và gửi: bình luận lập tức xuất hiện đầu danh sách với avatar, tên, nhãn VIP/Admin và thời gian thực tế.
5. **Thao tác trên từng bình luận:**
   - Bấm icon Tim: tăng số lượt thích ngay lập tức và gọi `POST /api/comments/:id/like`.
   - Bấm icon Cờ (Báo cáo): mở hộp thoại chọn lý do vi phạm (phản cảm, spam, xúc phạm, spoiler, lý do khác). Bấm "Gửi Báo Cáo" -> hiển thị thông báo gửi thành công tới ban quản trị.
6. **Phân trang Client:**
   - Nếu chương có trên 10 bình luận: chỉ hiển thị 10 bình luận đầu tiên cùng nút "Xem thêm bình luận ([X] bình luận khác)". Bấm nút sẽ nạp thêm 10 bình luận tiếp theo.

### 6.5. Cách tạo tài khoản độc giả mới để thử nghiệm mua truyện thành công an toàn
Để kiểm thử nhánh thanh toán thành công (`process-sandbox` với `simulate_failure: false`) mà tuyệt đối không làm ảnh hưởng đến các tài khoản test có sẵn, bạn có thể tạo nhanh một tài khoản độc giả mới thông qua Node.js:
```bash
node -e "
const { User } = require('../backend/src/models');
const bcrypt = require('../backend/node_modules/bcryptjs');
(async () => {
  const hash = await bcrypt.hash('Reader123@', 10);
  const u = await User.create({
    username: 'reader_test_' + Date.now().toString().slice(-4),
    email: 'reader_' + Date.now() + '@marvel.test',
    password: hash,
    full_name: 'Độc Giả Thử Nghiệm',
    role: 'reader',
    status: 'active'
  });
  console.log('Tài khoản mới tạo thành công:');
  console.log('Username:', u.username);
  console.log('Password: Reader123@');
  process.exit(0);
})();
"
```
Đăng nhập tài khoản này trên ứng dụng Mobile, tiến hành mua truyện lẻ The Amazing Spider-Man với nút "Thanh Toán Thành Công", sau đó xác nhận truyện mở khóa vĩnh viễn.

### 6.6. Kiểm thử Tính năng Đăng Ký Tài Khoản & Chỉnh Sửa Hồ Sơ

#### A. Kiểm thử Đăng Ký Tài Khoản (`RegisterScreen`):
1. **Truy cập từ màn hình Đăng Nhập:**
   - Mở app hoặc vào tab "Tài Khoản" -> Bấm "Đăng Nhập Ngay" (hoặc đăng xuất nếu đang đăng nhập).
   - Quan sát dòng liên kết mới dưới nút Đăng Nhập: **"Chưa có tài khoản? Đăng ký ngay"**.
   - Bấm vào "Đăng ký ngay" -> Màn hình đăng ký trượt vào mượt mà.
2. **Kiểm tra Validation hợp lệ phía Client:**
   - Để trống và bấm "ĐĂNG KÝ TÀI KHOẢN": Cảnh báo đỏ xuất hiện tại từng ô.
   - Nhập tên đăng nhập có dấu cách hoặc ký tự đặc biệt: Báo lỗi "Tên đăng nhập chỉ gồm chữ cái, số và dấu gạch dưới (_)."
   - Nhập email sai định dạng (ví dụ `test`): Báo lỗi "Định dạng email không hợp lệ."
   - Nhập mật khẩu < 6 ký tự: Báo lỗi "Mật khẩu phải có độ dài tối thiểu 6 ký tự."
   - Nhập xác nhận mật khẩu không khớp: Báo lỗi "Xác nhận mật khẩu không khớp với mật khẩu đã nhập."
   - Thử nghiệm nút con mắt (Show/Hide password): Mỗi ô mật khẩu có thể bật/tắt hiển thị hoàn toàn độc lập.
3. **Kiểm tra xử lý phản hồi từ Backend:**
   - Thử đăng ký với username đã tồn tại (ví dụ `admin`): Backend trả về 409 -> App hiển thị lỗi tiếng Việt "Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác."
   - Thử đăng ký với email đã tồn tại (ví dụ `admin@marvel.test`): Backend trả về 409 -> App hiển thị lỗi tiếng Việt "Địa chỉ email này đã được đăng ký. Vui lòng sử dụng email khác."
4. **Đăng ký thành công & Tự động đăng nhập:**
   - Nhập thông tin mới:
     - Họ và tên: `Người Nhện Peter`
     - Tên đăng nhập: `spider_test_xxxx` (chọn hậu tố ngẫu nhiên)
     - Email: `spider_test_xxxx@marvel.test`
     - Mật khẩu: `SpiderPass123`
     - Xác nhận: `SpiderPass123`
   - Bấm "ĐĂNG KÝ TÀI KHOẢN": Nút hiển thị spinner tải, chặn bấm hai lần.
   - Sau khi backend trả về token (HTTP 201), app tự động lưu token vào `SecureStore`, cập nhật `AuthContext` và vào thẳng màn hình chính `Main` mà không cần đăng nhập lại.

#### B. Kiểm thử Chỉnh Sửa Hồ Sơ Cá Nhân (`ProfileEditScreen`):
1. **Truy cập màn hình chỉnh sửa:**
   - Vào tab "Tài Khoản" -> Quan sát trong thẻ tài khoản có mục **"Chỉnh Sửa Hồ Sơ"** kèm icon cây bút.
   - Bấm vào mục này -> Chuyển sang màn hình `ProfileEditScreen`.
2. **Phần 1: Cập nhật Họ và Tên:**
   - Nhập họ tên mới vào ô "Họ và Tên (Tên Hiển Thị)" (ví dụ: `Peter Parker (Spider-Man)`).
   - Tên đăng nhập và Email bị khóa (readonly) với nhãn "Không thể thay đổi" đúng như Web.
   - Bấm **"Lưu Thay Đổi Họ Tên"** -> Gọi `PUT /api/auth/profile`.
   - Banner xanh hiển thị: "Cập nhật họ và tên thành công!".
   - Quay lại tab "Tài Khoản" -> Tên hiển thị mới được cập nhật ngay lập tức mà không cần tải lại trang.
3. **Phần 2: Cập nhật Ảnh Đại Diện (Avatar):**
   - Bấm nút Camera trên avatar hoặc nút **"Chọn Ảnh Từ Thư Viện"**.
   - Hộp thoại xin quyền truy cập thư viện ảnh của thiết bị xuất hiện.
   - Chọn ảnh mong muốn (JPG, PNG, WEBP).
   - Ảnh được crop tỉ lệ 1:1 và nén tối ưu.
   - App kiểm tra dung lượng (tối đa 2MB) trước khi gửi qua `POST /api/auth/avatar` (multipart/form-data field `avatar`).
   - Cập nhật thành công: Ảnh đại diện mới lập tức hiển thị trên `ProfileEditScreen`, đồng thời phản ánh đồng bộ ngay trên Tab Tài Khoản và khu vực bình luận.
4. **Phần 3: Đổi Mật Khẩu:**
   - Kiểm tra 3 ô mật khẩu: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới. Mỗi ô có nút con mắt hiển thị/ẩn độc lập.
   - Thử nhập mật khẩu cũ sai: Báo lỗi tiếng Việt "Mật khẩu cũ không chính xác. Vui lòng kiểm tra lại."
   - Thử nhập mật khẩu mới < 8 ký tự: Báo lỗi "Mật khẩu mới phải có độ dài tối thiểu 8 ký tự."
   - Thử nhập xác nhận không khớp: Báo lỗi "Xác nhận mật khẩu mới không khớp."
   - Nhập đúng mật khẩu cũ và mật khẩu mới >= 8 ký tự -> Bấm **"Cập Nhật Mật Khẩu"** -> Báo thành công "Đổi mật khẩu thành công!", 3 ô mật khẩu tự động xóa trắng.

---

### 6.7. Hướng dẫn chuẩn bị ảnh trong máy ảo Android Emulator

Để kiểm thử tính năng chọn và tải ảnh đại diện bằng `expo-image-picker` trong Android Studio Emulator, bạn có thể đưa ảnh vào máy ảo theo một trong 3 cách cực kỳ đơn giản sau:

- **Cách 1 (Nhanh nhất - Kéo thả ảnh):**
  1. Chuẩn bị 1 tệp ảnh `.jpg` hoặc `.png` bất kỳ trên máy tính của bạn.
  2. Kéo (drag) tệp ảnh đó từ File Explorer của Windows và thả (drop) trực tiếp vào màn hình cửa sổ Android Emulator.
  3. Máy ảo Android sẽ tự động lưu tệp vào thư mục `Downloads` / `Pictures` và quét vào thư viện ảnh hệ thống (Google Photos / Gallery).
- **Cách 2 (Sử dụng ứng dụng Camera trong máy ảo):**
  1. Trong máy ảo Android, mở ứng dụng **Camera**.
  2. Android Emulator đã tích hợp sẵn khung cảnh mô phỏng 3D di chuyển được. Bấm nút chụp ảnh màu trắng để chụp 1 bức ảnh mẫu.
  3. Bức ảnh chụp sẽ ngay lập tức có mặt trong thư viện để `expo-image-picker` mở lên chọn.
- **Cách 3 (Tải từ Chrome trên máy ảo):**
  1. Mở trình duyệt Chrome trong Android Emulator.
  2. Tìm kiếm một hình ảnh bất kỳ (ví dụ: Marvel Avatar).
  3. Nhấn giữ vào ảnh -> Chọn **Download image**. Ảnh sẽ được lưu vào thư viện của máy ảo.

---

### 6.8. Hướng dẫn kiểm thử Tính năng Thông Báo & Thông Báo Thời Gian Thực (Socket.IO)

#### A. Kiểm thử Danh sách Thông báo & Trạng thái Chưa đăng nhập:
1. **Khi chưa đăng nhập:**
   - Mở ứng dụng hoặc đăng xuất tài khoản.
   - Bấm vào tab **"Thông Báo"** ở thanh điều hướng dưới đáy (icon chuông).
   - Quan sát: App hiển thị thẻ yêu cầu đăng nhập thân thiện với icon chuông viền đỏ Marvel, tiêu đề "ĐĂNG NHẬP ĐỂ XEM THÔNG BÁO" và nút "ĐĂNG NHẬP NGAY".
   - Bấm nút "ĐĂNG NHẬP NGAY": Chuyển mượt mà sang màn hình Đăng Nhập.
2. **Khi đã đăng nhập:**
   - Đăng nhập vào tài khoản độc giả.
   - Tab "Thông Báo" hiển thị danh sách các thông báo (tiêu đề, nội dung tóm tắt, thời gian định dạng tiếng Việt, huy hiệu Mới/Đã đọc).
   - Kéo danh sách từ trên xuống dưới (Pull-to-refresh): Spinner đỏ Marvel xoay và nạp lại dữ liệu mới nhất từ server.
   - Mỗi lần chuyển từ tab khác sang tab Thông Báo, app tự động gọi lại API (`useFocusEffect`), hoàn toàn không cache cứng.
3. **Đánh dấu đã đọc từng thông báo & Điều hướng thông minh:**
   - Bấm vào một thông báo chưa đọc:
     - Chấm đỏ trạng thái biến mất, thẻ chuyển sang trạng thái đã đọc (`is_read: true`).
     - Số đếm trên huy hiệu (Badge) tại Tab "Thông Báo" và Header trang chủ giảm đi 1 ngay lập tức.
     - App tự động mở đúng chương truyện (`ChapterReaderScreen`) hoặc chi tiết truyện (`StoryDetailScreen`) tương ứng với `link_url`.
     - Nếu chương truyện trả phí bị khóa quyền đọc, app chuyển vào đúng luồng chặn quyền đọc `AccessBlockedSheet` đã có.
4. **Đánh dấu tất cả đã đọc:**
   - Tại góc phải header màn hình Thông Báo, quan sát nút **"Đã đọc tất cả"**.
   - Bấm nút: Gọi `PATCH /api/notifications/read-all`. Toàn bộ các thông báo chuyển sang "Đã đọc", huy hiệu số chưa đọc biến mất hoàn toàn. Nút "Đã đọc tất cả" tự động chuyển sang trạng thái mờ (disabled).
5. **Trạng thái danh sách trống:**
   - Khi tài khoản chưa có thông báo nào: App hiển thị icon tĩnh vector SVG `notifications-off-outline` trong vòng tròn tối `#1A1A22` (tuyệt đối không dùng ảnh internet), dòng chữ "Chưa có thông báo nào" và nút "Khám phá kho truyện" đưa về trang chủ.

#### B. Kiểm thử Thông Báo Thời Gian Thực (Socket.IO) khi App đang mở:
Khi ứng dụng đang mở trên Android Emulator và người dùng đã đăng nhập:
1. App tự động kết nối Socket.IO tới backend (`http://10.0.2.2:5000` hoặc máy tính host) và gia nhập phòng cá nhân `user_${userId}`.
2. Để mô phỏng phát thông báo thời gian thực đến tài khoản đang mở app (ví dụ User ID `269` hoặc ID của tài khoản đang đăng nhập trong app), bạn có thể chạy lệnh Node.js sau tại thư mục gốc dự án:
   ```bash
   node -e "
   const { Notification } = require('./backend/src/models');
   const { sendNotificationToUser } = require('./backend/src/services/socketService');
   const { io } = require('./backend/node_modules/socket.io-client');

   (async () => {
     // Thay TARGET_USER_ID bằng ID người dùng đang đăng nhập trên Mobile
     const TARGET_USER_ID = 269; 
     
     const notif = await Notification.create({
       user_id: TARGET_USER_ID,
       title: 'Chương mới: The Amazing Spider-Man',
       message: 'Chương 12: Đột kích tháp Oscorp đã chính thức ra mắt!',
       type: 'new_chapter',
       link_url: '/stories/1/chapters/88',
       is_read: false
     });

     // Kết nối nhanh tới backend và phát qua socket
     const socket = io('http://localhost:5000');
     socket.on('connect', () => {
       console.log('Phát thông báo thời gian thực tới user_' + TARGET_USER_ID);
       socket.emit('join_user', TARGET_USER_ID);
       // Gửi qua socketService backend
       sendNotificationToUser(TARGET_USER_ID, notif.toJSON());
       setTimeout(() => {
         socket.disconnect();
         console.log('Hoàn tất phát thông báo mẫu.');
         process.exit(0);
       }, 500);
     });
   })();
   "
   ```
3. **Quan sát phản hồi ngay lập tức trên màn hình Android Emulator:**
   - Một **Banner thông báo thời gian thực (`InAppNotificationBanner`)** màu tối Marvel với thanh nhấn đỏ và icon chuông sẽ tự động trượt xuống từ mép trên cùng của màn hình.
   - Huy hiệu số chưa đọc (Badge đỏ) trên icon chuông ở Header trang chủ và tab "Thông Báo" tăng lên 1 ngay lập tức mà không cần đăng nhập lại hay tải lại trang.
   - Bấm vào banner nổi: Banner tự động đóng, thông báo được đánh dấu đã đọc và mở thẳng vào chương truyện tương ứng!
4. **Kiểm thử đăng xuất & ngắt kết nối:**
   - Vào tab "Tài Khoản" -> Bấm "Đăng Xuất".
   - Socket.IO tự động ngắt kết nối (`disconnect`), huy hiệu thông báo được xóa sạch, đảm bảo an toàn và không gây rò rỉ kết nối ngầm.



