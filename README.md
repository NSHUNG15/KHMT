# Website Liên đoàn Sinh viên Khoa Công nghệ Thông tin - Đại học Duy Tân

Dự án này là một website toàn diện cho Liên đoàn Sinh viên Khoa Công nghệ Thông tin tại Đại học Duy Tân, được thiết kế để tăng cường sự tham gia của sinh viên thông qua quản lý sự kiện và xây dựng cộng đồng số.

## Công nghệ sử dụng

- **Frontend**: React với Tailwind CSS, Shadcn UI
- **Backend**: Node.js với Express
- **Cơ sở dữ liệu**: PostgreSQL (qua Drizzle ORM)
- **Ngôn ngữ lập trình**: TypeScript

## Tính năng chính

- Quản lý sự kiện và đăng ký
- Tạo và điều hành giải đấu thể thao
- Tạo biểu mẫu đăng ký tùy chỉnh
- Quản lý thông báo
- Xác thực người dùng và quản lý hồ sơ

## Cách cài đặt và chạy ứng dụng

### Yêu cầu

- Node.js phiên bản 18 trở lên
- NPM hoặc Yarn

### Cài đặt

1. Clone repository:
   ```
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Cài đặt các dependencies:
   ```
   npm install
   ```

3. Cấu hình biến môi trường:
   - Tạo file `.env` từ file `.env.example` và cập nhật các biến môi trường

4. Chạy ứng dụng trong môi trường phát triển:
   ```
   npm run dev
   ```

5. Truy cập ứng dụng tại http://localhost:5000

## Triển khai sản phẩm

1. Build ứng dụng:
   ```
   npm run build
   ```

2. Chạy ứng dụng đã được build:
   ```
   npm start
   ```

## Đăng nhập tài khoản admin

- Username: `admin`
- Password: `admin`

## Gỡ lỗi phổ biến

### Lỗi khi tạo biểu mẫu và giải đấu

1. **Vấn đề**: Không thể tạo biểu mẫu hoặc giải đấu, xuất hiện lỗi validation
   
   **Giải pháp**:
   - Đảm bảo điền đầy đủ thông tin bắt buộc (các trường có dấu *)
   - Các trường ngày tháng phải hợp lệ (ngày kết thúc phải sau ngày bắt đầu)
   - Với giải đấu, trường "Bộ môn thể thao" và "Định dạng giải đấu" phải được chọn
   - Nếu tạo biểu mẫu mới, phải thêm ít nhất một trường vào biểu mẫu

2. **Vấn đề**: Lỗi "Validation error"
   
   **Giải pháp**:
   - Kiểm tra console của trình duyệt để xem thông tin chi tiết về lỗi
   - Đảm bảo dữ liệu nhập vào đúng định dạng (số nguyên cho các trường số, v.v.)

3. **Vấn đề**: Lỗi khi tạo biểu mẫu cho sự kiện hoặc giải đấu
   
   **Giải pháp**:
   - Sử dụng tùy chọn "Tạo biểu mẫu mới" và thêm ít nhất một trường vào biểu mẫu trước khi lưu
   - Hoặc sử dụng tùy chọn "Sử dụng biểu mẫu có sẵn" và chọn một biểu mẫu đã tạo trước đó

### Lỗi khác

1. **Vấn đề**: Không thể đăng nhập
   
   **Giải pháp**:
   - Kiểm tra kết nối database
   - Đảm bảo username và password chính xác
   - Xóa cookies và cache của trình duyệt, sau đó thử lại

2. **Vấn đề**: Không thể tải dữ liệu
   
   **Giải pháp**:
   - Kiểm tra kết nối mạng
   - Đảm bảo đã đăng nhập (với các tính năng yêu cầu xác thực)
   - Kiểm tra logs của server để xem lỗi chi tiết

## Cơ chế hoạt động

1. **Quản lý sự kiện**:
   - Admin tạo sự kiện với thông tin và biểu mẫu đăng ký
   - Sinh viên xem và đăng ký tham gia
   - Admin có thể xuất danh sách người đăng ký ra Excel

2. **Quản lý giải đấu**:
   - Admin tạo giải đấu và biểu mẫu đăng ký
   - Đội trưởng đăng ký đội tham gia
   - Admin có thể tạo lịch thi đấu tự động, cập nhật kết quả và theo dõi thứ hạng

3. **Thông báo**:
   - Admin tạo và xuất bản thông báo
   - Chỉ những thông báo đã xuất bản mới hiển thị cho người dùng

## Liên hệ

Liên hệ quản trị viên khi gặp vấn đề hoặc cần hỗ trợ.