'use client';

import { useState } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import VariableChips from './VariableChips';
import { MESSAGE_TYPE_LABELS, inputCls, labelCls } from './constants';
import { saveCareTemplateAction, deleteCareTemplateAction } from '@/app/actions/careTemplate.actions';

export default function TemplatesPopup({
    listOpen,
    onCloseList,
    templates = [],
    onSelectTemplate,
    onRefreshTemplates,
    showNoti,
}) {
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ _id: '', name: '', content: '', messageType: 'notice' });

    const openCreate = () => {
        setForm({ _id: '', name: '', content: '', messageType: 'notice' });
        onCloseList();
        setEditOpen(true);
    };

    const openEdit = (t) => {
        setForm({ _id: t._id, name: t.name, content: t.content, messageType: t.messageType || 'notice' });
        onCloseList();
        setEditOpen(true);
    };

    const handleSave = async () => {
        const fd = new FormData();
        if (form._id) fd.append('_id', form._id);
        fd.append('name', form.name);
        fd.append('content', form.content);
        fd.append('messageType', form.messageType);
        const res = await saveCareTemplateAction(null, fd);
        showNoti(res.status, res.message);
        if (res.status) {
            setEditOpen(false);
            setForm({ _id: '', name: '', content: '', messageType: 'notice' });
            if (onRefreshTemplates) onRefreshTemplates();
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Xóa mẫu này?')) return;
        const fd = new FormData();
        fd.append('_id', id);
        const res = await deleteCareTemplateAction(null, fd);
        showNoti(res.status, res.message);
        if (res.status) {
            if (editOpen) setEditOpen(false);
            if (onRefreshTemplates) onRefreshTemplates();
        }
    };

    return (
        <>
            {/* POPUP DANH SÁCH MẪU */}
            <FlexiblePopup
                open={listOpen}
                onClose={onCloseList}
                title="Mẫu tin nhắn"
                width="820px"
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-xs text-[var(--text-secondary)]">Chọn mẫu để sử dụng / sửa, hoặc tạo mẫu mới.</p>
                            <button
                                onClick={openCreate}
                                className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--main_b)]"
                            >
                                + Tạo mẫu
                            </button>
                        </div>
                        {templates.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Chưa có mẫu nào.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-max">
                                    <thead>
                                        <tr className="bg-[var(--main_d)] text-white">
                                            <th className="p-2 font-medium text-left">Tên</th>
                                            <th className="p-2 font-medium text-left">Loại tin nhắn</th>
                                            <th className="p-2 font-medium text-left">Nội dung</th>
                                            <th className="p-2 font-medium text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {templates.map(t => (
                                            <tr key={t._id} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                                <td className="p-2 font-medium whitespace-nowrap">{t.name}</td>
                                                <td className="p-2 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                                        {MESSAGE_TYPE_LABELS[t.messageType] || 'Khác'}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-2 max-w-md">
                                                    {t.content}
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                if (onSelectTemplate) onSelectTemplate(t.content);
                                                                onCloseList();
                                                            }}
                                                            className="px-2 py-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none hover:bg-blue-700"
                                                        >
                                                            Dùng
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(t)}
                                                            className="px-2 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-300"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t._id)}
                                                            className="px-2 py-1 rounded bg-red-600 text-white text-xs cursor-pointer border-none hover:bg-red-700"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            />

            {/* POPUP TẠO / SỬA MẪU */}
            <FlexiblePopup
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title={form._id ? 'Cập nhật mẫu tin nhắn' : 'Tạo mẫu tin nhắn'}
                width="520px"
                globalZIndex={1100}
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div>
                            <label className={labelCls}>Tên mẫu</label>
                            <input
                                className={inputCls}
                                value={form.name}
                                onChange={e => setForm(t => ({ ...t, name: e.target.value }))}
                                placeholder="VD: Mẫu thông báo nghỉ buổi học"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Loại tin nhắn</label>
                            <select
                                className={inputCls}
                                value={form.messageType}
                                onChange={e => setForm(t => ({ ...t, messageType: e.target.value }))}
                            >
                                {Object.entries(MESSAGE_TYPE_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Nội dung mẫu</label>
                            <textarea
                                rows="5"
                                className={`${inputCls} resize-y`}
                                value={form.content}
                                onChange={e => setForm(t => ({ ...t, content: e.target.value }))}
                                placeholder="Nội dung tin nhắn..."
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-1">Chèn biến động — sẽ được thay bằng dữ liệu riêng của từng học sinh khi gửi:</p>
                            <VariableChips onInsert={tok => setForm(t => ({ ...t, content: (t.content || '') + tok }))} />
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                            {form._id && (
                                <button
                                    type="button"
                                    onClick={() => handleDelete(form._id)}
                                    className="px-4 py-2 rounded bg-red-600 text-white text-sm cursor-pointer border-none hover:bg-red-700"
                                >
                                    Xóa
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium cursor-pointer border-none hover:bg-[var(--main_b)]"
                            >
                                Lưu mẫu
                            </button>
                        </div>
                    </div>
                )}
            />
        </>
    );
}
