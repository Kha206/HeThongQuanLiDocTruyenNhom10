# SPECIFICATION: SPRINT 2 - DANH MỤC TRUYỆN, CHÍNH SÁCH TRUY CẬP & GÓI ĐỌC
**Dự Án:** Nền Tảng Đọc Truyện Tranh Marvel (Marvel Comic Platform) - Nhóm 10  
**Phiên Bản:** Sprint 2 (26 Story Points)  
**Tài Liệu Nguồn:** [SPEC.md](file:///d:/CNPMNANGCAO/SPEC.md)

---

## 0. Capability Map & Dependency Graph (Scope Check)

Sprint 2 giải quyết 4 nhóm tính năng độc lập nhưng phối hợp chặt chẽ trên luồng nghiệp vụ danh mục truyện và thương mại hóa nội dung:

| Module ID | Trách Nhiệm & Chức Năng | Phụ Thuộc (Depends on) |
|---|---|---|
| `story-catalog-status` | Quản lý trạng thái truyện (`ongoing`, `completed`, `dropped`), bộ lọc & phân loại đa chiều cho Độc giả & Admin (US-12, US-21) | — |
| `access-policy-preview` | Cấu hình chính sách truy cập (`free`, `paid`, `mixed`), thiết lập và quản lý chương đọc thử `is_preview` (US-04, US-05) | `story-catalog-status` |
| `subscription-plans-pricing` | CSDL, Model, CRUD Quản lý Gói đọc tháng (`SubscriptionPlan`), định giá bán lẻ từng bộ truyện (`Story.price`), Trang Bảng Giá Hội Viên công khai cho Độc Giả (US-06, US-07) | `access-policy-preview` |
| `view-counter-anti-abuse` | API ghi nhận lượt xem nguyên tử có chống spam F5 (debounce / thời gian đọc thực tế $\ge 15s$), UI hiển thị format lượt đọc (US-09) | `story-catalog-status` |

**Thứ tự xây dựng (Build Order):**  
`story-catalog-status` ➔ `access-policy-preview` ➔ `subscription-plans-pricing` ➔ `view-counter-anti-abuse`

---

## 1. Assumptions & Clarifications (Các Giả Định Đầu Vào)

1. **CSDL & ORM:** Tiếp tục sử dụng MySQL `marvel_db` (XAMPP port 3306) và Sequelize ORM + CLI migrations. Tuyệt đối không dùng SQLite.
2. **Cơ chế Gói đọc:** Sprint 2 tập trung hoàn thiện hạ tầng dữ liệu của Gói đọc (`SubscriptionPlan`), quản trị Admin CRUD gói đọc, thiết lập định giá truyện lẻ, và giao diện công khai hiển thị bảng giá quyền lợi cho Độc Giả (`/subscriptions`). Luồng tích hợp cổng thanh toán Sandbox (VNPay/MoMo) và cấp quyền đọc tự động sẽ nối tiếp trong Sprint 3 theo đúng phân kỳ lộ trình.
3. **Cơ chế Đọc thử (`is_preview`):**
   - Chương được đánh dấu `is_preview = true` thì bất kỳ ai (kể cả chưa đăng ký gói) đều được đọc miễn phí.
   - Với truyện có `access_policy = 'mixed'`, các chương có `is_preview = true` là đọc thử, các chương còn lại yêu cầu quyền đọc.
   - Với truyện có `access_policy = 'free'`, tất cả chương đều miễn phí.
   - Với truyện có `access_policy = 'paid'`, chỉ chương `is_preview = true` mới được đọc thử; các chương khác yêu cầu trả phí.
4. **Phòng chống gian lận lượt xem (View Anti-Abuse):** Client chỉ gửi request tăng view sau khi người dùng lưu lại trang ít nhất 15 giây hoặc scroll tương tác; Backend đồng thời áp dụng rate limit / session debounce để ngăn chặn bot spam refresh.

---

## 2. Technical Stack & Commands

- **Backend:** Node.js (v20+), Express.js, Sequelize ORM, MySQL2.
- **Frontend:** React, Vite, TailwindCSS, Lucide React, Axios, React Router v6.
- **Commands:**
  - Chạy migration CSDL: `cd backend && npx sequelize-cli db:migrate`
  - Seed dữ liệu gói đọc mẫu: `cd backend && npx sequelize-cli db:seed:all` (hoặc script seed)
  - Chạy backend dev: `cd backend && npm run dev`
  - Chạy frontend dev: `cd frontend && npm run dev`
  - Kiểm tra kết nối DB: `node -e "require('./backend/src/models').sequelize.authenticate().then(() => console.log('OK'))"`

---

## 3. Data Architecture & Schema Changes

### 3.1. Bảng Mới: `subscription_plans`
Sequelize migration: `20261003000006-create-subscription-plans.js`

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc / Mặc Định | Ý Nghĩa Nghiệp Vụ |
|---|---|---|---|
| `id` | `INTEGER` | PK, Auto Increment | Khóa chính |
| `name` | `VARCHAR(100)` | NOT NULL | Tên hiển thị gói (ví dụ: "Gói Siêu Anh Hùng") |
| `slug` | `VARCHAR(100)` | NOT NULL, UNIQUE | Định danh URL (ví dụ: `goi-sieu-anh-hung`) |
| `description` | `TEXT` | NULL | Mô tả tóm tắt giá trị của gói |
| `price` | `DECIMAL(10,2)` | NOT NULL, DEFAULT 0.00 | Giá tiền niêm yết (VNĐ) |
| `duration_days` | `INTEGER` | NOT NULL, DEFAULT 30 | Thời lượng gói tính theo ngày (30, 90, 365) |
| `badge` | `VARCHAR(50)` | NULL | Nhãn nổi bật (vd: "Phổ Biến Nhất", "Tiết Kiệm 30%") |
| `features` | `JSON` | NULL | Mảng JSON chứa danh sách quyền lợi chi tiết |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT true | Trạng thái hiển thị cho phép người dùng mua |
| `display_order` | `INTEGER` | NOT NULL, DEFAULT 0 | Thứ tự sắp xếp hiển thị trên bảng giá |
| `created_at` | `DATETIME` | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |
| `updated_at` | `DATETIME` | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Thời gian cập nhật |

### 3.2. Cập Nhật Bảng `stories` & `chapters`
- Bảng `stories` đã có sẵn các trường:
  - `status`: `ENUM('ongoing', 'completed', 'dropped')` DEFAULT `'ongoing'`
  - `access_policy`: `ENUM('free', 'paid', 'mixed')` DEFAULT `'free'`
  - `price`: `DECIMAL(10,2)` DEFAULT `0.00`
  - `view_count`: `INTEGER` DEFAULT `0`
- Bảng `chapters` đã có sẵn:
  - `is_preview`: `BOOLEAN` DEFAULT `false`

---

## 4. API Endpoints Specification

### 4.1. Module: `story-catalog-status` & `access-policy-preview`

#### Public APIs:
1. `GET /api/stories`
   - **Query params:**
     - `search`: Chuỗi tìm kiếm theo tên hoặc mô tả
     - `genre`: Slug hoặc tên thể loại
     - `status`: `all` | `ongoing` | `completed` | `dropped`
     - `access_policy`: `all` | `free` | `paid` | `mixed`
     - `sort`: `latest` (mặc định) | `views` | `rating` | `year` | `title`
     - `page`: Trang hiện tại (mặc định 1)
     - `limit`: Số truyện / trang (mặc định 12)
   - **Response:**
     ```json
     {
       "success": true,
       "total": 24,
       "page": 1,
       "totalPages": 2,
       "stories": [...]
     }
     ```

2. `GET /api/stories/:id`
   - Trả về chi tiết truyện, danh sách thể loại và danh sách chương đã sắp xếp theo `chapter_number ASC`, kèm thông tin `is_preview` và giá truyện lẻ `price`.

#### Admin APIs:
3. `PATCH /api/admin/stories/:id/status`
   - **Body:** `{ "status": "ongoing" | "completed" | "dropped" }`
   - Thay đổi nhanh trạng thái truyện trực tiếp trên bảng quản trị.

4. `PATCH /api/admin/stories/:id/policy`
   - **Body:** `{ "access_policy": "free" | "paid" | "mixed", "price": 29000 }`
   - Cập nhật chính sách truy cập và giá bán lẻ của truyện.

5. `PATCH /api/admin/chapters/:id/preview`
   - **Body:** `{ "is_preview": true | false }`
   - Bật/tắt cờ đọc thử cho 1 chương truyện cụ thể.

6. `POST /api/admin/stories/:id/quick-preview`
   - **Body:** `{ "preview_count": 3 }`
   - Tự động đánh dấu `preview_count` chương đầu tiên làm đọc thử, các chương còn lại đặt `is_preview = false`.

---

### 4.2. Module: `subscription-plans-pricing`

#### Public APIs:
1. `GET /api/plans`
   - Lấy danh sách toàn bộ các gói đọc đang kích hoạt (`is_active = true`), sắp xếp theo `display_order ASC`.
   - **Response:**
     ```json
     {
       "success": true,
       "plans": [
         {
           "id": 1,
           "name": "Gói Độc Giả Marvel",
           "slug": "goi-doc-gia-marvel",
           "description": "Trải nghiệm không giới hạn kho truyện Marvel chuẩn nét trong 30 ngày.",
           "price": 49000,
           "duration_days": 30,
           "badge": "Tiêu Chuẩn",
           "features": [
             "Đọc toàn bộ chương truyện VIP",
             "Hình ảnh chất lượng gốc từ Comic Vine",
             "Không có quảng cáo xen kẽ",
             "Đọc trên mọi thiết bị máy tính & di động"
           ],
           "is_active": true,
           "display_order": 1
         },
         ...
       ]
     }
     ```

2. `GET /api/plans/:id`
   - Lấy chi tiết thông tin một gói đọc.

#### Admin APIs (Yêu cầu JWT Token Role Admin):
3. `POST /api/admin/plans`
   - Tạo gói đọc mới.
   - **Body:** `{ "name", "description", "price", "duration_days", "badge", "features", "display_order", "is_active" }`

4. `PUT /api/admin/plans/:id`
   - Chỉnh sửa thông tin gói đọc.

5. `DELETE /api/admin/plans/:id`
   - Xóa gói đọc.

6. `PATCH /api/admin/plans/:id/toggle`
   - Bật / tắt nhanh trạng thái kích hoạt của gói (`is_active = !is_active`).

---

### 4.3. Module: `view-counter-anti-abuse`

1. `POST /api/stories/:id/view`
   - **Headers / Body:** `{ "duration_seconds": 18, "client_token": "..." }`
   - **Business Rules:**
     - Kiểm tra nếu `duration_seconds < 15` thì từ chối tăng view (trả về `{ "success": false, "message": "Thời gian đọc chưa đủ điều kiện" }`).
     - Session debounce: Ghi nhớ IP/User trong cache/bộ nhớ tạm; nếu cùng IP/User gửi request tăng view cho cùng một truyện trong vòng 10 phút thì không tăng tiếp (tránh lạm dụng script/F5 liên tục).
     - Thực hiện tăng nguyên tử: `await Story.increment('view_count', { by: 1, where: { id } })`.
   - **Response:**
     ```json
     {
       "success": true,
       "message": "Đã ghi nhận lượt đọc hợp lệ",
       "view_count": 1250
     }
     ```

---

## 5. UI/UX Design Specifications

### 5.1. Trang Chủ / Kho Truyện (`HomePage.jsx`)
- **Bộ Lọc Đa Chiều Nâng Cao (Catalog Controls):**
  - Thanh tìm kiếm từ khóa kết hợpdebounce 300ms.
  - Phân loại Thể loại dạng chips cuộn ngang (Action, Superhero, Sci-Fi, Magic, Mutants...).
  - Nhóm nút lọc Trạng thái truyện: `Tất cả` | `Đang phát hành` | `Hoàn thành`.
  - Nhóm nút lọc Chính sách truy cập: `Tất cả` | `Miễn phí` | `VIP Trả phí` | `Có đọc thử`.
  - Dropdown Sắp xếp: Mới nhất, Lượt xem nhiều nhất, Đánh giá cao nhất, Năm phát hành.
- **Thẻ Truyện (`ComicCard.jsx`):**
  - Hiển thị badge kép:
    - Góc trái: Badge Chính sách (`Free` màu xanh ngọc, `VIP` màu vàng kim, `Đọc thử` màu xanh lá).
    - Góc phải: Badge Trạng thái (`Đang ra` viền xanh dương, `Full` viền tím).
  - Footer thẻ truyện hiển thị số lượt xem format đẹp (ví dụ: `1.4K`, `12.5K`).

### 5.2. Màn Hình Quản Trị Truyện & Chương (`AdminStoriesPage.jsx`)
- Tích hợp thêm tab / công cụ quản lý nhanh:
  - Đổi trạng thái (`ongoing` / `completed` / `dropped`) với dropdown 1-click trực tiếp trên table.
  - Cột chính sách truy cập kèm nút chỉnh sửa nhanh giá bán lẻ (`price`).
  - Nút **"Quản Lý Chương & Đọc Thử"** mở modal riêng biệt:
    - Danh sách toàn bộ chương của truyện.
    - Cột toggle cờ `is_preview` dạng switch button trực quan.
    - Nút thao tác nhanh: *"Tự động đặt 3 chương đầu là đọc thử (Preview)"*.

### 5.3. Màn Hình Quản Trị Gói Đọc (`AdminPlansPage.jsx`)
- Route: `/admin/plans` (được bảo vệ bởi `ProtectedRoute` với `requireAdmin = true`).
- Bảng danh sách các gói đọc:
  - Tên gói, Huy hiệu (Badge), Giá tiền (VNĐ), Thời hạn (ngày), Trạng thái (`Đang mở` / `Tạm ngưng`), Thứ tự hiển thị.
  - Thao tác: Thêm mới gói đọc, Sửa gói đọc, Xóa gói, Bật/tắt nhanh trạng thái hoạt động.
- Modal Thêm / Chỉnh Sửa gói đọc:
  - Form trực quan nhập tên, giá, thời hạn, huy hiệu, mô tả và thêm/xóa từng dòng quyền lợi trong mảng `features`.

### 5.4. Trang Bảng Giá Gói Hội Viên Độc Giả (`SubscriptionsPage.jsx`)
- Route: `/subscriptions` (Công khai cho toàn bộ độc giả).
- Đưa link "Gói Hội Viên" nổi bật kèm badge "VIP" lên `Navbar.jsx`.
- Thiết kế:
  - Hero Header phong cách Marvel Cinematic Universe: Tiêu đề phông `Italiana`, hiệu ứng ánh hào quang đỏ/vàng kim.
  - Grid 3 gói thẻ đọc nổi bật:
    - Gói 1: **Độc Giả Marvel** (1 Tháng - 49.000đ).
    - Gói 2: **Siêu Anh Hùng** (3 Tháng - 129.000đ, có badge "Phổ Biến Nhất" viền vàng kim rực rỡ).
    - Gói 3: **Đa Vũ Trụ VIP** (1 Năm - 399.000đ, badge "Tiết Kiệm 35%").
  - Mỗi thẻ hiển thị giá, chu kỳ tính tiền, nút CTA "Đăng Ký Gói", và danh sách dấu tích xanh quyền lợi.
  - Bảng so sánh tính năng (Feature Comparison Table) giữa tài khoản Free và Hội viên VIP.
  - Phần FAQ (Câu hỏi thường gặp) giải đáp về việc gia hạn, hủy gói và quyền lợi đọc.

---

## 6. Testing Strategy & Success Criteria

### 6.1. Backend Testing:
- Kiểm tra migration `20261003000006-create-subscription-plans.js` tạo bảng `subscription_plans` thành công trong `marvel_db`.
- Seed thành công 3 gói đọc mẫu.
- API `GET /api/plans` trả về đúng danh sách các gói active.
- API `GET /api/stories` lọc chính xác theo `status` và `access_policy`.
- API `POST /api/stories/:id/view` từ chối nếu thời gian đọc $< 15s$, và tăng đúng 1 view nếu hợp lệ.
- API `PATCH /api/admin/chapters/:id/preview` cập nhật chính xác cờ đọc thử.

### 6.2. Frontend Verification:
- Trang chủ `/`: Thử nghiệm tất cả các bộ lọc trạng thái và chính sách; thẻ truyện hiển thị đúng badge trạng thái và chính sách.
- Trang `/subscriptions`: Hiển thị 3 gói đọc đẹp mắt, phong cách Marvel Dark Mode, đầy đủ tính năng và responsive trên cả mobile lẫn desktop.
- Trang `/admin/stories`: Thao tác chuyển đổi trạng thái truyện, thiết lập chính sách truy cập, bật/tắt đọc thử chương hoạt động mượt mà.
- Trang `/admin/plans`: Tạo mới, sửa, bật/tắt gói đọc phản ánh ngay lập tức vào CSDL.
- Console không có lỗi Javascript/React hay lỗi mạng.

---

## 7. Boundaries

- **Always:**
  - Giữ CSDL MySQL `marvel_db` kết nối qua XAMPP port 3306.
  - Lưu trữ giá tiền bằng kiểu `DECIMAL(10,2)` và định dạng hiển thị tiền tệ VNĐ (vd: `49.000 đ`).
  - Kiểm tra quyền Admin với middleware `roleMiddleware('admin')` cho toàn bộ các endpoint cấu hình giá, gói và chính sách.
- **Ask first:**
  - Thay đổi cấu trúc bảng người dùng hoặc bảng thanh toán trước thời điểm Sprint 3.
- **Never:**
  - Không xóa cứng dữ liệu truyện khi chỉ muốn đổi trạng thái (`dropped`).
  - Không cho phép tăng lượt đọc bằng việc reload trang liên tục không có thời gian dừng đọc.
