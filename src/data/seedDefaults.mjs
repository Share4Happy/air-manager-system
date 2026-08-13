export const GUIDE_SEED = [
    {
        role: 'Admin',
        sections: [
            {
                title: 'Quản lý người dùng',
                steps: [
                    { content: 'Vào menu Người dùng để xem danh sách tài khoản nhân viên.' },
                    { content: 'Chọn "Thêm" để tạo tài khoản mới: điền tên, số điện thoại và chọn vai trò (Admin, Học vụ, Giáo viên, Sale).' },
                    { content: 'Dùng nút 3 chấm để vô hiệu hóa/kích hoạt tài khoản hoặc chuyển đổi vai trò.' },
                    { content: 'Dùng chức năng đăng nhập tạm để đăng nhập dưới vai trò khác nhằm kiểm tra và quay lại tài khoản của mình.' },
                ],
            },
            {
                title: 'Cài đặt hệ thống',
                steps: [
                    { content: 'Vào menu Cài đặt để cấu hình hệ thống gồm các tab: Hướng dẫn, Bài kiểm tra, Zalo Proxy, Cấu hình SLA, ZaloLite và Đồng bộ Drive.' },
                    { content: 'Tab Hướng dẫn: chọn vai trò rồi bấm "Chỉnh sửa" để cập nhật nội dung hướng dẫn và câu hỏi thường gặp.' },
                    { content: 'Tab Bài kiểm tra: soạn câu hỏi kiểm tra theo từng vai trò, xem lịch sử làm bài và cấu hình ngưỡng đạt.' },
                    { content: 'Tab Cấu hình SLA: đặt thời gian nhắc nhở điểm danh, cảnh báo nhật ký, cảnh báo minh chứng và ghi nhận vi phạm SLA.' },
                    { content: 'Tab Đồng bộ Drive: chuẩn hóa lại cấu trúc thư mục Google Drive theo quy định của trung tâm.' },
                ],
            },
            {
                title: 'Thống kê',
                steps: [
                    { content: 'Vào menu Thống kê để xem tổng quan KPI của trung tâm: học sinh, doanh thu/học phí, tỷ lệ hoàn thành.' },
                    { content: 'Lọc theo tháng/quý/năm hoặc theo khu vực, tìm theo lớp để xem chi tiết.' },
                ],
            },
            {
                title: 'Quản lý khóa học và học sinh',
                steps: [
                    { content: 'Vào menu Khóa học để tạo/sửa khóa học, xem danh sách khóa học chính và khóa học thử.' },
                    { content: 'Quản lý học sinh trong khóa: thêm mới, bảo lưu, xóa và thu tiền học phí.' },
                ],
            },
            {
                title: 'Chăm sóc khách hàng',
                steps: [
                    { content: 'Vào menu Chăm sóc để quản lý pipeline khách hàng: chăm sóc lớp học, chăm sóc và cấu hình Zalo.' },
                    { content: 'Theo dõi trạng thái học sinh: Không theo, Chưa chăm sóc, Theo học.' },
                ],
            },
            {
                title: 'Theo dõi thông báo và SLA',
                steps: [
                    { content: 'Vào menu Thông báo để xem các cảnh báo hệ thống và xử lý theo mức độ: Sự cố, Cảnh báo, Nhắc nhở.' },
                    { content: 'Đánh dấu đã xử lý hoặc chuyển thành sự cố khi cần để theo dõi đúng tiến độ.' },
                ],
            },
        ],
        faqs: [
            {
                question: 'Tôi quên mật khẩu đăng nhập thì phải làm sao?',
                answer: 'Liên hệ Admin hệ thống để đặt lại mật khẩu. Không có chức năng tự đặt lại mật khẩu trong hệ thống.',
            },
            {
                question: 'Tôi có thể chuyển vai trò cho một tài khoản không?',
                answer: 'Có. Vào menu Người dùng, chọn tài khoản và dùng nút 3 chấm để chuyển đổi vai trò.',
            },
            {
                question: 'Thay đổi nội dung hướng dẫn có ảnh hưởng ngay lập tức không?',
                answer: 'Có. Sau khi lưu ở Cài đặt, nội dung mới sẽ hiển thị ngay trong trang Thông tin cho mọi người dùng có vai trò tương ứng.',
            },
            {
                question: 'Ngưỡng đạt bài kiểm tra được cấu hình ở đâu?',
                answer: 'Vào Cài đặt > tab Bài kiểm tra, mục "Ngưỡng đạt". Chỉ Admin mới được thay đổi giá trị này.',
            },
        ],
    },
    {
        role: 'Academic',
        sections: [
            {
                title: 'Dashboard học vụ',
                steps: [
                    { content: 'Vào menu Học vụ để xem số buổi học hôm nay theo trạng thái: chưa diễn ra, đang diễn ra, đã kết thúc, chờ báo cáo, hoàn thành.' },
                    { content: 'Theo dõi các cảnh báo và vi phạm SLA, bấm nút tắt để đi nhanh tới SLA, chuyên cần hoặc học bù.' },
                ],
            },
            {
                title: 'Quản lý khóa học',
                steps: [
                    { content: 'Vào Học vụ > Quản lý khóa học để xem danh sách khóa đang học/hoàn thành, tạo khóa học mới, lọc theo khu vực hoặc thời gian.' },
                    { content: 'Khóa học thử (Học thử) được quản lý riêng tại trang Khóa học.' },
                    { content: 'Chọn một khóa học để xem chi tiết buổi học và danh sách học sinh.' },
                    { content: 'Dùng nút tạo buổi bù khi buổi học bị hủy.' },
                ],
            },
            {
                title: 'Báo cáo và thông báo',
                steps: [
                    { content: 'Vào Học vụ > Báo cáo để xem điểm danh từng lớp theo ngày và thống kê kết quả buổi học theo giáo viên.' },
                    { content: 'Cấu hình tin nhắn báo cáo và nhấn "Gửi ngay" để gửi cho phụ huynh qua Zalo.' },
                    { content: 'Cấu hình gửi báo cáo định kỳ (hằng ngày/hằng tuần/hằng tháng) cho từng giáo viên hoặc khu vực.' },
                    { content: 'Xem thống kê tuần để theo dõi tỷ lệ đi học.' },
                ],
            },
            {
                title: 'Theo dõi minh chứng và SLA',
                steps: [
                    { content: 'Kiểm tra buổi học đã có đủ ảnh/video minh chứng chưa.' },
                    { content: 'Xem bảng cảnh báo SLA: thiếu điểm danh, thiếu nhật ký, thiếu tài nguyên buổi học.' },
                    { content: 'Phối hợp với giáo viên để bổ sung minh chứng nếu còn thiếu theo thời hạn.' },
                ],
            },
            {
                title: 'Quản lý học phí',
                steps: [
                    { content: 'Vào Học vụ > Quản lý học phí để theo dõi công nợ theo khóa học.' },
                    { content: 'Tạo khoản nợ, thu tiền/thanh toán (hóa đơn, tiền mặt hoặc chuyển khoản), quản lý tài khoản ngân hàng.' },
                ],
            },
            {
                title: 'Quản lý học bù',
                steps: [
                    { content: 'Vào Học vụ > Quản lý học bù để xem danh sách học sinh cần học bù và lịch sử học bù.' },
                    { content: 'Xếp lịch học bù: chọn buổi, giờ, phòng và giáo viên; theo dõi trạng thái Chờ xếp lịch, Đã xếp lịch, Hoàn thành, Vắng, Quá hạn, Hủy.' },
                ],
            },
            {
                title: 'Chương trình và phòng học',
                steps: [
                    { content: 'Vào Học vụ > Quản lý chương trình học để tạo chương trình mới (ID 3 ký tự, ảnh bìa, huy hiệu, học phí, các chủ đề với thời lượng và link slide).' },
                    { content: 'Vào Học vụ > Quản lý phòng học để tạo khu vực và quản lý phòng học trong từng khu vực.' },
                ],
            },
        ],
        faqs: [
            {
                question: 'Tạo buổi học bù như thế nào?',
                answer: 'Mở buổi học bị hủy trong lịch, dùng nút "Tạo buổi bù" để tạo buổi mới cùng thời lượng và giáo trình.',
            },
            {
                question: 'Báo cáo gửi cho phụ huynh bị lỗi thì làm sao?',
                answer: 'Kiểm tra lại cấu hình tin nhắn và tài khoản Zalo trong Cài đặt, sau đó thử gửi lại. Nếu vẫn lỗi, xem phần kết quả gửi chi tiết từng người trong popup gửi báo cáo.',
            },
            {
                question: 'Minh chứng buổi học thiếu có bị cảnh báo không?',
                answer: 'Có. Hệ thống tự động cảnh báo khi buổi học kết thúc chưa có đủ minh chứng theo cấu hình SLA.',
            },
            {
                question: 'Xếp lịch học bù như thế nào?',
                answer: 'Vào Học vụ > Quản lý học bù, chọn học sinh cần học bù rồi xếp lịch: chọn buổi, giờ, phòng và giáo viên. Hệ thống sẽ cập nhật trạng thái theo từng giai đoạn.',
            },
            {
                question: 'Làm sao để cấu hình gửi báo cáo định kỳ cho phụ huynh?',
                answer: 'Vào Học vụ > Báo cáo > tab Cấu hình báo cáo, chọn tần suất (ngày/tuần/tháng), đối tượng giáo viên/khu vực và loại báo cáo, sau đó lưu.',
            },
        ],
    },
    {
        role: 'Teacher',
        sections: [
            {
                title: 'Xem lịch dạy',
                steps: [
                    { content: 'Vào menu Lịch dạy để xem các buổi học trong tuần, chọn chế độ "Lịch của tôi" hoặc "Toàn trung tâm".' },
                    { content: 'Chọn buổi học để xem chi tiết lớp, học sinh và giáo trình.' },
                ],
            },
            {
                title: 'Điểm danh và nhận xét',
                steps: [
                    { content: 'Mở buổi học cần điểm danh và bấm điểm danh cho từng học sinh: Có mặt, Vắng, Có phép.' },
                    { content: 'Ghi nhận xét buổi học và nhận xét từng học sinh để hệ thống báo cáo chính xác.' },
                ],
            },
            {
                title: 'Upload minh chứng',
                steps: [
                    { content: 'Trong buổi học, chọn thêm ảnh/video minh chứng sau giờ học; ảnh tự động lưu vào Google Drive.' },
                    { content: 'Kiểm tra lại minh chứng đã lưu đúng buổi và đúng học sinh.' },
                ],
            },
            {
                title: 'Khóa học và hồ sơ học sinh',
                steps: [
                    { content: 'Vào menu Khóa học để xem các khóa được phân công, xem chi tiết khóa và tài liệu chương trình.' },
                    { content: 'Xem hồ sơ học sinh và e-portfolio để theo dõi tiến độ của từng học sinh.' },
                ],
            },
        ],
        faqs: [
            {
                question: 'Tôi quên điểm danh một học sinh thì sửa thế nào?',
                answer: 'Mở lại buổi học đó trong Lịch dạy và cập nhật điểm danh của học sinh còn thiếu. Thay đổi sẽ được lưu ngay.',
            },
            {
                question: 'Upload ảnh minh chứng như thế nào?',
                answer: 'Mở buổi học cần thêm ảnh, dùng nút thêm hình để chọn ảnh/video từ máy. Ảnh sẽ được lưu vào Drive và gắn đúng buổi học.',
            },
            {
                question: 'Buổi học bị hủy thì tôi có cần làm gì không?',
                answer: 'Không cần thao tác thêm. Hệ thống sẽ thông báo cho phụ huynh và Học vụ có thể tạo buổi bù khi cần.',
            },
            {
                question: 'Tôi điểm danh nhầm trạng thái của học sinh thì sửa lại được không?',
                answer: 'Được. Mở lại buổi học đó trong Lịch dạy và thay đổi trạng thái điểm danh của học sinh. Thay đổi sẽ được lưu ngay.',
            },
        ],
    },
    {
        role: 'Sale',
        sections: [
            {
                title: 'Chăm sóc khách hàng',
                steps: [
                    { content: 'Vào menu Chăm sóc, tab "Chăm sóc" để xem bảng khách hàng/học viên cần chăm sóc.' },
                    { content: 'Dùng bộ lọc theo nguồn, khu vực, nhãn, người phụ trách để tìm đúng nhóm khách hàng.' },
                    { content: 'Chọn nhiều khách hàng để thao tác hàng loạt: gán nhãn, gán Sale, gửi tin nhắn Zalo.' },
                ],
            },
            {
                title: 'Chăm sóc lớp học',
                steps: [
                    { content: 'Vào tab "Chăm sóc lớp học" để xử lý lịch hủy buổi học/báo nghỉ của lớp.' },
                    { content: 'Xem thông tin học viên, lớp, giáo viên và liên hệ Zalo để xác nhận với phụ huynh.' },
                ],
            },
            {
                title: 'Theo dõi trạng thái học sinh',
                steps: [
                    { content: 'Theo dõi trạng thái: Không theo, Chưa chăm sóc, Theo học.' },
                    { content: 'Liên hệ phụ huynh và cập nhật trạng thái sau mỗi lần tương tác.' },
                    { content: 'Lọc theo trạng thái "Chưa chăm sóc" để ưu tiên xử lý trước.' },
                ],
            },
            {
                title: 'Quản lý học phí',
                steps: [
                    { content: 'Vào Học sinh > thẻ thanh toán để xem tình trạng đóng học phí.' },
                    { content: 'Theo dõi công nợ và nhắc phụ huynh khi đến hạn.' },
                ],
            },
            {
                title: 'Cấu hình Zalo',
                steps: [
                    { content: 'Vào tab "Cấu hình Zalo" trong menu Chăm sóc để gắn tài khoản Zalo cho từng người dùng phục vụ gửi tin nhắn CSKH.' },
                ],
            },
        ],
        faqs: [
            {
                question: 'Cập nhật trạng thái học sinh sau khi liên hệ như thế nào?',
                answer: 'Vào menu Chăm sóc, chọn học sinh và cập nhật trạng thái mới sau mỗi lần liên hệ với phụ huynh.',
            },
            {
                question: 'Tôi thấy học sinh nợ học phí, phải xử lý ra sao?',
                answer: 'Mở thẻ thanh toán của học sinh để xem chi tiết công nợ, sau đó liên hệ phụ huynh và cập nhật sau khi thanh toán.',
            },
            {
                question: 'Làm sao biết học sinh nào chưa được chăm sóc?',
                answer: 'Lọc danh sách theo trạng thái "Chưa chăm sóc" trong menu Chăm sóc để ưu tiên xử lý trước.',
            },
            {
                question: 'Gửi tin nhắn Zalo hàng loạt như thế nào?',
                answer: 'Vào menu Chăm sóc, tab "Chăm sóc", chọn nhiều khách hàng rồi dùng thao tác hàng loạt để gửi tin nhắn Zalo theo biến thể đã cấu hình.',
            },
        ],
    },
]

export const QUIZ_SEED = [
    {
        role: 'Admin',
        questions: [
            {
                question: 'Bạn cần tạo tài khoản mới cho nhân viên. Bạn vào đâu?',
                options: ['Người dùng', 'Học sinh', 'Khóa học', 'Thống kê'],
                answerIndex: 0,
            },
            {
                question: 'Nơi cấu hình Zalo Proxy, SLA và Đồng bộ Drive là?',
                options: ['Hướng dẫn', 'Cài đặt', 'Thông tin', 'Lịch dạy'],
                answerIndex: 1,
            },
            {
                question: 'Ai có thể chỉnh sửa nội dung Hướng dẫn trong Cài đặt?',
                options: ['Mọi người dùng', 'Chỉ Admin', 'Admin và Học vụ', 'Giáo viên'],
                answerIndex: 2,
            },
            {
                question: 'Có thể tạm khóa một tài khoản nhân viên không?',
                options: ['Không thể', 'Có, qua nút 3 chấm trong Người dùng', 'Chỉ khi nhân viên nghỉ việc', 'Không cần thiết'],
                answerIndex: 1,
            },
            {
                question: 'Tab Đồng bộ Drive trong Cài đặt dùng để làm gì?',
                options: ['Tải ảnh học sinh', 'Chuẩn hóa lại cấu trúc thư mục Drive theo quy định', 'Xóa dữ liệu Drive', 'Đăng nhập Google'],
                answerIndex: 1,
            },
            {
                question: 'Người dùng quên mật khẩu đăng nhập thì xử lý thế nào?',
                options: ['Tự đặt lại trong hệ thống', 'Liên hệ Admin hệ thống để đặt lại', 'Tạo tài khoản mới', 'Không thể làm gì'],
                answerIndex: 1,
            },
            {
                question: 'Chuyển vai trò cho một tài khoản bằng cách nào?',
                options: ['Xóa tài khoản rồi tạo mới', 'Nút 3 chấm trong menu Người dùng', 'Vào Cài đặt SLA', 'Chỉ Admin hệ thống làm được'],
                answerIndex: 1,
            },
            {
                question: 'Sau khi sửa nội dung Hướng dẫn trong Cài đặt, khi nào thay đổi có hiệu lực?',
                options: ['Sau khi khởi động lại', 'Ngay lập tức', 'Ngày hôm sau', 'Khi Admin duyệt'],
                answerIndex: 1,
            },
            {
                question: 'Xem tổng quan KPI của trung tâm (học sinh, doanh thu, tỷ lệ hoàn thành) ở đâu?',
                options: ['Menu Thống kê', 'Lịch dạy', 'Thông tin', 'Công cụ'],
                answerIndex: 0,
            },
            {
                question: 'Khi tạo tài khoản mới, bạn cần nhập những thông tin nào?',
                options: ['Tên và số điện thoại', 'Tên, số điện thoại và chọn vai trò', 'Chỉ số điện thoại', 'Ảnh chân dung'],
                answerIndex: 1,
            },
        ],
    },
    {
        role: 'Academic',
        questions: [
            {
                question: 'Bạn muốn tạo buổi học bù cho một buổi đã bị hủy. Bạn làm gì?',
                options: ['Tạo khóa học mới', 'Dùng nút tạo buổi bù trong buổi học', 'Thêm học sinh mới', 'Điều chỉnh SLA'],
                answerIndex: 1,
            },
            {
                question: 'Điểm danh cho từng buổi học nằm ở đâu?',
                options: ['Học vụ > Báo cáo', 'Người dùng', 'Cài đặt', 'Thông tin'],
                answerIndex: 0,
            },
            {
                question: 'Sau khi gửi báo cáo cho phụ huynh, bạn kiểm tra kết quả ở đâu?',
                options: ['Lịch dạy', 'Thống kê tuần trong Báo cáo', 'Học sinh', 'Người dùng'],
                answerIndex: 1,
            },
            {
                question: 'Minh chứng buổi học bị thiếu, bạn cần làm gì?',
                options: ['Bỏ qua', 'Phối hợp giáo viên bổ sung ảnh/video', 'Tự đăng nhập Google Drive', 'Xóa buổi học'],
                answerIndex: 1,
            },
            {
                question: 'Khóa học thử (Học thử) được quản lý ở đâu?',
                options: ['Học vụ', 'Người dùng', 'Cài đặt', 'Thông tin'],
                answerIndex: 0,
            },
            {
                question: 'Buổi học bù được tạo từ đâu?',
                options: ['Mở buổi học bị hủy trong lịch, bấm "Tạo buổi bù"', 'Tạo khóa học mới', 'Xếp lịch từ trang Học sinh', 'Liên hệ giáo viên'],
                answerIndex: 0,
            },
            {
                question: 'Báo cáo gửi phụ huynh bị lỗi, bước đầu tiên bạn làm gì?',
                options: ['Bỏ qua', 'Kiểm tra cấu hình tin nhắn và tài khoản Zalo', 'Đổi giáo viên', 'Xóa buổi học'],
                answerIndex: 1,
            },
            {
                question: 'Minh chứng buổi học thiếu có được cảnh báo tự động không?',
                options: ['Không', 'Có, theo cấu hình SLA', 'Chỉ khi Admin yêu cầu', 'Chỉ cuối tháng'],
                answerIndex: 1,
            },
            {
                question: 'Nút "Gửi ngay" trong Báo cáo dùng để làm gì?',
                options: ['Xóa báo cáo', 'Gửi báo cáo cho phụ huynh ngay lập tức', 'Tạo khóa học', 'Cập nhật điểm danh'],
                answerIndex: 1,
            },
            {
                question: 'Thống kê tuần trong Báo cáo giúp theo dõi gì?',
                options: ['Doanh thu', 'Tỷ lệ đi học', 'Số phòng học', 'Lịch sử đăng nhập'],
                answerIndex: 1,
            },
        ],
    },
    {
        role: 'Teacher',
        questions: [
            {
                question: 'Bạn xem các buổi dạy trong tuần ở đâu?',
                options: ['Lịch dạy', 'Người dùng', 'Học sinh', 'Cài đặt'],
                answerIndex: 0,
            },
            {
                question: 'Sau giờ học, bạn cần làm gì?',
                options: ['Chỉ điểm danh', 'Điểm danh và upload minh chứng ảnh/video', 'Không cần làm gì', 'Gửi tin nhắn thủ công'],
                answerIndex: 1,
            },
            {
                question: 'Học sinh vắng/trễ được ghi nhận bằng cách nào?',
                options: ['Không ghi nhận', 'Ghi nhận trong lúc điểm danh', 'Báo qua tin nhắn riêng', 'Xóa học sinh'],
                answerIndex: 1,
            },
            {
                question: 'Minh chứng nên được upload khi nào?',
                options: ['Cuối học kỳ', 'Sau mỗi buổi học', 'Khi Admin yêu cầu', 'Không bắt buộc'],
                answerIndex: 1,
            },
            {
                question: 'Chi tiết lớp, học sinh và giáo trình của buổi học xem ở đâu?',
                options: ['Chọn buổi học trong Lịch dạy', 'Cài đặt', 'Người dùng', 'Thông tin'],
                answerIndex: 0,
            },
            {
                question: 'Bạn quên điểm danh một học sinh thì sửa thế nào?',
                options: ['Không sửa được', 'Mở lại buổi học trong Lịch dạy và cập nhật', 'Báo Học vụ tạo buổi mới', 'Xóa học sinh'],
                answerIndex: 1,
            },
            {
                question: 'Upload ảnh minh chứng bằng cách nào?',
                options: ['Gửi qua tin nhắn', 'Mở buổi học, dùng nút thêm hình chọn ảnh/video từ máy', 'Chụp màn hình', 'Nhờ Admin upload'],
                answerIndex: 1,
            },
            {
                question: 'Buổi học bị hủy, giáo viên cần làm gì?',
                options: ['Không cần thao tác thêm, hệ thống tự thông báo', 'Tự gửi tin cho phụ huynh', 'Tạo buổi bù ngay', 'Báo nghỉ bằng văn bản'],
                answerIndex: 0,
            },
            {
                question: 'Điểm danh gồm những thao tác nào?',
                options: ['Chỉ đếm số học sinh', 'Bấm điểm danh từng học sinh và ghi nhận vắng/trễ/có phép', 'Chụp ảnh lớp', 'Gửi tin nhắn'],
                answerIndex: 1,
            },
            {
                question: 'Sau khi upload minh chứng, cần kiểm tra gì?',
                options: ['Ảnh đẹp', 'Ảnh lưu đúng buổi và đúng học sinh', 'Ảnh đúng kích thước', 'Không cần kiểm tra'],
                answerIndex: 1,
            },
        ],
    },
    {
        role: 'Sale',
        questions: [
            {
                question: 'Danh sách học sinh cần chăm sóc nằm ở đâu?',
                options: ['Menu Chăm sóc', 'Người dùng', 'Cài đặt', 'Lịch dạy'],
                answerIndex: 0,
            },
            {
                question: 'Trạng thái học sinh "Chưa chăm sóc" nghĩa là gì?',
                options: ['Đã liên hệ xong', 'Chưa liên hệ/chăm sóc', 'Đã nghỉ học', 'Đang chờ nhập học'],
                answerIndex: 1,
            },
            {
                question: 'Sau khi liên hệ phụ huynh, bạn cần làm gì?',
                options: ['Không cần làm gì', 'Cập nhật trạng thái học sinh', 'Xóa học sinh', 'Đổi mật khẩu'],
                answerIndex: 1,
            },
            {
                question: 'Theo dõi tình trạng đóng học phí của học sinh ở đâu?',
                options: ['Học sinh > thẻ thanh toán', 'Cài đặt', 'Người dùng', 'Thông tin'],
                answerIndex: 0,
            },
            {
                question: 'Khi học sinh đến hạn đóng học phí, bạn nên làm gì?',
                options: ['Bỏ qua', 'Nhắc phụ huynh khi đến hạn', 'Tự động trừ tiền', 'Khóa tài khoản'],
                answerIndex: 1,
            },
            {
                question: 'Cập nhật trạng thái học sinh sau khi liên hệ như thế nào?',
                options: ['Vào menu Chăm sóc, chọn học sinh và cập nhật trạng thái', 'Gửi tin nhắn', 'Xóa học sinh', 'Không cần cập nhật'],
                answerIndex: 0,
            },
            {
                question: 'Học sinh nợ học phí, bạn xử lý ra sao?',
                options: ['Bỏ qua', 'Mở thẻ thanh toán xem công nợ, liên hệ nhắc phụ huynh', 'Tự trừ tiền', 'Khóa tài khoản'],
                answerIndex: 1,
            },
            {
                question: 'Làm sao biết học sinh nào chưa được chăm sóc?',
                options: ['Xem ngẫu nhiên', 'Lọc theo trạng thái "Chưa chăm sóc"', 'Hỏi giáo viên', 'Xem thống kê doanh thu'],
                answerIndex: 1,
            },
            {
                question: 'Có những trạng thái nào cho học sinh trong chăm sóc?',
                options: ['Đang học, đã nghỉ', 'Không theo, Chưa chăm sóc, Theo học', 'Nghỉ có phép, vắng', 'Mới, cũ, tiềm năng'],
                answerIndex: 1,
            },
            {
                question: 'Lịch chạy tự động trong menu Chăm sóc dùng để làm gì?',
                options: ['Xóa khách hàng', 'Chạy chiến dịch gửi tin tự động cho khách hàng', 'Đồng bộ Drive', 'Cập nhật giá'],
                answerIndex: 1,
            },
        ],
    },
]