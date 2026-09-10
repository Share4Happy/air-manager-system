export const DEFAULT_EVENT_TEMPLATES = [
    {
        name: 'Cuộc thi AI Robotics Championship',
        code: 'TPL-ROBOTIC-COMPETITION',
        type: 'competition',
        description: 'Mẫu quy trình chuẩn bị và tổ chức giải đấu Robotics cho học sinh trung tâm (VEX, Robofight, WRO...).',
        icon: 'trophy',
        isDefault: true,
        roadmapNodes: [
            // Phase 1
            { id: 'p1', parentId: null, name: '1. Lập kế hoạch & Ban hành điều lệ', description: 'Giai đoạn chuẩn bị khung pháp lý, dự toán kinh phí và cơ cấu giải thưởng.', relativeDaysStart: -45, relativeDaysDue: -30, priority: 'high', order: 1 },
            { id: 'p1-1', parentId: 'p1', name: 'Soạn thảo và phê duyệt Thể lệ thi đấu', description: 'Quy định độ tuổi, kích thước robot, luật đấu và thang điểm.', relativeDaysStart: -45, relativeDaysDue: -38, priority: 'high', order: 2 },
            { id: 'p1-2', parentId: 'p1', name: 'Lập bảng dự toán ngân sách & duyệt chi', description: 'Kinh phí sân bãi, quà tặng, linh kiện, truyền thông.', relativeDaysStart: -40, relativeDaysDue: -35, priority: 'urgent', order: 3 },
            { id: 'p1-3', parentId: 'p1', name: 'Thành lập Ban tổ chức & Phân công nhiệm vụ', description: 'Phân công Trưởng ban, Tổ trọng tài, Tổ kỹ thuật, Tổ hậu cần.', relativeDaysStart: -35, relativeDaysDue: -30, priority: 'medium', order: 4 },

            // Phase 2
            { id: 'p2', parentId: null, name: '2. Truyền thông & Tiếp nhận đăng ký', description: 'Quảng bá giải đấu, mở cổng đăng ký và chốt danh sách đội thi.', relativeDaysStart: -30, relativeDaysDue: -15, priority: 'high', order: 5 },
            { id: 'p2-1', parentId: 'p2', name: 'Thiết kế Poster, Banner & Ấn phẩm truyền thông', description: 'Key visual giải đấu, backdrop sân khấu, standee.', relativeDaysStart: -30, relativeDaysDue: -25, priority: 'medium', order: 6 },
            { id: 'p2-2', parentId: 'p2', name: 'Mở đơn đăng ký & Gửi thông báo đến Phụ huynh', description: 'Gửi tin qua Zalo ZNS, đăng thông báo trên hệ thống.', relativeDaysStart: -25, relativeDaysDue: -18, priority: 'high', order: 7 },
            { id: 'p2-3', parentId: 'p2', name: 'Chốt danh sách, chia bảng đấu & bốc thăm', description: 'Xếp lịch thi đấu, phổ biến quy chế cho các đội.', relativeDaysStart: -18, relativeDaysDue: -15, priority: 'high', order: 8 },

            // Phase 3
            { id: 'p3', parentId: null, name: '3. Cơ sở vật chất & Kỹ thuật sân đấu', description: 'Setup sa bàn, kiểm tra robot, hệ thống âm thanh và phần mềm tính điểm.', relativeDaysStart: -15, relativeDaysDue: -2, priority: 'high', order: 9 },
            { id: 'p3-1', parentId: 'p3', name: 'Lắp ráp sa bàn thi đấu & kiểm tra linh kiện robot', description: 'Kiểm tra độ chính xác kích thước sàn đấu và phụ kiện.', relativeDaysStart: -14, relativeDaysDue: -7, priority: 'urgent', order: 10 },
            { id: 'p3-2', parentId: 'p3', name: 'Cài đặt màn hình LED & Phần mềm tính điểm', description: 'Hệ thống đồng hồ bấm giờ, bảng điểm trực tiếp.', relativeDaysStart: -7, relativeDaysDue: -3, priority: 'medium', order: 11 },
            { id: 'p3-3', parentId: 'p3', name: 'Đặt cúp, huy chương, giấy chứng nhận & quà tặng', description: 'Kiểm tra in ấn tên giải thưởng và logo trung tâm.', relativeDaysStart: -15, relativeDaysDue: -5, priority: 'medium', order: 12 },
            { id: 'p3-4', parentId: 'p3', name: 'Tập dượt thử (Rehearsal) & Họp tổ Trọng tài', description: 'Chạy thử kịch bản, thống nhất tình huống tranh chấp.', relativeDaysStart: -3, relativeDaysDue: -1, priority: 'high', order: 13 },

            // Phase 4
            { id: 'p4', parentId: null, name: '4. Ngày diễn ra Sự kiện (D-Day)', description: 'Vận hành toàn bộ chương trình thi đấu và trao giải.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 14 },
            { id: 'p4-1', parentId: 'p4', name: 'Đón tiếp, điểm danh QR & Phát thẻ thí sinh', description: 'Khu vực check-in tại sảnh chính.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 15 },
            { id: 'p4-2', parentId: 'p4', name: 'Lễ Khai mạc & Giới thiệu Ban giám khảo', description: 'Tuyên bố lý do, phổ biến luật thi đấu.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'high', order: 16 },
            { id: 'p4-3', parentId: 'p4', name: 'Điều phối các vòng thi đấu (Vòng bảng & Chung kết)', description: 'Trọng tài ghi điểm, chụp ảnh từng trận đấu.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 17 },
            { id: 'p4-4', parentId: 'p4', name: 'Lễ Bế mạc, Trao giải & Chụp ảnh lưu niệm', description: 'Trao cúp, huy chương, chứng nhận cho thí sinh.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'high', order: 18 },

            // Phase 5
            { id: 'p5', parentId: null, name: '5. Tổng kết & Đánh giá sau sự kiện', description: 'Hoàn thiện hồ sơ truyền thông, album ảnh và quyết toán tài chính.', relativeDaysStart: 1, relativeDaysDue: 7, priority: 'medium', order: 19 },
            { id: 'p5-1', parentId: 'p5', name: 'Upload toàn bộ Album ảnh lên Google Drive & Chia sẻ', description: 'Gửi link ảnh gốc chất lượng cao cho phụ huynh.', relativeDaysStart: 1, relativeDaysDue: 3, priority: 'high', order: 20 },
            { id: 'p5-2', parentId: 'p5', name: 'Họp rút kinh nghiệm & Viết báo cáo tổng kết', description: 'Đánh giá chỉ số thành công, ghi nhận bài học cải tiến.', relativeDaysStart: 2, relativeDaysDue: 5, priority: 'medium', order: 21 },
            { id: 'p5-3', parentId: 'p5', name: 'Quyết toán chi phí thực tế & Hoàn tất chứng từ', description: 'Đối soát ngân sách dự toán với hóa đơn thực tế.', relativeDaysStart: 3, relativeDaysDue: 7, priority: 'high', order: 22 },
        ],
        budgetItems: [
            { id: 'b1', name: 'Cúp lưu niệm & Huy chương vàng/bạc/đồng', category: 'prizes', defaultEstimatedCost: 2500000, note: 'Bộ 3 cúp + 30 huy chương' },
            { id: 'b2', name: 'In ấn Backdrop, Standee, Băng rôn, Bảng tên', category: 'marketing', defaultEstimatedCost: 1800000, note: 'Khổ 4x2.5m + 2 standee' },
            { id: 'b3', name: 'Vật liệu làm sa bàn & Linh kiện bổ sung', category: 'equipment', defaultEstimatedCost: 1500000, note: 'Tấm foam, phụ kiện, pin robot' },
            { id: 'b4', name: 'Nước uống, Teabreak cho học sinh & phụ huynh', category: 'catering', defaultEstimatedCost: 1200000, note: 'Bánh ngọt, nước suối, trái cây' },
            { id: 'b5', name: 'Bồi dưỡng trọng tài & ban tổ chức', category: 'logistics', defaultEstimatedCost: 2000000, note: 'Phụ cấp ngày diễn ra sự kiện' },
            { id: 'b6', name: 'Dự phòng phát sinh', category: 'other', defaultEstimatedCost: 1000000, note: 'Chi phí đột xuất' },
        ]
    },
    {
        name: 'Workshop Trải nghiệm STEM & Tuyển sinh',
        code: 'TPL-STEM-WORKSHOP',
        type: 'workshop',
        description: 'Mẫu sự kiện trải nghiệm chế tạo robot mở cho học viên mới và phụ huynh quan tâm.',
        icon: 'chalkboard-teacher',
        isDefault: true,
        roadmapNodes: [
            { id: 'ws1', parentId: null, name: '1. Chuẩn bị chủ đề & Giáo án trải nghiệm', description: 'Lựa chọn mô hình lắp ráp robot hấp dẫn, phù hợp 6-14 tuổi.', relativeDaysStart: -20, relativeDaysDue: -12, priority: 'high', order: 1 },
            { id: 'ws1-1', parentId: 'ws1', name: 'Biên soạn slide thuyết trình & Kịch bản workshop', description: 'Slide tương tác, trò chơi khởi động, bài học chế tạo.', relativeDaysStart: -20, relativeDaysDue: -14, priority: 'medium', order: 2 },
            { id: 'ws1-2', parentId: 'ws1', name: 'Chính sách ưu đãi học phí & Quà tặng tuyển sinh', description: 'Voucher giảm giá khóa học khi đăng ký tại chỗ.', relativeDaysStart: -15, relativeDaysDue: -12, priority: 'high', order: 3 },

            { id: 'ws2', parentId: null, name: '2. Truyền thông & Chốt học viên tham dự', description: 'Tuyển sinh học viên trải nghiệm qua kênh Marketing và Phụ huynh giới thiệu.', relativeDaysStart: -14, relativeDaysDue: -3, priority: 'high', order: 4 },
            { id: 'ws2-1', parentId: 'ws2', name: 'Đăng bài truyền thông & Quảng bá workshop', description: 'Kênh Facebook, Zalo OA, phát tờ rơi trường học.', relativeDaysStart: -14, relativeDaysDue: -7, priority: 'medium', order: 5 },
            { id: 'ws2-2', parentId: 'ws2', name: 'Gọi điện xác nhận & Hướng dẫn phụ huynh', description: 'Telesale xác nhận lịch, dặn dò học cụ.', relativeDaysStart: -5, relativeDaysDue: -2, priority: 'urgent', order: 6 },

            { id: 'ws3', parentId: null, name: '3. Setup phòng học & Vận hành Workshop', description: 'Đón tiếp, hướng dẫn học sinh chế tạo và tư vấn khóa học.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 7 },
            { id: 'ws3-1', parentId: 'ws3', name: 'Check-in đón tiếp phụ huynh & học sinh', description: 'Phát tài liệu, hướng dẫn chỗ ngồi.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'high', order: 8 },
            { id: 'ws3-2', parentId: 'ws3', name: 'Giáo viên hướng dẫn chế tạo & Thử nghiệm robot', description: 'Học sinh hoàn thành sản phẩm và thi thử mini.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 9 },
            { id: 'ws3-3', parentId: 'ws3', name: 'Tư vấn lộ trình học & Chốt ghi danh khóa chính', description: 'Đội ngũ tư vấn làm việc trực tiếp với phụ huynh.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 10 },

            { id: 'ws4', parentId: null, name: '4. Chăm sóc sau sự kiện & Thống kê chuyển đổi', description: 'Gửi ảnh, liên hệ chăm sóc học viên chưa chốt và báo cáo.', relativeDaysStart: 1, relativeDaysDue: 5, priority: 'high', order: 11 },
            { id: 'ws4-1', parentId: 'ws4', name: 'Gửi hình ảnh & Video kỷ niệm cho Phụ huynh', description: 'Tạo album Drive và gửi link qua Zalo.', relativeDaysStart: 1, relativeDaysDue: 2, priority: 'high', order: 12 },
            { id: 'ws4-2', parentId: 'ws4', name: 'Báo cáo tỷ lệ chuyển đổi học viên chính thức', description: 'Thống kê số lượng tham gia / số lượng đăng ký khóa học.', relativeDaysStart: 2, relativeDaysDue: 4, priority: 'medium', order: 13 },
        ],
        budgetItems: [
            { id: 'wb1', name: 'Quà tặng lưu niệm cho học sinh (Bút, sổ, móc khóa)', category: 'prizes', defaultEstimatedCost: 800000, note: '30 phần quà nhỏ' },
            { id: 'wb2', name: 'Teabreak nhẹ (Bánh snack, nước trái cây)', category: 'catering', defaultEstimatedCost: 500000, note: 'Phục vụ phụ huynh và bé' },
            { id: 'wb3', name: 'Chi phí in ấn tờ rơi, brochure khóa học', category: 'marketing', defaultEstimatedCost: 600000, note: '50 bộ brochure màu' },
        ]
    },
    {
        name: 'Lễ Tổng kết & Triển lãm E-Portfolio (Showcase)',
        code: 'TPL-SHOWCASE-GRADUATION',
        type: 'showcase',
        description: 'Mẫu sự kiện báo cáo dự án cuối khóa của học viên kết hợp triển lãm sản phẩm công nghệ.',
        icon: 'star',
        isDefault: true,
        roadmapNodes: [
            { id: 'sh1', parentId: null, name: '1. Chuẩn bị dự án & Hướng dẫn thuyết trình', description: 'Học sinh hoàn thiện mô hình robot và slide thuyết trình.', relativeDaysStart: -21, relativeDaysDue: -7, priority: 'high', order: 1 },
            { id: 'sh1-1', parentId: 'sh1', name: 'Duyệt bài thuyết trình và sản phẩm robot của học sinh', description: 'Giáo viên chủ nhiệm hướng dẫn chỉnh sửa.', relativeDaysStart: -21, relativeDaysDue: -10, priority: 'high', order: 2 },
            { id: 'sh1-2', parentId: 'sh1', name: 'In ấn Chứng nhận tốt nghiệp & Huy hiệu E-Portfolio', description: 'Chứng chỉ chuẩn bị cho từng học viên tốt nghiệp.', relativeDaysStart: -12, relativeDaysDue: -5, priority: 'medium', order: 3 },

            { id: 'sh2', parentId: null, name: '2. Gửi thiệp mời & Chuẩn bị sân khấu', description: 'Mời phụ huynh tham dự ngày hội showcase của con.', relativeDaysStart: -10, relativeDaysDue: -1, priority: 'high', order: 4 },
            { id: 'sh2-1', parentId: 'sh2', name: 'Gửi thiệp mời điện tử trang trọng đến Phụ huynh', description: 'Gửi qua hệ thống Zalo ZNS và thông báo lớp.', relativeDaysStart: -10, relativeDaysDue: -4, priority: 'high', order: 5 },
            { id: 'sh2-2', parentId: 'sh2', name: 'Bố trí khu vực triển lãm từng nhóm & Bàn ban giám khảo', description: 'Bảng tên nhóm, poster giới thiệu dự án robot.', relativeDaysStart: -2, relativeDaysDue: -1, priority: 'medium', order: 6 },

            { id: 'sh3', parentId: null, name: '3. Ngày hội Showcase & Trao chứng chỉ', description: 'Học sinh thuyết trình dự án, phụ huynh trải nghiệm và vinh danh.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 7 },
            { id: 'sh3-1', parentId: 'sh3', name: 'Học sinh thuyết trình & Trình diễn robot', description: 'Phụ huynh và ban giám khảo chấm điểm/đặt câu hỏi.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'urgent', order: 8 },
            { id: 'sh3-2', parentId: 'sh3', name: 'Lễ Vinh danh & Trao chứng nhận tốt nghiệp khóa học', description: 'Chụp hình kỷ niệm từng học sinh cùng bố mẹ.', relativeDaysStart: 0, relativeDaysDue: 0, priority: 'high', order: 9 },

            { id: 'sh4', parentId: null, name: '4. Cập nhật E-Portfolio & Lưu trữ', description: 'Đưa sản phẩm và chứng nhận lên hồ sơ điện tử học viên.', relativeDaysStart: 1, relativeDaysDue: 5, priority: 'high', order: 10 },
            { id: 'sh4-1', parentId: 'sh4', name: 'Cập nhật điểm & Hình ảnh vào trang E-Portfolio học sinh', description: 'Hồ sơ năng lực học tập trên hệ thống.', relativeDaysStart: 1, relativeDaysDue: 3, priority: 'high', order: 11 },
            { id: 'sh4-2', parentId: 'sh4', name: 'Gửi link Google Drive hình ảnh buổi lễ cho phụ huynh', description: 'Chia sẻ kỷ niệm đẹp cùng trung tâm.', relativeDaysStart: 1, relativeDaysDue: 3, priority: 'medium', order: 12 },
        ],
        budgetItems: [
            { id: 'sb1', name: 'In chứng nhận, bìa bằng & Huy hiệu danh dự', category: 'prizes', defaultEstimatedCost: 1500000, note: 'Cho 25 học sinh tốt nghiệp' },
            { id: 'sb2', name: 'Backdrop sân khấu & Trang trí sảnh triển lãm', category: 'marketing', defaultEstimatedCost: 1200000, note: 'Khung backdrop chụp ảnh' },
            { id: 'sb3', name: 'Teabreak tiệc ngọt bế giảng', category: 'catering', defaultEstimatedCost: 1000000, note: 'Bánh ngọt, trà đào, hoa quả' },
        ]
    }
];
