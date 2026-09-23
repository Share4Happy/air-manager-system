'use client';
import React from 'react';
import { IconInbox } from '@/app/events/ui/icons';
import { ImportExcelModal } from '@/app/events/ui/common';

export default function ImportMembersModal({ isOpen, onClose, eventId, onImportSuccess }) {
    return (
        <ImportExcelModal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Danh sách Thành viên & Khách mời"
            subtitle="Tải file Excel để import danh sách thành viên, trọng tài, tình nguyện viên..."
            icon={IconInbox}
            templateUrl="/api/events/members/template"
            templateButtonText="Tải file mẫu .xlsx"
            templateHint="Chưa có mẫu sẵn? Tải file mẫu chuẩn để điền thông tin nhanh chóng."
            uploadUrl={`/api/events/${eventId}/members/import`}
            fieldName="members"
            radioName="importModeMembers"
            onImportSuccess={onImportSuccess}
        />
    );
}
