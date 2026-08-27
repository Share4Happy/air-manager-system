'use client';
import React, { useState, useCallback, useEffect } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import TopicForm from '@/app/course/book/[id]/ui/AddTopicForm';
import { useRouter } from 'next/navigation';
import { Svg_Add, Svg_Slide, Svg_Pen, Svg_Delete, Svg_Save } from '@/components/(icon)/svg';
import Link from 'next/link';
export default function Create({ availableTypes = [], typeCounts = {}, onTypeDeleted }) {
    const router = useRouter();
    const [openPopup, setOpenPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [newTypeInput, setNewTypeInput] = useState('');
    const SESSION_KEY = 'createbook_program';
    const TOPICS_KEY = 'createbook_topics';

    const getSessionData = () => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    };
    const getSessionTopics = () => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = sessionStorage.getItem(TOPICS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    };
    const saveSession = (data, topicList) => {
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
            sessionStorage.setItem(TOPICS_KEY, JSON.stringify(topicList));
        } catch {}
    };
    const clearSession = () => {
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(TOPICS_KEY);
        } catch {}
    };

    const initialProgramData = { ID: '', Name: '', Type: availableTypes[0] || '', Price: '', Image: null, Badge: null, Describe: '' };
    const [programData, setProgramData] = useState(() => {
        const saved = getSessionData();
        return saved ? { ...initialProgramData, ...saved, Image: null, Badge: null } : initialProgramData;
    });
    const [topics, setTopics] = useState(() => getSessionTopics());
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [secondaryType, setSecondaryType] = useState('add');
    const [editingIndex, setEditingIndex] = useState(null);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMessage, setNotiMessage] = useState('');
    const openPopupHandler = useCallback(() => {
        const saved = getSessionData();
        if (saved) {
            setProgramData({ ...initialProgramData, ...saved, Image: null, Badge: null });
            setTopics(getSessionTopics());
        }
        setOpenPopup(true);
    }, []);
    const closePopupHandler = useCallback(() => {
        setOpenPopup(false);
        setProgramData(prev => ({ ...initialProgramData, Type: availableTypes[0] || '' }));
        setTopics([]);
        setErrorMsg('');
        setNotiOpen(false);
        setNewTypeInput('');
        clearSession();
    }, []);
    const closeSecondary = () => {
        setSecondaryOpen(false);
        setEditingIndex(null);
    };
    useEffect(() => {
        if (openPopup) {
            const { Image, Badge, ...rest } = programData;
            saveSession(rest, topics);
        }
    }, [programData, topics, openPopup]);

    const handleProgramDataChange = (e) => {
        const { name, value } = e.target;
        setProgramData(prev => ({ ...prev, [name]: value }));
    };
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setProgramData(prev => ({ ...prev, [name]: files[0] || null }));
    };
    const addTopic = (topic) => setTopics((prev) => [...prev, topic]);
    const updateTopic = (index, updatedTopic) => {
        setTopics((prev) => prev.map((topic, i) => (i === index ? updatedTopic : topic)));
    };
    const deleteTopic = (index) => setTopics((prev) => prev.filter((_, i) => i !== index));
    const openAddTopicForm = () => {
        setSecondaryType('add');
        setSecondaryOpen(true);
    };
    const openEditTopicForm = (index) => {
        setEditingIndex(index);
        setSecondaryType('edit');
        setSecondaryOpen(true);
    };
    const TopicList = () => {
        if (topics.length === 0) return <p className={'p-3 text-xs text-center text-[var(--text-secondary)]'}>Chưa có chủ đề nào được thêm</p>;
        return (
            <div className={'border border-[var(--border-color)] overflow-hidden'}>
                {topics.map((topic, i) => (
                    <div key={i} className={'border-b border-[var(--border-color)] p-3 bg-[var(--bg-primary)] flex gap-2 mb-3 items-center justify-between'}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={'font-semibold text-sm mr-1'}>{i + 1}. {topic.Name}</span>
                            <span className={'text-sm'}>
                                {topic.Period ? `${topic.Period} tiết` : 'Chưa có thời lượng'}
                                {' – '}
                                {topic.Slide ? <a href={topic.Slide} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Link slide</a> : 'Chưa có slide'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Link target='_blank' href={`${topic.Slide}`} className='p-1.5 flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5' style={{ background: 'var(--main_b)', cursor: 'pointer' }}><Svg_Slide w={16} h={16} c="white" /></Link>
                            <div className='p-1.5 flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5' style={{ background: 'var(--yellow)', cursor: 'pointer' }} onClick={() => openEditTopicForm(i)}><Svg_Pen w={16} h={16} c="white" /></div>
                            <div className='p-1.5 flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5' style={{ background: 'var(--red)', cursor: 'pointer' }} onClick={() => deleteTopic(i)}><Svg_Delete w={16} h={16} c="white" /></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    const handleSaveProgram = (e) => {
        e.preventDefault();
        const errors = [];
        if (!programData.Type) errors.push('Loại chương trình');
        if (!programData.ID) errors.push('ID chương trình');
        else if (programData.ID.length !== 3) errors.push('ID phải có 3 ký tự');
        if (!programData.Name) errors.push('Tên chương trình');
        if (!programData.Image || !programData.Image.size) errors.push('Ảnh bìa');
        if (errors.length) {
            setErrorMsg('Vui lòng nhập: ' + errors.join(', ') + '.');
            return;
        }
        setErrorMsg('');
        const formData = new FormData();
        formData.append('ID', programData.ID);
        formData.append('Name', programData.Name);
        formData.append('Price', Number(programData.Price) || 0);
        formData.append('Type', programData.Type);
        formData.append('Topics', JSON.stringify(topics));
        formData.append('Describe', programData.Describe || '');
        if (programData.Image) formData.append('Image', programData.Image);
        if (programData.Badge) formData.append('Badge', programData.Badge);
        setIsLoading(true);
        fetch('/api/book', { method: 'POST', body: formData })
            .then(async (r) => {
                if (!r.ok) throw await r.json().catch(() => ({ mes: 'Lỗi không xác định' }));
                return r.json();
            })
            .then(() => {
                clearSession();
                setNotiStatus(true);
                setNotiMessage('Đã tạo chương trình thành công!');
                setNotiOpen(true);
                router.refresh();
            })
            .catch((err) => {
                setNotiStatus(false);
                setNotiMessage(err.mes || 'Lỗi từ server, không thể tạo chương trình.');
                setNotiOpen(true);
            })
            .finally(() => setIsLoading(false));
    };
    const renderProgramForm = () => (
        <form className={'flex flex-col gap-4 p-4'} onSubmit={handleSaveProgram}>
            <TextNoti title="Thông tin chương trình học" color="blue" mes="Điền thông tin và thêm các chủ đề cấu thành nên chương trình. ID quy định phải có 3 kí tự" />
            <label className='text-sm font-medium text-[var(--text-primary)]'>Loại chương trình</label>
            <div className='flex flex-wrap gap-2'>
                {availableTypes.map(t => (
                    <span
                        key={t}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            programData.Type === t
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                    >
                        <span className='cursor-pointer' onClick={() => { setProgramData(p => ({ ...p, Type: t })); setNewTypeInput('') }}>{t}</span>
                        <span
                            className='ml-1 w-4 h-4 rounded-full inline-flex items-center justify-center text-xs cursor-pointer hover:bg-black/10'
                            onClick={(e) => {
                                e.stopPropagation()
                                const count = typeCounts[t] || 0
                                if (count > 0) {
                                    setNotiStatus(false)
                                    setNotiMessage(`Không thể xóa "${t}". Còn ${count} chương trình thuộc loại này.`)
                                    setNotiOpen(true)
                                } else {
                                    if (onTypeDeleted) onTypeDeleted()
                                }
                            }}
                        >
                            ✕
                        </span>
                    </span>
                ))}
                {programData.Type && !availableTypes.includes(programData.Type) && (
                    <span className='px-3 py-1.5 rounded-full text-sm bg-blue-600 text-white border border-blue-600'>
                        {programData.Type}
                    </span>
                )}
                <div className='flex items-center gap-1'>
                    <input
                        type='text'
                        className='px-2 py-1.5 border border-gray-300 bg-white text-sm outline-none text-gray-700 w-[120px]'
                        placeholder='Thêm loại...'
                        value={newTypeInput}
                        onChange={e => setNewTypeInput(e.target.value)}
                    />
                    <span
                        className={`px-3 py-1.5 rounded-full text-sm cursor-pointer border ${
                            newTypeInput.trim() ? 'bg-gray-100 text-gray-700 border-gray-300 hover:border-blue-400' : 'text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        onClick={() => {
                            if (newTypeInput.trim()) {
                                setProgramData(p => ({ ...p, Type: newTypeInput.trim() }));
                                setNewTypeInput('');
                            }
                        }}
                    >
                        + Thêm
                    </span>
                </div>
            </div>
            <input name="ID" value={programData.ID} onChange={handleProgramDataChange} type='text' className='px-3 py-2.5 border border-gray-200 bg-white text-sm outline-none text-gray-700 resize-none' placeholder='ID chương trình (ví dụ: FZ1)' required />
            <input name="Name" value={programData.Name} onChange={handleProgramDataChange} type='text' className='px-3 py-2.5 border border-gray-200 bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Tên chương trình (ví dụ: Lập trình Scratch cấp độ 1)' required />
            <input name="Price" value={programData.Price} onChange={handleProgramDataChange} type='number' className='px-3 py-2.5 border border-gray-200 bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Học phí' />
            <textarea name="Describe" value={programData.Describe} onChange={handleProgramDataChange} className='px-3 py-2.5 border border-gray-200 bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Mô tả chương trình' style={{ height: 100, resize: 'none' }} />
            <TextNoti title="Hình ảnh chương trình học" color="blue" mes="Hình ảnh bìa và huy hiệu sẽ được sử dụng cho hồ sơ điện tử học sinh." />
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3'>
                <div className={'flex flex-col gap-1 font-sans border border-[#ddd] p-2 rounded-lg'}>
                    <input type="file" id="cover-image-upload" name="Image" className={'w-[0.1px] h-[0.1px] opacity-0 overflow-hidden absolute z-[-1]'} onChange={handleFileChange} accept="image/*" />
                    <label htmlFor="cover-image-upload" className={'inline-flex items-center gap-2 px-4 py-2 bg-[var(--main_d)] cursor-pointer font-medium justify-center rounded'}>
                        <Svg_Save w={16} h={16} c="white" />
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải ảnh bìa</p>
                    </label>
                    <span className={'text-xs text-[#555] text-center truncate'}>{programData.Image?.name || "Chưa chọn ảnh"}</span>
                </div>
                <div className={'flex flex-col gap-1 font-sans border border-[#ddd] p-2 rounded-lg'}>
                    <input type="file" id="badge-image-upload" name="Badge" className={'w-[0.1px] h-[0.1px] opacity-0 overflow-hidden absolute z-[-1]'} onChange={handleFileChange} accept="image/*" />
                    <label htmlFor="badge-image-upload" className={'inline-flex items-center gap-2 px-4 py-2 bg-[var(--main_d)] cursor-pointer font-medium justify-center rounded'}>
                        <Svg_Save w={16} h={16} c="white" />
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải ảnh huy hiệu</p>
                    </label>
                    <span className={'text-xs text-[#555] text-center truncate'}>{programData.Badge?.name || "Chưa chọn ảnh"}</span>
                </div>
            </div>

            {errorMsg && <p className={'text-red-600 text-xs font-medium'} style={{ marginTop: 8 }}>{errorMsg}</p>}
            <TextNoti title="Danh sách chủ đề" color="blue" mes="Thêm các chủ đề sẽ có trong chương trình này." />
            <div className={'flex gap-2'}>
                <button type="button" style={{ display: 'flex', gap: 8, alignItems: 'center' }} className={'px-4 py-2 bg-[var(--main_d)] text-white border-none cursor-pointer font-semibold rounded'} onClick={openAddTopicForm}>
                    <Svg_Add w={16} h={16} c="white" />
                    <span className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Thêm chủ đề</span>
                </button>
            </div>
            <TopicList />
            <button type="submit" className={'self-end px-5 py-2 bg-[var(--main_d)] text-white border-none cursor-pointer font-semibold rounded'} disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu chương trình'}</button>
        </form>
    );
    return (
        <>
            <div className={'px-3 sm:px-4 py-2 bg-[var(--main_d)] flex items-center justify-center gap-2 w-full sm:w-max rounded-lg text-white text-sm font-medium cursor-pointer hover:bg-[var(--main_b)] transition-colors whitespace-nowrap'} onClick={openPopupHandler}>
                <Svg_Add w={16} h={16} c="white" />
                <span className='text-sm' style={{ color: 'white' }}>Thêm chương trình</span>
            </div>
            <FlexiblePopup open={openPopup} onClose={closePopupHandler} title="Tạo chương trình học mới" width={600} renderItemList={renderProgramForm} secondaryOpen={secondaryOpen} onCloseSecondary={closeSecondary}
                renderSecondaryList={() => {
                    if (secondaryType === 'edit') {
                        return <TopicForm initialData={topics[editingIndex]} onSave={(updatedTopic) => { updateTopic(editingIndex, updatedTopic); closeSecondary(); }} onCancel={closeSecondary} isLoading={isLoading} />;
                    }
                    return <TopicForm onSave={(newTopic) => { addTopic(newTopic); closeSecondary(); }} onCancel={closeSecondary} isLoading={isLoading} />;
                }}
                secondaryTitle={secondaryType === 'edit' ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
                centered secondaryCentered titleCentered
            />
            {isLoading && <div className='loadingOverlay'><Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang xử lý...</p>} /></div>}
            <Noti open={notiOpen} onClose={() => setNotiOpen(false)} status={notiStatus} mes={notiMessage}
                button={
                    <div className={'w-[calc(100%-24px)] justify-center p-2.5 bg-[var(--main_d)] flex items-center gap-2 text-white text-sm font-medium cursor-pointer'} onClick={() => { setNotiOpen(false); if (notiStatus) closePopupHandler(); }}>Đóng</div>
                }
            />
        </>
    );
}