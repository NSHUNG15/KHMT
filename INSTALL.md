# Hướng dẫn cài đặt và triển khai

## Cài đặt trong môi trường phát triển

### Yêu cầu hệ thống

- Node.js phiên bản 18 trở lên
- NPM phiên bản 8 trở lên hoặc Yarn
- PostgreSQL (tùy chọn, có thể sử dụng bộ nhớ trong RAM cho môi trường phát triển)

### Các bước cài đặt

1. **Clone repository**

```bash
git clone <repository-url>
cd <repository-folder>
```

2. **Cài đặt dependencies**

```bash
npm install
# hoặc
yarn install
```

3. **Cấu hình môi trường**

Tạo file `.env` từ file mẫu `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` để cấu hình:
- `DATABASE_URL`: URL kết nối đến PostgreSQL (nếu sử dụng)
- `SESSION_SECRET`: Chuỗi bí mật cho phiên làm việc
- `PORT`: Cổng chạy ứng dụng (mặc định: 5000)

4. **Khởi chạy ứng dụng trong môi trường phát triển**

```bash
npm run dev
# hoặc
yarn dev
```

5. **Truy cập ứng dụng**

Mở trình duyệt và truy cập địa chỉ http://localhost:5000

## Triển khai trên môi trường sản xuất

### Bước 1: Chuẩn bị server

- Cài đặt Node.js và npm
- Cài đặt và cấu hình PostgreSQL
- Cài đặt PM2 (quản lý quy trình)

```bash
npm install -g pm2
```

### Bước 2: Clone và cài đặt ứng dụng

```bash
git clone <repository-url>
cd <repository-folder>
npm install --production
```

### Bước 3: Cấu hình môi trường sản xuất

Tạo file `.env` với cấu hình phù hợp cho môi trường sản xuất:

```
NODE_ENV=production
DATABASE_URL=postgres://user:password@localhost:5432/dbname
SESSION_SECRET=your_strong_secret_key
PORT=5000
```

### Bước 4: Build ứng dụng

```bash
npm run build
```

### Bước 5: Khởi chạy ứng dụng với PM2

```bash
pm2 start npm --name "cssu-website" -- start
```

### Bước 6: Cấu hình PM2 để khởi động cùng hệ thống

```bash
pm2 startup
pm2 save
```

### Bước 7: Cấu hình Nginx (tùy chọn)

Nếu bạn muốn sử dụng Nginx làm reverse proxy:

```
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Bước 8: Cấu hình SSL với Let's Encrypt (tùy chọn)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Xác thực và phân quyền

Hệ thống có các vai trò người dùng sau:

1. **Khách (Guest)**: Người dùng chưa đăng nhập
   - Xem thông báo, sự kiện, giải đấu đã được công bố
   - Đăng ký tài khoản

2. **Người dùng (User)**: Người dùng đã đăng nhập
   - Xem tất cả nội dung được công bố
   - Đăng ký tham gia sự kiện và giải đấu
   - Quản lý hồ sơ cá nhân
   - Tạo và quản lý đội tham gia giải đấu

3. **Quản trị viên (Admin)**: Quản lý hệ thống
   - Tất cả quyền của người dùng
   - Tạo và quản lý nội dung (thông báo, sự kiện, giải đấu)
   - Quản lý người dùng
   - Xuất dữ liệu đăng ký

### Tài khoản mặc định

Hệ thống tạo sẵn một tài khoản quản trị viên mặc định:

- **Username**: admin
- **Password**: admin

**Lưu ý**: Hãy đổi mật khẩu này ngay sau khi cài đặt xong hệ thống để đảm bảo an toàn.

## Backup và khôi phục dữ liệu

### Backup dữ liệu PostgreSQL

```bash
pg_dump -U username -d dbname > backup.sql
```

### Khôi phục dữ liệu

```bash
psql -U username -d dbname < backup.sql
```

## Troubleshooting

### Lỗi kết nối database

- Kiểm tra `DATABASE_URL` trong file `.env`
- Đảm bảo PostgreSQL đang chạy
- Kiểm tra quyền truy cập của người dùng database

### Lỗi khi khởi chạy ứng dụng

- Kiểm tra logs: `pm2 logs cssu-website`
- Đảm bảo đã cài đặt đủ dependencies: `npm install`
- Kiểm tra xung đột cổng: đảm bảo cổng 5000 không bị sử dụng bởi ứng dụng khác

### Lỗi khi build

- Xóa thư mục `node_modules` và cài đặt lại: `rm -rf node_modules && npm install`
- Xóa thư mục build và build lại: `rm -rf dist && npm run build`

## Cập nhật ứng dụng

Để cập nhật ứng dụng lên phiên bản mới:

```bash
git pull
npm install
npm run build
pm2 restart cssu-website
```