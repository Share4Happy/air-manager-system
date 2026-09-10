'use client';
import React from 'react';
import {
    IconRobot,
    IconSchool,
    IconCamera,
    IconLocation,
    IconUser,
    IconEdit,
    IconTrash,
} from '@/app/events/ui/icons';

export const getCategoryMeta = (category) => {
    switch (category) {
        case 'assembly':
            return {
                label: 'Lắp ráp Robotics',
                badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                stationNum: 'bg-blue-600 text-white',
                columnBorder: 'border-t-4 border-t-blue-500',
                columnHeaderBg: 'bg-blue-50/40 dark:bg-blue-950/20',
                accentBorder: 'border-t-4 border-t-blue-500',
                headerBg: 'bg-blue-50/70 dark:bg-blue-950/40',
                accentText: 'text-blue-600 dark:text-blue-400',
            };
        case 'coding':
            return {
                label: 'Lập trình Điều khiển',
                badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                stationNum: 'bg-purple-600 text-white',
                columnBorder: 'border-t-4 border-t-purple-500',
                columnHeaderBg: 'bg-purple-50/40 dark:bg-purple-950/20',
                accentBorder: 'border-t-4 border-t-purple-500',
                headerBg: 'bg-purple-50/70 dark:bg-purple-950/40',
                accentText: 'text-purple-600 dark:text-purple-400',
            };
        case 'control':
            return {
                label: 'Điều khiển & Sa bàn',
                badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                stationNum: 'bg-amber-600 text-white',
                columnBorder: 'border-t-4 border-t-amber-500',
                columnHeaderBg: 'bg-amber-50/40 dark:bg-amber-950/20',
                accentBorder: 'border-t-4 border-t-amber-500',
                headerBg: 'bg-amber-50/70 dark:bg-amber-950/40',
                accentText: 'text-amber-600 dark:text-amber-400',
            };
        case 'competition':
            return {
                label: 'Thi đấu & Thử thách',
                badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                stationNum: 'bg-rose-600 text-white',
                columnBorder: 'border-t-4 border-t-rose-500',
                columnHeaderBg: 'bg-rose-50/40 dark:bg-rose-950/20',
                accentBorder: 'border-t-4 border-t-rose-500',
                headerBg: 'bg-rose-50/70 dark:bg-rose-950/40',
                accentText: 'text-rose-600 dark:text-rose-400',
            };
        case 'reward':
            return {
                label: 'Check-in & Đổi thưởng',
                badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                stationNum: 'bg-emerald-600 text-white',
                columnBorder: 'border-t-4 border-t-emerald-500',
                columnHeaderBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
                accentBorder: 'border-t-4 border-t-emerald-500',
                headerBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
                accentText: 'text-emerald-600 dark:text-emerald-400',
            };
        default:
            return {
                label: 'Phân khu Trải nghiệm',
                badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                stationNum: 'bg-indigo-600 text-white',
                columnBorder: 'border-t-4 border-t-indigo-500',
                columnHeaderBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
                accentBorder: 'border-t-4 border-t-indigo-500',
                headerBg: 'bg-indigo-50/70 dark:bg-indigo-950/40',
                accentText: 'text-indigo-600 dark:text-indigo-400',
            };
    }
};

/**
 * ScenarioMatrixTable - Shared Scenario Matrix Table between Station View & Roadmap Tree View
 */
export default function ScenarioMatrixTable({
    event = {},
    stations = [],
    users = [],
    members = [],
    partnerName,
    onOpenEditStation,
    onDeleteStation,
    onPreviewPhoto,
    hideTitleBar = false,
    className = '',
}) {
    const resolvedPartnerName = partnerName || event?.location || event?.targetAudience || 'Địa điểm tổ chức';

    const getPersonInfo = (personId) => {
        if (!personId) return null;
        const idStr = typeof personId === 'object' ? String(personId?._id || personId?.id) : String(personId);
        const u = users.find((usr) => String(usr._id) === idStr);
        if (u) return { name: u.name, role: Array.isArray(u.role) ? u.role.join(', ') : u.role || 'Nhân sự', type: 'user' };
        const m = members.find((mem) => String(mem.id) === idStr || String(mem._id) === idStr);
        if (m) return { name: m.name, role: m.role || 'Thành viên ngoài', type: 'member', org: m.organization };
        return null;
    };

    if (!stations || stations.length === 0) return null;

    return (
        <div className={`overflow-x-auto scrollbar-thin rounded-2xl border border-[var(--border-color)] shadow-xs bg-[var(--bg-primary)] ${className}`}>
            {/* Title Header Bar */}
            {!hideTitleBar && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 text-[var(--text-primary)] border-b border-[var(--border-color)] text-center py-4 px-4 font-bold text-base sm:text-lg uppercase tracking-wide min-w-[850px]">
                    KỊCH BẢN ĐIỀU PHỐI CHI TIẾT SỰ KIỆN - {event?.title || 'NGÀY HỘI STEM'}
                </div>
            )}

            <table className="w-full text-sm sm:text-base border-collapse min-w-[850px]">
                <thead>
                    <tr className="border-b border-[var(--border-color)] text-left">
                        <th className="p-4 border-r border-[var(--border-color)] w-52 min-w-[200px] font-bold text-sm sm:text-base text-[var(--text-primary)] bg-[var(--bg-secondary)]">
                            Nội dung / Phân khu
                        </th>
                        {stations.map((st, i) => {
                            const meta = getCategoryMeta(st.category);
                            const lead = getPersonInfo(st.lead);
                            return (
                                <th
                                    key={st.id || i}
                                    className={`p-4 border-r border-[var(--border-color)] min-w-[270px] ${meta.columnHeaderBg} ${meta.columnBorder}`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-md ${meta.stationNum} text-xs sm:text-sm font-bold`}>
                                                0{i + 1}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold border ${meta.badge}`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        {(onOpenEditStation || onDeleteStation) && (
                                            <div className="flex items-center gap-1">
                                                {onOpenEditStation && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenEditStation(st)}
                                                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-blue-600 hover:bg-[var(--bg-primary)] border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                                                        title="Chỉnh sửa trạm này"
                                                    >
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {onDeleteStation && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteStation(st.id)}
                                                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                                        title="Xóa trạm"
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-bold text-base sm:text-lg text-[var(--text-primary)]">
                                        {st.name}
                                    </div>
                                    {st.location && (
                                        <div className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium flex items-center gap-1.5 mt-1.5">
                                            <IconLocation className="w-4 h-4 text-rose-500" /> {st.location}
                                        </div>
                                    )}
                                    {lead && (
                                        <div className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 mt-1.5">
                                            <IconUser className="w-4 h-4" /> {lead.name}
                                        </div>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                    {/* Row 1: AIR Side */}
                    <tr>
                        <td className="p-4 font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-r border-b border-[var(--border-color)] align-top w-52 min-w-[200px]">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--text-primary)]">
                                <IconRobot className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Phía AI Robotic
                            </div>
                            <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium block mt-1.5 leading-relaxed">
                                Thiết bị, mô hình & nội dung giảng dạy
                            </span>
                        </td>
                        {stations.map((st, i) => (
                            <td key={i} className="p-4 border-r border-[var(--border-color)] align-top leading-relaxed text-sm sm:text-base text-[var(--text-primary)] bg-[var(--bg-primary)]">
                                <div className="min-h-[38px] mb-2">
                                    {st.equipmentList?.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {st.equipmentList.map((eq, eqIdx) => (
                                                <span key={eqIdx} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 font-semibold">
                                                    {eq}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] italic">Chưa liệt kê thiết bị riêng</span>
                                    )}
                                </div>
                                <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-[var(--text-primary)] dark:text-slate-200">
                                    {st.centerContent?.description || st.description || 'Chưa thiết lập nội dung.'}
                                </div>
                                {st.lead && (
                                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <IconUser className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Phụ trách: {getPersonInfo(st.lead)?.name || 'Chưa gán'}
                                    </div>
                                )}
                            </td>
                        ))}
                    </tr>

                    {/* Row 2: Photo Illustrations */}
                    <tr>
                        <td className="p-4 font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-r border-b border-[var(--border-color)] align-middle w-52 min-w-[200px]">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--text-primary)]">
                                <IconCamera className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Ảnh Minh Họa
                            </div>
                            <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium block mt-1.5 leading-relaxed">
                                Mô hình thực tế & sa bàn
                            </span>
                        </td>
                        {stations.map((st, i) => (
                            <td key={i} className="p-3 border-r border-[var(--border-color)] align-middle text-center bg-[var(--bg-primary)]">
                                {st.photos && st.photos.length > 0 ? (
                                    <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                        {st.photos.map((p, pIdx) => {
                                            const src = p.url || (p.fileId ? `https://lh3.googleusercontent.com/d/${p.fileId}` : '');
                                            return (
                                                <div
                                                    key={pIdx}
                                                    onClick={() => onPreviewPhoto?.({ src, caption: p.caption })}
                                                    className={`w-28 h-20 rounded-xl overflow-hidden border border-[var(--border-color)] inline-block shadow-xs transition-opacity ${onPreviewPhoto ? 'cursor-pointer hover:opacity-90' : ''}`}
                                                >
                                                    <img src={src} alt={p.caption || 'Minh họa'} className="w-full h-full object-cover" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span className="text-[var(--text-secondary)] italic text-sm sm:text-base">Chưa có ảnh</span>
                                )}
                            </td>
                        ))}
                    </tr>

                    {/* Row 3: School / Partner Side */}
                    <tr>
                        <td className="p-4 font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-r border-b border-[var(--border-color)] align-top w-52 min-w-[200px]">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--text-primary)]">
                                <IconSchool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {resolvedPartnerName}
                            </div>
                            <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium block mt-1.5 leading-relaxed">
                                Điều phối học sinh & CSVC
                            </span>
                        </td>
                        {stations.map((st, i) => (
                            <td key={i} className="p-4 border-r border-[var(--border-color)] align-top leading-relaxed text-sm sm:text-base text-[var(--text-primary)] bg-[var(--bg-primary)]">
                                <div className="min-h-[30px] mb-1.5">
                                    {st.partnerContent?.studentGroupInfo ? (
                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-block">
                                            Quy mô: {st.partnerContent.studentGroupInfo}
                                        </span>
                                    ) : (
                                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] italic">Theo nhóm học sinh</span>
                                    )}
                                </div>
                                <div className="text-sm sm:text-base leading-relaxed text-[var(--text-primary)] dark:text-slate-200">
                                    {st.partnerContent?.description || 'Hỗ trợ điều phối học sinh, cơ sở vật chất.'}
                                </div>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
