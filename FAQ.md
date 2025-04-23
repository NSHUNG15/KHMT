# Câu hỏi thường gặp (FAQ)

## Lỗi khi tạo giải đấu

### Vì sao tôi không thể tạo giải đấu?

Khi tạo giải đấu, bạn cần lưu ý những điểm sau để tránh lỗi "Validation error":

1. **Tất cả các trường bắt buộc phải được điền**:
   - Tên giải đấu
   - Mô tả
   - Bộ môn thể thao (phải chọn một giá trị từ dropdown)
   - Định dạng giải đấu (phải chọn một giá trị từ dropdown)
   - Ngày bắt đầu
   - Ngày kết thúc
   - Hạn đăng ký

2. **Các trường ngày tháng phải hợp lệ**:
   - Ngày kết thúc phải sau ngày bắt đầu
   - Hạn đăng ký phải trước ngày bắt đầu

3. **Đối với biểu mẫu đăng ký**:
   - Nếu chọn "Tạo biểu mẫu mới", phải thêm ít nhất một trường vào biểu mẫu
   - Nếu chọn "Sử dụng biểu mẫu có sẵn", phải chọn một biểu mẫu từ danh sách

### Lỗi cụ thể và cách khắc phục

#### Lỗi: "Validation error: Required"
- **Nguyên nhân**: Thiếu thông tin ở các trường bắt buộc
- **Giải pháp**: Kiểm tra và điền đầy đủ tất cả các trường có dấu (*)

#### Lỗi: "startDate must be a valid date"
- **Nguyên nhân**: Định dạng ngày không hợp lệ
- **Giải pháp**: Sử dụng bộ chọn ngày (date picker) có sẵn trong form

#### Lỗi: "formId - Data validation for a wrong formId"
- **Nguyên nhân**: ID biểu mẫu không hợp lệ hoặc không tồn tại
- **Giải pháp**: 
  - Nếu tạo biểu mẫu mới, đảm bảo thêm ít nhất một trường vào biểu mẫu
  - Nếu sử dụng biểu mẫu có sẵn, đảm bảo chọn một biểu mẫu từ danh sách

## Lỗi khi tạo biểu mẫu

### Vì sao biểu mẫu không được tạo?

1. **Biểu mẫu trống**:
   - Phải thêm ít nhất một trường vào biểu mẫu

2. **Lỗi định dạng**:
   - Đảm bảo các trường biểu mẫu có nhãn (label)
   - Các trường bắt buộc phải được đánh dấu là "Required"

3. **Quy trình tạo biểu mẫu**:
   - Nhấn nút "Thêm trường" để thêm trường mới
   - Chọn loại trường (văn bản, số, email, v.v.)
   - Điền nhãn cho trường
   - Đánh dấu nếu trường là bắt buộc
   - Thêm gợi ý (placeholder) nếu cần

### Làm gì khi gặp lỗi "Unexpected token"?

Lỗi này thường xảy ra khi định dạng JSON của biểu mẫu không hợp lệ:

1. **Giải pháp**:
   - Tạo biểu mẫu lại từ đầu, thêm từng trường một
   - Đảm bảo không có ký tự đặc biệt trong nhãn hoặc gợi ý
   - Không nhập quá nhiều tùy chọn cho trường loại "select" hoặc "radio"

## Cách thiết lập giải đấu thể thao hiệu quả

1. **Định dạng giải đấu**:
   - **Loại trực tiếp (Knockout)**: Phù hợp với giải đấu ngắn, đội thua sẽ bị loại
   - **Vòng tròn (Round Robin)**: Mỗi đội sẽ thi đấu với tất cả các đội khác
   - **Chia bảng + Loại trực tiếp**: Đầu tiên thi đấu vòng tròn trong bảng, sau đó các đội dẫn đầu sẽ thi đấu loại trực tiếp

2. **Số lượng đội tối đa**:
   - Nên giới hạn số lượng đội tham gia để dễ quản lý
   - Số lượng đội lý tưởng cho giải đấu loại trực tiếp là 2^n (8, 16, 32)
   - Đối với giải đấu vòng tròn, số lượng đội nên từ 4-10 để tránh quá nhiều trận đấu

3. **Biểu mẫu đăng ký cho đội**:
   - Thêm trường cho tên đội
   - Thêm trường cho thông tin liên hệ của đội trưởng
   - Thêm trường cho danh sách thành viên
   - Có thể thêm trường cho logo đội hoặc thông tin khác

## Tạo sự kiện và giải đấu hiệu quả

1. **Sự kiện đơn lẻ**:
   - Thích hợp cho hội thảo, workshop, gặp mặt
   - Có thể giới hạn số lượng người tham gia
   - Sử dụng biểu mẫu đơn giản với thông tin cần thiết

2. **Giải đấu thể thao**:
   - Cần lập kế hoạch kỹ về thời gian, địa điểm
   - Thiết lập định dạng giải đấu phù hợp với số lượng đội và thời gian
   - Tạo biểu mẫu đăng ký đầy đủ thông tin

3. **Xuất bản nội dung**:
   - Đánh dấu "Công bố ngay" nếu muốn nội dung hiển thị với người dùng
   - Có thể lưu dưới dạng bản nháp để hoàn thiện sau