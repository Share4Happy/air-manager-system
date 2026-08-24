'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Menu from '@/components/(ui)/(button)/menu';
import { Svg_Add } from '@/components/(icon)/svg';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';

const ROLE_COLORS = {
  Admin: 'bg-purple-100 text-purple-700',
  Academic: 'bg-blue-100 text-blue-700',
  Sale: 'bg-green-100 text-green-700',
  Teacher: 'bg-orange-100 text-orange-700',
}

function AddUserForm({ onSubmit, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: ['Teacher'],
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'role' ? [value] : value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label>Họ và Tên<span className="text-red-500">*</span></label>
        <input type="text" name="name" onChange={handleChange} value={formData.name} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" required />
      </div>
      <div className="flex flex-col gap-2">
        <label>Email<span className="text-red-500">*</span></label>
        <input type="email" name="email" onChange={handleChange} value={formData.email} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" required />
      </div>
      <div className="flex flex-col gap-2">
        <label>Mật khẩu<span className="text-red-500">*</span></label>
        <input type="password" name="password" onChange={handleChange} value={formData.password} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" required />
      </div>
      <div className="flex flex-col gap-2">
        <label>Số điện thoại</label>
        <input type="tel" name="phone" onChange={handleChange} value={formData.phone} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" />
      </div>
      <div className="flex flex-col gap-2">
        <label>Địa chỉ</label>
        <input type="text" name="address" onChange={handleChange} value={formData.address} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" />
      </div>
      <div className="flex flex-col gap-2">
        <label>Vai trò</label>
        <select name="role" value={formData.role[0]} onChange={handleChange} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none">
          {["Admin", "Academic", "Sale", "Teacher"].map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-row gap-2">
        <button type="button" className="px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100" onClick={onClose}><h5>Hủy</h5></button>
        <button type="submit" className="px-3 py-2 rounded bg-[var(--main_d)] text-white flex items-center gap-2 justify-center whitespace-nowrap border-none cursor-pointer transition-all duration-200 hover:bg-[var(--main_b)]" disabled={isLoading}>
          <h5 style={{ color: 'white' }}>{isLoading ? 'Đang xử lý...' : 'Thêm mới'}</h5>
        </button>
      </div>
    </form>
  );
}

function EditUserForm({ userData, onSubmit, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    role: 'Teacher',
    email: '',
    password: '',
  });
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        role: userData.role?.[0] || 'Teacher',
        email: userData.email || '',
        password: '',
      });
    }
  }, [userData]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.password) delete data.password;
    onSubmit(userData._id, data);
  };
  const ROLES = ["Admin", "Academic", "Sale", "Teacher"];
  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label>Họ và Tên</label>
        <input type="text" name="name" onChange={handleChange} value={formData.name} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" />
      </div>
      <div className="flex flex-col gap-2">
        <label>Email</label>
        <input type="email" name="email" onChange={handleChange} value={formData.email} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" />
      </div>
      <div className="flex flex-col gap-2">
        <label>Số điện thoại</label>
        <input type="tel" name="phone" onChange={handleChange} value={formData.phone} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" />
      </div>
      <div className="flex flex-col gap-2">
        <label>Địa chỉ</label>
        <input type="text" name="address" onChange={handleChange} value={formData.address} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" />
      </div>
      <div className="flex flex-col gap-2">
        <label>Quyền</label>
        <select name="role" value={formData.role} onChange={handleChange} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none">
          {ROLES.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label>Mật khẩu mới <span className="text-gray-400 text-xs">(để trống nếu không đổi)</span></label>
        <input type="password" name="password" onChange={handleChange} value={formData.password} placeholder="••••••••" className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" />
      </div>
      <div className="flex flex-row gap-2">
        <button type="button" className="px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100" onClick={onClose}>Hủy</button>
        <button type="submit" className="px-3 py-2 rounded bg-[var(--main_d)] text-white flex items-center gap-2 justify-center whitespace-nowrap border-none cursor-pointer transition-all duration-200 hover:bg-[var(--main_b)]" disabled={isLoading}>
          <h5 style={{ color: 'white' }}> {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</h5>
        </button>
      </div>
    </form>
  );
}

const getCreatedDate = (user) => {
  if (user.createdAt) return new Date(user.createdAt);
  try {
    const ts = parseInt(user._id.toString().substring(0, 8), 16) * 1000;
    return new Date(ts);
  } catch { return null; }
};

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const Main = ({ initialTeachers }) => {
  const router = useRouter();
  const [users, setUsers] = useState(initialTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isAddUserPopupOpen, setIsAddUserPopupOpen] = useState(false);
  const [isEditUserPopupOpen, setIsEditUserPopupOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, status: false, message: '' });
  const [confirmUser, setConfirmUser] = useState(null);
  const [resetLoginUser, setResetLoginUser] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [toggling, setToggling] = useState(false);

  const handleAddUser = async (formData) => {
    if (!formData.name || !formData.email || !formData.password) {
      setNotification({ open: true, status: false, message: 'Tên, Email và Mật khẩu là bắt buộc.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      setNotification({
        open: true,
        status: response.ok,
        message: result.message || result.error,
      });
      if (response.ok) {
        setIsAddUserPopupOpen(false);
        router.refresh();
      }
    } catch (error) {
      setNotification({ open: true, status: false, message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId, formData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/roleuser/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      setNotification({
        open: true,
        status: response.ok,
        message: result.message || result.error,
      });
      if (response.ok) {
        setIsEditUserPopupOpen(false);
        router.refresh();
      }
    } catch (error) {
      setNotification({ open: true, status: false, message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchRole = async (userId, userName, userStatus) => {
    if (userStatus === false) {
      setNotification({ open: true, status: false, message: `Tài khoản "${userName}" đã bị khóa, không thể chuyển.` });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/switch-role/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        if (result.backupToken) {
          localStorage.setItem('backupToken', result.backupToken)
          localStorage.setItem('backupUser', JSON.stringify(result.user))
        }
        setNotification({ open: true, status: true, message: `🔀 Đã chuyển sang ${result.user.name} (${result.user.role?.join(', ')})` });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setNotification({ open: true, status: false, message: result.error || 'Chuyển đổi thất bại' });
      }
    } catch (error) {
      setNotification({ open: true, status: false, message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLogin = async (userId) => {
    setResetting(true);
    try {
      const res = await fetch('/api/user/reset-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      setNotification({ open: true, status: res.ok, message: result.mes || (res.ok ? 'Đã xóa khóa đăng nhập' : 'Lỗi') });
      setResetLoginUser(null);
      if (res.ok) router.refresh();
    } catch {
      setNotification({ open: true, status: false, message: 'Lỗi kết nối' });
    } finally {
      setResetting(false);
    }
  };

  const handleSwitchBack = async () => {
    const backupToken = localStorage.getItem('backupToken')
    if (!backupToken) return
    setIsLoading(true);
    try {
      const response = await fetch('/api/switch-back', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupToken }),
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.removeItem('backupToken')
        localStorage.removeItem('backupUser')
        setNotification({ open: true, status: true, message: '✅ Đã quay lại tài khoản gốc' });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setNotification({ open: true, status: false, message: result.error || 'Không thể quay lại. Vui lòng đăng nhập lại.' });
        localStorage.removeItem('backupToken')
        localStorage.removeItem('backupUser')
      }
    } catch (error) {
      setNotification({ open: true, status: false, message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNoti = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenEditPopup = (user) => {
    setEditingUser(user);
    setIsEditUserPopupOpen(true);
  };

  const handleToggleStatus = async (userId) => {
    if (toggling) return;
    setToggling(true);
    setConfirmUser(null);
    try {
      const response = await fetch(`/api/statususer/${userId}`, { method: 'PATCH' });
      const result = await response.json();
      setNotification({
        open: true,
        status: response.ok,
        message: result.message || result.error,
      });
      if (response.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: result.status } : u));
      }
    } catch (error) {
      setNotification({ open: true, status: false, message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setToggling(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((teacher) => {
      const nameMatch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const phoneMatch = teacher.phone?.includes(searchTerm)
      const emailMatch = teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const searchMatch = nameMatch || phoneMatch || emailMatch
      if (!searchMatch) return false
      if (filterRole !== 'all' && !(teacher.role && teacher.role.includes(filterRole))) return false
      if (filterStatus === 'active' && teacher.status === false) return false
      if (filterStatus === 'inactive' && teacher.status !== false) return false
      return true
    })
  }, [users, searchTerm, filterRole, filterStatus]);

  const allRoles = useMemo(() => {
    const roles = new Set()
    users.forEach(teacher => {
      if (teacher.role) teacher.role.forEach(r => roles.add(r))
    })
    return ['all', ...Array.from(roles).sort()]
  }, [users]);

  const roleMenuItems = (
    <div className="w-full rounded-md bg-[var(--bg-primary)] mt-2 shadow-[var(--boxshaw2)] max-h-[350px] overflow-auto p-2">
      {allRoles.map(role => {
        const displayName = role === 'all' ? 'Tất cả vai trò' : role
        return (
          <p key={role} onClick={() => { setFilterRole(role); setIsRoleMenuOpen(false); }} className="p-2 rounded cursor-pointer transition-all duration-200 hover:bg-[var(--hover)] text-sm font-normal text-[var(--text-primary)]">
            {displayName}
          </p>
        )
      })}
    </div>
  );

  const roleMenuButton = (
    <div className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" style={{ width: 140, cursor: 'pointer' }}>
      {filterRole === 'all' ? 'Tất cả vai trò' : filterRole}
    </div>
  );

  const statusMenuItems = (
    <div className="w-full rounded-md bg-[var(--bg-primary)] mt-2 shadow-[var(--boxshaw2)] overflow-auto p-2">
      {[
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'active', label: 'Hoạt động' },
        { value: 'inactive', label: 'Đã vô hiệu' },
      ].map(item => (
        <p key={item.value} onClick={() => { setFilterStatus(item.value); setIsStatusMenuOpen(false); }} className="p-2 rounded cursor-pointer transition-all duration-200 hover:bg-[var(--hover)] text-sm font-normal text-[var(--text-primary)]">
          {item.label}
        </p>
      ))}
    </div>
  );

  const statusMenuButton = (
    <div className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" style={{ width: 140, cursor: 'pointer' }}>
      {filterStatus === 'all' ? 'Tất cả trạng thái' : filterStatus === 'active' ? 'Hoạt động' : 'Đã vô hiệu'}
    </div>
  );

  const [backupInfo, setBackupInfo] = useState({ hasBackup: false, name: '' })

  useEffect(() => {
    const token = localStorage.getItem('backupToken')
    const user = JSON.parse(localStorage.getItem('backupUser') || '{}')
    setBackupInfo({ hasBackup: !!token, name: user.name || '' })
  }, [])

  return (
    <>
      {backupInfo.hasBackup && (
        <div className="flex items-center justify-between px-4 py-2 mb-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            🔀 Đang ở chế độ <strong>{backupInfo.name || 'người dùng khác'}</strong>
          </p>
          <button
            onClick={handleSwitchBack}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Quay lại
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2 bg-white rounded-md border border-[var(--border-color)]">
        <div className="flex flex-wrap items-center gap-2 w-full">
          <input type="text" placeholder="Tìm kiếm theo tên, email hoặc SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none flex-1 min-w-[200px]" />
          <div>
            <Menu isOpen={isRoleMenuOpen} onOpenChange={setIsRoleMenuOpen} menuItems={roleMenuItems} menuPosition="bottom" customButton={roleMenuButton} />
          </div>
          <div>
            <Menu isOpen={isStatusMenuOpen} onOpenChange={setIsStatusMenuOpen} menuItems={statusMenuItems} menuPosition="bottom" customButton={statusMenuButton} />
          </div>
          <div className="px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100 shrink-0" style={{ padding: 10.5 }} onClick={() => setIsAddUserPopupOpen(true)}>
            <Svg_Add w="var(--font-size-xs)" h="var(--font-size-xs)" c="var(--text-primary)" />
            <h5>Thêm người dùng</h5>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16 }}>
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto w-full border border-gray-200 rounded-lg shadow-sm bg-white">
              <table className="w-full min-w-[1050px] border-collapse bg-white text-left">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-200">
                    <th className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-14 text-center">STT</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[180px]">Tên</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[220px]">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[140px]">SĐT</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[180px]">Vai trò</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[140px]">Ngày tạo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[130px]">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-20 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-none">
                        <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap text-center">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{user.email || '–––'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{user.phone || '–––'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.role?.map(r => (
                              <span key={r} className={`px-2 py-0.5 text-[10px] font-semibold rounded ${ROLE_COLORS[r] || 'bg-gray-100 text-gray-700'}`}>{r}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(getCreatedDate(user))}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded ${user.status !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {user.status !== false ? 'Hoạt động' : 'Đã vô hiệu'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center relative whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (openMenuId === user._id) {
                              setOpenMenuId(null)
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const menuH = 132
                              const spaceBelow = window.innerHeight - rect.bottom
                              setMenuPos({
                                top: spaceBelow >= menuH ? rect.bottom + 4 : rect.top - menuH,
                                left: rect.left + rect.width / 2
                              })
                              setOpenMenuId(user._id)
                            }
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        >
                          ⋮
                        </button>
                        {openMenuId === user._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="fixed z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
                              style={{
                                top: menuPos.top,
                                left: Math.max(4, Math.min(menuPos.left - 70, window.innerWidth - 144)),
                              }}>
                              <button
                                onClick={() => { setOpenMenuId(null); handleOpenEditPopup(user); }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Thông tin tài khoản
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); setConfirmUser(user); }}
                                disabled={toggling}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${user.status !== false ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'} ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {user.status !== false ? 'Vô hiệu tài khoản' : 'Kích hoạt tài khoản'}
                              </button>
                              <button
                                 onClick={() => { setOpenMenuId(null); handleSwitchRole(user._id, user.name, user.status); }}
                                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                Chuyển đổi role
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); setResetLoginUser(user); }}
                                className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                              >
                                Reset thời gian khóa
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-xl text-[#888] mt-12">Không tìm thấy người dùng nào.</p>
        )}
      </div>
      <FlexiblePopup
        open={isAddUserPopupOpen}
        onClose={() => setIsAddUserPopupOpen(false)}
        title="Thêm người dùng mới"
        width={500}
        renderItemList={() => (
          <AddUserForm
            onSubmit={handleAddUser}
            isLoading={isLoading}
            onClose={() => setIsAddUserPopupOpen(false)}
          />
        )}
      />
      <FlexiblePopup
        open={isEditUserPopupOpen}
        onClose={() => setIsEditUserPopupOpen(false)}
        title="Chỉnh sửa thông tin"
        width={500}
        renderItemList={() => (
          <EditUserForm
            userData={editingUser}
            onSubmit={handleUpdateUser}
            isLoading={isLoading}
            onClose={() => setIsEditUserPopupOpen(false)}
          />
        )}
      />
      {confirmUser && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !toggling && setConfirmUser(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <p className="text-sm text-gray-700">
              {confirmUser.status !== false
                ? `Bạn có chắc muốn vô hiệu hóa tài khoản "${confirmUser.name}"?`
                : `Bạn có chắc muốn kích hoạt lại tài khoản "${confirmUser.name}"?`}
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setConfirmUser(null)}
                disabled={toggling}
                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer border-none disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleToggleStatus(confirmUser._id)}
                disabled={toggling}
                className={`px-4 py-2 text-sm rounded text-white transition-colors cursor-pointer border-none disabled:opacity-50 ${confirmUser.status !== false ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {toggling ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
      {resetLoginUser && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !resetting && setResetLoginUser(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <p className="text-sm text-gray-700">
              Bạn có chắc muốn reset thời gian khóa đăng nhập của tài khoản "<span className="font-semibold">{resetLoginUser.name}</span>"?<br />
              Người dùng sẽ có thể đăng nhập lại ngay lập tức.
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setResetLoginUser(null)}
                disabled={resetting}
                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer border-none disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleResetLogin(resetLoginUser._id)}
                disabled={resetting}
                className="px-4 py-2 text-sm rounded text-white transition-colors cursor-pointer border-none disabled:opacity-50 bg-orange-600 hover:bg-orange-700"
              >
                {resetting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="loadingOverlay" style={{ zIndex: 1100 }}>
          <Loading content="Đang xử lý..." />
        </div>
      )}
      <Noti
        open={notification.open}
        onClose={handleCloseNoti}
        status={notification.status}
        mes={notification.message}
        button={<button onClick={handleCloseNoti} className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" style={{ width: '100%' }}>Đóng</button>}
      />
    </>
  )
}
export default Main;
