# Task List: Marvel Comic Platform

## Sprint 1 (27 Story Points) - Nền Tảng, Dữ Liệu ComicVine, Auth & Hero 3D

### Giai đoạn 1: Khởi tạo Project & CSDL
- [x] **Task 1.1:** Khởi tạo cấu trúc thư mục project (`backend`, `frontend`, `docs`) và cấu hình `package.json`, `.env.example`, `.gitignore`.
  - Acceptance: Cấu trúc thư mục đúng chuẩn; `.env.example` có đầy đủ `PORT`, `DB_*`, `JWT_SECRET`, `COMICVINE_API_KEY`.
  - Verify: Kiểm tra thư mục và file tồn tại.
  - Files: `backend/package.json`, `backend/.env.example`, `.gitignore`, `docs/schema.sql`.

- [x] **Task 1.2:** Cài đặt dependencies backend (`express`, `mysql2`, `sequelize`, `sequelize-cli`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `axios`).
  - Acceptance: `npm install` thành công, không lỗi dependency.
  - Verify: `node -e "require('sequelize'); console.log('Sequelize OK')"`
  - Files: `backend/package.json`.

- [x] **Task 1.3:** Viết migrations Sequelize cho 5 bảng: `Users`, `Stories`, `Genres`, `StoryGenres`, `Chapters`.
  - Acceptance: Các file migration tạo đúng schema: quan hệ Story N-N Genre, Story 1-N Chapter, User có role `reader`/`admin`.
  - Verify: Chạy `npx sequelize-cli db:migrate` trên MySQL `marvel_db`.
  - Files: `backend/migrations/*.js`, `backend/src/config/database.js`.

- [x] **Task 1.4:** Định nghĩa Sequelize Models với associations đầy đủ và seed tài khoản Admin mẫu.
  - Acceptance: Models `User`, `Story`, `Genre`, `StoryGenre`, `Chapter` load được trong Sequelize; tài khoản admin tồn tại.
  - Verify: Script test query model trả về kết quả không lỗi.
  - Files: `backend/src/models/*.js`, `backend/seeders/*.js`.

### Checkpoint 1: Database Foundation
- [x] Database `marvel_db` kết nối thành công, tất cả bảng đã được tạo.

---

### Giai đoạn 2: Seed Dữ Liệu ComicVine Thật
- [x] **Task 1.5:** Xây dựng script `backend/scripts/seedFromComicVine.js` giao tiếp với ComicVine API.
  - Acceptance: Script gọi ComicVine API, áp dụng delay 1.1s/request, lấy ít nhất 5-10 đầu truyện Marvel lớn (Spider-Man, Avengers, Iron Man, Thor, X-Men, Captain America...) kèm các issue/chapter thật, trích xuất ảnh bìa gốc, thể loại và lưu vào CSDL qua Sequelize.
  - Verify: Chạy thử và kiểm tra log request/response của ComicVine.
  - Files: `backend/scripts/seedFromComicVine.js`, `backend/src/services/comicVineService.js`.

- [x] **Task 1.6:** Thực thi seed dữ liệu và kiểm tra CSDL `marvel_db`.
  - Acceptance: Trong bảng `Stories` có $\ge 5$ bộ truyện Marvel thật, bảng `Chapters` có danh sách issue thật, bảng `Genres` có thể loại.
  - Verify: Truy vấn SQL `SELECT COUNT(*) FROM Stories;` và `SELECT COUNT(*) FROM Chapters;` đều có dữ liệu thật.
  - Files: `backend/scripts/seedFromComicVine.js`.

### Checkpoint 2: Dữ Liệu Thật Đã Sẵn Sàng (DoD bắt buộc cho HeroScene)
- [x] CSDL có dữ liệu truyện Marvel 100% thật từ ComicVine để cung cấp ảnh bìa và thông tin cho HeroScene và Story Detail.

---

### Giai đoạn 3: Backend API Sprint 1
- [x] **Task 1.7:** Xây dựng Module Auth (Đăng ký, Đăng nhập JWT, Đăng xuất, Middleware xác thực `authMiddleware`).
  - Acceptance: API `/api/auth/register`, `/api/auth/login`, `/api/auth/me` trả về JWT token và thông tin user hợp lệ; mật khẩu được mã hóa bcrypt.
  - Verify: Kiểm tra bằng cURL/Postman cho cả luồng thành công và lỗi (sai mật khẩu, trùng email).
  - Files: `backend/src/controllers/authController.js`, `backend/src/routes/authRoutes.js`, `backend/src/middlewares/authMiddleware.js`.

- [x] **Task 1.8:** Xây dựng Module Story & Search (Public API lấy danh sách truyện, tìm kiếm theo tên, lọc theo thể loại, chi tiết truyện).
  - Acceptance: `/api/stories` hỗ trợ query `search`, `genre`, phân trang; `/api/stories/:id` trả về thông tin truyện, thể loại và danh sách chương.
  - Verify: Gọi GET `/api/stories` và GET `/api/stories/:id` kiểm tra dữ liệu thật.
  - Files: `backend/src/controllers/storyController.js`, `backend/src/routes/storyRoutes.js`.

- [x] **Task 1.9:** Xây dựng Module Admin Management cho Story, Chapter, Genre.
  - Acceptance: Admin có quyền CRUD truyện, thêm/sửa chương truyện, quản lý thể loại; độc giả thông thường bị chặn với HTTP 403.
  - Verify: Test request có token role `admin` thành công, token role `reader` bị chặn.
  - Files: `backend/src/controllers/adminController.js`, `backend/src/routes/adminRoutes.js`, `backend/src/middlewares/roleMiddleware.js`.

---

### Giai đoạn 4: Frontend Setup & Core Layout
- [x] **Task 1.10:** Khởi tạo project React + Vite + TailwindCSS tại `frontend/` và cài đặt `three`, `lucide-react`, `axios`, `react-router-dom`.
  - Acceptance: Project chạy được bằng `npm run dev` trên cổng 5173.
  - Verify: Mở trình duyệt xem trang khởi động không có lỗi.
  - Files: `frontend/package.json`, `frontend/vite.config.js`, `frontend/tailwind.config.js`.

- [x] **Task 1.11:** Thiết lập Design System Marvel Dark Mode & Layout cơ bản (Navbar, Footer credit ComicVine).
  - Acceptance: Nền tối `#0F0F14`, card `#1A1A22`, accent `#ED1D24`; Google Fonts `Italiana`, `Outfit`, `Inter` nạp đầy đủ; Footer có link `comicvine.gamespot.com`.
  - Verify: Giao diện Header & Footer hiển thị đúng tone màu và credit.
  - Files: `frontend/src/index.css`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/Footer.jsx`.

- [x] **Task 1.12:** Xây dựng Auth Context và Axios Client kết nối backend API.
  - Acceptance: Lưu trữ JWT token vào `localStorage`, tự động đính kèm Bearer token vào header request, hỗ trợ login/logout trạng thái toàn app.
  - Verify: Đăng nhập thử và kiểm tra header request.
  - Files: `frontend/src/services/api.js`, `frontend/src/context/AuthContext.jsx`.

---

### Giai đoạn 5: Xây Dựng HeroScene.jsx (10 Yêu Cầu Kỹ Thuật Three.js)
- [x] **Task 1.13:** Thiết lập khung Scroll Model `400vh` và Custom Cursor 2 vòng tròn.
  - Acceptance: Hero container cao 400vh, canvas & UI fixed bên trong, scroll listener giới hạn trong 400vh; custom cursor (inner 6px, outer 40px lerp 0.2) chỉ kích hoạt trong Hero.
  - Verify: Di chuột và cuộn trang trong vùng Hero, cursor và scroll progress phản hồi đúng.
  - Files: `frontend/src/components/HeroScene.jsx`.

- [x] **Task 1.14:** Lập trình Background Shader GLSL (bảng màu Marvel $c_0 \to c_1$) và Forge Sparks (450 hạt đỏ/xanh).
  - Acceptance: Shader 3 lớp sóng với đúng tần số, góc, trọng số, palette Marvel đỏ rượu $\to$ xanh navy; 450 hạt spark chuyển động vật lý và tái sinh khi chạm biên.
  - Verify: WebGL render nền sóng màu Marvel và bụi hạt năng lượng sống động.
  - Files: `frontend/src/components/HeroScene.jsx`.

- [x] **Task 1.15:** Tích hợp 4-6 Plane 3D hiển thị bìa truyện Marvel thật lơ lửng quanh tâm, tilt theo chuột.
  - Acceptance: Load trực tiếp 4-6 ảnh bìa Marvel thật từ DB; các plane nổi lơ lửng, phản chiếu ánh sáng từ Key SpotLight đỏ và Rim Light xanh; group xoay theo tọa độ chuột.
  - Verify: Nhìn thấy các bìa truyện Marvel 3D rõ nét, xoay nhẹ khi rê chuột.
  - Files: `frontend/src/components/HeroScene.jsx`.

- [x] **Task 1.16:** Hoàn thiện 4 Slides nội dung Marvel, hiệu ứng Per-letter Title Reveal, Grid Overlay và Animate Loop.
  - Acceptance: Text tiêu đề hiệu ứng stagger từng ký tự; 4 slide Marvel chuyển đổi theo tiến trình cuộn; 5 đường kẻ grid và dots trôi; animate loop dọn dẹp bộ nhớ sạch sẽ khi unmount.
  - Verify: Cuộn từ 0 đến 400vh thấy 4 slide xuất hiện tuần tự mượt mà, sau 400vh chuyển mượt sang danh sách truyện bên dưới.
  - Files: `frontend/src/components/HeroScene.jsx`.

---

### Giai đoạn 6: Giao Diện Người Dùng & Hoàn Tất Sprint 1
- [x] **Task 1.17:** Xây dựng `HomePage.jsx` tích hợp `HeroScene` ở trên và Danh sách truyện Marvel bên dưới (Bộ lọc thể loại, Tìm kiếm, Thẻ truyện ComicCard).
  - Acceptance: Danh sách hiển thị các bộ truyện thật đã seed từ ComicVine, click vào mở trang chi tiết.
  - Verify: Xem danh sách và thử tìm kiếm/lọc thể loại.
  - Files: `frontend/src/pages/Reader/HomePage.jsx`, `frontend/src/components/ComicCard.jsx`.

- [x] **Task 1.18:** Xây dựng `StoryDetailPage.jsx` (thông tin truyện, tác giả, nhà xuất bản Marvel, danh sách chương đọc thử/chính thức).
  - Acceptance: Hiển thị đầy đủ thông tin chi tiết của truyện thật, danh sách chương thật từ CSDL.
  - Verify: Điều hướng đến từng truyện và kiểm tra thông tin.
  - Files: `frontend/src/pages/Reader/StoryDetailPage.jsx`.

- [x] **Task 1.19:** Xây dựng trang Đăng nhập & Đăng ký (`LoginPage.jsx`, `RegisterPage.jsx`).
  - Acceptance: Đăng ký tài khoản mới thành công, đăng nhập nhận token, điều hướng về trang chủ hoặc trang quản trị nếu là Admin.
  - Verify: Đăng ký tài khoản mới và đăng nhập thử.
  - Files: `frontend/src/pages/Auth/LoginPage.jsx`, `frontend/src/pages/Auth/RegisterPage.jsx`.

- [x] **Task 1.20:** Xây dựng giao diện Quản trị Admin cho Truyện và Chương (`AdminStoriesPage.jsx`, `AdminChaptersPage.jsx`).
  - Acceptance: Admin xem được danh sách toàn bộ truyện, chỉnh sửa thông tin, thêm chương mới, quản lý trạng thái.
  - Verify: Đăng nhập admin và thử chỉnh sửa truyện/chương.
  - Files: `frontend/src/pages/Admin/AdminStoriesPage.jsx`.

- [x] **Task 1.21:** Kiểm thử tổng thể Sprint 1 và xác nhận Definition of Done (DoD).
  - Acceptance: Dữ liệu 100% thật từ ComicVine; HeroScene render không lỗi console; FPS ổn định $\ge 50-60$; các luồng cơ bản (Auth, Story, Chapter, Admin) hoạt động trơn tru.
  - Verify: Chạy toàn bộ backend + frontend, kiểm tra DevTools console và network.

---

## Roadmap Các Sprint Tiếp Theo

### Sprint 2 (26 Story Points) - Danh Mục Truyện, Chính Sách Truy Cập & Gói Đọc

#### Module 1: `story-catalog-status` (US-12, US-21)
- [x] **Task 2.1:** Backend API lọc kết hợp nâng cao và cập nhật nhanh trạng thái truyện.
  - Acceptance: `GET /api/stories` hỗ trợ `status` (`ongoing`, `completed`, `dropped`), `access_policy` (`free`, `paid`, `mixed`), `sort` (`latest`, `views`, `rating`, `year`, `title`). Thêm `PATCH /api/admin/stories/:id/status`.
  - Verify: Gọi GET và PATCH qua test script hoặc cURL, kiểm tra JSON trả về.
  - Files: `backend/src/controllers/storyController.js`, `backend/src/controllers/adminController.js`, `backend/src/routes/adminRoutes.js`.

- [x] **Task 2.2:** Giao diện Độc giả: Bộ điều khiển lọc phân loại nâng cao trên `HomePage.jsx` và badge trạng thái trên `ComicCard.jsx`.
  - Acceptance: Filter bar có các nút chuyển trạng thái, chính sách và dropdown sắp xếp; thẻ truyện hiển thị badge trạng thái (`Đang ra`, `Hoàn thành`) và chính sách (`Free`, `VIP`, `Đọc thử`).
  - Verify: Kiểm tra tương tác lọc trên trình duyệt, danh sách truyện cập nhật tương ứng.
  - Files: `frontend/src/pages/Reader/HomePage.jsx`, `frontend/src/components/ComicCard.jsx`.

- [x] **Task 2.3:** Giao diện Quản trị: Thao tác đổi trạng thái truyện nhanh trên bảng `AdminStoriesPage.jsx`.
  - Acceptance: Cột trạng thái có dropdown chọn nhanh `ongoing`/`completed`/`dropped`, lưu tức thời vào CSDL.
  - Verify: Đổi trạng thái 1 truyện và tải lại trang kiểm tra DB giữ đúng trạng thái.
  - Files: `frontend/src/pages/Admin/AdminStoriesPage.jsx`.

#### Module 2: `access-policy-preview` (US-04, US-05)
- [x] **Task 2.4:** Backend API cấu hình chính sách truy cập, giá truyện lẻ và quản lý đọc thử cho chương.
  - Acceptance: `PATCH /api/admin/stories/:id/policy` cập nhật `access_policy` và `price`. `PATCH /api/admin/chapters/:id/preview` bật/tắt `is_preview`. `POST /api/admin/stories/:id/quick-preview` đặt nhanh N chương đầu đọc thử.
  - Verify: Test các endpoint với token admin.
  - Files: `backend/src/controllers/adminController.js`, `backend/src/routes/adminRoutes.js`.

- [x] **Task 2.5:** Giao diện Quản trị: Modal Quản lý Chương & Bật/Tắt Đọc Thử trên `AdminStoriesPage.jsx`.
  - Acceptance: Modal hiển thị danh sách tất cả các chương của truyện đã chọn, công tắc toggle `is_preview` 1-click cho từng chương, và nút "Đặt 3 chương đầu đọc thử".
  - Verify: Bật tắt `is_preview` cho 1 chương, kiểm tra DB và icon khóa/mở cập nhật ngay.
  - Files: `frontend/src/pages/Admin/AdminStoriesPage.jsx`.

- [x] **Task 2.6:** Giao diện Độc giả: Hiển thị giá bán lẻ và phân biệt chương đọc thử / VIP trên `StoryDetailPage.jsx`.
  - Acceptance: Thông tin truyện hiển thị giá bán lẻ nếu `paid`/`mixed`; danh sách chương hiển thị rõ nhãn "Đọc thử miễn phí" (xanh lá) hoặc "VIP" (vàng kim kèm icon Khóa).
  - Verify: Xem chi tiết truyện Free, Mixed, Paid để xác nhận các badge hiển thị chính xác.
  - Files: `frontend/src/pages/Reader/StoryDetailPage.jsx`.

#### Module 3: `subscription-plans-pricing` (US-06, US-07)
- [x] **Task 2.7:** Migration & Model CSDL `SubscriptionPlan` kèm Seeder 3 gói tiêu chuẩn.
  - Acceptance: Bảng `subscription_plans` được tạo trong MySQL `marvel_db` với đầy đủ trường; nạp sẵn 3 gói: Gói Độc Giả (1 Tháng - 49k), Gói Siêu Anh Hùng (3 Tháng - 129k), Gói Đa Vũ Trụ VIP (1 Năm - 399k).
  - Verify: `npx sequelize-cli db:migrate` thành công và `SELECT * FROM subscription_plans;` có 3 bản ghi.
  - Files: `backend/migrations/20261003000006-create-subscription-plans.js`, `backend/src/models/SubscriptionPlan.js`, `backend/seeders/20261003000002-seed-subscription-plans.js`.

- [x] **Task 2.8:** Backend API Quản lý Gói đọc (Public & Admin CRUD).
  - Acceptance: `GET /api/plans` (lấy danh sách gói active), `GET /api/plans/:id`, Admin CRUD: `POST /api/admin/plans`, `PUT /api/admin/plans/:id`, `DELETE /api/admin/plans/:id`, `PATCH /api/admin/plans/:id/toggle`.
  - Verify: Kiểm tra các endpoint qua test script/Postman.
  - Files: `backend/src/controllers/planController.js`, `backend/src/routes/planRoutes.js`, `backend/src/app.js`.

- [x] **Task 2.9:** Giao diện Độc giả: Xây dựng trang Bảng Giá Gói Hội Viên Marvel (`SubscriptionsPage.jsx`).
  - Acceptance: Trang `/subscriptions` hiển thị Dark Mode Marvel ấn tượng, 3 thẻ gói nổi bật, checklist quyền lợi, bảng so sánh tính năng Free vs VIP, nút CTA "Đăng ký ngay".
  - Verify: Điều hướng đến `/subscriptions` từ Navbar và kiểm tra hiển thị trên mobile/desktop.
  - Files: `frontend/src/pages/Reader/SubscriptionsPage.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/App.jsx`.

- [x] **Task 2.10:** Giao diện Quản trị: Xây dựng trang Quản lý Gói đọc (`AdminPlansPage.jsx`).
  - Acceptance: Admin xem được toàn bộ danh sách gói, sửa giá, thêm gói mới, sửa quyền lợi (features), bật/tắt kích hoạt gói.
  - Verify: Đăng nhập admin, vào `/admin/plans`, tạo hoặc chỉnh sửa một gói và kiểm tra kết quả.
  - Files: `frontend/src/pages/Admin/AdminPlansPage.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/App.jsx`.

#### Module 4: `view-counter-anti-abuse` (US-09)
- [x] **Task 2.11:** Backend API Ghi nhận lượt xem nguyên tử có chống spam F5.
  - Acceptance: `POST /api/stories/:id/view` kiểm tra thời gian đọc $\ge 15s$, kiểm tra debounce IP/User trong bộ nhớ 10 phút, tăng `view_count` nguyên tử trong MySQL.
  - Verify: Gửi 2 request liên tiếp: request đầu tăng view, request sau (dưới 15s hoặc cùng IP trong 10 phút) không tăng view lặp lại.
  - Files: `backend/src/controllers/storyController.js`, `backend/src/routes/storyRoutes.js`.

- [x] **Task 2.12:** Frontend Tích hợp Bộ đếm lượt xem thời gian thực & Format hiển thị.
  - Acceptance: Hook tự động gửi request ghi nhận view sau khi độc giả lưu lại trang truyện $\ge 15s$; format số hiển thị đẹp mắt (ví dụ: `1.2K`, `54K`) trên trang chi tiết và danh mục.
  - Verify: Mở trang chi tiết truyện, kiểm tra network call sau 15 giây và số view được cập nhật.
  - Files: `frontend/src/pages/Reader/StoryDetailPage.jsx`, `frontend/src/components/ComicCard.jsx`.

#### Module 5: `chapter-rich-system` (10-13 Chapters/Story, Dynamic Palette, Alternate Layouts)
- [x] **Task 2.14:** Migration & Model CSDL `Chapter` bổ sung các trường rich data (`cover_image`, `content`, `character_credits`, `accent_color`).
  - Acceptance: Bảng `chapters` được cập nhật trong MySQL `marvel_db`; model `Chapter.js` đồng bộ 4 trường mới.
  - Verify: `npx sequelize-cli db:migrate` thành công.
  - Files: `backend/migrations/20261003000007-add-rich-fields-to-chapters.js`, `backend/src/models/Chapter.js`.

- [x] **Task 2.15:** Phân tích màu chủ đạo & Seed 10-12 Chapters cho toàn bộ 8 bộ truyện Marvel từ ComicVine.
  - Acceptance: Script `seedFromComicVine.js` sử dụng `node-vibrant` trích xuất màu `accent_color` (fallback `#ED1D24`); mỗi Story có đúng 10-12 chapter thật với đầy đủ `cover_image`, `content`, `character_credits` (tối đa 8 nhân vật gồm `name` và `icon_url`).
  - Verify: Chạy script seed thành công, tổng cộng 85 chapters trong DB với màu sắc sống động.
  - Files: `backend/scripts/seedFromComicVine.js`.

- [x] **Task 2.16:** Backend API Chi tiết Chapter & Điều hướng kế cận (`prev_chapter` / `next_chapter`).
  - Acceptance: `GET /api/chapters/:chapterId` trả về chi tiết chương, cùng thông tin `prev_chapter` và `next_chapter` để chuyển chương mượt mà.
  - Verify: Test API trả về đúng chapter trước/sau.
  - Files: `backend/src/controllers/storyController.js`, `backend/src/routes/storyRoutes.js`, `backend/src/app.js`.

- [x] **Task 2.17:** Xây dựng Giao diện Đọc Chapter Nghệ Thuật (`ChapterReaderPage.jsx`) với Bố cục Luân Phiên Chẵn/Lẻ.
  - Acceptance:
    - Bố cục LẺ: Hero full-width 50-60vh với parallax scroll (translateY 0.35), tiêu đề/issue/ngày ở góc dưới; Pull quote font `Italiana` căn giữa với dấu ngoặc kép lớn mờ phía sau; nội dung chính font `Merriweather` max-width 680px; backdrop avatar nhân vật đầu tiên blur 28px opacity 0.07; dải avatar nhân vật tròn; điều hướng 2 card prev/next.
    - Bố cục CHẴN: Bố cục 2 cột cố định: Bìa sticky 40% bên trái + nội dung cuộn 60% bên phải. Tự động chuyển về 1 cột trên mobile.
    - Tone màu nhấn toàn trang đồng bộ động theo `accent_color` của từng chapter.
  - Verify: Kiểm thử trên trình duyệt cả Chapter 1 (Lẻ) và Chapter 2 (Chẵn).
  - Files: `frontend/src/pages/Reader/ChapterReaderPage.jsx`, `frontend/src/App.jsx`, `frontend/index.html`, `frontend/tailwind.config.js`.

- [x] **Task 2.18:** Nâng cấp Danh Sách Chương trên `StoryDetailPage.jsx`.
  - Acceptance: Mỗi card chapter trong danh sách hiển thị thumbnail cover nhỏ bên cạnh, kèm dải màu `accent_color` làm điểm nhấn viền trái card; click vào mở trực tiếp `ChapterReaderPage`.
  - Verify: Xem danh sách chương trên `StoryDetailPage` và click mở đọc.
  - Files: `frontend/src/pages/Reader/StoryDetailPage.jsx`.

#### Checkpoint & Verification Sprint 2
- [x] **Task 2.13:** Kiểm thử tích hợp toàn diện Sprint 2 và xác nhận Definition of Done (DoD).
  - Acceptance: Toàn bộ 5 modules hoạt động trơn tru; bảng `subscription_plans` & `chapters` chuẩn MySQL; giao diện Admin và Reader không có lỗi console; hệ thống sẵn sàng cho Sprint 3 (Quyền đọc kết hợp & Thanh toán).
  - Verify: Test end-to-end các luồng nghiệp vụ trên trình duyệt.

### Sprint 3 (25 Story Points) - Quyền Đọc Kết Hợp, Thanh Toán Sandbox & Trình Đọc Chương Trả Phí

#### Trình Tự Găng 1: Nền Tảng CSDL & Middleware Quyền Đọc Kết Hợp (US-26)
- [x] **Task 3.1:** Migrations & Models CSDL cho `payments`, `subscriptions`, `story_purchases`.
  - Acceptance: Schema MySQL chuẩn khóa ngoại `users`, `subscription_plans`, `stories`; quan hệ associate thiết lập đầy đủ trong `backend/src/models/`.
  - Verify: Chạy `npx sequelize-cli db:migrate` thành công trên `marvel_db`.
  - Files: `backend/migrations/*.js`, `backend/src/models/Payment.js`, `backend/src/models/Subscription.js`, `backend/src/models/StoryPurchase.js`, `backend/src/models/index.js`.

- [x] **Task 3.2:** Xây dựng Middleware Quyền Đọc Kết Hợp Độc Lập `checkReadAccess` (US-26).
  - Acceptance: Độc giả đọc được chương VIP nếu: có gói tháng còn hạn (`end_date >= NOW()`) HOẶC đã mua lẻ truyện (`status = 'completed'`). Đảm bảo KHÔNG trừ tiền/kích hoạt 2 lần nếu có cả hai điều kiện (`via: 'both'`). Chương free hoặc `is_preview = true` luôn mở tự do. Admin luôn được đọc.
  - Verify: Viết unit test tự động xác nhận 100% test case.
  - Files: `backend/src/middlewares/checkReadAccess.js`.

- [x] **Task 3.3:** Viết Bộ Unit Test Chuyên Sâu cho `checkReadAccess` (BẮT BUỘC).
  - Acceptance: Kiểm thử đủ 8+ test cases: Free/Preview, Chưa login (401), Login nhưng thiếu quyền (403), Gói hết hạn (403), Chỉ có gói còn hạn (200), Chỉ đã mua truyện (200), Có cả hai (200, via both), Admin (200). Đạt tỷ lệ pass 100%.
  - Verify: Chạy `npm test` ở backend, toàn bộ test cases xanh 100%.
  - Files: `backend/tests/checkReadAccess.test.js`, `backend/package.json`.

#### Trình Tự Găng 2: Thanh Toán Sandbox & DB Transaction (US-08, US-27, US-28)
- [x] **Task 3.4:** Backend API Thanh Toán Sandbox VNPay/MoMo bọc trong Sequelize Transaction.
  - Acceptance: `POST /api/payments/checkout`, `POST /api/payments/process-sandbox`. Toàn bộ thao tác cập nhật `payments`, `subscriptions` hoặc `story_purchases` bọc trong `sequelize.transaction()`. Hỗ trợ gia hạn gói cộng dồn ngày (`end_date = old_end_date + days`). Giả lập lỗi tự động rollback giao dịch không để dữ liệu tiền - quyền lệch nhau.
  - Verify: Gửi request test mua gói và mua truyện, kiểm tra MySQL ghi nhận đúng và rollback khi lỗi.
  - Files: `backend/src/services/paymentService.js`, `backend/src/controllers/paymentController.js`, `backend/src/routes/paymentRoutes.js`, `backend/src/app.js`.

#### Trình Tự Găng 3: Áp Dụng Middleware vào Trình Đọc Chương (US-25)
- [x] **Task 3.5:** Tích hợp `checkReadAccess` vào API đọc chapter `GET /api/chapters/:chapterId`.
  - Acceptance: Khi gọi API lấy nội dung chapter, nếu người dùng không đủ quyền, trả về 403 `PAYMENT_REQUIRED` kèm metadata truyện để frontend hiển thị Paywall. Nếu đủ quyền hoặc free/preview, trả về full nội dung và character credits.
  - Verify: Gọi GET với token đủ quyền và thiếu quyền, kiểm tra response status và payload.
  - Files: `backend/src/routes/storyRoutes.js`, `backend/src/controllers/storyController.js`.

- [x] **Task 3.6:** Nâng cấp UI Trình Đọc Chương `ChapterReaderPage.jsx` với Paywall Marvel Điện Ảnh (US-25).
  - Acceptance: Khi gặp lỗi 403, hiển thị màn hình Paywall Marvel Dark Mode sang trọng, icon Khóa VIP phát sáng, thông điệp rõ ràng và 2 nút CTA: Nâng cấp Gói VIP tháng (chuyển `/subscriptions`) hoặc Mua trọn bộ truyện này ngay lập tức.
  - Verify: Đăng nhập user mới không có gói, truy cập chương VIP (ví dụ Chapter 4 của Amazing Spider-Man), kiểm tra hiển thị Paywall.
  - Files: `frontend/src/pages/Reader/ChapterReaderPage.jsx`.

#### Trình Tự Găng 4: Giao Diện Người Dùng (US-27, US-28, US-31)
- [x] **Task 3.7:** UI Đăng Ký & Gia Hạn Gói Đọc Hội Viên `SubscriptionsPage.jsx` (US-27, US-28).
  - Acceptance: Hiển thị trạng thái gói hiện tại của user (Gói đang dùng, ngày hết hạn, còn lại bao nhiêu ngày). Nút "Đăng ký" / "Gia hạn gói" mở Modal thanh toán Sandbox chọn cổng VNPay / MoMo, thanh toán thành công cập nhật hạn VIP tức thì.
  - Verify: Thực hiện thanh toán Sandbox gói 1 tháng và gia hạn tiếp gói 3 tháng, kiểm tra ngày hết hạn cộng dồn đúng.
  - Files: `frontend/src/pages/Reader/SubscriptionsPage.jsx`.

- [x] **Task 3.8:** UI Danh Sách Truyện Đã Mua `PurchasedStoriesPage.jsx` & Cập Nhật Navbar (US-31).
  - Acceptance: Trang `/purchased-stories` hiển thị lưới các truyện người dùng đã mua bản quyền riêng lẻ, ngày mua, giá đã trả và nút "Đọc ngay". Dropdown User trên Navbar có link tới trang này.
  - Verify: Mua 1 bộ truyện lẻ qua Sandbox, vào `/purchased-stories` kiểm tra truyện xuất hiện.
  - Files: `frontend/src/pages/Reader/PurchasedStoriesPage.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/App.jsx`.

#### Checkpoint & Verification Sprint 3
- [x] **Task 3.9:** Kiểm thử tích hợp toàn diện Sprint 3 và xác nhận Definition of Done (DoD).
  - Acceptance: Unit test middleware 100% pass; thanh toán sandbox gói & truyện lẻ thành công; kiểm tra không thu phí trùng; rollback transaction chuẩn xác; giao diện độc giả hoàn thiện.
  - Verify: Thực thi kịch bản kiểm thử E2E qua browser subagent.

### Sprint 4 (25 Story Points) - Mua Truyện, Tiến Độ Đọc, Tương Tác & Kiểm Duyệt

#### Trình Tự Găng 1: Mua Truyện Riêng Lẻ & Kích Hoạt Bản Quyền
- [x] **Task 4.1:** Hoàn thiện API & Luồng Thanh Toán Mua Truyện Lẻ (VNPay / MoMo Sandbox).
  - Acceptance: Mua đứt trọn bộ truyện bản quyền với giá `Story.price`, bọc trong Sequelize Transaction, ghi nhận `story_purchases`, mở khóa toàn bộ chương VIP vĩnh viễn (kiểm chứng qua middleware `checkReadAccess`). Nút "Mua Trọn Bộ Truyện Này" trên `StoryDetailPage.jsx` và Paywall trên `ChapterReaderPage.jsx`.
  - Verify: Test mua truyện lẻ qua Sandbox, kiểm tra quyền đọc mở khóa ngay lập tức.
  - Files: `backend/src/services/paymentService.js`, `frontend/src/pages/Reader/StoryDetailPage.jsx`, `frontend/src/pages/Reader/ChapterReaderPage.jsx`.

#### Trình Tự Găng 2: Tiến Độ Đọc & Khôi Phục Vị Trí Tự Động
- [x] **Task 4.2:** Migration & Model CSDL `ReadingProgress` và Backend API.
  - Acceptance: Schema `reading_progress` (`user_id`, `story_id`, `chapter_id`, `scroll_y`, `progress_percent`, `updated_at`) với unique `(user_id, story_id)`. API `POST /api/reading-progress`, `GET /api/reading-progress/:storyId`, `GET /api/reading-progress`.
  - Verify: Gọi API lưu và truy xuất tiến độ qua test script.
  - Files: `backend/migrations/*create-reading-progress.js`, `backend/src/models/ReadingProgress.js`, `backend/src/controllers/progressController.js`, `backend/src/routes/progressRoutes.js`.

- [x] **Task 4.3:** Tích hợp Tự Động Khôi Phục Vị Trí Đọc trên `ChapterReaderPage.jsx`.
  - Acceptance: Tự động lưu tiến độ đọc (debounce khi cuộn). Khi độc giả mở lại chương, tự động cuộn (auto-scroll) tới đúng vị trí đã dừng và hiển thị thông báo "Đã khôi phục vị trí đọc gần nhất".
  - Verify: Đọc dở 1 chương ở mức 65%, tải lại trang/mở lại xác nhận nhảy đúng vị trí 65%.
  - Files: `frontend/src/pages/Reader/ChapterReaderPage.jsx`.

- [x] **Task 4.4:** Xây dựng Trang "Truyện Đang Đọc" (`ReadingHistoryPage.jsx` - `/reading-history`).
  - Acceptance: Hiển thị danh sách truyện thành viên đang đọc dở, thanh progress bar màu đỏ Marvel, chapter đang đọc và nút "Đọc Tiếp" mở đúng chương và vị trí dở dang. Thêm link vào Navbar dropdown.
  - Verify: Kiểm tra hiển thị danh sách truyện đọc dở trên giao diện.
  - Files: `frontend/src/pages/Reader/ReadingHistoryPage.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/App.jsx`.

#### Trình Tự Găng 3: Theo Dõi Truyện & Thông Báo Real-time (Socket.IO + Web Push)
- [x] **Task 4.5:** Migration CSDL `StoryFollow` & `Notification`, Cài đặt & Cấu hình Socket.IO.
  - Acceptance: Bảng `story_follows` và `notifications`. Tích hợp Socket.IO trên Express server `server.js`. API `POST /api/stories/:id/follow`, `GET /api/stories/:id/follow-status`, `GET /api/notifications`, `PATCH /api/notifications/:id/read`.
  - Verify: Test follow/unfollow và kết nối WebSocket Socket.IO.
  - Files: `backend/migrations/*create-follows-notifications.js`, `backend/src/models/StoryFollow.js`, `backend/src/models/Notification.js`, `backend/src/services/socketService.js`, `backend/src/server.js`.

- [x] **Task 4.6:** Tích hợp Nút Theo Dõi, Web Push Notification và Chuông Thông Báo Navbar.
  - Acceptance: Nút "Theo Dõi" trên `StoryDetailPage.jsx`. Icon Chuông thông báo trên `Navbar.jsx` hiển thị badge số đỏ unread. Khi Admin tạo chương mới cho truyện, Socket.IO đẩy thông báo real-time và kích hoạt Web Push Notification trình duyệt.
  - Verify: Follow 1 truyện, tạo chapter mới cho truyện đó, kiểm tra chuông thông báo và push notification.
  - Files: `frontend/src/components/Navbar.jsx`, `frontend/src/pages/Reader/StoryDetailPage.jsx`, `frontend/src/services/socket.js`.

#### Trình Tự Găng 4: Thảo Luận Chương & Kiểm Duyệt Bình Luận
- [x] **Task 4.7:** Migration CSDL `Comment` và Backend API Bình Luận & Báo Cáo Vi Phạm.
  - Acceptance: Bảng `comments` (`id`, `user_id`, `story_id`, `chapter_id`, `content`, `status`, `is_reported`, `report_reason`, `likes_count`). API `GET/POST /api/chapters/:chapterId/comments`, `POST /api/comments/:id/like`, `POST /api/comments/:id/report`. Admin API: `GET /api/admin/comments`, `PATCH /api/admin/comments/:id/status`, `DELETE /api/admin/comments/:id`.
  - Verify: Test đăng comment, like, report và các API admin.
  - Files: `backend/migrations/*create-comments.js`, `backend/src/models/Comment.js`, `backend/src/controllers/commentController.js`, `backend/src/routes/commentRoutes.js`.

- [x] **Task 4.8:** Kết Nối UI Thảo Luận Chương & Xây Dựng Trang Quản Trị Bình Luận (`AdminCommentsPage.jsx`).
  - Acceptance: Nâng cấp khu vực bình luận `ChapterReaderPage.jsx` kết nối API thật, hỗ trợ báo cáo vi phạm, avatar initials chuẩn Marvel. Trang `/admin/comments` cho Admin lọc các bình luận bị báo cáo, nút Ẩn/Hiện và Xóa vi phạm.
  - Verify: Đăng bình luận, gửi báo cáo vi phạm, Admin ẩn/xóa bình luận và kiểm tra cập nhật tức thì.
  - Files: `frontend/src/pages/Reader/ChapterReaderPage.jsx`, `frontend/src/pages/Admin/AdminCommentsPage.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/App.jsx`.

#### Tính Năng Song Song & Hoàn Tất Sprint 4
- [x] **Task 4.9:** Xây dựng Trang Lịch Sử Giao Dịch (`TransactionHistoryPage.jsx` - `/transactions`).
  - Acceptance: API `GET /api/payments/my-transactions`. Giao diện hiển thị bảng lịch sử toàn bộ các giao dịch mua gói VIP và mua truyện lẻ, số tiền, phương thức, trạng thái và ngày giờ. Thêm link vào Navbar.
  - Verify: Mua gói và mua truyện, kiểm tra xuất hiện trong bảng giao dịch.
  - Files: `backend/src/controllers/paymentController.js`, `frontend/src/pages/Reader/TransactionHistoryPage.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/App.jsx`.

- [x] **Task 4.10:** Kiểm thử tích hợp toàn diện Sprint 4 & Nghiệm Thu Definition of Done.
  - Acceptance: Mua truyện mở khóa vĩnh viễn; tiến độ đọc tự động lưu và khôi phục chuẩn xác; theo dõi truyện nhận push notification khi có chương mới; bình luận và kiểm duyệt Admin hoạt động đúng; KHÔNG xuất hiện bất kỳ mã `US-XX` nào trên UI.
  - Verify: Chạy verify script và unit tests kiểm thử E2E tất cả các tiêu chí.

### Sprint 5: Quản Trị Thành Viên, Thống Kê & Tích Hợp Toàn Diện
- [ ] Quản lý danh sách thành viên và phân quyền.
- [ ] Báo cáo thống kê lượt đọc, doanh thu theo ngày/tháng/năm.
- [ ] Thống kê xếp hạng truyện hot và tăng trưởng hội viên.
- [ ] Dashboard Admin tổng hợp và kiểm thử E2E hoàn tất dự án.
