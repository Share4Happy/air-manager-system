'use client';

import { useState } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { fmtDate } from './constants';

export default function NotifyConfirmPopup({
    target,
    onClose,
    onSuccess,
    showNoti,
    userName = '—',
}) {
    const [notifying, setNotifying] = useState(false);

    if (!target) return null;

    const handleNotify = async () => {
        setNotifying(true);
        try {
            const res = await fetch('/api/client/lesson-cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: target.courseId, detailId: target.detailId, method: 'care' }),
            });
            const json = await res.json();
            showNoti(json.success, json.success ? 'Đã đánh dấu thông báo thành công.' : (json.error || 'Lỗi hệ thống.'));
            if (json.success) {
                onClose();
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error(err);
            showNoti(false, err.message || 'Lỗi hệ thống.');
        } finally {
            setNotifying(false);
        }
    };

    return (
        <FlexiblePopup
            open={!!target}
            onClose={onClose}
            title={`Đã thông báo - ${target.courseID}`}
            width="460px"
            renderItemList={() => (
                <div className="flex flex-col gap-3 p-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Xác nhận đã thông báo buổi {target.kind === 'cancel' ? 'nghỉ ' : 'học '}
                        <span className="text-[var(--text-primary)] font-medium">{fmtDate(target.day)}</span> của lớp{' '}
                        <span className="text-[var(--text-primary)] font-medium">{target.courseID}</span> cho phụ huynh.
                    </p>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-[var(--text-secondary)]">
                        Người xác nhận: <span className="text-[var(--text-primary)] font-medium">{userName}</span>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                        <button
                            onClick={handleNotify}
                            disabled={notifying}
                            className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium cursor-pointer border-none hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {notifying ? 'Đang lưu...' : 'Xác nhận đã thông báo'}
                        </button>
                    </div>
                </div>
            )}
        />
    );
}
