'use client';
import React, { useState, useEffect } from 'react';
import {
    IconStation,
    IconRobot,
    IconSchool,
    IconCamera,
    IconUpload,
    IconClose,
    IconUser,
    IconPackage,
    IconLocation,
    IconPlus,
    IconTrash,
} from '@/app/events/ui/icons';
import { EventModal, useEventDialog } from '@/app/events/ui/common';

const categoryOptions = [
    { value: 'assembly', label: 'Trải nghiệm Lắp ráp Robotics' },
    { value: 'coding', label: 'Trải nghiệm Lập trình Điều khiển' },
    { value: 'control', label: 'Trải nghiệm Điều khiển & Sa bàn' },
    { value: 'competition', label: 'Thi đấu & Thử thách Mini' },
    { value: 'reward', label: 'Quầy Đổi thưởng & Check-in Passport' },
    { value: 'showcase', label: 'Trình diễn Demo Robot' },
    { value: 'custom', label: 'Phân khu chuyên đề khác' },
];

export default function AddEditStationModal({
    isOpen,
    onClose,
    onSave,
    station,
    users = [],
    members = [],
    partnerName = 'Địa điểm tổ chức',
    eventId,
}) {
    const dialog = useEventDialog();
    const [formData, setFormData] = useState({
        name: '',
        category: 'assembly',
        location: '',
        lead: '',
        staffList: [],
        inChargeUnits: [
            {
                id: `unit-${Date.now()}-1`,
                name: 'Bên phụ trách (AI ROBOTIC)',
                lead: '',
                equipmentText: '',
                description: '',
            }
        ],
        partnerName: partnerName || '',
        partnerDescription: '',
        studentGroupInfo: '10 - 15 học sinh / lượt',
        photos: [],
        notes: '',
    });

    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        if (station) {
            let initialUnits = [];
            if (station.inChargeUnits && station.inChargeUnits.length > 0) {
                initialUnits = station.inChargeUnits.map((u, idx) => ({
                    id: u.id || `unit-${Date.now()}-${idx}`,
                    name: u.name || `Bên phụ trách ${idx + 1}`,
                    lead: typeof u.lead === 'object' ? u.lead?._id || u.lead?.id || '' : u.lead || '',
                    equipmentText: Array.isArray(u.equipmentList) ? u.equipmentList.join('\n') : (u.equipmentText || ''),
                    description: u.description || '',
                }));
            } else {
                initialUnits = [
                    {
                        id: `unit-${Date.now()}-1`,
                        name: 'Bên phụ trách (AI ROBOTIC)',
                        lead: typeof station.lead === 'object' ? station.lead?._id || station.lead?.id || '' : station.lead || '',
                        equipmentText: (station.equipmentList || []).join('\n'),
                        description: station.centerContent?.description || station.description || '',
                    }
                ];
            }

            setFormData({
                name: station.name || '',
                category: station.category || 'assembly',
                location: station.location || '',
                lead: typeof station.lead === 'object' ? station.lead?._id || station.lead?.id || '' : station.lead || '',
                staffList: (station.staffList || []).map(s => typeof s === 'object' ? s?._id || s?.id : s),
                inChargeUnits: initialUnits,
                partnerName: station.partnerContent?.partnerName || partnerName || '',
                partnerDescription: station.partnerContent?.description || '',
                studentGroupInfo: station.partnerContent?.studentGroupInfo || '10 - 15 học sinh / lượt',
                photos: station.photos || [],
                notes: station.notes || '',
            });
        } else {
            setFormData({
                name: '',
                category: 'assembly',
                location: 'Sân trường',
                lead: '',
                staffList: [],
                inChargeUnits: [
                    {
                        id: `unit-${Date.now()}-1`,
                        name: 'Bên phụ trách (AI ROBOTIC)',
                        lead: '',
                        equipmentText: '',
                        description: '',
                    }
                ],
                partnerName: partnerName || '',
                partnerDescription: 'Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn để tiện cho các bé ổn định và quan sát các bạn khác làm.',
                studentGroupInfo: '10 - 15 học sinh / lượt',
                photos: [],
                notes: '',
            });
        }
    }, [station, partnerName, isOpen]);

    if (!isOpen) return null;

    // Personnel list from event members or users
    const allPersonnel = members.length > 0
        ? members.map(m => ({
            id: String(m.id || m._id),
            name: m.name,
            role: m.role,
        }))
        : users.map(u => ({
            id: String(u._id || u.id),
            name: u.name,
            role: Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự',
        }));

    const handleStaffToggle = (personId) => {
        setFormData(prev => {
            const exists = prev.staffList.includes(personId);
            return {
                ...prev,
                staffList: exists
                    ? prev.staffList.filter(id => id !== personId)
                    : [...prev.staffList, personId],
            };
        });
    };

    const handleAddUnit = () => {
        const nextNum = formData.inChargeUnits.length + 1;
        setFormData(prev => ({
            ...prev,
            inChargeUnits: [
                ...prev.inChargeUnits,
                {
                    id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: `Bên phụ trách ${nextNum}`,
                    lead: '',
                    equipmentText: '',
                    description: '',
                }
            ]
        }));
    };

    const handleRemoveUnit = (idx) => {
        if (formData.inChargeUnits.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            inChargeUnits: prev.inChargeUnits.filter((_, i) => i !== idx),
        }));
    };

    const handleUnitChange = (idx, field, value) => {
        setFormData(prev => ({
            ...prev,
            inChargeUnits: prev.inChargeUnits.map((u, i) => i === idx ? { ...u, [field]: value } : u),
        }));
    };

    const handleAddPhotoFromUrl = () => {
        if (!newPhotoUrl.trim()) return;
        setFormData(prev => ({
            ...prev,
            photos: [
                ...prev.photos,
                {
                    url: newPhotoUrl.trim(),
                    caption: 'Ảnh sa bàn / mô hình',
                },
            ],
        }));
        setNewPhotoUrl('');
    };

    const handleUploadPhotoFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !eventId) return;

        try {
            setUploadingPhoto(true);
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('caption', `Ảnh trạm ${formData.name || 'trải nghiệm'}`);
            uploadFormData.append('tag', 'station');

            const res = await fetch(`/api/events/${eventId}/media`, {
                method: 'POST',
                body: uploadFormData,
            });
            const data = await res.json();
            if (res.ok && data.success && data.media) {
                setFormData(prev => ({
                    ...prev,
                    photos: [
                        ...prev.photos,
                        {
                            fileId: data.media.fileId,
                            url: data.media.url,
                            caption: data.media.caption || file.name,
                        },
                    ],
                }));
                dialog.toast('Đã tải ảnh lên thành công', 'success');
            } else {
                dialog.alert(data.message || 'Lỗi tải ảnh lên Google Drive', { title: 'Lỗi tải ảnh', type: 'danger' });
            }
        } catch (err) {
            console.error('Error uploading photo:', err);
            dialog.alert('Lỗi kết nối khi tải ảnh', { title: 'Lỗi kết nối', type: 'danger' });
        } finally {
            setUploadingPhoto(false);
            e.target.value = '';
        }
    };

    const handleRemovePhoto = (idx) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== idx),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        const inChargeUnits = formData.inChargeUnits.map(u => {
            const eqList = (u.equipmentText || '')
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean);
            const leadObj = allPersonnel.find(p => p.id === u.lead);
            return {
                id: u.id || `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: (u.name || 'Bên phụ trách').trim(),
                lead: u.lead || null,
                leadName: leadObj?.name || '',
                equipmentList: eqList,
                description: (u.description || '').trim(),
            };
        });

        const primaryLead = inChargeUnits[0]?.lead || formData.lead || null;
        const allEquipments = inChargeUnits.flatMap(u => u.equipmentList);

        const stationData = {
            id: station?.id || station?._id || `station-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: formData.name.trim(),
            category: formData.category,
            location: formData.location.trim(),
            lead: primaryLead,
            leadName: allPersonnel.find(p => p.id === primaryLead)?.name || '',
            staffList: formData.staffList,
            equipmentList: allEquipments,
            inChargeUnits: inChargeUnits,
            centerContent: {
                title: formData.name.trim(),
                description: inChargeUnits[0]?.description || '',
            },
            partnerContent: {
                partnerName: formData.partnerName.trim(),
                description: formData.partnerDescription.trim(),
                studentGroupInfo: formData.studentGroupInfo.trim(),
            },
            photos: formData.photos,
            notes: formData.notes.trim(),
        };

        onSave(stationData);
    };

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title={station ? 'Chỉnh sửa Phân khu / Trạm' : 'Thêm Phân khu / Trạm Trải nghiệm'}
            subtitle="Thiết lập nội dung bên phụ trách và phần việc phối hợp của đơn vị liên kết"
            icon={IconStation}
            maxWidth="max-w-3xl"
            onSubmit={handleSubmit}
            submitLabel={station ? 'Lưu thay đổi' : 'Tạo Trạm Mới'}
            cancelLabel="Hủy"
        >
            <div className="flex flex-col gap-4 text-xs sm:text-sm">
                {/* 1. Basic Info & Personnel Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Thông tin phân khu & Nhân sự điều phối
                    </span>

                    <div>
                        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                            Tên Trạm / Phân khu <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ví dụ: Khu vực 1: Trải nghiệm lắp ráp Robot..."
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                Phân loại trải nghiệm
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                            >
                                {categoryOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                <IconLocation className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <span>Vị trí bố trí (Tại trường / Sảnh)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ví dụ: Bàn 1-4 Sân trường, Sảnh A, Phòng Lab..."
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[var(--border-color)]/60">
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                <IconUser className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <span>Trưởng trạm phụ trách chính (Lead)</span>
                            </label>
                            <select
                                value={formData.lead}
                                onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                            >
                                <option value="">-- Chưa chỉ định --</option>
                                {allPersonnel.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.role ? `(${u.role})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                Nhân sự hỗ trợ ({formData.staffList.length} người)
                            </label>
                            <div className="max-h-24 overflow-y-auto p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-wrap gap-1.5">
                                {allPersonnel.length === 0 ? (
                                    <span className="text-xs text-[var(--text-secondary)] italic">Chưa có nhân sự</span>
                                ) : (
                                    allPersonnel.map((u) => {
                                        const isSelected = formData.staffList.includes(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => handleStaffToggle(u.id)}
                                                className={`px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-gray-400'
                                                }`}
                                            >
                                                {u.name}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Card: Bên phụ trách (Hỗ trợ nhiều bên phụ trách) */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 flex flex-col gap-3.5">
                    {/* Header of Section */}
                    <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-900/60 pb-2.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                            <IconRobot className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-xs sm:text-sm font-bold">Bên phụ trách</span>
                                <span className="text-[10px] text-blue-600/80 dark:text-blue-300/80 font-normal">
                                    {formData.inChargeUnits.length} bên / bộ phận tham gia điều phối trạm
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddUnit}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Thêm một bên phụ trách khác cho trạm này"
                        >
                            <IconPlus className="w-3.5 h-3.5" />
                            <span>Thêm bên phụ trách</span>
                        </button>
                    </div>

                    {/* List of In-charge Unit Cards */}
                    <div className="flex flex-col gap-3.5">
                        {formData.inChargeUnits.map((unit, uIdx) => (
                            <div
                                key={unit.id || uIdx}
                                className="p-3.5 rounded-xl border border-blue-200/90 dark:border-blue-800/60 bg-[var(--bg-primary)] shadow-2xs flex flex-col gap-3 relative transition-all"
                            >
                                {/* Unit Header */}
                                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)]/60 pb-2 flex-wrap">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-bold shrink-0">
                                            Card #{uIdx + 1}
                                        </span>
                                        <input
                                            type="text"
                                            value={unit.name}
                                            onChange={(e) => handleUnitChange(uIdx, 'name', e.target.value)}
                                            placeholder="Tên bên phụ trách (VD: AI ROBOTIC, Ban Kỹ thuật...)"
                                            className="w-full max-w-xs px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 text-xs sm:text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-[var(--bg-primary)]"
                                        />
                                    </div>
                                    {formData.inChargeUnits.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUnit(uIdx)}
                                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                            title="Xóa bên phụ trách này"
                                        >
                                            <IconTrash className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Row 1: Person in charge for this Unit */}
                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                        <IconUser className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Người chịu trách nhiệm</span>
                                    </label>
                                    <select
                                        value={unit.lead || ''}
                                        onChange={(e) => handleUnitChange(uIdx, 'lead', e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="">-- Chưa chỉ định người chịu trách nhiệm --</option>
                                        {allPersonnel.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} {u.role ? `(${u.role})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Row 2: Equipment */}
                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 mb-1">
                                        <IconPackage className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                        <span>Mô hình Robot & Thiết bị mang theo (Mỗi dòng 1 món)</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={unit.equipmentText}
                                        onChange={(e) => handleUnitChange(uIdx, 'equipmentText', e.target.value)}
                                        placeholder="Ví dụ:&#10;4x Mô hình Robot Cú Mèo&#10;4x Máy tính bảng nạp code"
                                        className="w-full px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none"
                                    />
                                </div>

                                {/* Row 3: Teaching Content & Script */}
                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        Nội dung giảng dạy, hướng dẫn & Kịch bản
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={unit.description}
                                        onChange={(e) => handleUnitChange(uIdx, 'description', e.target.value)}
                                        placeholder="Chi tiết nội dung học sinh được trải nghiệm, luật chơi, cách hướng dẫn tại trạm..."
                                        className="w-full px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Card: Đơn vị phối hợp (Trường học) */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold border-b border-emerald-200 dark:border-emerald-900/60 pb-2">
                        <IconSchool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold">Đơn vị phối hợp (Trường học)</span>
                            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-300/80 font-normal">Điều phối học sinh & CSVC</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                Tên trường / Đơn vị phối hợp
                            </label>
                            <input
                                type="text"
                                value={formData.partnerName}
                                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                                placeholder={partnerName || "Tên trường / Đơn vị..."}
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                Quy mô học sinh / lượt
                            </label>
                            <input
                                type="text"
                                value={formData.studentGroupInfo}
                                onChange={(e) => setFormData({ ...formData, studentGroupInfo: e.target.value })}
                                placeholder="Ví dụ: 10 - 15 học sinh / lượt"
                                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                            Yêu cầu điều phối từ nhà trường
                        </label>
                        <textarea
                            rows={3}
                            value={formData.partnerDescription}
                            onChange={(e) => setFormData({ ...formData, partnerDescription: e.target.value })}
                            placeholder="Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn để ổn định..."
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed resize-none"
                        />
                    </div>
                </div>

                {/* 3. Photos Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                            <IconCamera className="w-3.5 h-3.5" />
                            <span>Hình ảnh Sa bàn & Minh họa ({formData.photos.length})</span>
                        </span>
                        {eventId && (
                            <label className="px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
                                <IconUpload className="w-3.5 h-3.5" />
                                <span>{uploadingPhoto ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUploadPhotoFile}
                                    disabled={uploadingPhoto}
                                />
                            </label>
                        )}
                    </div>

                    {/* Add via URL */}
                    <div className="flex items-center gap-2">
                        <input
                            type="url"
                            value={newPhotoUrl}
                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                            placeholder="Hoặc dán link ảnh trực tiếp (https://...)"
                            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={handleAddPhotoFromUrl}
                            className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] font-semibold cursor-pointer text-xs transition-colors shrink-0"
                        >
                            Thêm URL
                        </button>
                    </div>

                    {/* Photo list */}
                    {formData.photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                            {formData.photos.map((p, idx) => {
                                const imgSrc = p.url || (p.fileId ? `https://lh3.googleusercontent.com/d/${p.fileId}` : '');
                                return (
                                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-primary)] aspect-video shadow-xs">
                                        <img
                                            src={imgSrc}
                                            alt={p.caption || 'Minh họa'}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhoto(idx)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer text-xs"
                                        >
                                            <IconClose className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </EventModal>
    );
}
