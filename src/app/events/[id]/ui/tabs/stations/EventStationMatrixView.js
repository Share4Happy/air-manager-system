'use client';
import React, { useState } from 'react';
import AddEditStationModal from './AddEditStationModal';
import ScenarioMatrixTable from './ScenarioMatrixTable';
import { useEventDialog } from '@/app/events/ui/common';
import {
    IconStation,
    IconZap,
    IconPlus,
} from '@/app/events/ui/icons';

export default function EventStationMatrixView({
    event,
    stations = [],
    users = [],
    members = [],
    onUpdateStations,
    readOnly = false,
}) {
    const dialog = useEventDialog();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(null);

    const partnerName = event?.location || event?.targetAudience || 'Địa điểm tổ chức';

    const handleOpenAdd = () => {
        setEditingStation(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (station, index) => {
        setEditingStation({ ...station, _editIndex: index });
        setIsModalOpen(true);
    };

    const handleSaveStation = (stationData) => {
        let updated;
        if (editingStation) {
            const editIdx = typeof editingStation._editIndex === 'number' ? editingStation._editIndex : -1;
            const targetId = editingStation.id || editingStation._id;
            
            let foundIdx = editIdx;
            if (foundIdx === -1 || !stations[foundIdx]) {
                foundIdx = stations.findIndex((s, idx) => (targetId && (s.id === targetId || s._id === targetId)) || s === editingStation);
            }

            if (foundIdx !== -1) {
                updated = [...stations];
                updated[foundIdx] = {
                    ...stations[foundIdx],
                    ...stationData,
                    id: stations[foundIdx].id || targetId || `station-${Date.now()}`,
                };
            } else {
                updated = [...stations, { ...stationData, id: targetId || `station-${Date.now()}` }];
            }
        } else {
            const newId = `station-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            updated = [...stations, { ...stationData, id: newId, order: stations.length + 1 }];
        }
        onUpdateStations(updated);
        setIsModalOpen(false);
        setEditingStation(null);
        dialog.toast(editingStation ? 'Đã cập nhật phân khu / trạm' : 'Đã thêm phân khu / trạm mới', 'success');
    };

    const handleDeleteStation = async (stationId, stationIndex) => {
        const ok = await dialog.confirm('Bạn có chắc chắn muốn xóa phân khu / trạm này?', {
            title: 'Xóa phân khu / trạm',
            type: 'danger',
            confirmText: 'Xóa trạm',
        });
        if (!ok) return;
        const updated = stations.filter((s, idx) => {
            if (typeof stationIndex === 'number' && idx === stationIndex) return false;
            if (stationId && (s.id === stationId || s._id === stationId)) return false;
            return true;
        });
        onUpdateStations(updated);
        dialog.toast('Đã xóa phân khu / trạm', 'info');
    };

    // Apply Standard 3-Station STEM Day Template
    const handleApplySTEMTemplate = async () => {
        if (stations.length > 0) {
            const ok = await dialog.confirm('Thao tác này sẽ nạp mẫu kịch bản 3 trạm chuẩn (Lắp ráp, Lập trình, Điều khiển sa bàn). Tiếp tục?', {
                title: 'Nạp mẫu kịch bản 3 trạm chuẩn',
                type: 'warning',
                confirmText: 'Nạp kịch bản',
            });
            if (!ok) return;
        }

        const now = Date.now();
        const rand = () => Math.random().toString(36).slice(2, 6);

        const templateStations = [
            {
                id: `station-prep-${now}-${rand()}`,
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
                inChargeUnits: [
                    {
                        id: `unit-prep-1-${now}-${rand()}`,
                        name: 'Bên phụ trách (AI ROBOTIC)',
                        lead: null,
                        equipmentList: [
                            'Vé / Thẻ trải nghiệm 3 khu vực',
                            'Con dấu mộc tròn 3 trạm',
                            'Bánh kẹo, sticker quà tặng',
                            'Phiếu giảm giá khóa học AI Robotic',
                        ],
                        description: 'Phát vé trải nghiệm cho học sinh. Các bạn tham gia các khu vực để lấy con dấu. Bạn nào tham gia đủ các khu vực sẽ được nhận 1 phần quà ngẫu nhiên (Phiếu giảm giá khóa học AI Robotic, bánh kẹo, quà lưu niệm, sticker...).',
                    }
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
                id: `station-assembly-${now + 1}-${rand()}`,
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
                inChargeUnits: [
                    {
                        id: `unit-assembly-1-${now + 1}-${rand()}`,
                        name: 'Bên phụ trách (AI ROBOTIC)',
                        lead: null,
                        equipmentList: [
                            '4 Mô hình Robot Cú mèo',
                            '4 Mô hình Robot Chó',
                            'Hộp phân loại linh kiện',
                            'Sách hướng dẫn lắp ráp trực quan',
                        ],
                        description: '4 Mô hình dự kiến lắp ráp: Robot cú mèo, Robot chó. Học sinh được chia theo nhóm để trải nghiệm. Sau khi hoàn thành sẽ được hướng dẫn tháo mô hình cho lượt kế tiếp.',
                    }
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
                id: `station-coding-${now + 2}-${rand()}`,
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
                inChargeUnits: [
                    {
                        id: `unit-coding-1-${now + 2}-${rand()}`,
                        name: 'Bên phụ trách (AI ROBOTIC)',
                        lead: null,
                        equipmentList: [
                            '4 Mô hình Smart Fan (Cột xoay gió)',
                            '4 Mô hình Smart Lamp (Đèn thông minh)',
                            '4 Máy tính bảng nạp code Scratch/Blockly',
                        ],
                        description: 'Khi các bạn học sinh tới khu vực trải nghiệm, hướng dẫn viên giới thiệu đôi nét về các mô hình sẽ được lập trình và cách thức thực hiện. 4 Mô hình dự kiến: Smart Fan, Smart Lamp.',
                    }
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
                id: `station-control-${now + 3}-${rand()}`,
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
                inChargeUnits: [
                    {
                        id: `unit-control-1-${now + 3}-${rand()}`,
                        name: 'Bên phụ trách (AI ROBOTIC)',
                        lead: null,
                        equipmentList: [
                            '1 Sa bàn bạt thi đấu Mini Robotics Challenge',
                            '4 Xe Robot đua điều khiển tay cầm',
                            'Đồng hồ bấm giờ điện tử & Bảng điểm',
                        ],
                        description: 'Các đội tham gia điều khiển robot vượt thử thách trên sa bàn. Có tiêu chí chấm điểm rõ ràng: Hoàn thành nhiệm vụ, Thời gian, Độ chính xác. Tạo không khí sôi nổi.',
                    }
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
            {/* Action Toolbar */}
            {!readOnly && (
                <div className="flex items-center justify-end gap-2 bg-[var(--bg-primary)] p-3 sm:p-3.5 rounded-2xl border border-[var(--border-color)] shadow-xs">
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
            )}

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
                            {readOnly ? 'Chưa có thông tin phân khu trạm trải nghiệm trong sự kiện này.' : 'Hãy nạp mẫu chuẩn ngày hội STEM (3 trạm) hoặc thêm trạm mới để thiết lập kịch bản.'}
                        </p>
                    </div>
                    {!readOnly && (
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
                    )}
                </div>
            )}

            {/* Scenario Matrix Table */}
            {stations.length > 0 && (
                <ScenarioMatrixTable
                    event={event}
                    stations={stations}
                    users={users}
                    members={members}
                    partnerName={partnerName}
                    onOpenEditStation={(!readOnly && onUpdateStations) ? handleOpenEdit : null}
                    onDeleteStation={(!readOnly && onUpdateStations) ? handleDeleteStation : null}
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
