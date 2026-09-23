'use client'

import { useState } from 'react'
import { ROLES, RoleBadge, roleMeta } from './shared'

const ROLE_DETAILS = {
    Admin: {
        title: 'Quản trị viên (Admin)',
        subtitle: 'Toàn quyền điều hành và quản trị hệ thống',
        description: 'Vai trò cấp cao nhất có toàn quyền truy cập, cấu hình và quản trị mọi phân hệ trên nền tảng AI Robotic.',
        color: '#dc3545',
        bg: '#fdecef',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        groups: [
            {
                name: 'Quản trị Người dùng & Phân quyền',
                items: [
                    { title: 'Quản lý tài khoản', desc: 'Thêm mới, sửa thông tin, đặt lại mật khẩu và đổi trạng thái kích hoạt/khóa tài khoản nhân sự.' },
                    { title: 'Phân quyền vai trò (Role)', desc: 'Cấp quyền Admin, Academic, Teacher, Sale cho từng nhân sự trong hệ thống.' },
                    { title: 'Chuyển đổi vai trò (Switch Role)', desc: 'Chuyển đổi trải nghiệm sang vai trò khác để kiểm tra giao diện và luồng thao tác người dùng.' },
                    { title: 'Reset phiên đăng nhập', desc: 'Đăng xuất tài khoản từ xa và làm mới token bảo mật khi cần thiết.' },
                ]
            },
            {
                name: 'Hạ tầng, Hệ thống & Google Drive',
                items: [
                    { title: 'Cài đặt hệ thống (/setting)', desc: 'Cấu hình thông số toàn hệ thống, quản trị danh mục và quyền truy cập nâng cao.' },
                    { title: 'Quản lý Google Drive (/tools/drive-storage)', desc: 'Theo dõi dung lượng lưu trữ, quét tự động và đồng bộ cấu trúc thư mục lớp học theo chuẩn chuẩn mực.' },
                    { title: 'ZaloLite API Gateway', desc: 'Kết nối và quản lý các tài khoản Zalo bot, xem nhật ký tin nhắn (Bot Logs) và hạn mức gửi tin.' },
                    { title: 'Xóa bộ nhớ đệm (Clear Cache)', desc: 'Làm mới cache hệ thống tức thì khi cập nhật dữ liệu cốt lõi.' },
                    { title: 'Quản lý Danh mục Công cụ (/tools)', desc: 'Thêm mới, sửa, xóa, gắn nhãn và phân loại các công cụ hỗ trợ công việc.' },
                ]
            },
            {
                name: 'Tài chính & Học phí',
                items: [
                    { title: 'Cấu hình ngân hàng & QR', desc: 'Thiết lập tài khoản ngân hàng nhận học phí và cấu hình mã QR chuyển khoản tự động.' },
                    { title: 'Thu học phí & Duyệt hàng loạt', desc: 'Ghi nhận giao dịch học phí, xuất biên lai và thực hiện thu/duyệt học phí hàng loạt.' },
                    { title: 'Đối soát công nợ', desc: 'Kiểm tra và xử lý danh sách học sinh còn tồn đọng công nợ học phí.' },
                ]
            },
            {
                name: 'Học vụ, Lịch học & Sự kiện',
                items: [
                    { title: 'Toàn quyền Học vụ & Đào tạo', desc: 'Quản lý chương trình học, phòng học, mở lớp, phân công giáo viên và điều phối lịch dạy.' },
                    { title: 'Toàn quyền Sự kiện & Ngân sách', desc: 'Thiết lập sự kiện, quản lý chi phí/ngân sách (Budget), phân công trạm và nhân sự.' },
                    { title: 'Toàn quyền Chăm sóc (/client)', desc: 'Chăm sóc khách hàng, quản lý nhãn, gửi tin nhắn Zalo bot và xử lý lớp nghỉ/hủy.' },
                ]
            }
        ]
    },
    Academic: {
        title: 'Học vụ (Academic)',
        subtitle: 'Toàn quyền quản trị & điều hành tương đương Admin trên toàn bộ hệ thống',
        description: 'Vai trò Học vụ có quyền hạn tương đương Admin trên gần như 100% các phân hệ của hệ thống: từ quản trị tài khoản, cài đặt, Google Drive, Zalo bot, tài chính học phí đến toàn bộ nghiệp vụ đào tạo, lớp học, sự kiện và chăm sóc khách hàng.',
        color: '#0374da',
        bg: '#e8f4ff',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
        ),
        groups: [
            {
                name: 'Quản trị Người dùng & Phân quyền (Giống Admin)',
                items: [
                    { title: 'Quản lý tài khoản nhân sự', desc: 'Toàn quyền tạo mới, chỉnh sửa thông tin, đặt lại mật khẩu và khóa/mở khóa tài khoản.' },
                    { title: 'Phân quyền & Đổi Role', desc: 'Gán và điều chỉnh vai trò cho nhân sự trong trung tâm.' },
                    { title: 'Giả lập vai trò (Switch Role)', desc: 'Chuyển đổi linh hoạt sang vai trò Giáo viên, Sale để kiểm tra giao diện làm việc.' },
                    { title: 'Reset phiên đăng nhập', desc: 'Đăng xuất tài khoản từ xa và làm mới token xác thực.' },
                ]
            },
            {
                name: 'Hạ tầng, Drive & Hệ thống (Giống Admin)',
                items: [
                    { title: 'Cài đặt hệ thống (/setting)', desc: 'Toàn quyền truy cập và cấu hình các thông số hệ thống, danh mục và hướng dẫn.' },
                    { title: 'Quản lý Google Drive (/tools/drive-storage)', desc: 'Theo dõi dung lượng lưu trữ, chạy xác thực (Verify), quét dung lượng và đồng bộ thư mục lớp học.' },
                    { title: 'Quản lý Zalo Bot & Logs', desc: 'Xem trạng thái kết nối bot ZaloLite, kiểm tra lịch sử gửi tin (Bot Logs) và cấu hình tài khoản bot.' },
                    { title: 'Quản lý Công cụ & Nhãn (/tools)', desc: 'Thêm, sửa, xóa các công cụ tiện ích và quản lý hệ thống nhãn màu sắc.' },
                ]
            },
            {
                name: 'Tài chính & Quản lý Học phí (Giống Admin)',
                items: [
                    { title: 'Quản lý ngân hàng & Mã QR', desc: 'Thiết lập tài khoản ngân hàng nhận thanh toán học phí của trung tâm.' },
                    { title: 'Thu học phí lẻ & Duyệt hàng loạt', desc: 'Ghi nhận đóng học phí từng học sinh hoặc phê duyệt thu học phí đồng loạt cho cả lớp.' },
                    { title: 'Quản lý công nợ học phí (/academic/debt)', desc: 'Theo dõi tình hình nợ học phí, xuất danh sách nhắc phí và cập nhật trạng thái thanh toán.' },
                ]
            },
            {
                name: 'Quản lý Đào tạo & Khóa học (/academic)',
                items: [
                    { title: 'Quản lý chương trình học (/academic/program)', desc: 'Xây dựng và cập nhật giáo trình, bộ môn, bài học, tài liệu và danh mục bộ kit Lego/Robotics.' },
                    { title: 'Quản lý phòng học (/academic/rooms)', desc: 'Thiết lập danh sách phòng học, kiểm tra xung đột phòng học theo thời gian thực khi xếp lịch.' },
                    { title: 'Quản lý khóa học & Mở lớp (/academic/course-manager)', desc: 'Tạo lớp học mới, phân công giáo viên giảng dạy, phân bổ phòng học và xếp học sinh vào lớp.' },
                    { title: 'Quản lý học bù (/academic/makeup)', desc: 'Quản lý danh sách học sinh vắng, lên lịch học bù, ghép lớp bù và duyệt ca học bù.' },
                    { title: 'Báo cáo & Thông báo (/academic/report)', desc: 'Cấu hình gửi báo cáo tự động cho phụ huynh và giám sát chuyên cần lớp học.' },
                ]
            },
            {
                name: 'Điều phối Lịch học & Báo nghỉ (/calendar, /course)',
                items: [
                    { title: 'Xử lý báo nghỉ & Dời lịch', desc: 'Ghi nhận báo nghỉ lớp, tự động dời lịch các buổi kế tiếp và cập nhật thời khóa biểu.' },
                    { title: 'Đổi giáo viên & Phòng học', desc: 'Linh hoạt điều phối giáo viên dạy thay hoặc thay đổi phòng học khi có phát sinh.' },
                    { title: 'Quản lý lớp học thử (/course/trycourse)', desc: 'Tổ chức các buổi học thử, sắp xếp giáo viên và kiểm tra danh sách học sinh tham gia.' },
                ]
            },
            {
                name: 'Sự kiện, Ngân sách & Chăm sóc (/events, /client)',
                items: [
                    { title: 'Toàn quyền Sự kiện & Ngân sách (/events)', desc: 'Tạo sự kiện, thiết lập lộ trình nhiệm vụ, phân công trạm thử thách, kiểm kê thiết bị và quản lý ngân sách (Budget).' },
                    { title: 'Chăm sóc & Gửi tin Zalo (/client)', desc: 'Theo dõi lớp có buổi nghỉ/hủy, gửi tin nhắn Zalo chăm sóc phụ huynh, tạo mẫu tin nhắn tự động.' },
                ]
            }
        ]
    },
    Teacher: {
        title: 'Giáo viên (Teacher)',
        subtitle: 'Giảng dạy, quản lý lớp học, chăm sóc học sinh và đánh giá chất lượng',
        description: 'Trực tiếp phụ trách các buổi học, điểm danh, ghi nhận sản phẩm sáng tạo, nhận xét học sinh, đồng thời tham gia chăm sóc phụ huynh/học sinh và hỗ trợ các sự kiện.',
        color: '#28a745',
        bg: '#eaf7ee',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        groups: [
            {
                name: 'Chăm sóc Học sinh & Phụ huynh (/client)',
                items: [
                    { title: 'Truy cập trang Chăm sóc (/client)', desc: 'Giáo viên có toàn quyền truy cập phân hệ Chăm sóc để nắm bắt tình hình học sinh và lớp học.' },
                    { title: 'Gửi tin nhắn Zalo chăm sóc', desc: 'Trực tiếp gửi tin nhắn Zalo trao đổi, nhắc lịch hoặc gửi thông tin học tập đến phụ huynh qua Zalo bot.' },
                    { title: 'Chăm sóc buổi nghỉ / hủy', desc: 'Theo dõi các buổi học bị hủy hoặc học sinh vắng để liên hệ chăm sóc, hỗ trợ lịch học bù kịp thời.' },
                    { title: 'Quản lý nhãn & lịch sử tương tác', desc: 'Gắn nhãn phân loại học sinh và xem lại lịch sử gửi tin chăm sóc.' },
                ]
            },
            {
                name: 'Giảng dạy & Quản lý Buổi học (/calendar, /course)',
                items: [
                    { title: 'Xem lịch dạy cá nhân (/calendar)', desc: 'Theo dõi lịch dạy theo ngày, tuần, tháng; nắm bắt bài học tiếp theo và danh sách học sinh.' },
                    { title: 'Điểm danh học sinh', desc: 'Thực hiện điểm danh đầu buổi học (Có mặt, Đi trễ, Vắng có phép, Vắng không phép).' },
                    { title: 'Upload ảnh check-in & Sản phẩm', desc: 'Chụp và tải ảnh không khí lớp học cùng sản phẩm mô hình/robotics của học sinh lên Google Drive.' },
                    { title: 'Nhập nhận xét kết thúc buổi', desc: 'Viết nhận xét chi tiết về mức độ tiếp thu, kỹ năng và thái độ của từng học sinh để gửi báo cáo phụ huynh.' },
                    { title: 'Tiếp nhận học bù', desc: 'Đón nhận và điểm danh học sinh ghép lớp học bù vào buổi học của lớp mình.' },
                    { title: 'Gửi yêu cầu Báo nghỉ', desc: 'Gửi thông báo báo nghỉ khi có việc đột xuất để Học vụ hỗ trợ dời lịch học.' },
                ]
            },
            {
                name: 'Hồ sơ học sinh & E-Portfolio (/e-portfolio, /student)',
                items: [
                    { title: 'Tra cứu hồ sơ học sinh', desc: 'Tra cứu thông tin học tập, phụ huynh, mức độ chuyên cần và lịch sử tham gia lớp.' },
                    { title: 'E-Portfolio dự án sáng tạo', desc: 'Xem, ghi nhận và chia sẻ bộ sưu tập sản phẩm dự án sáng tạo của học sinh qua từng khóa học.' },
                ]
            },
            {
                name: 'Sự kiện, Khảo sát & Công cụ (/events, /info, /tools)',
                items: [
                    { title: 'Tham gia Sự kiện STEAM (/events)', desc: 'Tạo sự kiện, nhận phân công phụ trách trạm thử thách, làm trọng tài chấm điểm hoặc điều phối viên hoạt động.' },
                    { title: 'Kiểm tra nghiệp vụ (/info?tab=quiz)', desc: 'Tham gia làm các bài kiểm tra định kỳ để củng cố kiến thức chuyên môn và kỹ năng sư phạm.' },
                    { title: 'Kho Công cụ & Tiện ích (/tools)', desc: 'Tra cứu và thêm mới/sử dụng các công cụ hỗ trợ giảng dạy và làm việc.' },
                ]
            }
        ]
    },
    Sale: {
        title: 'Tư vấn & Chăm sóc (Sale / CSKH)',
        subtitle: 'Tư vấn tuyển sinh, chăm sóc phụ huynh và phát triển học viên mới',
        description: 'Tiếp nhận dữ liệu khách hàng tiềm năng, tư vấn các khóa học phù hợp, tổ chức học thử và chăm sóc định kỳ qua Zalo.',
        color: '#e67e22',
        bg: '#fdf2e6',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
        ),
        groups: [
            {
                name: 'Quản lý Khách hàng & Chăm sóc (/client)',
                items: [
                    { title: 'Quản lý Khách hàng tiềm năng (Lead)', desc: 'Tiếp nhận thông tin khách hàng từ các kênh tuyển sinh, cập nhật nhu cầu và thông tin liên hệ.' },
                    { title: 'Phân loại nhãn (Labels)', desc: 'Gắn nhãn trạng thái khách hàng (Quan tâm, Đã hẹn test, Đang suy nghĩ, Chốt nhập học).' },
                    { title: 'Gửi tin nhắn Zalo chăm sóc', desc: 'Gửi tin tư vấn trực tiếp hoặc gửi hàng loạt theo chiến dịch qua hệ thống ZaloLite bot.' },
                    { title: 'Lịch sử tương tác', desc: 'Xem lại toàn bộ lịch sử gửi tin và phản hồi của phụ huynh để tối ưu hóa việc tư vấn.' },
                ]
            },
            {
                name: 'Tổ chức Học thử (/course/trycourse)',
                items: [
                    { title: 'Đăng ký học thử', desc: 'Thêm học sinh vào các lớp trải nghiệm học thử STEM/Robotics phù hợp với độ tuổi.' },
                    { title: 'Cập nhật trạng thái sau học thử', desc: 'Đánh giá phản hồi của học sinh sau buổi thử (Theo học, Chưa CS, Không theo).' },
                    { title: 'Chuyển đổi nhập học chính thức', desc: 'Lập hồ sơ ghi danh và chuyển học sinh vào lớp học chính thức.' },
                ]
            },
            {
                name: 'Tra cứu Lớp học & Sự kiện (/academic/course-manager, /events)',
                items: [
                    { title: 'Tra cứu lớp mở mới', desc: 'Xem danh sách các lớp sắp khai giảng, sĩ số hiện tại và lịch học để tư vấn phụ huynh.' },
                    { title: 'Tham gia Sự kiện tuyển sinh (/events)', desc: 'Đồng hành cùng sự kiện trải nghiệm, đón tiếp phụ huynh và ghi danh học sinh trực tiếp tại sự kiện.' },
                ]
            }
        ]
    }
}

const PERMISSION_MATRIX = [
    {
        category: 'Quản trị Người dùng & Hệ thống',
        features: [
            { name: 'Quản lý tài khoản & phân quyền (Role)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Không', sale: 'Không' },
            { name: 'Khóa / Mở khóa tài khoản nhân sự', admin: 'Có', academic: 'Có', teacher: 'Không', sale: 'Không' },
            { name: 'Giả lập vai trò (Switch Role)', admin: 'Có', academic: 'Có', teacher: 'Không', sale: 'Không' },
            { name: 'Quản lý Cài đặt hệ thống (/setting)', admin: 'Có', academic: 'Có', teacher: 'Không', sale: 'Không' },
            { name: 'Quản lý Google Drive & Đồng bộ thư mục', admin: 'Có', academic: 'Có', teacher: 'Không', sale: 'Không' },
            { name: 'Cấu hình Zalo Bot & Xem Bot Logs', admin: 'Có', academic: 'Có', teacher: 'Không', sale: 'Xem hạn mức' },
            { name: 'Quản lý danh mục Công cụ (/tools)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Toàn quyền', sale: 'Toàn quyền' },
        ]
    },
    {
        category: 'Học vụ, Đào tạo & Tài chính',
        features: [
            { name: 'Quản lý chương trình & giáo án (/academic/program)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Chỉ xem', sale: 'Chỉ xem' },
            { name: 'Quản lý & xếp phòng học (/academic/rooms)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Chỉ xem', sale: 'Chỉ xem' },
            { name: 'Mở lớp & Phân công giáo viên (/academic/course-manager)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Chỉ xem', sale: 'Chỉ xem' },
            { name: 'Quản lý học bù (/academic/makeup)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Theo lớp', sale: 'Không' },
            { name: 'Báo cáo học tập & Thông báo (/academic/report)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Chỉ xem', sale: 'Không' },
            { name: 'Quản lý công nợ & thu học phí hàng loạt (/academic/debt)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Không', sale: 'Không' },
            { name: 'Cấu hình tài khoản ngân hàng & QR (/academic/bank)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Không', sale: 'Không' },
        ]
    },
    {
        category: 'Giảng dạy & Buổi học',
        features: [
            { name: 'Xem lịch dạy (/calendar)', admin: 'Tất cả', academic: 'Tất cả', teacher: 'Lịch cá nhân', sale: 'Tất cả' },
            { name: 'Điểm danh học sinh buổi học', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Không' },
            { name: 'Upload ảnh check-in & sản phẩm', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Không' },
            { name: 'Nhập nhận xét kết thúc buổi học', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Không' },
            { name: 'Gửi yêu cầu Báo nghỉ lớp', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Không' },
            { name: 'Dời lịch & Tạo buổi bù tự động', admin: 'Có', academic: 'Có', teacher: 'Không', sale: 'Không' },
        ]
    },
    {
        category: 'Chăm sóc, Khách hàng & Tuyển sinh',
        features: [
            { name: 'Truy cập trang Chăm sóc (/client)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Toàn quyền', sale: 'Toàn quyền' },
            { name: 'Gửi tin Zalo chăm sóc khách hàng/lớp học', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Có' },
            { name: 'Quản lý nhãn khách hàng & mẫu tin nhắn', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Có', sale: 'Có' },
            { name: 'Chăm sóc lớp học có buổi nghỉ/hủy', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Có', sale: 'Có' },
            { name: 'Quản lý Lớp học thử (/course/trycourse)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Có', sale: 'Toàn quyền' },
            { name: 'Xem & Quản lý E-Portfolio (/e-portfolio)', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Có' },
        ]
    },
    {
        category: 'Sự kiện & Trải nghiệm STEAM',
        features: [
            { name: 'Xem danh sách sự kiện (/events)', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Có' },
            { name: 'Tạo mới & Thiết lập sự kiện', admin: 'Có', academic: 'Có', teacher: 'Có', sale: 'Có' },
            { name: 'Cấu hình Trạm, Nhiệm vụ (Roadmap) & Thiết bị', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Được giao', sale: 'Được giao' },
            { name: 'Quản lý Ngân sách sự kiện (Budget)', admin: 'Toàn quyền', academic: 'Toàn quyền', teacher: 'Không', sale: 'Không' },
        ]
    }
]

function StatusBadge({ val }) {
    if (val === 'Toàn quyền' || val === 'Tất cả' || val === 'Có') {
        return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{val}</span>
    }
    if (val === 'Theo lớp' || val === 'Lịch cá nhân' || val === 'Được giao' || val === 'Xem hạn mức') {
        return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">{val}</span>
    }
    if (val === 'Chỉ xem') {
        return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">{val}</span>
    }
    return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">—</span>
}

export default function RolesView() {
    const [activeRole, setActiveRole] = useState('Academic')
    const [viewMode, setViewMode] = useState('cards') // 'cards' | 'matrix'
    const [searchQuery, setSearchQuery] = useState('')

    const currentRoleData = ROLE_DETAILS[activeRole] || ROLE_DETAILS.Academic

    const filteredMatrix = PERMISSION_MATRIX.map(cat => {
        const matchingFeatures = (cat.features || []).filter(f =>
            f?.name?.toLowerCase().includes((searchQuery || '').toLowerCase().trim())
        )
        return { ...cat, features: matchingFeatures }
    }).filter(cat => (cat.features || []).length > 0)

    return (
        <div className="w-full h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto py-6 px-4 flex flex-col gap-6">

                {/* Hero Header */}
                <div
                    className="rounded-2xl p-6 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #eef2ff 0%, #f8fbff 60%, #ffffff 100%)',
                        border: '1px solid #e0e7ff',
                        boxShadow: 'var(--boxshaw)'
                    }}
                >
                    <div
                        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20"
                        style={{
                            background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)',
                            transform: 'translate(30%, -30%)'
                        }}
                    />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-indigo-600 text-white shadow-md">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">Vai trò & Quyền hạn hệ thống</h2>
                                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                    Tra cứu chi tiết trách nhiệm, phạm vi quyền hạn và các thao tác của từng vai trò (Role)
                                </p>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex items-center gap-1 p-1 bg-white/80 rounded-xl border border-indigo-100 self-start md:self-auto shrink-0 shadow-xs">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-none ${
                                    viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 bg-transparent'
                                }`}
                            >
                                Chi tiết từng vai trò
                            </button>
                            <button
                                onClick={() => setViewMode('matrix')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-none ${
                                    viewMode === 'matrix' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 bg-transparent'
                                }`}
                            >
                                Ma trận so sánh quyền
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'cards' ? (
                    <>
                        {/* Role Selector Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {ROLES.map(r => {
                                const meta = roleMeta(r)
                                const isCurrent = activeRole === r
                                return (
                                    <button
                                        key={r}
                                        onClick={() => setActiveRole(r)}
                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                                            isCurrent
                                                ? 'bg-white shadow-md'
                                                : 'bg-[var(--bg-primary)] hover:bg-[var(--hover)] text-[var(--text-secondary)] border-[var(--border-color)]'
                                        }`}
                                        style={isCurrent ? { borderColor: meta.color, color: meta.color } : {}}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                        <span>{ROLE_DETAILS[r]?.title || meta.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Active Role Card */}
                        <div className="bg-white rounded-2xl p-6 border border-[var(--border-color)] shadow-xs flex flex-col gap-6">
                            {/* Role Banner */}
                            <div className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: currentRoleData.bg }}>
                                <div className="p-3 rounded-xl text-white shrink-0" style={{ backgroundColor: currentRoleData.color }}>
                                    {currentRoleData.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-lg font-bold text-gray-900">{currentRoleData.title}</h3>
                                        <RoleBadge role={activeRole} size="md" />
                                    </div>
                                    <p className="text-xs font-semibold mt-0.5" style={{ color: currentRoleData.color }}>
                                        {currentRoleData.subtitle}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                                        {currentRoleData.description}
                                    </p>
                                </div>
                            </div>

                            {/* Permission Groups */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentRoleData.groups.map((grp, gi) => (
                                    <div key={gi} className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: currentRoleData.color }} />
                                            <h4 className="text-sm font-bold text-gray-900">{grp.name}</h4>
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            {grp.items.map((item, ii) => (
                                                <div key={ii} className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-gray-200/60 shadow-2xs">
                                                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs text-emerald-600 bg-emerald-50 font-bold">
                                                        ✓
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-800">{item.title}</p>
                                                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Permission Matrix View */
                    <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-xs overflow-hidden flex flex-col gap-4 p-5">
                        {/* Search Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Ma trận phân quyền chi tiết</h3>
                                <p className="text-xs text-gray-500 mt-0.5">So sánh quyền hạn trực quan giữa các vai trò trên từng tính năng</p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Tìm tính năng..."
                                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer border-none bg-transparent"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200">
                                        <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider w-[40%]">Chức năng / Phân hệ</th>
                                        <th className="py-3 px-3 text-xs font-bold text-red-600 uppercase tracking-wider text-center w-[15%]">Quản trị (Admin)</th>
                                        <th className="py-3 px-3 text-xs font-bold text-blue-600 uppercase tracking-wider text-center w-[15%]">Học vụ (Academic)</th>
                                        <th className="py-3 px-3 text-xs font-bold text-emerald-600 uppercase tracking-wider text-center w-[15%]">Giáo viên (Teacher)</th>
                                        <th className="py-3 px-3 text-xs font-bold text-amber-600 uppercase tracking-wider text-center w-[15%]">Tư vấn (Sale)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMatrix.map((grp, gi) => (
                                        <React.Fragment key={gi}>
                                            <tr className="bg-indigo-50/40 border-t border-b border-indigo-100">
                                                <td colSpan={5} className="py-2.5 px-4 text-xs font-bold text-indigo-900">
                                                    {grp.category}
                                                </td>
                                            </tr>
                                            {(grp.features || []).map((feat, fi) => (
                                                <tr key={fi} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-2.5 px-4 text-xs text-gray-800 font-medium">
                                                        {feat.name}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <StatusBadge val={feat.admin} />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <StatusBadge val={feat.academic} />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <StatusBadge val={feat.teacher} />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <StatusBadge val={feat.sale} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {filteredMatrix.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-xs text-gray-400 italic">
                                                Không tìm thấy chức năng phù hợp với từ khóa "{searchQuery}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer Note */}
                <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs">
                    <span className="text-base shrink-0">💡</span>
                    <span>
                        <strong>Ghi chú quan trọng:</strong> <strong>Học vụ (Academic)</strong> được cấp toàn quyền thao tác tương đương Admin trên tất cả các phân hệ hệ thống (bao gồm quản lý tài khoản, cài đặt, Drive, Zalo bot, tài chính, sự kiện và đào tạo). <strong>Giáo viên (Teacher)</strong> có toàn quyền sử dụng phân hệ <strong>Chăm sóc (/client)</strong> để nhắn tin Zalo, theo dõi các buổi nghỉ/hủy và hỗ trợ phụ huynh học sinh.
                    </span>
                </div>

            </div>
        </div>
    )
}
