'use client';
import React, { useState } from 'react';
import AddEditStationModal from './AddEditStationModal';
import ScenarioMatrixTable, { getCategoryMeta } from './ScenarioMatrixTable';
import EventToolbar from '@/app/events/ui/common/EventToolbar';
import {
    IconStation,
    IconGrid,
    IconTable,
    IconZap,
    IconPlus,
    IconEdit,
    IconUser,
    IconUsers,
    IconLocation,
    IconRobot,
    IconSchool,
    IconChevronLeft,
    IconChevronRight,
    IconClose,
} from '@/app/events/ui/icons';

export default function EventStationMatrixView({
    event,
    stations = [],
    users = [],
    members = [],
    onUpdateStations,
}) {
    const [subView, setSubView] = useState('cards'); // 'cards' | 'table'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(null);

    const partnerName = event?.location || event?.targetAudience || 'Địa điểm tổ chức';

    const getPersonInfo = (personId) => {
        if (!personId) return null;
        const idStr = typeof personId === 'object' ? String(personId?._id || personId?.id) : String(personId);
        const u = users.find((usr) => String(usr._id) === idStr);
        if (u) return { name: u.name, role: Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự', type: 'user' };
        const m = members.find((mem) => String(mem.id) === idStr || String(mem._id) === idStr);
        if (m) return { name: m.name, role: m.role || 'Thành viên ngoài', type: 'member', org: m.organization };
        return null;
    };

    const handleOpenAdd = () => {
        setEditingStation(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (station) => {
        setEditingStation(station);
        setIsModalOpen(true);
    };

    const handleSaveStation = (stationData) => {
        let updated;
        if (editingStation) {
            updated = stations.map((s) => (s.id === editingStation.id ? { ...stationData, order: s.order } : s));
        } else {
            updated = [...stations, { ...stationData, order: stations.length + 1 }];
        }
        onUpdateStations(updated);
        setIsModalOpen(false);
        setEditingStation(null);
    };

    const handleDeleteStation = (stationId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phân khu / trạm này?')) return;
        const updated = stations.filter((s) => s.id !== stationId);
        onUpdateStations(updated);
    };

    const handleMoveStation = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= stations.length) return;
        const copy = [...stations];
        const temp = copy[index];
        copy[index] = copy[targetIndex];
        copy[targetIndex] = temp;
        copy.forEach((s, idx) => {
            s.order = idx + 1;
        });
        onUpdateStations(copy);
    };

    // Apply Standard 3-Station STEM Day Template
    const handleApplySTEMTemplate = () => {
        if (stations.length > 0 && !confirm('Thao tác này sẽ nạp mẫu kịch bản 3 trạm chuẩn (Lắp ráp, Lập trình, Điều khiển sa bàn). Tiếp tục?')) {
            return;
        }

        const templateStations = [
            {
                id: `station-prep-${Date.now()}`,
                order: 1,
                name: 'Khu vực Check-in & Chuẩn bị',
                category: 'reward',
                location: 'Cổng vào & Quầy trung tâm',
                lead: null,
                staffList: [],
                equipmentList: [
                    'Vé / Thẻ trải nghiệm 3 khu vực',
                    'Con dấu mộc tròn 3 trạm',
                    'Bánh kẹo, sticker quà tặng',
                    'Phiếu giảm giá khóa học AI Robotic',
                ],
                centerContent: {
                    title: 'Vé trải nghiệm 3 khu vực & Đổi thưởng',
                    description: 'Phát vé trải nghiệm cho học sinh. Các bạn tham gia các khu vực để lấy con dấu. Bạn nào tham gia đủ các khu vực sẽ được nhận 1 phần quà ngẫu nhiên (Phiếu giảm giá khóa học AI Robotic, bánh kẹo, quà lưu niệm, sticker...).',
                    models: ['Thẻ Trải nghiệm', 'Con dấu 3 trạm', 'Hộp quà may mắn'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Chuẩn bị khu vực sân trường, không gian trải nghiệm, hỗ trợ bàn ghế quầy lễ tân.',
                    studentGroupInfo: 'Toàn bộ học sinh',
                },
                photos: [],
                notes: 'Điểm bắt đầu và kết thúc nhận quà của học sinh.',
            },
            {
                id: `station-assembly-${Date.now() + 1}`,
                order: 2,
                name: 'Khu vực 1: Trải nghiệm Lắp ráp',
                category: 'assembly',
                location: 'Bàn 1-4 Sân trường',
                lead: null,
                staffList: [],
                equipmentList: [
                    '4 Mô hình Robot Cú mèo',
                    '4 Mô hình Robot Chó',
                    'Hộp phân loại linh kiện',
                    'Sách hướng dẫn lắp ráp trực quan',
                ],
                centerContent: {
                    title: 'Lắp ráp Robot Cú mèo & Robot Chó',
                    description: '4 Mô hình dự kiến lắp ráp: Robot cú mèo, Robot chó. Học sinh được chia theo nhóm để trải nghiệm. Sau khi hoàn thành sẽ được hướng dẫn tháo mô hình cho lượt kế tiếp.',
                    models: ['Robot Cú Mèo', 'Robot Chó Thông Minh'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn để tiện cho các bé ổn định và quan sát các bạn khác làm.',
                    studentGroupInfo: '10 - 15 học sinh / nhóm',
                },
                photos: [],
                notes: 'Thời gian mỗi lượt: 15 - 20 phút.',
            },
            {
                id: `station-coding-${Date.now() + 2}`,
                order: 3,
                name: 'Khu vực 2: Trải nghiệm Lập trình',
                category: 'coding',
                location: 'Bàn 5-8 Sân trường / Sảnh',
                lead: null,
                staffList: [],
                equipmentList: [
                    '4 Mô hình Smart Fan (Cột xoay gió)',
                    '4 Mô hình Smart Lamp (Đèn thông minh)',
                    '4 Máy tính bảng nạp code Scratch/Blockly',
                ],
                centerContent: {
                    title: 'Lập trình Smart Fan & Smart Lamp',
                    description: 'Khi các bạn học sinh tới khu vực trải nghiệm, hướng dẫn viên giới thiệu đôi nét về các mô hình sẽ được lập trình và cách thức thực hiện. 4 Mô hình dự kiến: Smart Fan, Smart Lamp.',
                    models: ['Smart Fan (Quạt gió)', 'Smart Lamp (Đèn RGB cảm biến)'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn để tiện ổn định và quan sát. Hỗ trợ ổ cắm nguồn điện.',
                    studentGroupInfo: '10 - 15 học sinh / nhóm',
                },
                photos: [],
                notes: 'Thời gian mỗi lượt: 15 - 20 phút.',
            },
            {
                id: `station-control-${Date.now() + 3}`,
                order: 4,
                name: 'Khu vực 3: Trải nghiệm Điều khiển & Sa bàn',
                category: 'control',
                location: 'Khu vực Thảm Sa bàn lớn ngoài trời',
                lead: null,
                staffList: [],
                equipmentList: [
                    '1 Sa bàn bạt thi đấu Mini Robotics Challenge',
                    '4 Xe Robot đua điều khiển tay cầm',
                    'Đồng hồ bấm giờ điện tử & Bảng điểm',
                ],
                centerContent: {
                    title: 'Mini Robotics Challenge - Thi đấu ngoài trời & Điều khiển xe',
                    description: 'Các đội tham gia điều khiển robot vượt thử thách trên sa bàn. Có tiêu chí chấm điểm rõ ràng: Hoàn thành nhiệm vụ, Thời gian, Độ chính xác. Tạo không khí sôi nổi.',
                    models: ['Xe Đua Vượt Chướng Ngại Vật', 'Sa Bàn Thi Đấu'],
                },
                partnerContent: {
                    partnerName: partnerName,
                    description: 'Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn. Bố trí không gian rộng rãi.',
                    studentGroupInfo: '10 - 15 học sinh / nhóm',
                },
                photos: [],
                notes: 'Tạo không khí cổ vũ sôi động.',
            },
        ];

        onUpdateStations(templateStations);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Unified 1-Row Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs">
                {/* Left: View Mode Toggle */}
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setSubView('cards')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            subView === 'cards'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconGrid className="w-3.5 h-3.5" />
                        <span>Dạng Thẻ</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSubView('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                            subView === 'table'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <IconTable className="w-3.5 h-3.5" />
                        <span>Bảng Ma trận Kịch bản</span>
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleApplySTEMTemplate}
                        className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Tạo nhanh kịch bản 3 trạm chuẩn"
                    >
                        <IconZap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Nạp Mẫu 3 Trạm</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                        <IconPlus className="w-3.5 h-3.5" />
                        <span>Thêm Trạm</span>
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {stations.length === 0 && (
                <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                        <IconStation className="w-7 h-7" />
                    </div>
                    <div className="max-w-md flex flex-col gap-1.5">
                        <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                            Chưa có phân khu / trạm trải nghiệm nào
                        </h4>
                        <p className="text-sm sm:text-base text-[var(--text-secondary)]">
                            Hãy nạp mẫu chuẩn ngày hội STEM (3 trạm) hoặc thêm trạm mới để thiết lập kịch bản.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleApplySTEMTemplate}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm sm:text-base font-semibold border-none cursor-pointer shadow-xs flex items-center gap-2"
                        >
                            <IconZap className="w-4 h-4" />
                            Nạp Mẫu Ngày hội STEM (3 Trạm)
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm sm:text-base font-semibold cursor-pointer flex items-center gap-2"
                        >
                            <IconPlus className="w-4 h-4" />
                            Thêm Trạm Thủ Công
                        </button>
                    </div>
                </div>
            )}

            {/* Sub-view 1: Card Grid View with Perfect Horizontal Alignment */}
            {subView === 'cards' && stations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
                    {stations.map((st, idx) => {
                        const leadInfo = getPersonInfo(st.lead);
                        const staffInfos = (st.staffList || []).map(getPersonInfo).filter(Boolean);
                        const meta = getCategoryMeta(st.category);

                        return (
                            <div
                                key={st.id || idx}
                                className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${meta.accentBorder}`}
                            >
                                <div className="flex flex-col flex-1">
                                    {/* 1. Station Header - Fixed Height */}
                                    <div className={`p-4 ${meta.headerBg} border-b border-[var(--border-color)] min-h-[84px] flex items-start justify-between gap-2.5`}>
                                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                            <span className={`px-2.5 py-1 rounded-lg ${meta.stationNum} font-bold text-xs sm:text-sm shrink-0 shadow-xs mt-0.5`}>
                                                0{idx + 1}
                                            </span>
                                            <div className="min-w-0 flex flex-col gap-1 flex-1">
                                                <h4 className="font-bold text-base sm:text-lg text-[var(--text-primary)] leading-snug line-clamp-2" title={st.name}>
                                                    {st.name}
                                                </h4>
                                                <div>
                                                    <span className={`px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-semibold border ${meta.badge}`}>
                                                        {meta.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(st)}
                                                className="w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-blue-600 hover:bg-[var(--bg-primary)] flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
                                                title="Sửa trạm"
                                            >
                                                <IconEdit className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteStation(st.id)}
                                                className="w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-rose-600 hover:bg-[var(--bg-primary)] flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
                                                title="Xóa trạm"
                                            >
                                                <IconClose className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Station Content Body */}
                                    <div className="p-4 flex flex-col gap-4 text-sm sm:text-base flex-1">
                                        {/* 2. Personnel & Location Box */}
                                        <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] min-h-[96px] flex flex-col justify-center gap-2 text-sm sm:text-base">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-medium text-xs sm:text-sm">
                                                    <IconUser className="w-4 h-4 text-blue-600 shrink-0" /> Phụ trách:
                                                </span>
                                                <span className="font-bold text-[var(--text-primary)] truncate max-w-[150px] text-sm sm:text-base">
                                                    {leadInfo ? leadInfo.name : <span className="text-[var(--text-secondary)] italic font-normal text-xs sm:text-sm">Chưa gán</span>}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-medium text-xs sm:text-sm">
                                                    <IconUsers className="w-4 h-4 text-purple-600 shrink-0" /> Hỗ trợ:
                                                </span>
                                                <span className="font-semibold text-[var(--text-primary)] truncate max-w-[150px] text-xs sm:text-sm" title={staffInfos.length > 0 ? staffInfos.map((s) => s.name).join(', ') : 'Theo phân bổ chung'}>
                                                    {staffInfos.length > 0 ? staffInfos.map((s) => s.name).join(', ') : <span className="text-[var(--text-secondary)] italic font-normal">Chung</span>}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-medium text-xs sm:text-sm">
                                                    <IconLocation className="w-4 h-4 text-rose-600 shrink-0" /> Vị trí:
                                                </span>
                                                <span className="font-semibold text-[var(--text-primary)] truncate max-w-[150px] text-xs sm:text-sm">
                                                    {st.location || 'Sân trường'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 3. Equipment & Models Box */}
                                        <div className="min-h-[86px] flex flex-col justify-start gap-1.5">
                                            <span className="text-xs sm:text-sm uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                                <IconRobot className="w-4 h-4" /> Mô hình & Thiết bị ({(st.equipmentList || []).length})
                                            </span>
                                            <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-hidden">
                                                {(st.equipmentList || []).length > 0 ? (
                                                    st.equipmentList.map((eq, i) => (
                                                        <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 font-semibold truncate max-w-[200px]" title={eq}>
                                                            {eq}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs sm:text-sm text-[var(--text-secondary)] italic py-1">Chưa liệt kê thiết bị riêng</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 4. Dual Responsibilities */}
                                        <div className="flex flex-col gap-3 pt-1 text-sm sm:text-base flex-1">
                                            {/* AIR Side */}
                                            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-900/60 min-h-[150px] flex flex-col justify-start gap-2 overflow-hidden">
                                                <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 text-sm sm:text-base shrink-0">
                                                    <IconRobot className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Phía AIR Phụ trách
                                                </div>
                                                <p className="text-[var(--text-primary)] dark:text-slate-200 leading-relaxed text-sm sm:text-base line-clamp-5 overflow-y-auto">
                                                    {st.centerContent?.description || 'Chưa thiết lập nội dung hướng dẫn.'}
                                                </p>
                                            </div>

                                            {/* School Side */}
                                            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-900/60 min-h-[150px] flex flex-col justify-start gap-2 overflow-hidden">
                                                <div className="font-bold text-emerald-700 dark:text-emerald-300 flex flex-col gap-1.5 text-sm sm:text-base shrink-0">
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <IconSchool className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> {partnerName || st.partnerContent?.partnerName || 'Địa điểm tổ chức'}
                                                    </span>
                                                    {st.partnerContent?.studentGroupInfo && (
                                                        <span className="text-xs sm:text-sm font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 self-start inline-block">
                                                            Quy mô: {st.partnerContent.studentGroupInfo}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[var(--text-primary)] dark:text-slate-200 leading-relaxed text-sm sm:text-base line-clamp-5 overflow-y-auto">
                                                    {st.partnerContent?.description || 'Hỗ trợ điều phối học sinh, sắp xếp không gian.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 6. Card Footer - Fixed Height */}
                                <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] h-12 flex items-center justify-between text-sm sm:text-base text-[var(--text-secondary)]">
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={idx === 0}
                                            onClick={() => handleMoveStation(idx, -1)}
                                            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer border-none bg-transparent"
                                            title="Di chuyển sang trái"
                                        >
                                            <IconChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={idx === stations.length - 1}
                                            onClick={() => handleMoveStation(idx, 1)}
                                            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer border-none bg-transparent"
                                            title="Di chuyển sang phải"
                                        >
                                            <IconChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold">
                                        Trạm {idx + 1}/{stations.length}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Sub-view 2: Highly Distinct & Professional Matrix Table */}
            {subView === 'table' && stations.length > 0 && (
                <ScenarioMatrixTable
                    event={event}
                    stations={stations}
                    users={users}
                    members={members}
                    partnerName={partnerName}
                    onOpenEditStation={handleOpenEdit}
                    onDeleteStation={handleDeleteStation}
                    onPreviewPhoto={setPreviewPhoto}
                />
            )}

            {/* Modal: Add/Edit Station */}
            <AddEditStationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveStation}
                station={editingStation}
                users={users}
                members={members}
                partnerName={partnerName}
                eventId={event?._id}
            />

            {/* Modal: Photo Zoom Preview */}
            {previewPhoto && (
                <div
                    onClick={() => setPreviewPhoto(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150"
                >
                    <div className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-3 bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] shadow-2xl">
                        <img
                            src={previewPhoto.src}
                            alt={previewPhoto.caption || 'Xem ảnh'}
                            className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                        />
                        {previewPhoto.caption && (
                            <p className="text-sm sm:text-base font-semibold text-[var(--text-primary)] text-center">
                                {previewPhoto.caption}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => setPreviewPhoto(null)}
                            className="px-5 py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm sm:text-base font-semibold border border-[var(--border-color)] cursor-pointer"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
