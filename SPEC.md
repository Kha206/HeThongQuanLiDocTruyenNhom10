# SPEC: Hệ Thống Đọc Truyện Tranh Marvel (Marvel Comic Platform) - Nhóm 10

## 1. Objective (Mục Tiêu & Bối Cảnh)
Dự án "Marvel Comic Platform" (Nhóm 10) là nền tảng đọc truyện tranh trực tuyến định hướng nội dung Marvel cao cấp, hỗ trợ trải nghiệm thị giác ấn tượng với công nghệ Three.js/WebGL (HeroScene phong cách Laocoön/Bronze and Time), đồng thời sở hữu hệ thống quản lý nội dung, hội viên, bản quyền và thanh toán gói đọc / mua truyện theo chương chuẩn mực công nghệ phần mềm nâng cao.

Toàn bộ dữ liệu truyện (tên, mô tả, ảnh bìa, năm xuất bản, tác giả, nhà xuất bản Marvel, danh sách chapter) được lấy **100% từ ComicVine API** thông qua script seed tự động định kỳ / khởi tạo, lưu trữ và phục vụ độc quyền từ cơ sở dữ liệu quan hệ MySQL cục bộ (`marvel_db`). Không phụ thuộc vào API bên ngoài lúc runtime.

Đối tượng người dùng:
- **Độc giả (Reader):** Khám phá vũ trụ Marvel với giao diện Hero 3D sống động, tìm kiếm & lọc truyện theo thể loại, đọc chương truyện trực tuyến (chương miễn phí, đọc thử), đăng ký gói tháng hoặc mua lẻ từng bộ truyện, lưu lịch sử / tiến độ đọc, theo dõi truyện và tham gia bình luận thảo luận từng chương.
- **Quản trị viên (Admin):** Quản lý đầu truyện, thể loại, chương truyện, kiểm duyệt bình luận, cấu hình chính sách truy cập (Free/Paid/Mixed), quản lý gói thành viên, giám sát hội viên và phân tích báo cáo doanh thu / lượt đọc.

---

## 2. Tech Stack Bắt Buộc & Tiêu Chuẩn Kỹ Thuật
- **Backend:** Node.js (v20+ / v26) + Express.js. Kiến trúc phân tầng rõ rệt: `config/`, `models/`, `controllers/`, `services/`, `middlewares/`, `routes/`.
- **Cơ Sở Dữ Liệu:** MySQL (thông qua XAMPP, port 3306, user `root`, password rỗng, database `marvel_db`).
- **ORM & Migrations:** Sequelize ORM + Sequelize CLI (`/migrations` và `/seeders` được theo dõi và commit lên Git). **TUYỆT ĐỐI KHÔNG** dùng SQLite.
- **Frontend:** ReactJS + Vite + TailwindCSS (phong cách Dark Mode điện ảnh: Nền tối `#0F0F14`, Card `#1A1A22`, Accent đỏ Marvel `#ED1D24`, font Inter & Merriweather / Outfit).
- **3D Hero Graphics:** Thư viện `three` (cài qua `npm install three`), tích hợp trong component React `HeroScene.jsx` với Canvas cố định trong container 400vh, GLSL wave background shader, hạt năng lượng Marvel đỏ/xanh (450 sparks), các plane 3D xoay lơ lửng hiển thị bìa truyện Marvel thật, custom cursor và typography Italiana / Outfit.
- **Xác Thực & Bảo Mật:** JWT (JSON Web Token) + bcryptjs hash mật khẩu + phân quyền RBAC (Role-Based Access Control: Reader / Admin).
- **Thanh Toán Sandbox:** Mô phỏng cổng thanh toán VNPay / MoMo Sandbox, giao dịch bọc trong Sequelize Transaction bảo toàn dữ liệu.
- **Thời Gian Thực:** Socket.IO & Web Push API (cho thông báo chương mới, bình luận real-time).
- **Nguồn Dữ Liệu:** ComicVine API (`comicvine.gamespot.com/api`) kết hợp script `backend/scripts/seedFromComicVine.js` có rate limit delay 1.1s/request.
- **Bản Quyền Dữ Liệu:** Footer hiển thị: *"Dữ liệu truyện cung cấp bởi Comic Vine"* kèm hyperlink `https://comicvine.gamespot.com`.

---

## 3. Project Structure
```
project-root/ (d:\CNPMNANGCAO\)
├── SPEC.md                                   # Đặc tả chi tiết hệ thống
├── tasks/
│   ├── plan.md                               # Kế hoạch triển khai tổng thể & PERT Critical Path
│   └── todo.md                               # Checklist công việc chi tiết từng Sprint
├── docs/
│   ├── schema.sql                            # Schema DDL xuất từ CSDL
│   └── erd.png                               # Bản đồ ERD thực thể quan hệ
├── backend/
│   ├── .env.example                          # Biến môi trường mẫu (PORT, DB, JWT, COMICVINE_API_KEY)
│   ├── package.json
│   ├── migrations/                           # Sequelize migrations
│   ├── seeders/                              # Sequelize seeders
│   ├── scripts/
│   │   └── seedFromComicVine.js              # Script cào và nạp dữ liệu từ ComicVine
│   └── src/
│       ├── app.js                            # Express app config
│       ├── server.js                         # Entry point server HTTP + Socket.IO
│       ├── config/                           # database.js, auth.js
│       ├── models/                           # Story, Genre, StoryGenre, Chapter, User, Subscription, Payment, ReadingProgress, Comment, Follow
│       ├── controllers/                      # authController, storyController, chapterController, adminController, paymentController, etc.
│       ├── middlewares/                      # authMiddleware, checkReadAccess, errorHandler, validator
│       ├── services/                         # comicVineService, paymentService, socketService
│       └── routes/                           # authRoutes, storyRoutes, chapterRoutes, adminRoutes, paymentRoutes
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css                         # Tailwind directives & global utility styling
        ├── components/
        │   ├── HeroScene.jsx                 # 3D WebGL Shader + Sparks + Floating Planes (400vh)
        │   ├── Navbar.jsx
        │   ├── Footer.jsx                    # Credit ComicVine
        │   ├── ComicCard.jsx
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── Reader/                       # HomePage, StoryDetailPage, ReaderPage, SubscriptionsPage, PurchasedPage, ProfilePage
        │   ├── Admin/                        # DashboardPage, StoryManagePage, ChapterManagePage, UserManagePage, CommentModerationPage
        │   └── Auth/                         # LoginPage, RegisterPage
        ├── services/                         # api.js, authService, storyService, paymentService
        └── three/                            # Shader GLSL utilities, particle generator
```

---

## 4. Commands Chuẩn Hóa
- **Backend:**
  - Setup: `cd backend && npm install`
  - Migration DB: `npx sequelize-cli db:migrate`
  - Seed ComicVine: `node scripts/seedFromComicVine.js`
  - Chạy dev: `npm run dev` (hoặc `node src/server.js`)
  - Chạy test: `npm test`
- **Frontend:**
  - Setup: `cd frontend && npm install`
  - Chạy dev server: `npm run dev`
  - Build production: `npm run build`
  - Preview build: `npm run preview`

---

## 5. Quy Tắc Nghiệp Vụ Cốt Lõi (Core Business Rules)
1. **Quan hệ Truyện - Thể loại:**
   - Quan hệ N - N giữa `Story` và `Genre` thông qua bảng liên kết `StoryGenre` (`story_id`, `genre_id`).
2. **Chính sách Truy cập (Access Policy):**
   - `Free`: Toàn bộ các chương được đọc miễn phí.
   - `Paid`: Yêu cầu quyền đọc trả phí cho toàn bộ các chương (trừ các chương được gắn cờ `is_preview = true`).
   - `Mixed`: Một số chương đầu miễn phí (hoặc preview), các chương sau yêu cầu trả phí.
3. **Quyền Đọc Trả Phí Độc Lập (Combined Read Access Middleware):**
   - Độc giả có quyền mở khóa đọc chương trả phí nếu thỏa mãn **MỘT TRONG HAI** điều kiện độc lập:
     1. Sở hữu gói hội viên tháng (`Subscription`) còn hiệu lực (`status = 'active'` và `end_date >= NOW()`).
     2. Đã mua quyền đọc riêng lẻ bộ truyện đó (`UserPurchase` hoặc `StoryPurchase` có `status = 'completed'`).
   - Tuyệt đối không bắt người dùng trả phí trùng nếu đã có gói hoặc đã mua truyện.
4. **Tính Toàn Vẹn Giao Dịch Tài Chính:**
   - Mọi thao tác thanh toán / kích hoạt gói / mở khóa truyện bị lỗi đều phải tự động `ROLLBACK` thông qua Sequelize Transaction (`sequelize.transaction()`).
5. **Tiến Độ Đọc & Thảo Luận:**
   - Tự động ghi nhớ chương vừa đọc gần nhất và số trang/phần trăm tiến độ (`ReadingProgress`).
   - Thảo luận (Bình luận theo chương) có cờ trạng thái kiểm duyệt (`pending`, `approved`, `rejected`). Bình luận mới đăng phải qua kiểm duyệt của Admin hoặc auto-approve nếu đạt tiêu chuẩn bộ lọc từ ngữ.
6. **Lượt Đọc (Views Counter):**
   - Ghi nhận lượt đọc tăng khi độc giả ở lại chương truyện trên 15 giây hoặc scroll qua ít nhất 50% nội dung chương (tránh spam refresh).

---

## 6. Đặc Tả Kỹ Thuật HeroScene.jsx (10 Yêu Cầu Bắt Buộc)
1. **Scroll Model (400vh):** Container Hero cao đúng 400vh. Canvas Three.js và overlay HTML UI có `position: fixed` ghim trong phạm vi Hero, sử dụng listener scroll/Intersection Observer chỉ tính toán tiến trình cuộn trong đúng 400vh của section Hero. Khi cuộn vượt quá 400vh, section ẩn mượt và nhường chỗ cho Story List thông thường.
2. **Custom Cursor:** 2 vòng tròn lồng nhau: vòng trong `cursor-inner` 6px bám dính pointer, vòng ngoài `cursor-outer` 40px lerp theo hệ số 0.2. Chỉ hiển thị trong không gian Hero (không can thiệp toàn bộ trang).
3. **Background Shader:** Fragment shader GLSL nguyên bản (noise wave 3 tầng, tần số 2.4 / 3.2 / 4.0, góc 0.6 / -0.7 / 1.2, trọng số wave 0.50 / 0.35 / 0.15, `scrollDeform = scroll * 5.0`, `vignette = 1.0 - dot(uv,uv)*0.12`, `crest multiplier = 1.4`). Bảng màu Marvel:
   - $c_0$ (đầu Hero): shadow `(0.001, 0.0003, 0.0003)`, wave1 `(0.12, 0.015, 0.01)` đỏ rượu đậm, wave2 `(0.08, 0.01, 0.008)`, crest `(0.55, 0.08, 0.06)` đỏ Marvel rực.
   - $c_1$ (cuối Hero): shadow `(0.0004, 0.0004, 0.0012)`, wave1 `(0.02, 0.015, 0.065)` xanh navy vũ trụ, wave2 `(0.01, 0.008, 0.045)`, crest `(0.25, 0.15, 0.55)` tím xanh ánh kim.
   - Mesh: PlaneGeometry(30,30), đặt tại $z = -8$, `renderOrder = -10`, `depthWrite = false`, `depthTest = false`.
4. **Forge Sparks (Particles):** 450 hạt, `PointsMaterial` size 0.025, opacity 0.85, `AdditiveBlending`, `depthWrite = false`, texture radial gradient tạo bằng canvas 16x16. Màu đỏ Marvel `(1.0, 0.1, 0.1)` (60%) và xanh vũ trụ `(0.3, 0.4, 1.0)` (40%). Vật lý hạt: vận tốc speedX/Y/Z, swaySpeed, swayRadius, recycle bounds $y > 3.0, |x| > 3.5, |z| > 3.5$, respawn tại $y = -2.5$.
5. **3D Comic Cover Floating Planes:** Thay thế 3D GLB model bằng 4-6 plane 3D hiển thị ảnh bìa Marvel THẬT lấy từ `marvel_db` (seed qua ComicVine API). Sử dụng `THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3, metalness: 0.1 }))`. Bố trí lơ lửng nhẹ quanh gốc tọa độ. Group chứa các plane xoay phản hồi theo chuột: `rotation.y = mouseX * 0.25`, `rotation.x = mouseY * 0.15`.
6. **Lighting Rig:**
   - Ambient Light: `#ffffff` cường độ 0.1
   - Key SpotLight: `#ff3333` cường độ 18.0 đặt tại `(4, 6, 3)` hắt ánh đỏ Marvel lên các plane ảnh bìa
   - Rim DirectionalLight: `#4d6fff` cường độ 10.0 đặt tại `(-5, 3, -4)`
   - Fill DirectionalLight: `#fff3e6` cường độ 0.8 đặt tại `(-2, -4, 2)`
7. **Per-Letter Title Reveal:** Hàm `splitTitlesIntoChars()` tách ký tự, áp dụng hiệu ứng stagger 0.035s/ký tự, blur từ 12px về 0, translateY từ 50px về 0. Font tiêu đề: `Italiana`, font phụ: `Outfit`.
8. **Grid Overlay & Progress Bar:** 5 đường kẻ dọc tinh tế, các chấm toạ độ trôi theo tiến trình cuộn `updateGridDots()`, thanh tiến độ Stories Progress Bar chia theo 400vh.
9. **4 Slides Nội Dung Marvel:**
   - Slide 1: *"Marvel <br>Universe"* — Sức mạnh kể chuyện huyền thoại qua nhiều thế hệ siêu anh hùng.
   - Slide 2: Tên arc / nhân vật nổi bật (lấy từ dữ liệu Marvel thật đã seed) + ảnh mask bìa truyện thật.
   - Slide 3: *"Infinite Stories"* — Chiều sâu đa vũ trụ, hàng ngàn ấn phẩm bất hủ.
   - Slide 4: *"Your Next <br>Chapter"* — Lời mời bước vào hành trình đọc truyện, nút CTA *"Khám phá ngay"*.
10. **Animate Loop:** Lerp smoothing (scroll: 0.025, mouse: 0.05, outer cursor: 0.2), cập nhật shader uniforms (`uTime`, `uScroll`), cập nhật vị trí hạt spark và rotation group plane 3D. Hủy requestAnimationFrame và dọn dẹp geometries/materials khi React unmount.

---

## 7. Roadmap 5 Sprint
- **Sprint 1 (27 pts) - Nền Tảng CSDL, Dữ Liệu ComicVine, Auth & Hero 3D:**
  - Thiết kế & Migrate CSDL (Story, Genre, StoryGenre, Chapter, User).
  - Script `seedFromComicVine.js` nạp ít nhất 5-10 truyện Marvel thật.
  - API & UI Quản lý truyện + chương cho Admin (US-01, US-03).
  - Xác thực JWT Login, Register, Logout (US-22, US-23, US-24).
  - Trang chi tiết truyện public (US-18), Danh sách chương (US-19), Tìm kiếm truyện (US-20), Quản lý thể loại (US-02).
  - Hoàn thiện component `HeroScene.jsx` 3D chuẩn 10 mục kỹ thuật với ảnh bìa thật.
- **Sprint 2 (26 pts) - Danh Mục Truyện, Chính Sách Truy Cập & Gói Đọc:**
  - Danh sách & Trạng thái truyện (US-21, US-12).
  - Cấu hình chính sách truy cập Free/Paid/Mixed & Chương đọc thử (US-04, US-05).
  - Quản lý gói đọc (Subscription Plans) & thiết lập giá bán lẻ (US-06, US-07).
  - UI hiển thị gói đọc & bộ đếm lượt đọc chính xác (US-09).
- **Sprint 3 (25 pts) - Quyền Đọc Kết Hợp, Thanh Toán Sandbox & Trình Đọc Chương:**
  - Middleware quyền đọc kết hợp độc lập (US-26) + Unit test chuyên biệt.
  - UI Đăng ký / Gia hạn gói đọc (US-27, US-28).
  - UI Truyện đã mua (US-31).
  - UI Trình đọc chương (ReaderPage) (US-25).
  - Tích hợp cổng thanh toán Sandbox (VNPay/MoMo), xử lý rollback lỗi giao dịch (US-08).
- **Sprint 4 (25 pts) - Mua Truyện, Tiến Độ Đọc, Tương Tác & Kiểm Duyệt:**
  - Mua truyện riêng lẻ bằng số dư / Sandbox (US-30).
  - Lưu tiến độ đọc & trang tiếp tục đọc (US-33, US-34).
  - Theo dõi truyện & thông báo chương mới qua Web Push / Socket (US-35, US-36).
  - Bình luận theo chương & màn hình Admin kiểm duyệt bình luận (US-37, US-38, US-10).
  - Lịch sử giao dịch thanh toán (US-32).
- **Sprint 5 (29 pts) - Quản Trị Thành Viên, Báo Cáo Thống Kê & Tích Hợp Toàn Diện:**
  - Quản lý thành viên người dùng (US-11).
  - Báo cáo thống kê lượt đọc & doanh thu theo mốc thời gian (US-13, US-14, US-15).
  - Thống kê xếp hạng truyện hot & tăng trưởng thành viên (US-16, US-17).
  - Admin Dashboard tổng hợp các chỉ số KPI.
  - Kiểm thử tích hợp E2E toàn bộ hệ thống (DoD đạt 100%).

---

## 8. Boundaries (Quy Tắc Biên Kiểm Soát)
- **Always:**
  - Sử dụng MySQL thật thông qua XAMPP (port 3306), database `marvel_db`.
  - Giữ các migrations trong `backend/migrations/` đồng bộ 100% với models.
  - Lấy dữ liệu truyện thật từ ComicVine qua `backend/scripts/seedFromComicVine.js`.
  - Giữ gìn footer credit bản quyền Comic Vine.
  - Xử lý cleanup bộ nhớ Three.js khi unmount `HeroScene.jsx`.
- **Ask first:**
  - Thay đổi cấu trúc bảng CSDL ngoài phạm vi đã thống nhất trong spec.
  - Cài đặt thêm các package ngoài tech stack (ví dụ thêm UI library thứ ba).
- **Never:**
  - KHÔNG sử dụng SQLite trong bất kỳ môi trường nào (kể cả dev hay test).
  - KHÔNG tự bịa dữ liệu truyện, không lấy ảnh placeholder/nguồn không chính thống.
  - KHÔNG commit file `.env` chứa ComicVine API key hoặc mật khẩu thật lên Git.
  - KHÔNG gọi trực tiếp ComicVine API từ client frontend lúc runtime.

---

## 9. Definition of Done (DoD) Cho Sprint 1
1. CSDL MySQL `marvel_db` kết nối thành công qua Sequelize, bảng đã migrate đầy đủ.
2. Script `seedFromComicVine.js` thực thi thành công, lưu ít nhất 5-10 bộ truyện Marvel và chapters thật vào CSDL.
3. API và giao diện Admin quản lý truyện, chương, thể loại hoạt động trơn tru.
4. Hệ thống Auth (Đăng ký, Đăng nhập JWT, Đăng xuất, Lưu session token) hoạt động bảo mật.
5. Trang chủ tích hợp `HeroScene.jsx` đầy đủ 10 tiêu chuẩn kỹ thuật, hiển thị ảnh bìa thật, đạt 60fps mượt mà, chuyển đổi mượt xuống Story List.
6. Public Story Detail và Chapter List hiển thị đúng dữ liệu thật từ CSDL.
7. Không có lỗi console ở cả backend và frontend.
