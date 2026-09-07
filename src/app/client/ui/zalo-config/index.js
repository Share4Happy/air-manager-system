'use client';

import React, { useState, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { addZaloAccountAction, updateZaloRolesAction } from '@/app/actions/zalo.actions';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Noti from '@/components/(features)/(noti)/noti';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';
import { Svg_Add, Svg_Delete } from '@/components/(icon)/svg';
import Image from 'next/image';
import { defaultAvatarUrl } from '@/function';

function SubmitBtn({ text = 'Lưu' }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="px-3.5 py-2 bg-[var(--main_b)] flex items-center gap-2 rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 hover:bg-[var(--main_d)] disabled:opacity-50"
        >
            {pending ? 'Đang xử lý...' : text}
        </button>
    );
}

function AddAccountForm({ formAction, formState, onClose }) {
    const [botId, setBotId] = useState('');
    useEffect(() => {
        if (formState.status === true) setBotId('');
    }, [formState]);

    return (
        <form action={formAction} className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">Bot ID (ZaloLite UUID)</label>
                <input
                    name="botId"
                    placeholder="VD: f61c40f5-cb8d-4502-8b81-9bebbe705b31"
                    required
                    value={botId}
                    onChange={(e) => setBotId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 font-mono focus:border-[var(--main_d)]"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                    Nhập UUID bot từ ZaloLite API Gateway. Hệ thống sẽ tự động lấy thông tin bot (tên, avatar, số điện thoại) qua API.
                </p>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border-color)]">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded bg-gray-100 text-sm text-gray-700 cursor-pointer border border-gray-300 hover:bg-gray-200"
                >
                    Hủy
                </button>
                <SubmitBtn text="Thêm tài khoản" />
            </div>
        </form>
    );
}

function RoleManager({ zaloAccount, allUsers, formAction, onClose }) {
    const [assignedUserIds, setAssignedUserIds] = useState(() => new Set(zaloAccount.roles?.map(r => r._id || r) || []));
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const availableUsers = allUsers.filter(u => !assignedUserIds.has(u._id) && (u.role?.[0] === 'Sale' || u.role?.[0] === 'Admin' || u.role?.includes('Sale') || u.role?.includes('Admin')));
    const assignedUsers = allUsers.filter(u => assignedUserIds.has(u._id));

    const handleAddUser = (user) => {
        setAssignedUserIds(prev => new Set(prev).add(user._id));
        setIsMenuOpen(false);
    };
    const handleRemoveUser = (userId) => {
        setAssignedUserIds(prev => {
            const s = new Set(prev);
            s.delete(userId);
            return s;
        });
    };

    return (
        <form action={formAction} className="flex flex-col">
            <input type="hidden" name="zaloAccountId" value={zaloAccount._id} />
            <input type="hidden" name="userIds" value={JSON.stringify(Array.from(assignedUserIds))} />
            <Title content={`Phân quyền - ${zaloAccount.name}`} click={onClose} />
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto p-4">
                <h6 className="text-sm font-medium text-[var(--text-primary)]">Người dùng được cấp quyền:</h6>
                {assignedUsers.length > 0 ? (
                    assignedUsers.map(user => (
                        <div key={user._id} className="flex justify-between items-center p-2.5 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)]">
                            <div className="flex items-center gap-2.5">
                                <Image src={user.avt || defaultAvatarUrl()} alt={user.name} width={34} height={34} className="w-8.5 h-8.5 rounded-full object-cover border border-gray-200" />
                                <div>
                                    <h5 className="text-sm font-medium text-[var(--text-primary)]">{user.name}</h5>
                                    <p className="text-xs text-[var(--text-secondary)]">{user.phone || 'Chưa có SĐT'} • {user.role?.[0] || 'Staff'}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveUser(user._id)}
                                className="bg-transparent border-none cursor-pointer p-1.5 rounded-md hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                                title="Xóa quyền"
                            >
                                <Svg_Delete w="14" h="14" c="currentColor" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-[var(--text-secondary)] text-center p-4 italic">Chưa có người dùng nào được phân quyền.</p>
                )}
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--border-color)] bg-gray-50/50">
                <Menu
                    isOpen={isMenuOpen}
                    onOpenChange={setIsMenuOpen}
                    customButton={
                        <button
                            type="button"
                            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 flex items-center gap-1.5 cursor-pointer border-none text-xs font-medium text-gray-700 transition-colors"
                        >
                            <Svg_Add w="12" h="12" c="var(--text-primary)" />
                            Thêm người dùng
                        </button>
                    }
                    menuItems={
                        <div className="p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[200px] overflow-y-auto shadow-lg z-50">
                            {availableUsers.length > 0 ? (
                                availableUsers.map(user => (
                                    <div
                                        key={user._id}
                                        onClick={() => handleAddUser(user)}
                                        className="text-xs px-2.5 py-2 rounded cursor-pointer hover:bg-[var(--hover)] transition-colors flex items-center gap-2"
                                    >
                                        <Image src={user.avt || defaultAvatarUrl()} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                                        <span className="font-medium text-gray-800">{user.name}</span>
                                        <span className="text-[11px] text-gray-400">({user.role?.[0]})</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-[var(--text-secondary)] text-center p-2">Tất cả nhân viên đã được gán</p>
                            )}
                        </div>
                    }
                    menuPosition="top"
                />
                <SubmitBtn text="Lưu phân quyền" />
            </div>
        </form>
    );
}

function ZaloLiteSection({ showNoti }) {
    const [form, setForm] = useState({
        baseUrl: 'https://sms-service.talab.io.vn/api/gateway/v1.0',
        apiKey: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch('/api/notifications/settings')
            .then(r => r.json())
            .then(json => {
                if (json.success && Array.isArray(json.data)) {
                    const map = {};
                    json.data.forEach(s => { map[s.key] = s.value; });
                    setForm({
                        baseUrl: map.ZALOLITE_BASE_URL || 'https://sms-service.talab.io.vn/api/gateway/v1.0',
                        apiKey: map.ZALOLITE_API_KEY || '',
                    });
                }
            })
            .catch(err => {
                console.error('Fetch ZaloLite settings error:', err);
                showNoti(false, 'Không thể tải cấu hình ZaloLite.');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: [
                        { key: 'ZALOLITE_BASE_URL', value: form.baseUrl.trim() },
                        { key: 'ZALOLITE_API_KEY', value: form.apiKey.trim() },
                    ],
                }),
            });
            const json = await res.json();
            if (json.success) {
                showNoti(true, 'Đã lưu cấu hình ZaloLite Gateway thành công.');
            } else {
                showNoti(false, json.error || 'Lỗi khi lưu cấu hình.');
            }
        } catch (err) {
            console.error(err);
            showNoti(false, 'Lỗi kết nối khi lưu cấu hình.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <div>
                    <h5 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                        <span>Cấu hình ZaloLite API Gateway</span>
                        {form.apiKey ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700">
                                Đã cấu hình Key
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700">
                                Chưa có Key
                            </span>
                        )}
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Cấu hình endpoint và khóa API để hệ thống gửi tin nhắn Zalo tự động qua ZaloLite Gateway.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="py-4 text-center text-xs text-[var(--text-secondary)] italic">Đang tải cấu hình ZaloLite...</div>
            ) : (
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">
                            Base URL <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.baseUrl}
                            onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
                            placeholder="https://sms-service.talab.io.vn/api/gateway/v1.0"
                            required
                            className="px-3 py-2 border border-gray-300 rounded bg-white text-xs outline-none text-gray-700 font-mono focus:border-[var(--main_d)]"
                        />
                        <p className="text-[11px] text-[var(--text-secondary)]">Endpoint chính của gateway ZaloLite.</p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-[var(--text-primary)]">
                                API Key <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="text-[11px] text-[var(--main_d)] hover:underline cursor-pointer border-none bg-transparent"
                            >
                                {showKey ? 'Ẩn khóa' : 'Hiện khóa'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={form.apiKey}
                                onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
                                placeholder="zlite_..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-xs outline-none text-gray-700 font-mono focus:border-[var(--main_d)]"
                            />
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white text-xs font-medium rounded cursor-pointer border-none shadow-xs transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu ZaloLite'}
                            </button>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">Khóa API xác thực để phân quyền gửi tin nhắn.</p>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function ZaloConfig({ zaloData = [], allUsers = [] }) {
    const router = useRouter();
    const [subTab, setSubTab] = useState('proxy'); // 'proxy', 'zalolite'
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [editingProxy, setEditingProxy] = useState(null);
    const [proxyInput, setProxyInput] = useState('');
    const [savingProxy, setSavingProxy] = useState(false);
    const [search, setSearch] = useState('');
    const [proxyFilter, setProxyFilter] = useState('all'); // 'all', 'has', 'none'
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });

    const [updateState, updateAction] = useActionState(updateZaloRolesAction, { message: null, status: null });
    const [addState, addAction] = useActionState(addZaloAccountAction, { message: null, status: null });

    const showNoti = (status, mes) => setNotification({ open: true, status, mes });

    useEffect(() => {
        if (updateState.message) {
            showNoti(updateState.status, updateState.message);
            if (updateState.status === true) {
                setSelectedAccount(null);
                router.refresh();
            }
        }
    }, [updateState, router]);

    useEffect(() => {
        if (addState.message) {
            showNoti(addState.status, addState.message);
            if (addState.status === true) {
                setShowAddForm(false);
                router.refresh();
            }
        }
    }, [addState, router]);

    const handleDelete = async (id, name) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"?`)) return;
        try {
            const res = await fetch(`/api/zalo/${id}`, { method: 'DELETE' });
            const json = await res.json();
            showNoti(json.success, json.success ? 'Đã xóa tài khoản Zalo.' : json.message || 'Lỗi khi xóa.');
            if (json.success) router.refresh();
        } catch {
            showNoti(false, 'Lỗi kết nối khi xóa tài khoản.');
        }
    };

    const handleSaveProxyInline = async (accId, customValue = null) => {
        const valueToSave = customValue !== null ? customValue : proxyInput;
        setSavingProxy(true);
        try {
            const res = await fetch(`/api/zalo/${accId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxy: valueToSave.trim() }),
            });
            const json = await res.json();
            showNoti(json.success, json.success ? 'Đã cập nhật proxy cho tài khoản Zalo.' : json.error || 'Lỗi khi cập nhật.');
            if (json.success) {
                setEditingProxy(null);
                router.refresh();
            }
        } catch {
            showNoti(false, 'Lỗi kết nối khi cập nhật proxy.');
        } finally {
            setSavingProxy(false);
        }
    };

    const filteredAccounts = useMemo(() => {
        return zaloData.filter(acc => {
            const q = search.toLowerCase().trim();
            const matchSearch = !q ||
                acc.name?.toLowerCase().includes(q) ||
                acc.phone?.includes(q) ||
                acc.uid?.toLowerCase().includes(q) ||
                acc.proxy?.toLowerCase().includes(q);

            if (!matchSearch) return false;
            if (proxyFilter === 'has') return !!acc.proxy;
            if (proxyFilter === 'none') return !acc.proxy;
            return true;
        });
    }, [zaloData, search, proxyFilter]);

    const saleUsers = allUsers.filter(u => u.role?.[0] === 'Sale' || u.role?.[0] === 'Admin' || u.role?.includes('Sale') || u.role?.includes('Admin'));

    return (
        <div className="flex flex-col gap-4 flex-1">
            {/* Top Sub-navigation Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-1 bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] p-1">
                    <button
                        onClick={() => setSubTab('proxy')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                            subTab === 'proxy'
                                ? 'bg-[var(--main_d)] text-white shadow-xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
                        }`}
                    >
                        Zalo Proxy ({zaloData.filter(a => a.proxy).length}/{zaloData.length})
                    </button>
                    <button
                        onClick={() => setSubTab('zalolite')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                            subTab === 'zalolite'
                                ? 'bg-[var(--main_d)] text-white shadow-xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
                        }`}
                    >
                        ZaloLite Gateway
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-3.5 py-1.5 bg-[var(--main_d)] hover:bg-[var(--main_b)] flex items-center gap-1.5 rounded text-white text-xs font-medium cursor-pointer border-none shadow-xs transition-colors"
                    >
                        <Svg_Add w="12" h="12" c="white" />
                        <span>Thêm tài khoản Bot ID</span>
                    </button>
                </div>
            </div>

            {/* ZaloLite Gateway Section */}
            {subTab === 'zalolite' && (
                <ZaloLiteSection showNoti={showNoti} />
            )}

            {/* Zalo Proxy & Accounts Section */}
            {subTab === 'proxy' && (
                <div className="bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[var(--border-color)]">
                        <div>
                            <h5 className="font-semibold text-sm text-[var(--text-primary)]">
                                Danh sách tài khoản Zalo & Cấu hình Proxy
                            </h5>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Quản lý địa chỉ Proxy, trạng thái kết nối và phân quyền nhân viên sử dụng từng tài khoản Zalo.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="text"
                                placeholder="Tìm theo tên, SĐT, UID, Proxy..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded bg-white text-xs outline-none text-gray-700 w-56 focus:border-[var(--main_d)]"
                            />
                            <select
                                value={proxyFilter}
                                onChange={e => setProxyFilter(e.target.value)}
                                className="px-2.5 py-1.5 border border-gray-300 rounded bg-white text-xs outline-none text-gray-700 cursor-pointer focus:border-[var(--main_d)]"
                            >
                                <option value="all">Tất cả tài khoản ({zaloData.length})</option>
                                <option value="has">Đã có Proxy ({zaloData.filter(a => a.proxy).length})</option>
                                <option value="none">Chưa có Proxy ({zaloData.filter(a => !a.proxy).length})</option>
                            </select>
                        </div>
                    </div>

                    {filteredAccounts.length === 0 ? (
                        <div className="text-center py-10 text-xs text-[var(--text-secondary)] italic">
                            {search || proxyFilter !== 'all' ? 'Không tìm thấy tài khoản phù hợp với bộ lọc.' : 'Chưa có tài khoản Zalo nào.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredAccounts.map(acc => {
                                const isEditing = editingProxy?._id === acc._id;
                                const hasProxy = !!acc.proxy;
                                const roleCount = acc.roles?.length || 0;

                                return (
                                    <div
                                        key={acc._id}
                                        className="bg-white border border-gray-200 rounded-lg p-3.5 flex flex-col gap-2.5 shadow-2xs hover:border-gray-300 transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Image
                                                    src={acc.avt || defaultAvatarUrl()}
                                                    alt={acc.name}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <h6 className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5">
                                                        <span>{acc.name}</span>
                                                        {hasProxy ? (
                                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                                                Proxy OK
                                                            </span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
                                                                Không Proxy
                                                            </span>
                                                        )}
                                                    </h6>
                                                    <p className="text-xs text-gray-500 font-mono">{acc.phone || 'Chưa có SĐT'}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDelete(acc._id, acc.name)}
                                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium cursor-pointer border border-rose-200 transition-colors shadow-2xs shrink-0"
                                                title="Xóa tài khoản"
                                            >
                                                Xóa
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-1 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-100">
                                            <span className="truncate">UID: {acc.uid || '—'}</span>
                                            <span>Giới hạn: {acc.rateLimitPerHour || 30} tin/giờ</span>
                                            <span>Nhân viên sử dụng: <strong className="text-gray-700 font-sans font-medium">{roleCount} người</strong></span>
                                        </div>

                                        {/* Inline Proxy Editor */}
                                        <div className="pt-1.5 border-t border-gray-100 flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center text-xs text-gray-600">
                                                <span className="font-semibold">Cấu hình Proxy:</span>
                                                {hasProxy && !isEditing && (
                                                    <button
                                                        onClick={() => handleSaveProxyInline(acc._id, '')}
                                                        className="text-[11px] text-rose-500 hover:underline cursor-pointer border-none bg-transparent"
                                                    >
                                                        Xóa Proxy
                                                    </button>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <div className="flex flex-col gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={proxyInput}
                                                        onChange={e => setProxyInput(e.target.value)}
                                                        placeholder="http://user:pass@host:port"
                                                        className="px-2.5 py-1.5 text-xs border border-[var(--main_d)] rounded bg-white outline-none text-gray-800 font-mono"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setEditingProxy(null)}
                                                            className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer border border-gray-300"
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveProxyInline(acc._id)}
                                                            disabled={savingProxy}
                                                            className="px-3 py-1 text-xs text-white bg-[var(--main_d)] hover:bg-[var(--main_b)] rounded cursor-pointer border-none shadow-xs disabled:opacity-50"
                                                        >
                                                            {savingProxy ? 'Đang lưu...' : 'Lưu Proxy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <code className="flex-1 px-2 py-1 text-[11px] bg-gray-50 border border-gray-200 rounded text-gray-700 truncate font-mono">
                                                        {acc.proxy || <span className="text-gray-400 italic font-sans">Chưa cấu hình (trực tiếp)</span>}
                                                    </code>
                                                    <button
                                                        onClick={() => {
                                                            setEditingProxy(acc);
                                                            setProxyInput(acc.proxy || '');
                                                        }}
                                                        className="px-2.5 py-1 text-xs font-medium text-[var(--main_d)] bg-blue-50 hover:bg-blue-100 rounded cursor-pointer border border-blue-200 shrink-0 transition-colors"
                                                    >
                                                        {acc.proxy ? 'Sửa' : 'Thêm Proxy'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions footer */}
                                        <div className="pt-1.5 border-t border-gray-100 flex gap-2">
                                            <button
                                                onClick={() => setSelectedAccount(acc)}
                                                className="flex-1 px-2.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-medium text-gray-700 cursor-pointer transition-colors shadow-2xs"
                                            >
                                                Phân quyền ({roleCount})
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Add account modal */}
            <CenterPopup open={showAddForm} onClose={() => setShowAddForm(false)} size="md">
                <Title content="Thêm tài khoản Zalo Bot" click={() => setShowAddForm(false)} />
                <AddAccountForm formAction={addAction} formState={addState} onClose={() => setShowAddForm(false)} />
            </CenterPopup>

            {/* Role management modal */}
            {selectedAccount && (
                <CenterPopup key={selectedAccount._id} open={!!selectedAccount} onClose={() => setSelectedAccount(null)}>
                    <RoleManager
                        zaloAccount={selectedAccount}
                        allUsers={saleUsers}
                        formAction={updateAction}
                        onClose={() => setSelectedAccount(null)}
                    />
                </CenterPopup>
            )}

            <Noti
                open={notification.open}
                onClose={() => setNotification(p => ({ ...p, open: false }))}
                status={notification.status}
                mes={notification.mes}
            />
        </div>
    );
}
