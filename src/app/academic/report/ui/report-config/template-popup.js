'use client'

import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { inputCls, labelCls, MESSAGE_TYPE_LABELS, SubmitButton } from './constants'

export default function TemplatePopup({
    open,
    onClose,
    action,
    templateForm,
    setTemplateForm,
}) {
    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title={templateForm._id ? 'Cập nhật mẫu tin nhắn' : 'Tạo mẫu tin nhắn'}
            width="560px"
            globalZIndex={1100}
            renderItemList={() => (
                <form action={action} className="flex flex-col gap-3 p-4">
                    <input type="hidden" name="_id" value={templateForm._id} />
                    <div>
                        <label className={labelCls}>Tên mẫu</label>
                        <input className={inputCls} name="name" placeholder="VD: Mẫu báo cáo cuối tuần"
                            value={templateForm.name} onChange={e => setTemplateForm(t => ({ ...t, name: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Loại báo cáo</label>
                        <select className={inputCls} name="reportType" value={templateForm.reportType}
                            onChange={e => setTemplateForm(t => ({ ...t, reportType: e.target.value }))}>
                            <option value="all">Tất cả</option>
                            <option value="attendance">Chuyên cần</option>
                            <option value="monthly">Thống kê tháng</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Loại tin nhắn</label>
                        <select className={inputCls} name="messageType" value={templateForm.messageType}
                            onChange={e => setTemplateForm(t => ({ ...t, messageType: e.target.value }))}>
                            {Object.entries(MESSAGE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-[var(--text-secondary)] flex flex-col gap-1.5">
                            <span className="font-semibold text-[var(--text-primary)]">Hướng dẫn tạo mẫu</span>
                            <span>• Nhập tên mẫu và nội dung, chọn loại báo cáo để lọc khi chọn mẫu trong cấu hình.</span>
                            <span>• Dữ liệu tự động (được thay khi gửi):</span>
                            <span className="pl-3">{'{body}'} — nội dung báo cáo tự sinh (chuyên cần / thống kê tháng)</span>
                            <span className="pl-3">{'{period}'} — kỳ báo cáo (vd: 05/08/2026 - 06/08/2026 hoặc Tháng 7/2026)</span>
                            <span className="pl-3">{'{date}'} — ngày gửi tin</span>
                            <span>• Ví dụ: "Kính gửi, {'{body}'} Trân trọng."</span>
                        </div>
                        <label className={labelCls}>Nội dung mẫu</label>
                        <textarea rows="6" className={`${inputCls} resize-y`} name="content"
                            value={templateForm.content} onChange={e => setTemplateForm(t => ({ ...t, content: e.target.value }))} />
                    </div>
                    <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                        <SubmitButton text="Lưu mẫu" />
                    </div>
                </form>
            )}
        />
    )
}
