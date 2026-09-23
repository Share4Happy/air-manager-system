'use client';
import React from 'react';
import { EventProofLink } from '@/app/events/ui/common';

export default function BudgetProofLink({
    item,
    onUpdateProofLink,
    readOnly = false,
}) {
    const link = item?.proofLink || (item?.receiptFileId ? `https://lh3.googleusercontent.com/d/${item.receiptFileId}` : '');

    return (
        <EventProofLink
            link={link}
            onSaveLink={(newLink) => onUpdateProofLink?.(item.id, newLink)}
            onRemoveLink={() => onUpdateProofLink?.(item.id, '')}
            canEdit={!readOnly}
            permissionWarning="Bạn không có quyền chỉnh sửa link minh chứng ngân sách này."
            placeholder="Dán link Drive (hóa đơn, phiếu chi, chứng từ...)"
            label="Minh chứng"
            compact={true}
        />
    );
}
