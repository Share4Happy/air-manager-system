'use client';
import React, { useState } from 'react';
import {
    IconBookOpen,
    IconUser,
    IconUsers,
    IconStation,
    IconPackage,
    IconSchool,
    IconCheckCircle,
    IconAlertTriangle,
    IconExternalLink,
    IconClock,
    IconLayers,
    IconDollar,
    IconFileText,
} from '@/app/events/ui/icons';

const ROLE_GUIDES = [
    {
        key: 'lead',
        label: 'Trưởng ban tổ chức',
        icon: IconUser,
        color: 'bg-rose-500 text-white',
        border: 'border-rose-200 dark:border-rose-900',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
        description: 'Chỉ đạo toàn diện, phê duyệt lộ trình, ngân sách, nhân sự và đối ngoại với ban giám hiệu nhà trường.',
        steps: [
            {
                title: 'Giai đoạn Chuẩn bị (D-14 đến D-3)',
                items: [
                    'Làm việc với Ban giám hiệu nhà trường để chốt thời gian, số lượng học sinh, không gian sảnh/sân trường.',
                    'Phê duyệt bản kế hoạch ngân sách dự toán, danh sách nhân sự tham gia và phân công Trưởng trạm.',
                    'Duyệt kịch bản ma trận các trạm trải nghiệm và quy tắc đổi thưởng Passport.',
                ],
            },
            {
                title: 'Trước ngày diễn ra (D-1)',
                items: [
                    'Kiểm tra công tác chuẩn bị thiết bị, sa bàn và quà tặng tại trung tâm.',
                    'Khảo sát thực tế vị trí nguồn điện, bàn ghế, mái che tại trường.',
                    'Tổ chức họp Briefing nhanh 15 phút với toàn bộ nhân sự sự kiện.',
                ],
            },
            {
                title: 'Ngày diễn ra sự kiện (D-Day)',
                items: [
                    'Có mặt trước 60 phút để chỉ đạo setup và đón tiếp đại diện nhà trường.',
                    'Phát biểu khai mạc ngắn gọn (3 - 5 phút), tạo không khí hứng khởi cho học sinh.',
                    'Giám sát tổng thể luồng di chuyển của học sinh, giải quyết các phát sinh cấp cao.',
                ],
            },
            {
                title: 'Sau sự kiện (D+1)',
                items: [
                    'Họp rút kinh nghiệm (Retro) với đội ngũ, ghi nhận đóng góp và điểm cần cải thiện.',
                    'Gửi thư cảm ơn, báo cáo hình ảnh và kết quả ngày hội cho Ban giám hiệu nhà trường.',
                    'Ký duyệt quyết toán chi phí thực tế trong tab Ngân sách.',
                ],
            },
        ],
    },
    {
        key: 'secretary',
        label: 'Thư ký & Quản lý điều phối',
        icon: IconLayers,
        color: 'bg-blue-600 text-white',
        border: 'border-blue-200 dark:border-blue-900',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
        description: 'Theo dõi tiến độ công việc trên hệ thống, phân bổ ngân sách, gửi tin Zalo thông báo và tổng hợp báo cáo.',
        steps: [
            {
                title: 'Giai đoạn Chuẩn bị',
                items: [
                    'Nhập liệu danh sách công việc vào tab Lộ trình, gán người phụ trách và đặt deadline rõ ràng.',
                    'Cập nhật thông tin chi tiết nhân sự (nội bộ + CTV/Tình nguyện viên) vào tab Nhân sự.',
                    'Cấu hình tin nhắn Zalo ZNS / tự động nhắc nhở lịch tập trung cho nhân sự trong tab Zalo Config.',
                ],
            },
            {
                title: 'Ngày D-Day',
                items: [
                    'Điểm danh nhân sự tại sự kiện qua tab Nhân sự (bấm Check-in).',
                    'Thu thập các hóa đơn, chứng từ phát sinh thực tế và cập nhật link Drive minh chứng vào tab Ngân sách.',
                    'Theo dõi tiến độ các task trong D-Day và hỗ trợ các trưởng trạm.',
                ],
            },
            {
                title: 'Sau sự kiện',
                items: [
                    'Tổng hợp chi phí thực tế và minh chứng hóa đơn để trình Trưởng ban tổ chức.',
                    'Cập nhật tab Tổng kết & Đánh giá (Số lượng học sinh tham gia, đánh giá KPI, bài học kinh nghiệm).',
                ],
            },
        ],
    },
    {
        key: 'station_lead',
        label: 'Trưởng trạm & Hướng dẫn viên STEM',
        icon: IconStation,
        color: 'bg-purple-600 text-white',
        border: 'border-purple-200 dark:border-purple-900',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
        description: 'Phụ trách nội dung chuyên môn, mô hình robot, thiết bị nạp code và hướng dẫn học sinh trải nghiệm tại trạm.',
        steps: [
            {
                title: 'Giai đoạn Chuẩn bị',
                items: [
                    'Đọc kỹ kịch bản trạm trong tab Kịch bản Trạm (Mô hình lắp ráp, chương trình nạp code Scratch/Blockly, luật thi đấu sa bàn).',
                    'Kiểm tra tình trạng hoạt động của Robot, động cơ, cảm biến và sạc đầy pin thiết bị trước 1 ngày.',
                    'Chuẩn bị con dấu mộc riêng của trạm để đóng dấu Passport cho các bé hoàn thành.',
                ],
            },
            {
                title: 'Ngày D-Day',
                items: [
                    'Có mặt trước 45 phút, bố trí bàn ghế, sắp xếp mô hình bắt mắt và test lại nguồn điện.',
                    'Đón từng lượt học sinh (10 - 15 em/lượt), hướng dẫn nhiệt tình, kiên nhẫn và vui vẻ.',
                    'Kiểm soát thời gian mỗi lượt: 15 - 20 phút/nhóm để đảm bảo xoay tua đều giữa các lớp.',
                    'Đóng dấu Passport cho học sinh sau khi bé hoàn thành trải nghiệm.',
                ],
            },
            {
                title: 'Kết thúc sự kiện',
                items: [
                    'Kiểm đếm toàn bộ mô hình, pin, máy tính bảng và phụ kiện trước khi đóng gói.',
                    'Bàn giao lại thiết bị cho Bộ phận Hậu cần theo Checklist thiết bị.',
                ],
            },
        ],
    },
    {
        key: 'logistics',
        label: 'Hậu cần, Kỹ thuật & Thiết bị',
        icon: IconPackage,
        color: 'bg-amber-600 text-white',
        border: 'border-amber-200 dark:border-amber-900',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        description: 'Đóng gói, vận chuyển, setup âm thanh, bàn ghế, quà tặng và kiểm soát danh mục thiết bị mang đi/về.',
        steps: [
            {
                title: 'Giai đoạn Chuẩn bị',
                items: [
                    'Duyệt tab Danh sách thiết bị, chuẩn bị đầy đủ số lượng và tích chọn "Đã đóng gói".',
                    'In ấn Vé / Thẻ trải nghiệm Passport, banner, backdrop, phiếu giảm giá và đóng gói quà tặng.',
                    'Chuẩn bị dây điện kéo dài, ổ cắm đa năng, băng keo cố định dây điện, kéo, kẹp giấy.',
                ],
            },
            {
                title: 'Ngày D-Day',
                items: [
                    'Vận chuyển toàn bộ trang thiết bị đến trường đúng giờ quy định (trước giờ khai mạc 60 - 90 phút).',
                    'Bố trí quầy Check-in & Đổi thưởng tại vị trí thuận tiện nhất cho học sinh.',
                    'Bố trí thảm sa bàn thi đấu phẳng phiu, an toàn, không bị vướng lối đi.',
                    'Hỗ trợ kỹ thuật nhanh khi có trạm gặp sự cố mất điện hoặc trục trặc thiết bị.',
                ],
            },
            {
                title: 'Kết thúc sự kiện',
                items: [
                    'Thu dọn sạch sẽ rác, banner và hiện trường khu vực tổ chức.',
                    'Kiểm kê từng món đồ theo Checklist trong tab Thiết bị và đánh dấu "Đã thu hồi".',
                ],
            },
        ],
    },
    {
        key: 'partner',
        label: 'Đơn vị phối hợp (Trường học)',
        icon: IconSchool,
        color: 'bg-emerald-600 text-white',
        border: 'border-emerald-200 dark:border-emerald-900',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        description: 'Phối hợp địa điểm, âm thanh, bàn ghế và điều phối học sinh theo ca lớp tham gia trật tự.',
        steps: [
            {
                title: 'Trước ngày diễn ra',
                items: [
                    'Chuẩn bị không gian sân trường / nhà đa năng / sảnh sạch sẽ, thoáng mát.',
                    'Bố trí bàn ghế theo sơ đồ (mỗi trạm khoảng 2 - 4 bàn và 15 - 20 ghế ngồi).',
                    'Cung cấp nguồn điện 220V ổn định cho các khu vực trải nghiệm lập trình và sa bàn.',
                    'Thông báo thời gian và phổ biến tinh thần ngày hội đến giáo viên chủ nhiệm các lớp.',
                ],
            },
            {
                title: 'Ngày D-Day',
                items: [
                    'Giáo viên chủ nhiệm dẫn học sinh xếp hàng đến khu vực theo thời khóa biểu ca trải nghiệm.',
                    'Hỗ trợ giữ trật tự, nhắc nhở các em xếp hàng nhận dấu mộc Passport và đổi thưởng văn minh.',
                    'Chụp ảnh lưu niệm của lớp tại khu vực backdrop sự kiện.',
                ],
            },
        ],
    },
];

const D_DAY_TIMELINE = [
    {
        stage: 'D-14 đến D-7',
        title: 'Khảo sát & Lập Kế hoạch',
        color: 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
        tag: 'Chuẩn bị sớm',
        items: [
            'Chốt thời gian, đối tượng tham gia và số lượng học sinh dự kiến với Ban giám hiệu.',
            'Lập sơ đồ phân bổ các trạm STEM trên hệ thống (Lắp ráp, Lập trình, Điều khiển).',
            'Lập bảng dự toán chi phí trong tab Ngân sách.',
        ],
    },
    {
        stage: 'D-6 đến D-2',
        title: 'Chốt Nhân sự & Thiết bị',
        color: 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
        tag: 'Thiết bị & Kịch bản',
        items: [
            'Phân công Trưởng trạm và nhân sự hỗ trợ cho từng trạm trải nghiệm.',
            'Kiểm tra bảo dưỡng toàn bộ mô hình robot, pin sạc, máy tính bảng và sa bàn bạt thi đấu.',
            'In ấn thẻ Passport trải nghiệm, quà tặng lưu niệm và phiếu ưu đãi khóa học.',
        ],
    },
    {
        stage: 'D-1',
        title: 'Đóng gói & Tổng duyệt (Briefing)',
        color: 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
        tag: 'Sẵn sàng 100%',
        items: [
            'Đóng gói thiết bị vào từng thùng phân loại theo tên trạm.',
            'Gửi thông báo Zalo lịch tập trung, địa điểm và trang phục cho toàn bộ nhân sự.',
            'Họp online hoặc trực tiếp 15 phút rà soát lần cuối kịch bản D-Day.',
        ],
    },
    {
        stage: 'D-Day (Ngày diễn ra)',
        title: 'Thực địa & Điều phối Trải nghiệm',
        color: 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
        tag: 'Cao điểm',
        items: [
            'Tập trung trước 60 - 90 phút để setup bàn ghế, banner và test robot.',
            'Phát thẻ Passport cho học sinh khi đến cổng check-in.',
            'Vận hành xoay tua đồng loạt các trạm (15 - 20 phút / lượt).',
            'Đổi quà cho các bạn học sinh sưu tầm đủ con dấu mộc.',
            'Thu hồi thiết bị, kiểm kê và dọn dẹp sạch sẽ hiện trường.',
        ],
    },
    {
        stage: 'D+1',
        title: 'Tổng kết, Đánh giá & Báo cáo',
        color: 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
        tag: 'Hoàn tất',
        items: [
            'Họp Retrospective rút kinh nghiệm và ghi nhận thành tích đội ngũ.',
            'Gửi Album ảnh Drive và thư cảm ơn nhà trường đối tác.',
            'Cập nhật hóa đơn thực tế và hoàn tất quyết toán ngân sách.',
        ],
    },
];

const FAQS = [
    {
        q: 'Khi học sinh tập trung quá đông tại một trạm trải nghiệm thì xử lý thế nào?',
        a: 'Hướng dẫn viên tại trạm phối hợp cùng GVCN chia học sinh thành 2 nhóm: 1 nhóm trực tiếp thao tác trên robot/sa bàn (khoảng 8 - 10 em), nhóm còn lại quan sát và cổ vũ. Sau 7 - 10 phút đổi chỗ luân phiên. Đồng thời điều hướng bớt học sinh sang các trạm đang vắng hơn.',
    },
    {
        q: 'Nếu Robot bị hết pin hoặc hỏng hóc đột xuất giữa giờ thì làm sao?',
        a: 'Mỗi trạm luôn chuẩn bị sẵn tối thiểu 1 - 2 mô hình / pin sạc dự phòng trong thùng thiết bị. Khi phát sinh sự cố, Trưởng trạm đổi ngay sang thiết bị dự phòng trong 30 giây và đưa thiết bị lỗi vào khu vực kỹ thuật phía sau để sửa chữa hoặc sạc bổ sung.',
    },
    {
        q: 'Học sinh làm mất thẻ Passport trải nghiệm hoặc không đủ con dấu mộc có được nhận quà không?',
        a: 'Nếu bé đã tham gia nhưng lỡ mất thẻ, hướng dẫn viên có thể xác nhận bằng cách hỏi nhanh nội dung bé vừa chơi và phát thẻ mới đóng bổ sung dấu. Với các bé chưa đủ 3 dấu, tặng phần quà khích lệ nhỏ (Sticker, kẹo) và động viên bé hoàn thành nốt trạm còn thiếu.',
    },
    {
        q: 'Nhà trường đối tác thay đổi vị trí tổ chức (từ sân trường vào sảnh do trời mưa) thì phản ứng thế nào?',
        a: 'Trưởng ban tổ chức cùng Trưởng hậu cần lập tức khảo sát sảnh mới, bố trí lại các trạm theo dạng thẳng hàng hoặc chữ L khép kín. Ưu tiên đưa trạm Sa bàn xe đua vào góc rộng nhất và bọc dây điện cẩn thận chống trơn trượt.',
    },
    {
        q: 'Làm thế nào để gắn minh chứng hóa đơn vào bảng ngân sách sự kiện?',
        a: 'Trong tab "Ngân sách", bạn bấm nút "+ Gắn minh chứng" ở cột Minh chứng tương ứng với khoản chi đó, sau đó dán link thư mục Google Drive chứa ảnh chụp phiếu thu/biên lai và bấm Lưu. Mọi người trong BTC đều có thể bấm vào để xem hoặc sao chép link.',
    },
];

export default function EventGuideView({ event = {}, users = [], members = [] }) {
    const [subTab, setSubTab] = useState('roles'); // 'roles' | 'timeline' | 'faq' | 'docs'
    const [activeRoleKey, setActiveRoleKey] = useState('lead');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const activeRole = ROLE_GUIDES.find(r => r.key === activeRoleKey) || ROLE_GUIDES[0];

    return (
        <div className="flex flex-col gap-6">
            {/* Header Hero Banner */}
            <div
                className="rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-blue-200/80 dark:border-blue-900/60 shadow-xs"
                style={{
                    background: 'linear-gradient(135deg, rgba(232, 244, 255, 0.9) 0%, rgba(248, 251, 255, 0.95) 60%, rgba(255, 255, 255, 1) 100%)',
                }}
            >
                <div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #0374da 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                            <IconBookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                                Sổ tay Hướng dẫn & Quy trình Điều phối Sự kiện
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                                Cẩm nang chuẩn hóa quy trình tổ chức Ngày hội STEM, phân nhiệm vai trò và sổ tay xử lý tình huống thực địa.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <a
                            href="https://docs.google.com/document/d/138s-w91Sa2DtbatlEJpQH4k9eISLVJHP7qoLl218rrw/edit?tab=t.0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 no-underline"
                        >
                            <IconExternalLink className="w-4 h-4" />
                            <span>Mở Sổ tay Google Docs</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Navigation Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto scrollbar-none">
                <button
                    type="button"
                    onClick={() => setSubTab('roles')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        subTab === 'roles'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}
                >
                    <IconUser className="w-4 h-4" />
                    <span>Quy trình theo Vai trò ({ROLE_GUIDES.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('timeline')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        subTab === 'timeline'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}
                >
                    <IconClock className="w-4 h-4" />
                    <span>Checklist Tiến độ D-Day ({D_DAY_TIMELINE.length} mốc)</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('faq')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        subTab === 'faq'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}
                >
                    <IconAlertTriangle className="w-4 h-4" />
                    <span>Sổ tay Xử lý Sự cố & FAQ ({FAQS.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('docs')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        subTab === 'docs'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}
                >
                    <IconFileText className="w-4 h-4" />
                    <span>Tài liệu Trực tuyến (Docs)</span>
                </button>
            </div>

            {/* TAB 1: Role SOP */}
            {subTab === 'roles' && (
                <div className="flex flex-col gap-5">
                    {/* Role Selector Buttons */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                        {ROLE_GUIDES.map((r) => {
                            const isSelected = activeRoleKey === r.key;
                            const Icon = r.icon;
                            return (
                                <button
                                    key={r.key}
                                    type="button"
                                    onClick={() => setActiveRoleKey(r.key)}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                                        isSelected
                                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                                            : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-gray-400'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                                    <span>{r.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Role Content Card */}
                    <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-xs p-5 sm:p-6 flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${activeRole.badge}`}>
                                    {activeRole.label}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] m-0 leading-relaxed max-w-2xl">
                                {activeRole.description}
                            </p>
                        </div>

                        {/* Stages list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeRole.steps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                            0{idx + 1}
                                        </span>
                                        <h4 className="font-bold text-sm text-[var(--text-primary)]">
                                            {step.title}
                                        </h4>
                                    </div>
                                    <ul className="flex flex-col gap-2 pl-2 m-0 text-xs sm:text-sm text-[var(--text-secondary)] list-none">
                                        {step.items.map((item, itemIdx) => (
                                            <li key={itemIdx} className="flex items-start gap-2 leading-relaxed">
                                                <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                <span className="text-[var(--text-primary)]">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: D-Day Timeline Checklist */}
            {subTab === 'timeline' && (
                <div className="flex flex-col gap-4">
                    {D_DAY_TIMELINE.map((item, idx) => (
                        <div
                            key={idx}
                            className={`p-4 sm:p-5 rounded-2xl border-l-4 bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-xs flex flex-col gap-3 relative transition-all ${item.color.split(' ')[0]}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)]/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                                        {item.stage}
                                    </span>
                                    <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                                        {item.title}
                                    </h4>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] self-start sm:self-auto">
                                    {item.tag}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                {item.items.map((action, aIdx) => (
                                    <div
                                        key={aIdx}
                                        className="p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]/70 text-xs sm:text-sm text-[var(--text-primary)] flex items-start gap-2 leading-relaxed"
                                    >
                                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                            {aIdx + 1}
                                        </span>
                                        <span>{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: FAQs & Troubleshooting */}
            {subTab === 'faq' && (
                <div className="flex flex-col gap-3">
                    {FAQS.map((faq, idx) => {
                        const isOpen = expandedFaq === idx;
                        return (
                            <div
                                key={idx}
                                className={`rounded-2xl border transition-all duration-150 overflow-hidden bg-[var(--bg-primary)] shadow-2xs ${
                                    isOpen
                                        ? 'border-blue-300 dark:border-blue-800 ring-1 ring-blue-500/20'
                                        : 'border-[var(--border-color)] hover:border-gray-400'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                                    className="w-full p-4 sm:p-4.5 text-left flex items-center justify-between gap-3 bg-transparent border-none cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                                            Q{idx + 1}
                                        </span>
                                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] leading-snug">
                                            {faq.q}
                                        </h4>
                                    </div>
                                    <span
                                        className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                                            isOpen ? 'rotate-180 text-blue-600' : ''
                                        }`}
                                    >
                                        ▼
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 sm:px-4.5 sm:pb-4.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)]/60 pt-3 bg-[var(--bg-secondary)]/30">
                                        <div className="flex items-start gap-2.5">
                                            <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <p className="m-0 text-[var(--text-primary)] leading-relaxed font-medium">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 4: Online Handbook (Google Docs Embedded Viewer) */}
            {subTab === 'docs' && (
                <div className="flex flex-col gap-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                <IconFileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                                    Tài liệu Biểu mẫu & Sổ tay Điều phối Trực tuyến
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] m-0">
                                    Nguồn tài liệu chính thức từ Google Docs của AI Robotic
                                </p>
                            </div>
                        </div>
                        <a
                            href="https://docs.google.com/document/d/138s-w91Sa2DtbatlEJpQH4k9eISLVJHP7qoLl218rrw/edit?tab=t.0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 no-underline shrink-0"
                        >
                            <IconExternalLink className="w-4 h-4" />
                            <span>Mở trong Tab Mới</span>
                        </a>
                    </div>

                    <div className="w-full h-[650px] rounded-xl overflow-hidden border border-[var(--border-color)] bg-white">
                        <iframe
                            src="https://docs.google.com/document/d/138s-w91Sa2DtbatlEJpQH4k9eISLVJHP7qoLl218rrw/preview"
                            className="w-full h-full border-none"
                            title="Sổ tay Hướng dẫn Sự kiện AI Robotic"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
