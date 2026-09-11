'use client';
import React, { useState, useEffect } from 'react';
import {
    IconStation,
    IconRobot,
    IconSchool,
    IconCamera,
    IconUpload,
    IconClose,
} from '@/app/events/ui/icons';
import { EventModal } from '@/app/events/ui/common';

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
    const [formData, setFormData] = useState({
        name: '',
        category: 'assembly',
        location: '',
        lead: '',
        staffList: [],
        equipmentText: '',
        centerTitle: '',
        centerDescription: '',
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
            setFormData({
                name: station.name || '',
                category: station.category || 'assembly',
                location: station.location || '',
                lead: typeof station.lead === 'object' ? station.lead?._id || station.lead?.id || '' : station.lead || '',
                staffList: (station.staffList || []).map(s => typeof s === 'object' ? s?._id || s?.id : s),
                equipmentText: (station.equipmentList || []).join('\n'),
                centerTitle: station.centerContent?.title || '',
                centerDescription: station.centerContent?.description || '',
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
                equipmentText: '',
                centerTitle: '',
                centerDescription: '',
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
            role: u.role,
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

    const handleAddPhotoFromUrl = () => {
        if (!newPhotoUrl.trim()) return;
        setFormData(prev => ({
            ...prev,
            photos: [
                ...prev.photos,
                {
                    url: newPhotoUrl.trim(),
                    fileId: '',
                    caption: 'Hình ảnh minh họa trạm',
                },
            ],
        }));
        setNewPhotoUrl('');
    };

    const handleUploadPhotoFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !eventId) return;

        setUploadingPhoto(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch(`/api/events/${eventId}/media`, {
                method: 'POST',
                body: uploadData,
            });
            const data = await res.json();
            if (res.ok && data.success && data.photo) {
                setFormData(prev => ({
                    ...prev,
                    photos: [
                        ...prev.photos,
                        {
                            fileId: data.photo.fileId,
                            url: `https://lh3.googleusercontent.com/d/${data.photo.fileId}`,
                            caption: file.name.replace(/\.[^/.]+$/, ''),
                        },
                    ],
                }));
            } else {
                alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Có lỗi khi tải ảnh lên.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (!formData.name.trim()) {
            alert('Vui lòng nhập tên trạm / phân khu');
            return;
        }

        const equipmentList = formData.equipmentText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);

        const stationData = {
            id: station?.id || `station-${Date.now()}`,
            order: station?.order || 0,
            name: formData.name.trim(),
            category: formData.category,
            location: formData.location.trim(),
            lead: formData.lead || null,
            staffList: formData.staffList,
            equipmentList,
            centerContent: {
                title: formData.centerTitle.trim(),
                description: formData.centerDescription.trim(),
                models: equipmentList,
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

    const modalTitle = (
        <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                <IconStation className="w-5 h-5" />
            </span>
            <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    {station ? 'Chỉnh sửa Phân khu / Trạm' : 'Thêm Phân khu / Trạm Trải nghiệm'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    Thiết lập nội dung AIR phụ trách và phần việc phối hợp của nhà trường
                </p>
            </div>
        </div>
    );

    return (
        <EventModal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            maxWidth="max-w-3xl"
            onSubmit={handleSubmit}
            submitLabel={station ? 'Lưu thay đổi' : 'Tạo Trạm Mới'}
            cancelLabel="Hủy"
        >
            <div className="flex flex-col gap-4 text-sm sm:text-base">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block font-semibold text-[var(--text-primary)] mb-1.5 text-sm sm:text-base">
                            Tên Trạm / Phân khu <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ví dụ: Khu vực 1: Trải nghiệm lắp ráp"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Other fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-semibold text-[var(--text-primary)] mb-1.5 text-sm sm:text-base">
                            Phân loại trải nghiệm
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        >
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold text-[var(--text-primary)] mb-1.5 text-sm sm:text-base">
                            Vị trí bố trí (Tại địa điểm)
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ví dụ: Sảnh A, Sân trung tâm, Phòng Lab..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Personnel assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-semibold text-[var(--text-primary)] mb-1.5 text-sm sm:text-base">
                            Trưởng trạm phụ trách chính (Lead)
                        </label>
                        <select
                            value={formData.lead}
                            onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
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
                        <label className="block font-semibold text-[var(--text-primary)] mb-1.5 text-sm sm:text-base">
                            Nhân sự hỗ trợ ({formData.staffList.length} người)
                        </label>
                        <div className="max-h-32 overflow-y-auto p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-wrap gap-1.5">
                            {allPersonnel.length === 0 ? (
                                <span className="text-xs text-[var(--text-secondary)]">Chưa có nhân sự</span>
                            ) : (
                                allPersonnel.map((u) => {
                                    const isSelected = formData.staffList.includes(u.id);
                                    return (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => handleStaffToggle(u.id)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-slate-400'
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

                {/* Equipment */}
                <div>
                    <label className="block font-semibold text-[var(--text-primary)] mb-1.5 text-sm sm:text-base">
                        Danh sách mô hình Robot & Thiết bị mang theo (Mỗi dòng 1 món)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.equipmentText}
                        onChange={(e) => setFormData({ ...formData, equipmentText: e.target.value })}
                        placeholder="Ví dụ:&#10;2x Bộ Kit Stem V2&#10;1x Sa bàn thi đấu Mini&#10;4x Pin Lipo 7.4V"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-mono"
                    />
                </div>

                {/* 2-Column Matrix Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Column 1: AI Robotic */}
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold border-b border-blue-200 dark:border-blue-900/60 pb-2">
                            <IconRobot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span>AI Robotic phụ trách (Trọng tâm trải nghiệm)</span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Tên phân khu / Tên bài trải nghiệm
                            </label>
                            <input
                                type="text"
                                value={formData.centerTitle}
                                onChange={(e) => setFormData({ ...formData, centerTitle: e.target.value })}
                                placeholder="Ví dụ: Khu vực 1: Trải nghiệm lắp ráp Robot..."
                                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Nội dung hướng dẫn & Kịch bản thực hiện
                            </label>
                            <textarea
                                rows={4}
                                value={formData.centerDescription}
                                onChange={(e) => setFormData({ ...formData, centerDescription: e.target.value })}
                                placeholder="Chi tiết nội dung các bé sẽ được làm gì, luật chơi, cách hướng dẫn tại trạm..."
                                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Column 2: Partner / School */}
                    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold border-b border-emerald-200 dark:border-emerald-900/60 pb-2">
                            <IconSchool className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <span>Đơn vị phối hợp (Trường học / Đối tác)</span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Tên trường / Đơn vị phối hợp
                            </label>
                            <input
                                type="text"
                                value={formData.partnerName}
                                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                                placeholder={partnerName || "Tên trường / Đơn vị phối hợp (ví dụ: Trường TH Hoà Bình)"}
                                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Quy mô học sinh / lượt
                            </label>
                            <input
                                type="text"
                                value={formData.studentGroupInfo}
                                onChange={(e) => setFormData({ ...formData, studentGroupInfo: e.target.value })}
                                placeholder="Ví dụ: 10 - 15 học sinh / lượt"
                                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                                Yêu cầu điều phối & Cơ sở vật chất từ nhà trường
                            </label>
                            <textarea
                                rows={3}
                                value={formData.partnerDescription}
                                onChange={(e) => setFormData({ ...formData, partnerDescription: e.target.value })}
                                placeholder="Trường điều phối 1 nhóm học sinh đến tập trung thành 1 hàng hoặc vòng tròn để tiện cho các bé ổn định và quan sát..."
                                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* Photos */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)] text-sm sm:text-base flex items-center gap-2">
                            <IconCamera className="w-4 h-4 text-purple-600" /> Ảnh Sa bàn & Minh họa ({formData.photos.length})
                        </span>
                        {eventId && (
                            <label className="px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-400 text-[var(--text-primary)] text-xs sm:text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">
                                <IconUpload className="w-3.5 h-3.5" />
                                {uploadingPhoto ? 'Đang tải...' : 'Tải ảnh lên'}
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
                            placeholder="Hoặc dán link ảnh (https://...)"
                            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={handleAddPhotoFromUrl}
                            className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border border-[var(--border-color)] font-semibold cursor-pointer text-xs sm:text-sm"
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
