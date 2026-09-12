'use client';
import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { srcImage, defaultAvatarUrl } from "@/function";
import Update from "../update";
import Pay from "../pay";
import Out from "../out";
import Reinstate from "../reinstate";
import Link from "next/link";
import WrapIcon from "@/components/(ui)/(button)/hoveIcon";
import { Svg_Profile } from "@/components/(icon)/svg";
import { getEportfolioUrl } from '@/utils/env';
import CompletedCoursesModal from "./completedCoursesModal";

export function Li_l({ data, dataArea, ReLoadData }) {
    const router = useRouter();
    const [showCompletedCourses, setShowCompletedCourses] = useState(false);
    const initialSrc = data.Avt ? srcImage(data.Avt) : defaultAvatarUrl();
    const status = data.Status?.[data.Status.length - 1]?.status;
    const hasPaid = data.hasPaid ?? false;

    // Lọc danh sách các khóa học mà học sinh đã hoàn thành
    const completedCourses = useMemo(() => {
        return (data.Course || []).filter(c => {
            const statusVal = c.status ?? c.enrollmentStatus;
            const isCompleted = statusVal === 2 || (c.course && c.course.Status === false && statusVal !== 1);
            return isCompleted && c.course;
        });
    }, [data.Course]);

    const rowBgClass = status === 0
        ? 'bg-rose-50/70 hover:bg-rose-100/70'
        : status === 1
        ? 'bg-amber-50/70 hover:bg-amber-100/70'
        : 'hover:bg-gray-50';

    return (
        <tr
            onClick={() => router.push(`/${data._id}`)}
            className={`transition-colors border-b border-gray-100 cursor-pointer ${rowBgClass}`}
        >
                {/* 1. Học sinh (Avatar + ID + Tên) */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 shadow-2xs">
                            <Image
                                src={initialSrc}
                                width={40}
                                height={40}
                                alt={`avt của ${data.Name}`}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-secondary)] font-mono">{data.ID}</p>
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{data.Name}</p>
                        </div>
                    </div>
                </td>

                {/* 2. Khu vực */}
                <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                    {data.Area ? data.Area.name : '—'}
                </td>

                {/* 3. Liên hệ */}
                <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                    {data.Phone ? data.Phone : '—'}
                </td>

                {/* 4. Ngày tạo */}
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    {data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '—'}
                </td>

                {/* 5. Xếp hạng */}
                <td className="px-4 py-3 text-center">
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            color: data.rank?.color || '#9ca3af',
                            backgroundColor: data.rank?.bg || '#f3f4f6',
                            border: `1px solid ${data.rank?.color || '#e5e7eb'}33`,
                        }}
                    >
                        {data.rank?.name || 'Mới'}
                    </span>
                </td>

                {/* 6. Đã hoàn thành */}
                <td className="px-4 py-3 text-center">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCompletedCourses(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
                            completedCourses.length > 0
                                ? 'bg-[var(--green)] text-white border-transparent hover:opacity-90 shadow-2xs'
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                        title="Nhấn để xem các khóa học học sinh đã hoàn thành"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={11} height={11} fill="currentColor">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/>
                        </svg>
                        <span>{completedCourses.length} khóa</span>
                    </button>
                </td>

                {/* 7. Hành động */}
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                        <Link href={`${getEportfolioUrl()}/e-portfolio/${data._id}`} target="_blank">
                            <WrapIcon
                                icon={<Svg_Profile w={16} h={16} c={'white'} />}
                                content={"Hồ sơ điện tử"}
                                style={{ background: data.statusProfile ? 'var(--main_d)' : 'var(--red)', borderRadius: 4, margin: 0 }}
                                placement="left"
                            />
                        </Link>
                        <Update data={data} data_area={dataArea} reloadData={ReLoadData} />
                        <Pay _id={data._id} status={hasPaid} />
                        {status !== 0 ? (
                            <Out data={data} />
                        ) : (
                            <Reinstate data={data} reloadData={ReLoadData} />
                        )}
                    </div>

                    {/* Popup hiển thị các khóa học đã hoàn thành */}
                    <CompletedCoursesModal
                        open={showCompletedCourses}
                        onClose={() => setShowCompletedCourses(false)}
                        student={data}
                        completedCourses={completedCourses}
                    />
                </td>
            </tr>
    );
}
