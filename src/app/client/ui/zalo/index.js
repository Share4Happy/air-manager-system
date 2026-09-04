'use client';
import React, { useState, useEffect, useActionState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { selectZaloAccountAction } from '@/app/actions/zalo.actions';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Logout, Svg_Setting } from '@/components/(icon)/svg';
import { defaultAvatarUrl } from '@/function';
import Image from 'next/image';

function SelectableZaloItem({ item, action }) {
    const { pending } = useFormStatus();
    return (
        <form action={action} className="w-full">
            <input type="hidden" name="zaloAccountId" value={item._id} />
            <button
                type="submit"
                disabled={pending}
                className="w-full flex items-center justify-between p-3 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--hover)] transition-colors cursor-pointer text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Image
                        src={item.avt || defaultAvatarUrl()}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--border-color)]"
                    />
                    <div className="flex flex-col min-w-0">
                        <h5 className="font-semibold text-sm truncate">{item.name}</h5>
                        <h6 className="text-xs text-[var(--text-secondary)] font-normal">{item.phone || 'Chưa có SĐT'}</h6>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <span className="w-2 h-2 rounded-full bg-[var(--green)]"></span>
                        <span className="hidden sm:inline">Hoạt động</span>
                    </div>
                    <span className="px-3 py-1.5 rounded bg-[var(--main_b)] hover:bg-[var(--main_d)] text-white text-xs font-medium transition-colors">
                        {pending ? 'Đang chọn...' : 'Chọn'}
                    </span>
                </div>
            </button>
        </form>
    );
}

export default function SettingZalo({ user, zalo = [] }) {
    const router = useRouter();
    const [isRightPopupOpen, setIsRightPopupOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [selectState, selectAction, isSelectPending] = useActionState(selectZaloAccountAction, { message: null, status: null });

    useEffect(() => {
        if (selectState.message) {
            setNotification({ open: true, status: selectState.status, mes: selectState.message });
            if (selectState.status === true) {
                router.refresh();
                setIsRightPopupOpen(false);
            }
        }
    }, [selectState, router]);

    const handleCloseNoti = () => setNotification(prev => ({ ...prev, open: false }));

    const currentZalo = user?.zalo;

    const filteredZaloList = useMemo(() => {
        if (!Array.isArray(zalo)) return [];
        return zalo.filter(item => {
            if (currentZalo?._id && item._id === currentZalo._id) return false;
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            return (
                item.name?.toLowerCase().includes(term) ||
                item.phone?.includes(term)
            );
        });
    }, [zalo, currentZalo, searchTerm]);

    return (
        <>
            {/* Nút trigger trực quan, đồng bộ với phong cách hệ thống */}
            {currentZalo ? (
                <div
                    onClick={() => setIsRightPopupOpen(true)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-white border border-[var(--border-color)] hover:bg-[var(--hover)] cursor-pointer transition-all shadow-xs"
                    title="Nhấn để đổi tài khoản Zalo"
                >
                    <Image
                        src={currentZalo.avt || defaultAvatarUrl()}
                        alt={currentZalo.name}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200"
                    />
                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                            <h5 className="font-semibold text-xs leading-tight max-w-[120px] truncate">
                                {currentZalo.name}
                            </h5>
                            <span className="w-2 h-2 rounded-full bg-[var(--green)] shrink-0"></span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                            {currentZalo.phone || 'Đang kết nối'}
                        </p>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] ml-1 pl-2 border-l border-[var(--border-color)] font-medium">
                        Đổi
                    </span>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsRightPopupOpen(true)}
                    className="px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100"
                >
                    <Svg_Setting w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                    <h5 className="font-normal">Chọn tài khoản Zalo</h5>
                </button>
            )}

            {/* Popup chọn tài khoản */}
            <FlexiblePopup
                open={isRightPopupOpen}
                onClose={() => setIsRightPopupOpen(false)}
                title="Chọn tài khoản Zalo làm việc"
                width={'540px'}
                renderItemList={() => (
                    <div className="p-4 flex flex-col gap-3 h-[calc(100%-32px)]">
                        {/* Tài khoản hiện tại */}
                        <div>
                            <h6 className="text-xs text-[var(--text-secondary)] mb-2 font-medium">Tài khoản đang liên kết</h6>
                            {currentZalo ? (
                                <div className="p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Image
                                            src={currentZalo.avt || defaultAvatarUrl()}
                                            alt={currentZalo.name}
                                            width={44}
                                            height={44}
                                            className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-200"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-semibold text-sm truncate">{currentZalo.name}</h5>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--green)] text-white font-medium">
                                                    Đang dùng
                                                </span>
                                            </div>
                                            <h6 className="text-xs text-[var(--text-secondary)] font-normal">{currentZalo.phone || 'Chưa có SĐT'}</h6>
                                        </div>
                                    </div>

                                    <form action={selectAction} className="shrink-0">
                                        <input type="hidden" name="zaloAccountId" value="" />
                                        <button
                                            type="submit"
                                            disabled={isSelectPending}
                                            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 flex items-center gap-1.5 text-xs font-medium cursor-pointer border-none transition-colors"
                                        >
                                            <Svg_Logout w={'14'} h={'14'} c={'var(--text-primary)'} />
                                            <h5>{isSelectPending ? 'Đang xử lý...' : 'Thoát tài khoản'}</h5>
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="py-3 px-4 border border-dashed border-[var(--border-color)] rounded text-center">
                                    <p className="text-xs text-[var(--text-secondary)]">Chưa chọn tài khoản Zalo làm việc. Hãy chọn một tài khoản bên dưới.</p>
                                </div>
                            )}
                        </div>

                        {/* Danh sách tài khoản khả dụng */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-color)]">
                                <h6 className="text-xs text-[var(--text-secondary)] font-medium">Danh sách tài khoản ({filteredZaloList.length})</h6>
                                {zalo.length > 3 && (
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm tài khoản..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-2.5 py-1 text-xs border border-gray-300 rounded outline-none w-40 bg-white"
                                    />
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                                {filteredZaloList.length > 0 ? (
                                    filteredZaloList.map((item) => (
                                        <SelectableZaloItem key={item._id} item={item} action={selectAction} />
                                    ))
                                ) : (
                                    <p className="text-xs text-[var(--text-secondary)] text-center p-6">
                                        {searchTerm ? 'Không tìm thấy tài khoản phù hợp.' : 'Không có tài khoản Zalo nào khác.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            />

            {isSelectPending && (
                <div className="loadingOverlay">
                    <Loading content={<h5>Đang xử lý...</h5>} />
                </div>
            )}

            <Noti
                open={notification.open}
                onClose={handleCloseNoti}
                status={notification.status}
                mes={notification.mes}
            />
        </>
    );
}