'use client';

import React, { useState, useEffect, useMemo } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import { Re_lesson } from '@/data/course';        
import { reloadCourse } from '@/data/actions/reload';
import { driveThumbnailUrl } from '@/function';


const getDriveImageUrl = (id, size = 200) => driveThumbnailUrl(id, size);

export default function StudentImageSelectionManager({ studentInfo, courseInfo, course }) {

    const [isPrimaryOpen, setPrimaryOpen] = useState(false);
    const [isSecondaryOpen, setSecondaryOpen] = useState(false);

    // Tách riêng state loading cho 2 popup
    const [isLoadingPrimary, setIsLoadingPrimary] = useState(false);
    const [isLoadingSecondary, setIsLoadingSecondary] = useState(false);
    // State quản lý thông báo Noti
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });

    const [originalImageIds, setOriginalImageIds] = useState(new Set());
    const [selectedImageIds, setSelectedImageIds] = useState(new Set());
    const [tempSelection, setTempSelection] = useState(new Set());
    const [lightboxImage, setLightboxImage] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());

    useEffect(() => {
        const existingIds = new Set(allCourseImages.map(img => img.id));
        const studentIds = new Set(studentInfo.Image.map(img => img.id) || []);
        const validIds = new Set([...studentIds].filter(id => existingIds.has(id)));
        setOriginalImageIds(validIds);
        setSelectedImageIds(validIds);
    }, [studentInfo, courseInfo]);

    const allCourseImages = courseInfo?.DetailImage || [];

    const selectedImageObjects = useMemo(() =>
        allCourseImages.filter(img => selectedImageIds.has(img.id)),
        [selectedImageIds, allCourseImages]
    );

    const handleOpenSecondaryPopup = () => {
        setTempSelection(new Set(selectedImageIds));
        setSecondaryOpen(true);
    };

    const handleRemoveFromPrimary = async (imageId) => {
        setIsLoadingPrimary(true);
        try {
            const newSelectedIds = new Set(selectedImageIds);
            newSelectedIds.delete(imageId);

            const imagesToSave = allCourseImages
                .filter(img => newSelectedIds.has(img.id))
                .map(img => ({ id: img.id, type: img.type, size: img.size }));

            const response = await fetch('/api/updateimagestudent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: courseInfo?._id,
                    studentId: studentInfo.ID,
                    newImages: imagesToSave
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Lỗi từ server');
            }

            setSelectedImageIds(newSelectedIds);
            setOriginalImageIds(newSelectedIds);

            await reloadCourse(course._id);
            await Re_lesson(courseInfo._id);

            setNotification({ open: true, status: true, mes: 'Đã xóa ảnh thành công!' });
        } catch (error) {
            console.error("Lỗi khi xóa ảnh:", error);
            setNotification({ open: true, status: false, mes: error.message || 'Có lỗi xảy ra, không thể xóa ảnh.' });
        } finally {
            setIsLoadingPrimary(false);
        }
    };

    const handleToggleInSecondary = (imageId) => {
        const newTempIds = new Set(tempSelection);
        if (newTempIds.has(imageId)) {
            newTempIds.delete(imageId);
        } else {
            newTempIds.add(imageId);
        }
        setTempSelection(newTempIds);
    };

    // HÀM MỚI: Xử lý lưu từ Popup 2
    const handleSaveFromSecondary = async () => {
        setIsLoadingSecondary(true);
        try {

            // Lấy ID của buổi học từ courseInfo (được truyền vào component)
            const lessonImageId = courseInfo?._id;
            if (!lessonImageId) {
                throw new Error("Không tìm thấy mã định danh của buổi học (courseInfo.Image).");
            }

            // Chuyển Set ID thành mảng các object {id, type} đúng cấu trúc
            const imagesToSave = allCourseImages
                .filter(img => tempSelection.has(img.id))
                .map(img => ({ id: img.id, type: img.type }));

            // Gọi API route với phương thức POST
            const response = await fetch('/api/updateimagestudent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: lessonImageId,         // ID của buổi học để tìm kiếm
                    studentId: studentInfo.ID,
                    newImages: imagesToSave       // Mảng object ảnh mới
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Lỗi từ server');
            }
            await reloadCourse(course._id); 
            await Re_lesson(courseInfo._id);

            setSelectedImageIds(tempSelection);
            setOriginalImageIds(tempSelection);

            setNotification({ open: true, status: true, mes: result.message || 'Lưu lựa chọn thành công!' });
            setSecondaryOpen(false);
        } catch (error) {
            console.error("Lỗi khi lưu từ popup 2:", error);
            setNotification({ open: true, status: false, mes: error.message || 'Có lỗi xảy ra, không thể lưu.' });
        } finally {
            setIsLoadingSecondary(false);
        }
    };
    const handleMultiDelete = async () => {
        if (multiSelectedIds.size === 0) return;
        setIsLoadingPrimary(true);
        try {
            const newSelectedIds = new Set(selectedImageIds);
            for (const id of multiSelectedIds) {
                newSelectedIds.delete(id);
            }

            const imagesToSave = allCourseImages
                .filter(img => newSelectedIds.has(img.id))
                .map(img => ({ id: img.id, type: img.type, size: img.size }));

            const response = await fetch('/api/updateimagestudent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: courseInfo?._id,
                    studentId: studentInfo.ID,
                    newImages: imagesToSave
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Lỗi từ server');
            }

            setSelectedImageIds(newSelectedIds);
            setOriginalImageIds(newSelectedIds);
            setMultiSelectedIds(new Set());
            setSelectMode(false);

            await reloadCourse(course._id);
            await Re_lesson(courseInfo._id);

            setNotification({ open: true, status: true, mes: `Đã xóa ${multiSelectedIds.size} ảnh thành công!` });
        } catch (error) {
            console.error("Lỗi khi xóa nhiều ảnh:", error);
            setNotification({ open: true, status: false, mes: error.message || 'Có lỗi xảy ra, không thể xóa ảnh.' });
        } finally {
            setIsLoadingPrimary(false);
        }
    };

    const closeNotification = () => setNotification({ open: false, status: false, mes: '' });

    // Render nội dung cho Popup 1
    const renderPrimaryContent = () => (
        <div className="relative p-4 h-[calc(100%-16px)] pb-0 flex flex-col">
            {isLoadingPrimary && (
                <div className="absolute inset-0 bg-white/85 flex justify-center items-center z-10 rounded-lg">
                    <Loading size={50} content={<p>Đang xử lý...</p>} />
                </div>
            )}
            <div className="flex justify-between items-center mb-3 shrink-0 flex-wrap gap-2">
                {!selectMode ? (
                    <>
                        <p className='text-base font-semibold text-[var(--text-primary)]'>Ảnh đã chọn ({selectedImageObjects.length})</p>
                        <div className="flex gap-2">
                            <button className='px-3 py-2 bg-red-500 flex items-center gap-2 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-red-600' onClick={() => { setSelectMode(true); setMultiSelectedIds(new Set()); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                Chọn nhiều
                            </button>
                            <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-[var(--main_d)]' onClick={handleOpenSecondaryPopup}>+ Thêm ảnh</button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className='text-base font-semibold text-[var(--text-primary)]'>Chọn ảnh để xóa</p>
                        <div className="flex gap-2">
                            <span className="text-sm text-[var(--text-primary)] self-center">{multiSelectedIds.size} đã chọn</span>
                            <button className="px-3 py-2 bg-gray-300 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-400" onClick={() => { setSelectMode(false); setMultiSelectedIds(new Set()); }}>
                                Hủy chọn
                            </button>
                            <button
                                className="px-3 py-2 bg-red-600 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={multiSelectedIds.size === 0}
                                onClick={handleMultiDelete}
                            >
                                Xóa ({multiSelectedIds.size})
                            </button>
                        </div>
                    </>
                )}
            </div>

            {selectedImageObjects.length > 0 ?
                <div style={{ overflow: 'auto', flex: 1 }}>
                    <div className="grid grid-cols-5 gap-2.5 overflow-y-auto bg-[#f9f9f9] rounded-lg p-2.5 flex-1">{
                        selectedImageObjects.map(image => (
                            <div
                                key={image.id}
                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-[#e0e0e0] transition-all duration-200 group ${selectMode && multiSelectedIds.has(image.id) ? 'ring-2 ring-red-500' : ''}`}
                                onClick={() => {
                                    if (selectMode) {
                                        setMultiSelectedIds(prev => {
                                            const next = new Set(prev);
                                            if (next.has(image.id)) next.delete(image.id);
                                            else next.add(image.id);
                                            return next;
                                        });
                                    } else {
                                        setLightboxImage(image.id);
                                    }
                                }}
                            >
                                <img
                                    src={getDriveImageUrl(image.id, 400)}
                                    alt={`Ảnh của ${studentInfo.ID}`}
                                    className="w-full h-full object-cover block"
                                />
                                {selectMode ? (
                                    <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${multiSelectedIds.has(image.id) ? 'bg-red-500 border-red-500' : 'bg-white/80 border-gray-400'}`}>
                                        {multiSelectedIds.has(image.id) && <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                                    </div>
                                ) : (
                                    <button
                                        className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFromPrimary(image.id); }}
                                        title="Xóa khỏi danh sách"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14" fill="white"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                                    </button>
                                )}
                            </div>
                        ))
                    }
                    </div>
                </div> : (
                    <div className="w-full h-full min-h-[150px] flex items-center justify-center text-center text-[#888]">
                        <p>Chưa có ảnh nào được chọn.</p>
                    </div>
                )}

        </div>
    );

    // Render nội dung cho Popup 2
    const renderSecondaryContent = () => (
        <div className="relative p-4 h-[calc(100%-16px)] pb-0 flex flex-col">
            {isLoadingSecondary && ( // Sử dụng state loading riêng
                <div className="absolute inset-0 bg-white/85 flex justify-center items-center z-10 rounded-lg">
                    <Loading size={50} content={<p>Đang lưu lựa chọn...</p>} />
                </div>
            )}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {allCourseImages.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[150px] text-center text-[#888]">
                        <p>Thư viện lớp chưa có hình ảnh.</p>
                    </div>
                ) : (
                <div className="grid grid-cols-5 gap-2.5">
                    {allCourseImages.map(image => (
                            <div
                                key={image.id}
                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-[#e0e0e0] transition-all duration-200 group ${tempSelection.has(image.id) ? 'ring-2 ring-green-500' : 'ring-0 hover:ring-2 hover:ring-blue-400'}`}
                            >
                                <img
                                    src={getDriveImageUrl(image.id)}
                                    alt={`Ảnh lớp ${image.id}`}
                                    loading="lazy"
                                    className={`w-full h-full object-cover block transition-all duration-300 ${tempSelection.has(image.id) ? 'opacity-50' : ''}`}
                                    onClick={() => handleToggleInSecondary(image.id)}
                                />
                                <button
                                    className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/60"
                                    onClick={(e) => { e.stopPropagation(); setLightboxImage(image.id); }}
                                    title="Xem ảnh"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="12" height="12" fill="white"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                                </button>
                                {tempSelection.has(image.id) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(25,135,84,0.8)] text-white text-2xl flex justify-center items-center">✓</div>}
                            </div>
                    ))}
                </div>
                )}
            </div>
            <div className="w-full py-2.5 flex justify-between gap-2 border-t border-[#e0e0e0] bg-[#fdfdfd] shrink-0">
                <button className="px-3 py-2 bg-gray-200 rounded text-sm font-medium cursor-pointer border-none hover:bg-gray-300" onClick={() => setSecondaryOpen(false)}>
                    Hủy
                </button>
                <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" onClick={handleSaveFromSecondary} disabled={isLoadingSecondary}>
                    {isLoadingSecondary ? 'Đang lưu...' : 'Lưu lựa chọn'}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Noti
                open={notification.open}
                onClose={closeNotification}
                status={notification.status}
                mes={notification.mes}
            />

            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-black/85 flex justify-center items-center z-[2000] cursor-pointer animate-[fadeIn_0.2s_ease]"
                    onClick={() => setLightboxImage(null)}
                >
                    <div
                        className="relative flex justify-center items-center cursor-default animate-[zoomIn_0.2s_ease]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                    >
                        <button
                            className="absolute top-0 -right-[15px] w-[30px] h-[30px] bg-white text-[#333] border-none rounded font-light text-xl leading-[30px] text-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
                            onClick={() => setLightboxImage(null)}
                        >
                            ×
                        </button>
                        <img
                            src={getDriveImageUrl(lightboxImage, 800)}
                            alt="Ảnh phóng to"
                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 py-2 rounded-lg cursor-pointer transition-colors duration-200 flex-1 justify-center" onClick={() => setPrimaryOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill='var(--text-primary)'>
                    <path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z" /></svg>
            </div>

            <FlexiblePopup
                open={isPrimaryOpen}
                onClose={() => setPrimaryOpen(false)}
                title={`Ảnh của học sinh: ${studentInfo.ID}`}
                renderItemList={renderPrimaryContent}
                width={600}

                secondaryOpen={isSecondaryOpen}
                onCloseSecondary={() => setSecondaryOpen(false)}
                secondaryTitle={`Chọn ảnh từ thư viện lớp`}
                renderSecondaryList={renderSecondaryContent}
                secondaryCentered
            />
        </>
    );
}
