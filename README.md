# Marvel Comics Hub - Hệ Thống Đọc Truyện Tranh Marvel (Nhóm 10)

Hệ thống đọc truyện tranh trực tuyến định hướng Marvel với giao diện Hero 3D (Three.js), quản lý nội dung, hội viên và thanh toán theo gói/chương.

---

## 🚀 Khởi Chạy Nhanh (Development)

> **Lưu ý quan trọng:** Hãy đảm bảo bạn đã mở **XAMPP** và khởi động dịch vụ **MySQL** trước khi chạy dự án để Backend có thể kết nối cơ sở dữ liệu (`marvel_db`).

### Cách 1: Sử dụng file `start-dev.bat` (Khuyên dùng)
- **Bấm đúp (double-click) trực tiếp vào file [`start-dev.bat`](file:///d:/CNPMNANGCAO/start-dev.bat) ở thư mục gốc của project**: File sẽ tự động mở 2 cửa sổ terminal riêng biệt cho **Backend** (`http://localhost:5000`) và **Frontend** (`http://localhost:5173`), cả hai cửa sổ đều được giữ nguyên để theo dõi log và lỗi.

### Cách 2: Khởi chạy thủ công qua dòng lệnh
1. **Khởi chạy Backend:**
   ```bash
   cd backend
   npm run dev
   ```
2. **Khởi chạy Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🛠 Yêu Cầu Môi Trường (Prerequisites)
- **Node.js**: v18 trở lên
- **XAMPP**: Chạy dịch vụ MySQL (cổng 3306, database `marvel_db`)
