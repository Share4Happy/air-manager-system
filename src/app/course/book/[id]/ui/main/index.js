'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Svg_Delete, Svg_Add, Svg_Pen, Svg_Slide } from '@/components/(icon)/svg';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import EditBookForm from '../EditBookForm';
import AddTopicForm from '../AddTopicForm';
import EditTopicForm from '../EditTopicForm';
import AlertPopup from '@/components/(features)/(noti)/alert';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { srcImage } from '@/function';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

// --- Sub-components for better structure ---

const InfoPanel = React.memo(({ bookData, formattedPrice, onEditClick }) => (
    <aside className="w-full lg:w-1/3 lg:max-w-[340px] shrink-0 flex flex-col">
        <div className="w-full rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-[var(--boxshaw2)] flex gap-2 justify-center max-w-[280px] sm:max-w-[320px] lg:max-w-none mx-auto lg:mx-0">
            {bookData.Image && <Image
                src={srcImage(bookData.Image)}
                alt={bookData.Name}
                width={400}
                height={533}
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className="w-[calc(50%-4px)] h-auto aspect-[3/4] object-cover block rounded"
                style={{ width: bookData.Badge ? 'calc(50% - 4px)' : '100%' }}
            />}
            {bookData.Badge && <Image
                src={srcImage(bookData.Badge)}
                alt={bookData.Name}
                width={400}
                height={533}
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className="w-[calc(50%-4px)] h-auto aspect-[3/4] object-cover block rounded"
            />}
            {!bookData.Image && !bookData.Badge && (
                <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">Không có ảnh</div>
            )}
        </div>
        <p className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-2">{bookData.Name}</p>
        <div className="flex flex-col gap-1.5 mb-4 text-xs sm:text-sm">
            <p className="text-[var(--text-primary)]"><strong>Loại:</strong> {bookData.Type}</p>
            <p className="text-[var(--text-primary)]"><strong>Học phí:</strong> <span className="text-blue-600 font-semibold">{formattedPrice}</span></p>
            <p className="text-[var(--text-primary)]"><strong>Số chủ đề:</strong> {bookData.Topics?.length || 0} chủ đề</p>
            <p className="text-[var(--text-primary)]"><strong>Số tiết quy định:</strong> {bookData.Topics?.reduce((total, item) => total + (item.Period || 0), 0) || 0} tiết</p>
            {bookData.Describe && <p className="text-[var(--text-primary)] mt-1"><strong>Mô tả:</strong> {bookData.Describe}</p>}
        </div>
        <button onClick={onEditClick} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer border border-transparent transition-all duration-200 text-white bg-[var(--main_b)] hover:bg-[var(--main_d)] w-full mt-auto text-sm font-medium">
            <Svg_Pen w={16} h={16} c='white' />
            <span>Chỉnh sửa thông tin</span>
        </button>
    </aside>
));
InfoPanel.displayName = 'InfoPanel';

const TopicItem = React.memo(({ topic, index, i, dragHandlers, actionHandlers }) => {
    const isDragging = dragHandlers.draggedIndex === index;
    const dragItemClass = `flex gap-2 mb-2 cursor-move transition-all duration-200 items-stretch ${isDragging ? 'opacity-50 scale-[1.01] shadow-[0_5px_15px_rgba(0,0,0,0.2)]' : ''}`;

    return (
        <React.Fragment>
            {dragHandlers.dragOverIndex === index && !isDragging && <div className="h-[70px] bg-[rgba(0,123,255,0.1)] border-2 border-dashed border-[var(--main_b)] rounded-lg my-1" />}
            <div
                draggable
                onDragStart={(e) => dragHandlers.onDragStart(e, index)}
                onDragEnter={(e) => dragHandlers.onDragEnter(e, index)}
                onDragEnd={dragHandlers.onDragEnd}
                className={dragItemClass}
            >
                <div className="w-14 sm:w-20 md:w-24 shrink-0 aspect-[4/3] overflow-hidden rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200 text-center px-1">
                    <p className="text-[11px] sm:text-xs font-semibold text-[var(--text-primary)]">#{i}</p>
                </div>
                <li className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 bg-white p-2.5 sm:p-3.5 rounded-lg border border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--bg-secondary)] shadow-sm">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-[var(--text-primary)] line-clamp-1">{topic.Name}</p>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] m-0">Thời lượng: {topic.Period || 'N/A'} tiết</p>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button type="button" className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5 bg-[var(--yellow)] border-none cursor-pointer" onClick={() => actionHandlers.onEdit(topic)} title="Sửa chủ đề"><Svg_Pen w={15} h={15} c='white' /></button>
                        {topic.Slide && <a href={topic.Slide} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5 bg-[var(--main_b)] no-underline" title="Xem slide"><Svg_Slide w={15} h={15} c='white' /></a>}
                        <button type="button" className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5 bg-[var(--red)] border-none cursor-pointer" onClick={() => actionHandlers.onDelete(topic._id, topic.Name)} title="Xóa chủ đề"><Svg_Delete w={15} h={15} c='white' /></button>
                    </div>
                </li>
            </div>
        </React.Fragment>
    );
});
TopicItem.displayName = 'TopicItem';

const TopicsPanel = React.memo(({ topics, dragHandlers, actionHandlers, onAddTopic, onImport }) => {
    let i = 0;
    return (
        <main className="flex-1 min-w-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[var(--border-color)] pt-4 lg:pt-0 lg:pl-4 min-h-[350px]" onDrop={dragHandlers.onDrop} onDragOver={(e) => e.preventDefault()}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 sm:pb-4 mb-2 border-b border-[var(--border-color)]">
                <p className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Danh sách chủ đề ({topics?.filter(t => t.Status !== false).length || 0})</p>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button onClick={onImport} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer border border-[var(--border-color)] transition-all duration-200 bg-white text-[var(--text-primary)] hover:bg-gray-50 text-xs sm:text-sm font-medium">
                        <Svg_Add w={15} h={15} c='currentColor' />
                        <span>Import</span>
                    </button>
                    <button onClick={onAddTopic} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg cursor-pointer border border-transparent transition-all duration-200 bg-[var(--main_b)] text-white hover:bg-[var(--main_d)] text-xs sm:text-sm font-medium">
                        <Svg_Add w={15} h={15} c='white' />
                        <span>Thêm chủ đề</span>
                    </button>
                </div>
            </div>
            <ul className="flex-1 list-none p-0 m-0 overflow-y-auto pr-1">
                {topics.map((topic, index) => {
                    if (topic.Status === false) return null;
                    i++;
                    return <TopicItem key={topic._id} topic={topic} index={index} i={i} dragHandlers={dragHandlers} actionHandlers={actionHandlers} />;
                })}
            </ul>
        </main>
    );
});
TopicsPanel.displayName = 'TopicsPanel';

const ActionPopups = React.memo(({ popups, handlers, bookData, currentEditingTopic }) => (
    <>
        <FlexiblePopup open={popups.isEditPopupOpen} onClose={handlers.onCloseEditBook} title="Chỉnh sửa thông tin sách" width={500}
            renderItemList={() => <EditBookForm initialData={bookData} onSave={handlers.onSaveBook} onCancel={handlers.onCloseEditBook} isLoading={handlers.isLoading} />}
        />
        <FlexiblePopup open={popups.isAddTopicPopupOpen} onClose={handlers.onCloseAddTopic} title="Thêm chủ đề mới" width={500}
            renderItemList={() => <AddTopicForm onSave={handlers.onSaveTopic} onCancel={handlers.onCloseAddTopic} isLoading={handlers.isLoading} />}
        />
        {currentEditingTopic && (
            <FlexiblePopup open={popups.isEditTopicPopupOpen} onClose={handlers.onCloseEditTopic} title={`Chỉnh sửa: ${currentEditingTopic.Name}`} width={500}
                renderItemList={() => <EditTopicForm initialData={currentEditingTopic} onSave={handlers.onSaveEditedTopic} onCancel={handlers.onCloseEditTopic} isLoading={handlers.isLoading} />}
            />
        )}
    </>
));
ActionPopups.displayName = 'ActionPopups';

// --- Main Component ---
const BookDetail = ({ data: initialData }) => {
    const router = useRouter();
    const [bookData, setBookData] = useState({ ...initialData, Topics: initialData.Topics || [] });
    const [popups, setPopups] = useState({ isEditPopupOpen: false, isAddTopicPopupOpen: false, isEditTopicPopupOpen: false });
    const [currentEditingTopic, setCurrentEditingTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notiState, setNotiState] = useState({ open: false, status: true, mes: '' });
    const [alertConfig, setAlertConfig] = useState({ open: false, title: '', content: null, actions: null, type: 'info' });
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [importPopupOpen, setImportPopupOpen] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const [importErrors, setImportErrors] = useState([])
    const [importLoading, setImportLoading] = useState(false)

    const API_ENDPOINT = useMemo(() => `/api/book/${bookData._id}`, [bookData._id]);
    const formattedPrice = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookData.Price), [bookData.Price]);

    useEffect(() => { setBookData({ ...initialData, Topics: initialData.Topics || [] }); }, [initialData]);

    const handleCloseNoti = useCallback(() => setNotiState(prev => ({ ...prev, open: false })), []);
    const handleCloseAlert = useCallback(() => setAlertConfig(prev => ({ ...prev, open: false })), []);

    const callApi = useCallback(async (method, body, endpoint = API_ENDPOINT) => {
        setIsLoading(true);
        const fetchOptions = { method };
        if (body) {
            if (body instanceof FormData) {
                fetchOptions.body = body;
            } else {
                fetchOptions.headers = { 'Content-Type': 'application/json' };
                fetchOptions.body = JSON.stringify(body);
            }
        }
        try {
            const response = await fetch(endpoint, fetchOptions);
            const result = await response.json();
            if (!response.ok) throw new Error(result.mes || `Lỗi ${response.status}`);
            setNotiState({ open: true, status: true, mes: result.mes });
            router.refresh();
            return true;
        } catch (error) {
            setNotiState({ open: true, status: false, mes: error.message });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [API_ENDPOINT, router]);

    const handleDragStart = useCallback((e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; }, []);
    const handleDragEnter = useCallback((e, index) => { e.preventDefault(); if (index !== dragOverIndex) setDragOverIndex(index); }, [dragOverIndex]);
    const handleDragEnd = useCallback(() => { setDraggedIndex(null); setDragOverIndex(null); }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) return handleDragEnd();
        const originalTopics = [...bookData.Topics];
        const reorderedTopics = reorder(originalTopics, draggedIndex, dragOverIndex);
        setBookData(prev => ({ ...prev, Topics: reorderedTopics }));
        handleDragEnd();
        const success = await callApi('PUT', { orderedTopicIds: reorderedTopics.map(t => t._id) });
        if (!success) setBookData(prev => ({ ...prev, Topics: originalTopics }));
    }, [draggedIndex, dragOverIndex, bookData.Topics, handleDragEnd, callApi]);

    const handleSaveBook = useCallback(async (formData) => {
        const success = await callApi('PUT', formData, '/api/book');
        if (success) setPopups(prev => ({ ...prev, isEditPopupOpen: false }));
    }, [callApi, bookData._id]);

    const handleSaveTopic = useCallback(async (newTopicData) => {
        const success = await callApi('POST', { topics: [newTopicData] });
        if (success) setPopups(prev => ({ ...prev, isAddTopicPopupOpen: false }));
    }, [callApi]);

    const handleOpenEditTopic = useCallback((topic) => {
        setCurrentEditingTopic(topic);
        setPopups(prev => ({ ...prev, isEditTopicPopupOpen: true }));
    }, []);

    const handleCloseEditTopic = useCallback(() => {
        setPopups(prev => ({ ...prev, isEditTopicPopupOpen: false }));
        setCurrentEditingTopic(null);
    }, []);

    const handleSaveEditedTopic = useCallback(async (updatedTopicData) => {
        if (!currentEditingTopic) return;
        const success = await callApi('PUT', { topicId: currentEditingTopic._id, updateData: updatedTopicData });
        if (success) handleCloseEditTopic();
    }, [callApi, currentEditingTopic, handleCloseEditTopic]);

    const executeDelete = useCallback(async (topicId) => {
        handleCloseAlert();
        await callApi('DELETE', { topicId });
    }, [callApi, handleCloseAlert]);

    const handleDeleteTopic = useCallback((topicId, topicName) => {
        setAlertConfig({
            open: true,
            type: 'warning',
            title: 'Xác nhận xóa chủ đề',
            content: <p>Bạn có chắc chắn muốn xóa chủ đề <strong>{topicName}</strong>? Hành động này không thể hoàn tác.</p>,
            actions: (
                <>
                    <button onClick={handleCloseAlert} className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 ${'bg-[var(--gray_b)] m-0'}`}>Hủy</button>
                    <button onClick={() => executeDelete(topicId)} className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 ${'bg-[var(--red)] m-0'}`}>Xóa</button>
                </>
            )
        });
    }, [executeDelete, handleCloseAlert]);

    const handleDownloadTemplate = useCallback(() => {
        window.open(`/api/book/${bookData._id}/import`, '_blank')
    }, [bookData._id])

    const handleImportFile = useCallback((f) => {
        if (!f) return
        const ext = f.name.split('.').pop().toLowerCase()
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            setNotiState({ open: true, status: false, mes: 'Vui lòng chọn file .xlsx, .xls hoặc .csv' })
            return
        }
        setImportFile(f)
    }, [])

    const handleImportUpload = useCallback(async () => {
        if (!importFile) return
        setImportLoading(true)
        setImportErrors([])
        try {
            const fd = new FormData()
            fd.append('file', importFile)
            const res = await fetch(`/api/book/${bookData._id}/import`, { method: 'POST', body: fd })
            const json = await res.json()
            if (json.status) {
                setNotiState({ open: true, status: true, mes: json.mes })
                if (json.data?.errors?.length) setImportErrors(json.data.errors)
                setImportFile(null)
                router.refresh()
            } else {
                setNotiState({ open: true, status: false, mes: json.mes })
            }
        } catch {
            setNotiState({ open: true, status: false, mes: 'Lỗi kết nối máy chủ' })
        } finally {
            setImportLoading(false)
        }
    }, [importFile, bookData._id, router])

    useEffect(() => {
        if (notiState.open) {
            const t = setTimeout(handleCloseNoti, 30000)
            return () => clearTimeout(t)
        }
    }, [notiState.open, handleCloseNoti])

    return (
        <>
            <div className="flex flex-col lg:flex-row w-full min-h-0 h-auto lg:h-[calc(100%-34px)] border border-[var(--border-color)] rounded-lg overflow-y-auto lg:overflow-hidden p-3 sm:p-4 gap-4 bg-white">
                <InfoPanel
                    bookData={bookData}
                    formattedPrice={formattedPrice}
                    onEditClick={() => setPopups(prev => ({ ...prev, isEditPopupOpen: true }))}
                />
                <TopicsPanel
                    topics={bookData.Topics}
                    dragHandlers={{
                        draggedIndex, dragOverIndex,
                        onDragStart: handleDragStart, onDragEnter: handleDragEnter,
                        onDragEnd: handleDragEnd, onDrop: handleDrop
                    }}
                    actionHandlers={{ onEdit: handleOpenEditTopic, onDelete: handleDeleteTopic }}
                    onAddTopic={() => setPopups(prev => ({ ...prev, isAddTopicPopupOpen: true }))}
                    onImport={() => { setImportFile(null); setImportErrors([]); setImportPopupOpen(true) }}
                />
            </div>
            <ActionPopups
                popups={popups}
                handlers={{
                    onCloseEditBook: () => setPopups(prev => ({ ...prev, isEditPopupOpen: false })),
                    onSaveBook: handleSaveBook,
                    onCloseAddTopic: () => setPopups(prev => ({ ...prev, isAddTopicPopupOpen: false })),
                    onSaveTopic: handleSaveTopic,
                    onCloseEditTopic: handleCloseEditTopic,
                    onSaveEditedTopic: handleSaveEditedTopic,
                    isLoading: isLoading,
                }}
                bookData={bookData}
                currentEditingTopic={currentEditingTopic}
            />

            <FlexiblePopup
                open={importPopupOpen}
                onClose={() => { setImportPopupOpen(false); setImportFile(null); setImportErrors([]) }}
                title="Import chủ đề từ Excel"
                width={550}
                renderItemList={() => (
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-primary)]">Tải file mẫu:</span>
                            <button
                                className="px-3 py-1.5 text-sm rounded bg-[var(--main_d)] text-white cursor-pointer border-none hover:brightness-110"
                                onClick={handleDownloadTemplate}
                            >
                                Tải mẫu Excel
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">Cột mẫu: Name (bắt buộc) | Slide (bắt buộc) | Period (bắt buộc) | Content</p>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-[var(--main_d)] hover:bg-[var(--main_d)]/5"
                            onClick={() => document.getElementById('import-file-input')?.click()}
                        >
                            <input id="import-file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden"
                                onChange={(e) => handleImportFile(e.target.files[0])} />
                            {importFile ? (
                                <div className="flex flex-col gap-2 items-center">
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{importFile.name}</span>
                                    <span className="text-xs text-[var(--text-secondary)]">{(importFile.size / 1024).toFixed(1)} KB</span>
                                    <button
                                        className="px-3 py-1 text-xs rounded bg-[var(--red)] text-white cursor-pointer border-none hover:brightness-110"
                                        onClick={(e) => { e.stopPropagation(); setImportFile(null) }}
                                    >
                                        Bỏ chọn
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">Kéo thả file vào đây hoặc nhấn để chọn file</p>
                            )}
                        </div>
                        <button
                            className="px-4 py-2 rounded text-sm font-medium cursor-pointer border-none transition-colors whitespace-nowrap"
                            style={{
                                background: importFile ? 'var(--main_d)' : 'var(--border-color)',
                                color: importFile ? 'white' : 'var(--text-secondary)',
                            }}
                            disabled={!importFile || importLoading}
                            onClick={handleImportUpload}
                        >
                            {importLoading ? 'Đang xử lý...' : 'Import'}
                        </button>
                        {importErrors.length > 0 && (
                            <div className="mt-2 text-xs space-y-0.5 max-h-40 overflow-y-auto">
                                {importErrors.map((e, i) => (
                                    <p key={i} className="text-[var(--red)]">
                                        ✕ Lỗi Dòng {e.row}
                                        {e.Name ? ` (${e.Name})` : ''}: {e.mes}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            />

            {isLoading && <div className='loadingOverlay'><Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang xử lý...</p>} /></div>}
            {importLoading && <div className='loadingOverlay'><Loading content={<p className='text-sm font-normal text-white'>Đang import...</p>} /></div>}
            <Noti open={notiState.open} onClose={handleCloseNoti} status={notiState.status} mes={notiState.mes} />
            <AlertPopup {...alertConfig} onClose={handleCloseAlert} />
        </>
    );
};
export default BookDetail;