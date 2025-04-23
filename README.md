# Duy Tan Computer Science Student Union Portal

Một nền tảng toàn diện dành cho Hội Sinh viên Khoa Khoa học Máy tính tại Đại học Duy Tân, được thiết kế để hợp lý hóa sự tham gia của sinh viên thông qua các công cụ quản lý sự kiện tiên tiến và xây dựng cộng đồng số.

## Tính năng

- **Quản lý sự kiện**: Tạo và quản lý các sự kiện khoa học máy tính, với hình thức đăng ký trực tuyến
- **Biểu mẫu tùy chỉnh**: Tạo và quản lý các biểu mẫu đăng ký có thể tùy chỉnh
- **Quản lý giải đấu thể thao**: Tự động tạo các cặp đấu, bảng xếp hạng, và quản lý đội
- **Quản lý thông báo**: Công bố thông tin quan trọng đến sinh viên
- **Xuất Excel**: Xuất dữ liệu đăng ký sự kiện, biểu mẫu, và giải đấu sang định dạng Excel
- **Xác thực và phân quyền**: Hệ thống đăng nhập an toàn với phân quyền người dùng/quản trị viên

## Công nghệ sử dụng

- **Frontend**: React, TailwindCSS, ShadcnUI
- **Backend**: Node.js, Express
- **Cơ sở dữ liệu**: PostgreSQL với Drizzle ORM
- **Xác thực**: Express Session, Bcrypt
- **Validation**: Zod
- **Các công cụ khác**: TanStack Query, React Hook Form

## Cài đặt và chạy ứng dụng

1. Clone repository:
   ```bash
   git clone https://github.com/your-username/duytan-cs-student-union.git
   cd duytan-cs-student-union
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   npm install --save-dev cross-env
   ```

3. Tạo file .env từ .env.example và cấu hình các biến môi trường

4. Chạy ứng dụng trong môi trường phát triển:
   ```bash
   npm run dev
   ```

5. Truy cập ứng dụng tại http://localhost:5000

## Hướng dẫn sử dụng

- **Tài khoản Admin mặc định**:
  - Username: admin
  - Password: adminpassword

- **Quản lý sự kiện**: Truy cập /admin/events để tạo và quản lý sự kiện
- **Quản lý giải đấu**: Truy cập /admin/tournaments để tạo và quản lý giải đấu
- **Quản lý biểu mẫu**: Truy cập /admin/forms để tạo và quản lý biểu mẫu tùy chỉnh
- **Quản lý thông báo**: Truy cập /admin/announcements để tạo và quản lý thông báo

## Hướng dẫn dành cho người đóng góp

1. Fork repository này
2. Tạo branch mới: `git checkout -b feature/your-feature-name`
3. Commit thay đổi: `git commit -m 'Add some feature'`
4. Push lên branch: `git push origin feature/your-feature-name`
5. Gửi Pull Request

## Điều hướng mã nguồn

- `/client/src` - Mã nguồn frontend React
- `/server` - Mã nguồn backend Express
- `/shared` - Các mô hình dữ liệu và schema được chia sẻ
- `/client/src/components` - Các component React UI
- `/client/src/pages` - Các trang của ứng dụng

## Giấy phép

Dự án này được phân phối dưới Giấy phép MIT. Xem `LICENSE` để biết thêm thông tin.