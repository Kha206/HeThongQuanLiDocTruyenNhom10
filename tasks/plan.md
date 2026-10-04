# Implementation Plan: Marvel Comic Platform (Nhóm 10)

## Overview
Dự án Marvel Comic Platform được tổ chức và phát triển tuần tự theo mô hình Scrum/Agile với 5 Sprint cụ thể trên Critical Path (đường găng PERT). Kế hoạch này tập trung triển khai chi tiết **Sprint 1 (27 Story Points)** nhằm hoàn thành nền tảng hạ tầng cốt lõi: kết nối MySQL `marvel_db`, Sequelize migrations, script cào nạp dữ liệu truyện Marvel thật từ ComicVine API (`seedFromComicVine.js`), xác thực JWT, các API & UI cơ bản cho độc giả & quản trị viên, và đặc biệt là component 3D WebGL `HeroScene.jsx` tái hiện trọn vẹn 10 tiêu chuẩn kỹ thuật từ template tham khảo.

---

## Architecture Decisions & Best Practices

1. **CSDL MySQL & Sequelize Migrations:**
   - Dùng XAMPP MySQL trên cổng 3306, user `root`, không mật khẩu, DB `marvel_db`.
   - Các bảng trong Sprint 1: `Users` (id, username, email, password, full_name, role, avatar, created_at, updated_at), `Stories` (id, comicvine_id, title, original_title, slug, description, cover_image, banner_image, publisher, release_year, status, access_policy, view_count, rating, created_at, updated_at), `Genres` (id, name, slug, description), `StoryGenres` (story_id, genre_id), `Chapters` (id, story_id, comicvine_issue_id, chapter_number, title, release_date, is_preview, pages_data, created_at, updated_at).
   - Migration files độc lập bằng `sequelize-cli` để đảm bảo có thể migrate/rollback rõ ràng.

2. **Dữ Liệu Thật Từ ComicVine (`seedFromComicVine.js`):**
   - Tuân thủ rate limit: ComicVine giới hạn 200 request/resource/giờ. Script đặt `setTimeout` tối thiểu 1.1s - 1.2s giữa mỗi request.
   - Script gọi resource `/volumes` lọc `publisher:Marvel` hoặc tìm các series Marvel kinh điển (Spider-Man, Avengers, Iron Man, Thor, X-Men, Captain America, Wolverine, Deadpool...), sau đó gọi tiếp `/issues` để lấy danh sách chapter thật kèm ảnh bìa gốc.
   - Lưu trữ link ảnh gốc chất lượng cao từ CDN ComicVine (medium_url, super_url).

3. **Backend API Structure:**
   - Express server tổ chức theo Controller - Service - Model pattern.
   - Middleware: `authMiddleware` (xác thực token Bearer JWT), `roleMiddleware` (phân quyền Admin).
   - Validation dữ liệu đầu vào bằng middleware validation.

4. **Frontend Architecture & 3D HeroScene:**
   - React + Vite + TailwindCSS.
   - Component `HeroScene.jsx`: Dùng Three.js dựng Canvas trong container `400vh`.
   - Shader tùy chỉnh GLSL wave với color palette Marvel: c0 (đỏ rượu sang đỏ Marvel rực), c1 (xanh navy vũ trụ sang tím xanh ánh kim).
   - Hạt Forge Sparks: 450 hạt chuyển động vật lý, màu đỏ Marvel (60%) và xanh vũ trụ (40%).
   - Thay thế mô hình 3D GLB bằng cụm 4-6 plane 3D hiển thị bìa truyện Marvel thật lấy từ DB đã seed. Khi chuột di chuyển, cụm plane nghiêng theo tọa độ chuột.
   - Custom cursor 2 vòng tròn hoạt động độc quyền trong phạm vi Hero.
   - Phông chữ Google Fonts: `Italiana` cho tiêu đề lớn, `Outfit` cho subtitle/body.
   - Cuộn qua 400vh sẽ chuyển mượt xuống Story List với bảng màu Dark Mode điện ảnh (`#0F0F14`, card `#1A1A22`, accent `#ED1D24`).

---

## Detailed Sprint 1 Implementation Tasks

### Giai đoạn 1: Khởi tạo Project & CSDL
- **Task 1.1:** Khởi tạo cấu trúc thư mục project (`backend`, `frontend`, `docs`) và cấu hình `package.json`, `.env.example`, `.gitignore`.
- **Task 1.2:** Cài đặt dependencies backend (`express`, `mysql2`, `sequelize`, `sequelize-cli`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `axios`).
- **Task 1.3:** Viết migrations Sequelize cho 5 bảng nền tảng: `Users`, `Stories`, `Genres`, `StoryGenres`, `Chapters`.
- **Task 1.4:** Định nghĩa Sequelize Models với đầy đủ associations (Story `belongsToMany` Genre qua StoryGenre, Story `hasMany` Chapter, v.v.). Chạy migrate vào `marvel_db`.

### Giai đoạn 2: Seed Dữ Liệu ComicVine Thật
- **Task 1.5:** Viết service và script `backend/scripts/seedFromComicVine.js` giao tiếp với ComicVine API. Cào ít nhất 5-10 series Marvel lớn cùng các issue/chapter đi kèm, đảm bảo delay 1.1s/request.
- **Task 1.6:** Thực thi script seed và xác nhận dữ liệu đã nằm trọn vẹn trong `marvel_db` (có tiêu đề thật, ảnh bìa thật, mô tả thật, chapter thật).

### Giai đoạn 3: Backend API Sprint 1
- **Task 1.7:** Xây dựng Module Auth (Đăng ký, Đăng nhập trả về JWT token, Đăng xuất, Lấy thông tin user hiện tại). Tạo sẵn tài khoản Admin mẫu (`admin@marvel.local`).
- **Task 1.8:** Xây dựng Module Story (Lấy danh sách truyện, lọc/tìm kiếm theo tên & thể loại, lấy chi tiết 1 truyện kèm thể loại và danh sách chương).
- **Task 1.9:** Xây dựng Module Admin Story & Chapter Management (Thêm, Sửa, Xóa truyện; Quản lý chương truyện).
- **Task 1.10:** Xây dựng Module Genre (Lấy danh sách thể loại, quản lý thể loại cho Admin).

### Giai đoạn 4: Frontend Setup & Core Layout
- **Task 1.11:** Khởi tạo frontend bằng Vite + React + TailwindCSS. Cài đặt các thư viện cần thiết (`three`, `lucide-react`, `axios`, `react-router-dom`).
- **Task 1.12:** Cấu hình TailwindCSS với theme Marvel chuẩn (màu `#0F0F14`, `#1A1A22`, `#ED1D24`, font `Inter`, `Outfit`, `Italiana`).
- **Task 1.13:** Xây dựng Navbar (responsive, trạng thái đăng nhập, menu Reader/Admin) và Footer (ghi rõ *"Dữ liệu truyện cung cấp bởi Comic Vine"* kèm hyperlink).
- **Task 1.14:** Xây dựng Context quản lý trạng thái Xác thực (AuthContext) và API client.

### Giai đoạn 5: Phát Triển HeroScene.jsx (10 Tiêu Chuẩn Kỹ Thuật)
- **Task 1.15:** Cấu trúc container `400vh` và hệ thống scroll listener / Intersection Observer.
- **Task 1.16:** Xây dựng Custom Cursor (vòng trong 6px, vòng ngoài 40px lerp 0.2) hoạt động trong Hero.
- **Task 1.17:** Lập trình GLSL Background Shader với 3 wave noise và bảng màu Marvel ($c_0$ đỏ rượu $\to$ đỏ Marvel rực; $c_1$ xanh navy $\to$ tím xanh ánh kim).
- **Task 1.18:** Tạo hệ thống Forge Sparks (450 hạt, texture gradient canvas 16x16, blend Additive, màu đỏ Marvel & xanh vũ trụ, physics tái chế hạt).
- **Task 1.19:** Tích hợp cụm 4-6 plane 3D hiển thị ảnh bìa Marvel thật từ DB qua TextureLoader, tilt xoay theo chuột.
- **Task 1.20:** Thiết lập Lighting Rig chuẩn (#ffffff@0.1, SpotLight đỏ #ff3333@18.0, Rim xanh #4d6fff@10.0, Fill #fff3e6@0.8).
- **Task 1.21:** Hiệu ứng Per-letter Title Reveal (`splitTitlesIntoChars`), Grid Overlay 5 đường dọc + chấm trôi + progress bar, và 4 slides nội dung Marvel (Slide 1, Slide 2 với mask ảnh bìa thật, Slide 3, Slide 4 + nút CTA).
- **Task 1.22:** Hoàn thiện Animate loop mượt mà, cleanup tài nguyên Three.js khi unmount.

### Giai đoạn 6: Giao Diện Người Dùng Sprint 1
- **Task 1.23:** Hoàn thiện `HomePage.jsx` kết hợp `HeroScene.jsx` ở trên và danh sách truyện Marvel (Story Grid, tìm kiếm nhanh, lọc thể loại) ở dưới.
- **Task 1.24:** Xây dựng `StoryDetailPage.jsx` (thông tin chi tiết truyện, tác giả, nhà xuất bản, tóm tắt, danh sách chương đọc thử / chính thức).
- **Task 1.25:** Xây dựng trang Đăng nhập & Đăng ký (`LoginPage.jsx`, `RegisterPage.jsx`).
- **Task 1.26:** Xây dựng trang Quản trị Admin: `AdminStoriesPage.jsx` và `AdminChaptersPage.jsx`.

---

## Checkpoints & Verification
- **Checkpoint 1 (Sau Giai đoạn 1 & 2):**
  - Database `marvel_db` kết nối thành công.
  - Script seed chạy xong, kiểm tra MySQL có ít nhất 5-10 series Marvel kèm chapters thật.
- **Checkpoint 2 (Sau Giai đoạn 3 & 4):**
  - Các API Auth, Stories, Chapters, Genres kiểm tra phản hồi JSON chuẩn xác qua Postman/cURL.
  - Frontend React chạy Vite không có warning, Tailwind CSS áp dụng đồng bộ.
- **Checkpoint 3 (Sau Giai đoạn 5 & 6):**
  - HeroScene 3D render trọn vẹn, không có lỗi WebGL context hay lỗi console.
  - Tải ảnh bìa thật mượt mà, các tương tác chuột & scroll 400vh chuẩn xác.
  - Luồng xem chi tiết truyện, tìm kiếm, đăng ký/đăng nhập hoạt động hoàn chỉnh.

---

## Risks and Mitigations
| Rủi ro | Mức độ | Biện pháp giảm thiểu |
|---|---|---|
| ComicVine API Rate Limit (200 req/h) hoặc chặn request | Cao | Bắt buộc delay $\ge 1.1s$ giữa các request; thiết lập User-Agent hợp lệ theo quy định ComicVine; cache dữ liệu vào MySQL vĩnh viễn, app không gọi trực tiếp. |
| Hiệu năng WebGL/Three.js bị tụt FPS trên máy cấu hình yếu | Trung bình | Tối ưu số lượng hạt (450 hạt), dùng geometry nhẹ (PlaneGeometry), vô hiệu hóa shadow tính toán nặng, dọn dẹp bộ nhớ khi scroll ra khỏi 400vh. |
| Ảnh bìa từ ComicVine bị chặn CORS khi load vào Three.js Texture | Cao | Lưu ý cấu hình `crossOrigin = "anonymous"` trên TextureLoader hoặc proxy ảnh qua backend nếu cần thiết. |

---

## Detailed Sprint 2 Implementation Plan (26 Story Points)

### Module 1: `story-catalog-status` (US-12, US-21)
- **Mục tiêu:** Cung cấp đầy đủ trạng thái truyện (`ongoing`, `completed`, `dropped`), bộ lọc kết hợp nâng cao trên Reader Catalog và thao tác cập nhật nhanh trạng thái cho Admin.
- **Backend:**
  - Cập nhật `storyController.getAllStories` để hỗ trợ lọc kết hợp: `status`, `access_policy`, `genre`, `search` và sắp xếp đa dạng (`latest`, `views`, `rating`, `year`, `title`).
  - Thêm endpoint `PATCH /api/admin/stories/:id/status` cho Admin đổi trạng thái nhanh.
- **Frontend:**
  - Reader `HomePage.jsx`: Bộ điều khiển phân loại truyện theo trạng thái, chính sách và sắp xếp.
  - Reader `ComicCard.jsx`: Hiển thị badge trạng thái và chính sách tinh tế.
  - Admin `AdminStoriesPage.jsx`: Cột trạng thái có dropdown đổi trạng thái trực tiếp.

### Module 2: `access-policy-preview` (US-04, US-05)
- **Mục tiêu:** Cho phép cấu hình chính sách truy cập Free / Paid / Mixed, định giá bán lẻ, và quản lý các chương đọc thử (`is_preview`).
- **Backend:**
  - Thêm endpoint `PATCH /api/admin/stories/:id/policy` cập nhật `access_policy` và `price`.
  - Thêm endpoint `PATCH /api/admin/chapters/:id/preview` bật/tắt cờ đọc thử cho từng chương.
  - Thêm endpoint `POST /api/admin/stories/:id/quick-preview` tự động gắn cờ N chương đầu đọc thử.
- **Frontend:**
  - Admin `AdminStoriesPage.jsx`: Thêm modal chuyên biệt "Quản lý chương & đọc thử", hỗ trợ switch toggle `is_preview` 1-click cho từng chương.
  - Reader `StoryDetailPage.jsx`: Hiển thị rõ giá bán lẻ và nhãn chương đọc thử / VIP trên danh sách chương.

### Module 3: `subscription-plans-pricing` (US-06, US-07)
- **Mục tiêu:** Xây dựng hạ tầng dữ liệu Gói thành viên đọc tháng (`SubscriptionPlan`), giao diện quản trị Admin và trang bảng giá công khai cho Độc giả.
- **Database:**
  - Migration Sequelize `20261003000006-create-subscription-plans.js`.
  - Model `SubscriptionPlan.js` định nghĩa các trường: `name`, `slug`, `description`, `price`, `duration_days`, `badge`, `features` (JSON), `is_active`, `display_order`.
  - Seed 3 gói đọc tiêu chuẩn: 1 Tháng (49k), 3 Tháng (129k - Hot), 1 Năm (399k - VIP).
- **Backend API:**
  - Public: `GET /api/plans`, `GET /api/plans/:id`.
  - Admin: `POST /api/admin/plans`, `PUT /api/admin/plans/:id`, `DELETE /api/admin/plans/:id`, `PATCH /api/admin/plans/:id/toggle`.
- **Frontend:**
  - Tạo mới trang Độc giả `SubscriptionsPage.jsx` (`/subscriptions`) với thiết kế Dark Mode Marvel điện ảnh, thẻ so sánh quyền lợi gói đọc.
  - Tạo trang Quản trị `AdminPlansPage.jsx` (`/admin/plans`) để Admin CRUD các gói đọc.
  - Cập nhật `Navbar.jsx` thêm liên kết "Gói Hội Viên VIP".

### Module 4: `view-counter-anti-abuse` (US-09)
- **Mục tiêu:** Ghi nhận lượt đọc chính xác, chống gian lận spam reload, cập nhật atomic và hiển thị format số lượt xem.
- **Backend:**
  - Endpoint `POST /api/stories/:id/view`: Kiểm tra thời gian đọc thực tế $\ge 15s$ và debounce IP/User trong bộ nhớ 10 phút.
  - Cập nhật atomic `Story.increment('view_count', { by: 1, where: { id } })`.
- **Frontend:**
  - Tích hợp hook/timer ghi nhận lượt đọc hợp lệ khi độc giả dừng xem truyện $\ge 15s$.
  - Helper hiển thị số lượt xem rút gọn (K, M) kèm tooltip số lượng chính xác.

---

## Detailed Implementation Plan: Hệ Thống Đọc Chapter Phong Phú Thị Giác

### Giai đoạn 1: Mở rộng CSDL & Trích xuất màu nổi bật (`node-vibrant`)
- Tạo migration Sequelize `20261003000007-add-rich-fields-to-chapters.js`:
  - Thêm cột `cover_image`, `content`, `character_credits`, `accent_color` vào bảng `chapters`.
- Cập nhật model `backend/src/models/Chapter.js`.
- Cài đặt & tích hợp module `node-vibrant/node` vào helper `extractAccentColor(imageUrl)`:
  - Trích xuất bảng màu `palette.Vibrant?.hex` hoặc `palette.DarkVibrant?.hex`.
  - Fallback về `#ED1D24` khi có lỗi.

### Giai đoạn 2: Cập nhật Seed Script ComicVine với 10-13 Chapter/Story
- Cập nhật `backend/scripts/seedFromComicVine.js`:
  - Mở rộng catalog toàn bộ 8 series Marvel lên 10-13 chapter/issue đầy đủ.
  - Mỗi chapter bao gồm: `comicvine_issue_id`, `issue_number`, `title`, `release_date`, `cover_image` (ảnh bìa ComicVine thật), `content` (description tóm tắt ComicVine thật), `character_credits` (tối đa 8 nhân vật với icon thật từ ComicVine).
  - Tự động chạy `extractAccentColor` để tính toán và lưu `accent_color` cho từng chapter.
  - Chạy lại seed script và xác nhận MySQL có đủ 10-13 chapter/story.

### Giai đoạn 3: Backend API phục vụ Chapter Reader
- Nâng cấp `storyController.getChapterDetail` (`GET /api/stories/chapters/:chapterId` hoặc `GET /api/chapters/:chapterId`):
  - Trả về chapter với `content`, `cover_image`, `character_credits`, `accent_color`.
  - Truy vấn tìm `prev_chapter` và `next_chapter` theo `chapter_number` trong cùng `story_id`.

### Giai đoạn 4: Xây dựng Giao diện ChapterReaderPage & Nâng cấp StoryDetailPage
- Nhập font `Merriweather` vào `frontend/index.html` và `tailwind.config.js`.
- Xây dựng component `ChapterReaderPage.jsx`:
  - Hero Header 50-60vh với parallax scroll và gradient tối.
  - Style động theo `accent_color` của chapter.
  - Pull Quote font Italiana với dấu ngoặc kép lớn mờ ảo.
  - Nội dung chính font Merriweather, max-width ~680px, line-height 1.8.
  - Backdrop nhân vật mờ ảo (blur 25px, opacity 0.06).
  - Section Dải nhân vật (avatar tròn + tên, cuộn ngang trên mobile).
  - Điều hướng cuối trang (2 card prev/next có thumbnail cover_image).
  - Luân phiên bố cục: Chapter LẺ (Hero full-width phía trên) vs Chapter CHẴN (2 cột sticky 40%/60%, mobile fallback 1 cột).
- Nâng cấp danh sách chapter trên `StoryDetailPage.jsx`:
  - Hiển thị thumbnail nhỏ `cover_image` và dải màu `accent_color` ở viền trái mỗi card.
- Đăng ký route `/stories/:storyId/chapters/:chapterId` trong `frontend/src/App.jsx`.


