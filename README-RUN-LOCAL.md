# Hướng dẫn chạy dự án trên môi trường VS Code (Windows)

## Cài đặt môi trường

1. **Cài đặt Node.js và npm**
   - Tải và cài đặt Node.js từ [https://nodejs.org/](https://nodejs.org/) (khuyên dùng phiên bản LTS)
   - Kiểm tra cài đặt bằng các lệnh:
     ```
     node -v
     npm -v
     ```

2. **Clone dự án**
   - Clone dự án từ repository GitHub/GitLab hoặc giải nén file dự án

3. **Cài đặt các gói phụ thuộc**
   - Di chuyển vào thư mục dự án:
     ```
     cd duong/dan/toi/du-an
     ```
   - Cài đặt các gói phụ thuộc:
     ```
     npm install
     ```
   - Cài đặt cross-env (để hỗ trợ đặt biến môi trường trên Windows):
     ```
     npm install --save-dev cross-env
     ```

4. **Thiết lập biến môi trường**
   - Tạo file `.env` dựa trên file `.env.example`
   - Điền các thông tin cấu hình cần thiết

## Chỉnh sửa file package.json

Mở file `package.json` và thay đổi phần "scripts" như sau:

```json
"scripts": {
  "dev": "cross-env NODE_ENV=development tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "cross-env NODE_ENV=production node dist/index.js",
  "check": "tsc",
  "db:push": "drizzle-kit push"
},
```

## Chạy dự án

1. **Khởi động máy chủ phát triển**
   ```
   npm run dev
   ```

2. **Hoặc sử dụng lệnh sau nếu không có cross-env**
   ```
   set NODE_ENV=development && tsx server/index.ts
   ```

3. **Truy cập ứng dụng**
   - Mở trình duyệt và truy cập: [http://localhost:5000](http://localhost:5000)

## Thông tin đăng nhập

- **Tài khoản Admin**:
  - Username: admin
  - Password: adminpassword

## Các lệnh khác

- **Tạo build sản phẩm**:
  ```
  npm run build
  ```

- **Chạy ứng dụng từ build**:
  ```
  npm run start
  ```

- **Kiểm tra kiểu dữ liệu**:
  ```
  npm run check
  ```

- **Cập nhật schema database**:
  ```
  npm run db:push
  ```

## Xử lý lỗi thường gặp

### Lỗi "NODE_ENV is not recognized as an internal or external command"
Lỗi này xảy ra trên Windows khi chạy lệnh `npm run dev` hoặc `npm run start` mà không có cross-env.

**Cách khắc phục**:
1. Cài đặt cross-env:
   ```
   npm install --save-dev cross-env
   ```
2. Sửa file package.json như hướng dẫn ở trên.

### Lỗi kết nối cơ sở dữ liệu
Kiểm tra lại cấu hình DATABASE_URL trong file .env của bạn.

### Các vấn đề khác
Nếu gặp các vấn đề khác, vui lòng kiểm tra logs để tìm nguyên nhân và liên hệ với đội phát triển để được hỗ trợ.