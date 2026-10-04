# SPEC: Hệ Thống Trình Bày & Đọc Chương Truyện Marvel (Chapter Reader System)
**Dự Án:** Nền Tảng Đọc Truyện Tranh Marvel (Marvel Comic Platform) - Nhóm 10  
**Tài Liệu Đặc Tả:** `SPEC-chapter-system.md`  
**Liên Kết:** [SPEC.md](file:///d:/CNPMNANGCAO/SPEC.md), [SPEC-sprint2.md](file:///d:/CNPMNANGCAO/SPEC-sprint2.md)

---

## 0. Capability Map & Dependency Graph (Scope Check)

| Module ID | Trách Nhiệm & Chức Năng | Phụ Thuộc (Depends on) |
|---|---|---|
| `chapter-schema-colorthief` | Mở rộng schema CSDL `chapters` (`cover_image`, `content`, `character_credits`, `accent_color`), cài đặt `node-vibrant` trích xuất màu chủ đạo từ ảnh bìa, cập nhật script `seedFromComicVine.js` nạp 10-13 chapter/truyện 100% dữ liệu ComicVine | — |
| `chapter-api-endpoints` | Cập nhật API `GET /api/chapters/:id` và `GET /api/stories/:id` trả về đầy đủ metadata chapter, character credits, accent color và liên kết chương trước/sau (`prevChapter`, `nextChapter`) | `chapter-schema-colorthief` |
| `chapter-reader-page` | Xây dựng component `ChapterReaderPage.jsx` với Hero parallax, dynamic theme theo `accent_color`, Pull Quote font Italiana, nội dung Merriweather, backdrop nhân vật mờ ảo, dải nhân vật tròn, điều hướng prev/next, và luân phiên bố cục Chẵn (2 cột sticky) / Lẻ (Hero full-width) | `chapter-api-endpoints` |
| `chapter-list-decorations` | Nâng cấp danh sách chương trên `StoryDetailPage.jsx` hiển thị thumbnail bìa chapter và dải màu `accent_color` trang trí viền trái; tối ưu responsive mobile | `chapter-api-endpoints` |

**Thứ tự xây dựng (Build Order):**  
`chapter-schema-colorthief` ➔ `chapter-api-endpoints` ➔ `chapter-reader-page` ➔ `chapter-list-decorations`

---

## 1. Assumptions & Clarifications (Giả Định Kỹ Thuật)

1. **Nguồn Dữ Liệu ComicVine:** 100% dữ liệu (ảnh bìa issue, tóm tắt nội dung description, danh sách nhân vật character_credits, ngày phát hành) lấy từ ComicVine (`comicvine.gamespot.com`). Tuyệt đối không nạp nguồn ảnh ngoài, không dùng placeholder giả mạo.
2. **Số Lượng Chapter:** Mỗi bộ truyện trong 8 series Marvel sẽ có từ 10 đến 13 chapter (hoặc toàn bộ nếu volume có ít hơn).
3. **Trích Xuất Màu Chủ Đạo (`accent_color`):**
   - Sử dụng thư viện `node-vibrant` (`node-vibrant/node`).
   - Trích xuất bảng màu `palette.Vibrant?.hex` hoặc `palette.DarkVibrant?.hex` từ URL ảnh bìa issue.
   - Nếu xảy ra lỗi mạng hoặc ảnh không trích xuất được màu hợp lệ, tự động fallback về màu đỏ Marvel `#ED1D24`.
4. **Bố Cục Luân Phiên (Odd / Even Alternating Layout):**
   - **Chapter số Lẻ (1, 3, 5, 7, 9, 11, 13...):** Bố cục dọc truyền thống — Hero banner full-width 50-60vh phía trên với hiệu ứng parallax nhẹ, nội dung cuộn dọc ở dưới căn giữa màn hình.
   - **Chapter số Chẵn (2, 4, 6, 8, 10, 12...):** Bố cục 2 cột hiện đại — 40% bên trái là ảnh bìa lớn cố định (`sticky top-24`), 60% bên phải là nội dung cuộn độc lập. Trên thiết bị di động (màn hình `< 768px`), tự động chuyển về bố cục 1 cột như chapter lẻ để đảm bảo trải nghiệm đọc thoải mái.
5. **Kiểu Chữ (Typography):**
   - Tiêu đề & Pull Quote: Google Font `Italiana` (sang trọng, điện ảnh).
   - Nội dung bài đọc: Google Font `Merriweather` (serif truyền thống, dễ đọc, khoảng cách dòng `line-height: 1.8`, độ rộng chuẩn `max-w-[680px]`).

---

## 2. Technical Stack & Commands

- **Backend:** Node.js v20+, Express.js, Sequelize ORM, MySQL (XAMPP port 3306), `node-vibrant/node`.
- **Frontend:** React, Vite, TailwindCSS, Lucide React, Google Fonts (`Italiana`, `Merriweather`, `Outfit`, `Inter`).
- **Commands Chuẩn Hóa:**
  - Cài đặt thư viện màu: `cd backend && npm install node-vibrant`
  - Chạy migration thêm trường mới: `cd backend && npx sequelize-cli db:migrate`
  - Chạy seed nạp 10-13 chapter & tính màu: `cd backend && node scripts/seedFromComicVine.js`
  - Chạy backend: `cd backend && npm run dev`
  - Chạy frontend: `cd frontend && npm run dev`
  - Build kiểm tra production: `cd frontend && npm run build`

---

## 3. Data Architecture & Schema Evolution

### 3.1. Bảng `chapters` (Sequelize Migration: `20261003000007-add-rich-fields-to-chapters.js`)

| Cột Mới / Thay Đổi | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
|---|---|---|---|
| `cover_image` | `VARCHAR(1000)` | NULL | Link ảnh bìa riêng của từng issue/chapter từ ComicVine |
| `content` | `LONGTEXT` | NULL | Văn bản nội dung tóm tắt chi tiết của issue |
| `character_credits` | `JSON` | NULL | Mảng tối đa 8 nhân vật xuất hiện: `[{ name, icon_url, id }]` |
| `accent_color` | `VARCHAR(10)` | DEFAULT `'#ED1D24'` | Mã màu HEX nổi bật trích xuất tự động từ ảnh bìa |

### 3.2. Model Association & Fallbacks
- Nếu `chapter.cover_image` rỗng hoặc null, hệ thống tự động fallback sang `story.cover_image` của bộ truyện cha.
- Nếu `chapter.accent_color` không có hoặc lỗi, mặc định sử dụng `#ED1D24`.

---

## 4. API Endpoints Specification

### 4.1. `GET /api/stories/:id`
- Trả về chi tiết bộ truyện và danh sách các chương:
  ```json
  {
    "success": true,
    "story": {
      "id": 1,
      "title": "The Amazing Spider-Man",
      "cover_image": "https://...",
      "chapters": [
        {
          "id": 101,
          "chapter_number": 1,
          "title": "Spider-Man!",
          "cover_image": "https://comicvine.gamespot.com/a/uploads/...",
          "release_date": "1963-03-01",
          "accent_color": "#f8e02c",
          "is_preview": true
        },
        ...
      ]
    }
  }
  ```

### 4.2. `GET /api/chapters/:chapterId`
- Trả về chi tiết chương truyện phục vụ màn hình đọc `ChapterReaderPage`:
  ```json
  {
    "success": true,
    "chapter": {
      "id": 101,
      "chapter_number": 1,
      "title": "Spider-Man!",
      "release_date": "1963-03-01",
      "cover_image": "https://comicvine.gamespot.com/a/uploads/...",
      "accent_color": "#2c6cf8",
      "content": "Peter Parker is an ordinary high school student...",
      "character_credits": [
        { "name": "Peter Parker", "icon_url": "https://..." },
        { "name": "J. Jonah Jameson", "icon_url": "https://..." }
      ],
      "is_preview": true,
      "story": {
        "id": 1,
        "title": "The Amazing Spider-Man",
        "cover_image": "https://...",
        "access_policy": "mixed"
      },
      "prev_chapter": null,
      "next_chapter": {
        "id": 102,
        "chapter_number": 2,
        "title": "Duel to the Death with the Vulture!",
        "cover_image": "https://..."
      }
    }
  }
  ```

---

## 5. UI/UX & Layout Architecture (`ChapterReaderPage.jsx`)

### 5.1. Hệ Thống Màu Động (Dynamic Accent Atmosphere)
- Mỗi chapter được gán một biến CSS hoặc style động: `--chapter-accent: ${chapter.accent_color}`.
- Các thành phần được đồng bộ tông màu:
  - Viền trái pull-quote: `border-left: 4px solid var(--chapter-accent)`
  - Glow nhẹ quanh nút bấm CTA / icon: `box-shadow: 0 0 20px ${accentColor}33`
  - Màu số chương & badge: text và viền mang màu nhấn
  - Đường phân cách gạch chân tiêu đề: gradient pha từ `var(--chapter-accent)` sang trong suốt.

### 5.2. Hero Header Parallax
- Chiều cao: `50vh - 60vh` (trên mobile: `~35vh`).
- Ảnh bìa issue full-width, `object-fit: cover`.
- Hiệu ứng Parallax: ảnh dịch chuyển nhẹ theo tốc độ cuộn `translateY(scrollY * 0.35)`.
- Gradient tối phủ mờ từ dưới lên (`from-[#0F0F14] via-[#0F0F14]/60 to-transparent`).
- Góc dưới ảnh hiển thị: Tên bộ truyện (breadcrumb), Số Issue to nổi bật, Tiêu đề chương, Ngày phát hành.

### 5.3. Pull Quote & Nghệ Thuật Chữ
- Tự động tách câu văn ấn tượng nhất từ `content`.
- Font: `Italiana`, cỡ chữ lớn `2xl - 3xl`, căn giữa, màu chữ sáng, in nghiêng nhẹ.
- Trang trí dấu ngoặc kép lớn `“` mờ ảo (`text-7xl font-serif opacity-10 absolute`).

### 5.4. Khối Nội Dung Chính
- Font: `Merriweather`, `line-height: 1.8`, màu chữ xám ngà `text-gray-200`.
- Chiều rộng tối đa: `max-w-[680px]` căn giữa.
- Tách văn bản thành 2-4 đoạn văn thoáng đãng, dễ đọc.

### 5.5. Backdrop Nhân Vật Mờ Ảo (Ambient Character Texture)
- Lấy ảnh nhân vật đầu tiên trong `character_credits` (nếu có).
- Kích thước lớn, đặt ẩn phía sau nền văn bản (`z-0 pointer-events-none`).
- Áp dụng `filter: blur(25px)`, `opacity: 0.06`.

### 5.6. Section Dải Nhân Vật (Character Credits Bar)
- Grid avatar tròn (`w-14 h-14 object-cover rounded-full border border-white/10`).
- Hover scale nhẹ `scale-110`, viền sáng theo màu `accent_color`.
- Tên nhân vật hiển thị nhỏ bên dưới.
- Trên mobile: tự động chuyển thành thanh cuộn ngang mượt mà (`overflow-x-auto no-scrollbar`).
- Ẩn hoàn toàn nếu mảng `character_credits` rỗng.

### 5.7. Điều Hướng Cuối Trang (Previous / Next Navigation)
- 2 thẻ card tương tác cho Chương Trước và Chương Sau.
- Hiển thị thumbnail ảnh bìa nhỏ của chương đó, số issue, tên chương.
- Hover đổi màu viền sang `accent_color` và mũi tên trượt nhẹ.

### 5.8. Luân Phiên Bố Cục Chẵn / Lẻ (Odd / Even Alternating Layout)
- **Chapter LẺ (`chapter_number % 2 !== 0`):**
  - Hero Header full-width phía trên ➔ Nội dung cuộn dọc căn giữa phía dưới.
- **Chapter CHẴN (`chapter_number % 2 === 0`):**
  - Bố cục 2 cột cố định:
    - Cột Trái (40%): Ảnh bìa issue ghim cố định (`sticky top-24`), kèm hiệu ứng đổ bóng viền phát sáng nhẹ theo `accent_color`.
    - Cột Phải (60%): Header nhỏ, Pull Quote, Nội dung chính, Dải nhân vật và Điều hướng cuối trang cuộn dọc.
  - Trên màn hình di động (`< 768px`), tự động chuyển thành 1 cột như chapter lẻ.

---

## 6. Trang Danh Sách Chương (`StoryDetailPage.jsx`)
- Mỗi hàng / thẻ chương trong danh sách bổ sung:
  - Thumbnail ảnh bìa issue nhỏ (`w-12 h-16 rounded-md object-cover`).
  - Dải màu nhỏ trang trí viền trái card (`w-1.5 h-full rounded-l-xl`) mang chính màu `accent_color` của chương đó.
  - Hiển thị nhãn đọc thử / VIP chuẩn hóa.

---

## 7. Testing Strategy & Success Criteria

1. **CSDL & Seed Data:**
   - Bảng `chapters` có đủ 4 trường mới: `cover_image`, `content`, `character_credits`, `accent_color`.
   - Chạy seed `node scripts/seedFromComicVine.js` thành công.
   - Mỗi bộ truyện có từ 10 đến 13 chapter đầy đủ ảnh bìa thật, nội dung thật, nhân vật thật và mã màu hex hợp lệ.
2. **Kiểm Tra Trích Xuất Màu:**
   - Toàn bộ chapter đều có `accent_color` dạng hex (`#xxxxxx`).
   - Các chapter khác nhau có màu nhấn khác nhau phản ánh đúng bìa truyện.
3. **Kiểm Tra Giao Diện Đọc Chapter:**
   - Mở chapter số lẻ (ví dụ Chap 1): Hiển thị layout dọc với Hero full-width.
   - Mở chapter số chẵn (ví dụ Chap 2): Hiển thị layout 2 cột với ảnh bìa sticky bên trái.
   - Thử nghiệm trên mobile viewport (375px - 414px): Cả 2 layout đều hiển thị mượt mà không vỡ khung, dải nhân vật cuộn ngang.
   - Nút điều hướng chương trước/sau hoạt động chính xác.

---

## 8. Boundaries

- **Always:**
  - CHỈ sử dụng dữ liệu thật từ ComicVine (comicvine.gamespot.com).
  - Giữ fallback an toàn nếu thiếu ảnh bìa hoặc lỗi màu (`story.cover_image`, `#ED1D24`).
- **Never:**
  - Không nạp ảnh placeholder hoặc nguồn truyện bên ngoài ngoài ComicVine.
  - Không phá vỡ luồng phân quyền đọc thử / VIP đã thiết lập ở Sprint 2.
