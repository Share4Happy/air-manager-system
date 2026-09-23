'use client';
import React from 'react';
import { canEditTaskProofLink } from './roadmapPermissions';
import { EventProofLink } from '@/app/events/ui/common';

export default function TaskProofLink({
    task,
    onUpdateProofLink,
    currentUser = null,
    members = [],
    event = {},
    readOnly = false,
}) {
    const canEdit = !readOnly && canEditTaskProofLink(currentUser, members, task, event);
    const link = task?.proofLink || '';

    return (
        <EventProofLink
            link={link}
            onSaveLink={(newLink) => onUpdateProofLink?.(task.id, newLink)}
            onRemoveLink={() => onUpdateProofLink?.(task.id, '')}
            canEdit={canEdit}
            permissionWarning="Bạn không có quyền gắn hoặc chỉnh sửa link minh chứng cho công việc này. Chỉ người được phân công hoặc Ban quản lý/Thư ký mới có quyền thao tác."
            placeholder="Dán link minh chứng (Google Drive, Docs, Ảnh, Báo cáo...)"
            label="Minh chứng"
            className="mt-1"
        />
    );
}
