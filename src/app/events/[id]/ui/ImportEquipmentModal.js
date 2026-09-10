'use client';
import React from 'react';
import { IconPackage } from '@/app/events/ui/icons';
import { ImportExcelModal } from '@/app/events/ui/common';

export default function ImportEquipmentModal({ isOpen, onClose, eventId, onImportSuccess }) {
    return (
        <ImportExcelModal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Danh sách Thiết bị & Linh kiện"
            subtitle="Nhập file Excel để nạp nhanh danh mục thiết bị, linh kiện, mô hình mang theo sự kiện"
            icon={IconPackage}
            templateUrl="/api/events/equipment/template"
            templateButtonText="Tải file mẫu .xlsx"
            templateHint="Chưa có file mẫu? Tải file mẫu chuẩn để điền thông tin thiết bị nhanh nhất."
            uploadUrl={`/api/events/${eventId}/equipment/import`}
            fieldName="equipmentChecklist"
            radioName="importModeEquipment"
            onImportSuccess={onImportSuccess}
        />
    );
}
