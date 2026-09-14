'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useMemo, useRef } from 'react';
import Menu from '@/components/(ui)/(button)/menu';
import Toolbar from '@/components/(ui)/(toolbar)';

export default function FilterControls({
    sources = [],
    areas = [],
    zaloAccounts = [],
    users = [],
    labels = []
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const currentType = searchParams.get('type');
    const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
    const [isUidMenuOpen, setIsUidMenuOpen] = useState(false);
    const [isCampaignMenuOpen, setIsCampaignMenuOpen] = useState(false);
    const [isCareStatusMenuOpen, setIsCareStatusMenuOpen] = useState(false);
    const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
    const [isZaloMenuOpen, setIsZaloMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const searchTimeout = useRef(null);
    const createURL = useCallback((paramsToUpdate) => {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(paramsToUpdate)) {
            if (value || value === false || value === 0) params.set(key, String(value));
            else params.delete(key);
        }
        params.set('page', '1');
        replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, replace]);

    const handleSearch = useCallback((term) => {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            createURL({ query: term });
        }, 500);
    }, [createURL]);

    const staticOptions = useMemo(() => ({
        uidStatus: [{ value: 'true', name: 'Đã có' }, { value: 'not_searched', name: 'Chưa tìm' }, { value: 'not_found', name: 'Không có' }],
        campaignStatus: [{ value: 'true', name: 'Đang chạy' }, { value: 'false', name: 'Không chạy' }],
        careStatus: [{ value: '4', name: 'Đang chăm sóc' }, { value: '0', name: 'Chưa có kết quả' }, { value: '2', name: 'Không quan tâm' }, { value: '3', name: 'Tạm thời không quan tâm' }]
    }), []);

    const getSelectedName = useCallback((param, data, defaultText, keyField = '_id', nameField = 'name') => {
        const value = searchParams.get(param);
        if (!value) return defaultText;
        if (param === 'source' && value === 'null') return 'Thiếu nguồn';
        const selected = data.find(item => String(item[keyField]) === value);
        return selected ? selected[nameField] : defaultText;
    }, [searchParams]);

    const hasActiveFilters = Boolean(
        searchParams.get('source') ||
        searchParams.get('uidStatus') ||
        searchParams.get('campaignStatus') ||
        searchParams.get('careStatus') ||
        searchParams.get('area') ||
        searchParams.get('zaloAccount') ||
        searchParams.get('user')
    );

    return (
        <Toolbar
            searchPlaceholder="Tìm theo tên, SĐT..."
            search={searchParams.get('query') || ''}
            onSearchChange={handleSearch}
            showFilters={showMobileFilters}
            onToggleFilters={() => setShowMobileFilters(p => !p)}
            hasActiveFilters={hasActiveFilters}
            hasFilters={true}
            mobileActions={
                <div className="h-9 flex items-center p-0.5 rounded-lg border border-gray-300 bg-[var(--bg-secondary)] shrink-0">
                    <button
                        className={`h-full px-2 rounded-md text-xs font-semibold flex items-center transition-all cursor-pointer border-none ${!currentType ? 'bg-[var(--bg-primary)] text-[var(--main_d)] shadow-xs' : 'text-[var(--text-secondary)] bg-transparent'}`}
                        onClick={() => createURL({ type: '' })}
                    >
                        Khách hàng
                    </button>
                    <button
                        className={`h-full px-2 rounded-md text-xs font-semibold flex items-center transition-all cursor-pointer border-none ${currentType === 'true' ? 'bg-[var(--bg-primary)] text-[var(--main_d)] shadow-xs' : 'text-[var(--text-secondary)] bg-transparent'}`}
                        onClick={() => createURL({ type: 'true' })}
                    >
                        Học sinh
                    </button>
                </div>
            }
            desktopActions={
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-9 flex items-center p-0.5 rounded-lg border border-gray-300 bg-[var(--bg-secondary)] shrink-0">
                        <button
                            className={`h-full px-2.5 rounded-md text-xs font-semibold flex items-center transition-all cursor-pointer border-none ${!currentType ? 'bg-[var(--bg-primary)] text-[var(--main_d)] shadow-xs' : 'text-[var(--text-secondary)] bg-transparent'}`}
                            onClick={() => createURL({ type: '' })}
                        >
                            Khách hàng
                        </button>
                        <button
                            className={`h-full px-2.5 rounded-md text-xs font-semibold flex items-center transition-all cursor-pointer border-none ${currentType === 'true' ? 'bg-[var(--bg-primary)] text-[var(--main_d)] shadow-xs' : 'text-[var(--text-secondary)] bg-transparent'}`}
                            onClick={() => createURL({ type: 'true' })}
                        >
                            Học sinh
                        </button>
                    </div>
                    <Menu
                        className="w-auto shrink-0"
                        isOpen={isSourceMenuOpen}
                        onOpenChange={setIsSourceMenuOpen}
                        customButton={
                            <div className='h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] cursor-pointer hover:border-[var(--main_d)] transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap shrink-0'>
                                <span>{getSelectedName('source', sources, 'Tất cả nguồn')}</span>
                                <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                </svg>
                            </div>
                        }
                        menuItems={
                            <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[220px] overflow-y-auto shadow-md z-30'>
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ source: '' }); setIsSourceMenuOpen(false); }}>Tất cả nguồn</p>
                                {sources.map(s => <p key={s._id} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ source: s._id }); setIsSourceMenuOpen(false); }}>{s.name}</p>)}
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ source: 'null' }); setIsSourceMenuOpen(false); }}>Thiếu nguồn</p>
                            </div>
                        }
                        menuPosition="bottom"
                    />
                    <Menu
                        className="w-auto shrink-0"
                        isOpen={isUidMenuOpen}
                        onOpenChange={setIsUidMenuOpen}
                        customButton={
                            <div className='h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] cursor-pointer hover:border-[var(--main_d)] transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap shrink-0'>
                                <span>{getSelectedName('uidStatus', staticOptions.uidStatus, 'Trạng thái UID', 'value')}</span>
                                <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                </svg>
                            </div>
                        }
                        menuItems={
                            <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ uidStatus: '' }); setIsUidMenuOpen(false); }}>Tất cả UID</p>
                                {staticOptions.uidStatus.map(s => <p key={s.value} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ uidStatus: s.value }); setIsUidMenuOpen(false); }}>{s.name}</p>)}
                            </div>
                        }
                        menuPosition="bottom"
                    />
                    <Menu
                        className="w-auto shrink-0"
                        isOpen={isCampaignMenuOpen}
                        onOpenChange={setIsCampaignMenuOpen}
                        customButton={
                            <div className='h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] cursor-pointer hover:border-[var(--main_d)] transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap shrink-0'>
                                <span>{getSelectedName('campaignStatus', staticOptions.campaignStatus, 'Trạng thái chiến dịch', 'value')}</span>
                                <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                </svg>
                            </div>
                        }
                        menuItems={
                            <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ campaignStatus: '' }); setIsCampaignMenuOpen(false); }}>Trạng thái chiến dịch</p>
                                {staticOptions.campaignStatus.map(s => <p key={s.value} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ campaignStatus: s.value }); setIsCampaignMenuOpen(false); }}>{s.name}</p>)}
                            </div>
                        }
                        menuPosition="bottom"
                    />
                    {!currentType && (
                        <>
                            <Menu
                                className="w-auto shrink-0"
                                isOpen={isCareStatusMenuOpen}
                                onOpenChange={setIsCareStatusMenuOpen}
                                customButton={
                                    <div className='h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] cursor-pointer hover:border-[var(--main_d)] transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap shrink-0'>
                                        <span>{getSelectedName('careStatus', staticOptions.careStatus, 'Trạng thái chăm sóc', 'value')}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ careStatus: '' }); setIsCareStatusMenuOpen(false); }}>Trạng thái chăm sóc</p>
                                        {staticOptions.careStatus.map(s => <p key={s.value} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ careStatus: s.value }); setIsCareStatusMenuOpen(false); }}>{s.name}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                            <Menu
                                className="w-auto shrink-0"
                                isOpen={isAreaMenuOpen}
                                onOpenChange={setIsAreaMenuOpen}
                                customButton={
                                    <div className='h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] cursor-pointer hover:border-[var(--main_d)] transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap shrink-0'>
                                        <span>{searchParams.get('area') || 'Tất cả khu vực'}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ area: '' }); setIsAreaMenuOpen(false); }}>Tất cả khu vực</p>
                                        {areas.map(a => <p key={a} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ area: a }); setIsAreaMenuOpen(false); }}>{a}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                            <Menu
                                className="w-auto shrink-0"
                                isOpen={isZaloMenuOpen}
                                onOpenChange={setIsZaloMenuOpen}
                                customButton={
                                    <div className='h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] cursor-pointer hover:border-[var(--main_d)] transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap shrink-0'>
                                        <span>{getSelectedName('zaloAccount', zaloAccounts, 'Tất cả tài khoản Zalo')}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[220px] overflow-y-auto shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ zaloAccount: '' }); setIsZaloMenuOpen(false); }}>Tất cả tài khoản Zalo</p>
                                        {zaloAccounts.map(a => <p key={a._id} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ zaloAccount: a._id }); setIsZaloMenuOpen(false); }}>{a.name}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                            <Menu
                                className="w-auto shrink-0"
                                isOpen={isUserMenuOpen}
                                onOpenChange={setIsUserMenuOpen}
                                customButton={
                                    <div className='h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] cursor-pointer hover:border-[var(--main_d)] transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap shrink-0'>
                                        <span>{getSelectedName('user', users, 'Tất cả người dùng')}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[220px] overflow-y-auto shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ user: '' }); setIsUserMenuOpen(false); }}>Tất cả người dùng</p>
                                        {users.map(u => <p key={u._id} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ user: u._id }); setIsUserMenuOpen(false); }}>{u.name}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                        </>
                    )}
                </div>
            }
            mobileFilters={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Menu
                        className="w-full"
                        isOpen={isSourceMenuOpen}
                        onOpenChange={setIsSourceMenuOpen}
                        customButton={
                            <div className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] w-full cursor-pointer flex items-center justify-between'>
                                <span>{getSelectedName('source', sources, 'Tất cả nguồn')}</span>
                                <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                </svg>
                            </div>
                        }
                        menuItems={
                            <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[200px] overflow-y-auto shadow-md z-30'>
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ source: '' }); setIsSourceMenuOpen(false); }}>Tất cả nguồn</p>
                                {sources.map(s => <p key={s._id} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ source: s._id }); setIsSourceMenuOpen(false); }}>{s.name}</p>)}
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ source: 'null' }); setIsSourceMenuOpen(false); }}>Thiếu nguồn</p>
                            </div>
                        }
                        menuPosition="bottom"
                    />
                    <Menu
                        className="w-full"
                        isOpen={isUidMenuOpen}
                        onOpenChange={setIsUidMenuOpen}
                        customButton={
                            <div className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] w-full cursor-pointer flex items-center justify-between'>
                                <span>{getSelectedName('uidStatus', staticOptions.uidStatus, 'Trạng thái UID', 'value')}</span>
                                <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                </svg>
                            </div>
                        }
                        menuItems={
                            <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ uidStatus: '' }); setIsUidMenuOpen(false); }}>Tất cả UID</p>
                                {staticOptions.uidStatus.map(s => <p key={s.value} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ uidStatus: s.value }); setIsUidMenuOpen(false); }}>{s.name}</p>)}
                            </div>
                        }
                        menuPosition="bottom"
                    />
                    <Menu
                        className="w-full"
                        isOpen={isCampaignMenuOpen}
                        onOpenChange={setIsCampaignMenuOpen}
                        customButton={
                            <div className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] w-full cursor-pointer flex items-center justify-between'>
                                <span>{getSelectedName('campaignStatus', staticOptions.campaignStatus, 'Trạng thái chiến dịch', 'value')}</span>
                                <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                </svg>
                            </div>
                        }
                        menuItems={
                            <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ campaignStatus: '' }); setIsCampaignMenuOpen(false); }}>Trạng thái chiến dịch</p>
                                {staticOptions.campaignStatus.map(s => <p key={s.value} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ campaignStatus: s.value }); setIsCampaignMenuOpen(false); }}>{s.name}</p>)}
                            </div>
                        }
                        menuPosition="bottom"
                    />
                    {!currentType && (
                        <>
                            <Menu
                                className="w-full"
                                isOpen={isCareStatusMenuOpen}
                                onOpenChange={setIsCareStatusMenuOpen}
                                customButton={
                                    <div className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] w-full cursor-pointer flex items-center justify-between'>
                                        <span>{getSelectedName('careStatus', staticOptions.careStatus, 'Trạng thái chăm sóc', 'value')}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ careStatus: '' }); setIsCareStatusMenuOpen(false); }}>Trạng thái chăm sóc</p>
                                        {staticOptions.careStatus.map(s => <p key={s.value} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ careStatus: s.value }); setIsCareStatusMenuOpen(false); }}>{s.name}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                            <Menu
                                className="w-full"
                                isOpen={isAreaMenuOpen}
                                onOpenChange={setIsAreaMenuOpen}
                                customButton={
                                    <div className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] w-full cursor-pointer flex items-center justify-between'>
                                        <span>{searchParams.get('area') || 'Tất cả khu vực'}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ area: '' }); setIsAreaMenuOpen(false); }}>Tất cả khu vực</p>
                                        {areas.map(a => <p key={a} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ area: a }); setIsAreaMenuOpen(false); }}>{a}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                            <Menu
                                className="w-full"
                                isOpen={isZaloMenuOpen}
                                onOpenChange={setIsZaloMenuOpen}
                                customButton={
                                    <div className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] w-full cursor-pointer flex items-center justify-between'>
                                        <span>{getSelectedName('zaloAccount', zaloAccounts, 'Tất cả tài khoản Zalo')}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[200px] overflow-y-auto shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ zaloAccount: '' }); setIsZaloMenuOpen(false); }}>Tất cả tài khoản Zalo</p>
                                        {zaloAccounts.map(a => <p key={a._id} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ zaloAccount: a._id }); setIsZaloMenuOpen(false); }}>{a.name}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                            <Menu
                                className="w-full"
                                isOpen={isUserMenuOpen}
                                onOpenChange={setIsUserMenuOpen}
                                customButton={
                                    <div className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs font-normal text-[var(--text-primary)] w-full cursor-pointer flex items-center justify-between'>
                                        <span>{getSelectedName('user', users, 'Tất cả người dùng')}</span>
                                        <svg className="text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={8} height={8} fill="currentColor">
                                            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
                                        </svg>
                                    </div>
                                }
                                menuItems={
                                    <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[200px] overflow-y-auto shadow-md z-30'>
                                        <p className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ user: '' }); setIsUserMenuOpen(false); }}>Tất cả người dùng</p>
                                        {users.map(u => <p key={u._id} className='text-xs font-normal text-[var(--text-primary)] p-1.5 hover:bg-[var(--hover)] rounded cursor-pointer' onClick={() => { createURL({ user: u._id }); setIsUserMenuOpen(false); }}>{u.name}</p>)}
                                    </div>
                                }
                                menuPosition="bottom"
                            />
                        </>
                    )}
                </div>
            }
        />
    );
}