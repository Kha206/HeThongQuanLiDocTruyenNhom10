@echo off
:: ==============================================================================
:: LƯU Ý: Vui lòng bật XAMPP (MySQL) trước khi chạy file này!
:: Backend cần kết nối cơ sở dữ liệu MySQL để hoạt động bình thường.
:: ==============================================================================

chcp 65001 >nul
title Khởi Động Dự Án - Marvel Comics Hub

echo ==============================================================================
echo  [LƯU Ý QUAN TRỌNG]
echo  Vui lòng bật XAMPP (khởi động MySQL) trước khi chạy file này!
echo  Backend cần kết nối cơ sở dữ liệu MySQL (marvel_db) để hoạt động.
echo ==============================================================================
echo.
echo Đang mở cửa sổ Backend và Frontend...
echo.

:: 1. Mở cửa sổ riêng biệt cho Backend, chuyển vào thư mục backend và chạy npm run dev
start "BACKEND - Marvel Comics Hub" /d "%~dp0backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: 2. Mở cửa sổ riêng biệt cho Frontend, chuyển vào thư mục frontend và chạy npm run dev
start "FRONTEND - Marvel Comics Hub" /d "%~dp0frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ==============================================================================
echo  Đã khởi chạy xong Backend và Frontend trong 2 cửa sổ riêng biệt!
echo  Cả 2 cửa sổ sẽ giữ nguyên mở để bạn tiện theo dõi log hoặc lỗi nếu có.
echo ==============================================================================
echo.
timeout /t 5 >nul
