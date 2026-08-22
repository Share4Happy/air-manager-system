'use client'

import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { inputCls, labelCls, SubmitButton } from './constants'

export default function SettingsPopup({
    open,
    onClose,
    action,
    settingsForm,
    setSettingsForm,
}) {
    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title="Cài đặt gửi tin báo cáo"
            width="520px"
            renderItemList={() => (
                <form action={action} className="flex flex-col gap-3 p-4">
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className={labelCls}>Chênh lệch giữa 2 tin (phút) — tối thiểu</label>
                            <input type="number" min="1" className={inputCls} name="staggerMinMin" value={settingsForm.staggerMinMin}
                                onChange={e => setSettingsForm(f => ({ ...f, staggerMinMin: Number(e.target.value) }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Chênh lệch giữa 2 tin (phút) — tối đa</label>
                            <input type="number" min="1" className={inputCls} name="staggerMaxMin" value={settingsForm.staggerMaxMin}
                                onChange={e => setSettingsForm(f => ({ ...f, staggerMaxMin: Number(e.target.value) }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Giới hạn tin nhắn mỗi giờ</label>
                            <input type="number" min="1" className={inputCls} name="hourlyLimit" value={settingsForm.hourlyLimit}
                                onChange={e => setSettingsForm(f => ({ ...f, hourlyLimit: Number(e.target.value) }))} />
                        </div>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex flex-col gap-1">
                        <span className="font-semibold">Lưu ý</span>
                        <span>• Thời gian gửi giữa mỗi người nhận sẽ ngẫu nhiên trong khoảng chênh lệch đã chọn (tránh spam, giảm rủi ro khoá tài khoản Zalo).</span>
                        <span>• Khi đạt giới hạn tin nhắn trong giờ, phần còn lại sẽ tạm dừng và tự gửi tiếp lúc giờ sau + 30 phút.</span>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                        <SubmitButton text="Lưu cài đặt" />
                    </div>
                </form>
            )}
        />
    )
}
