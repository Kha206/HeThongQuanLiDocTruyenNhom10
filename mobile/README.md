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
| `react-native-screens` | `~4.30.0` | Tối ưu hóa bộ nhớ native cho các màn hình điều hướng của React Navigation. |
| `react-native-safe-area-context`| `~5.10.1` | Xử lý vùng an toàn (tai thỏ, notch, thanh điều hướng dưới) trên Android/iOS. |

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

---

## 4. ĐIỂM KHÁC BIỆT THỰC TẾ SO VỚI TÀI LIỆU CŨ VÀ CÁCH XỬ LÝ TRONG APP

1. **Điểm đánh giá truyện (Rating fields):**
   - Tài liệu sơ bộ ghi `rating`. Thực tế backend trả về cả 3 field: `rating` (số float), `average_rating` (chuỗi số thực chính xác tính từ đánh giá người dùng thực), và `rating_count` (số lượng vote). 
   - Ứng dụng ưu tiên dùng `average_rating` kết hợp hiển thị `rating_count` để phản ánh đúng số sao thực.
2. **Khóa chính bảng truyện đã mua (`purchased-stories`):**
   - Trong phản hồi thực tế, mỗi bản ghi trả về `purchase_id` và `story_id` (chứ không phải `id`). App sử dụng `Number(item.story_id)` để đối chiếu mở khóa chương truyện chính xác 100%.
3. **Cấu trúc gói hội viên (`my-subscription`):**
   - Phản hồi thực tế chứa trực tiếp `plan_name`, `badge`, `days_remaining`, `is_active` ngay trong object `subscription`, app lấy trực tiếp các field này để hiển thị hạn dùng gói VIP.

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
