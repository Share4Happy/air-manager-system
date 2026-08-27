'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Noti from '@/components/(features)/(noti)/noti'
import QuizTab from './ui/quiz-tab'
import MigrationTab from './ui/migration-tab'
import { ROLES, RoleTabs } from '@/app/info/ui/shared'

function ZaloTab({ zaloAccounts, users }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [proxyVal, setProxyVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const filtered = useMemo(() => {
    if (!search.trim()) return zaloAccounts
    const q = search.toLowerCase()
    return zaloAccounts.filter(a =>
      a.name?.toLowerCase().includes(q) || a.phone?.includes(q) || a.uid?.toLowerCase().includes(q)
    )
  }, [zaloAccounts, search])

  const getUserName = (userId) => {
    const u = users.find(u => u._id === userId)
    return u?.name || userId
  }

  const startEdit = (account) => {
    setEditing(account._id)
    setProxyVal(account.proxy || '')
  }

  const cancelEdit = () => {
    setEditing(null)
    setProxyVal('')
  }

  const saveProxy = async (id) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/zalo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy: proxyVal }),
      })
      const json = await res.json()
      if (json.success) {
        setNoti({ open: true, status: true, message: 'Đã lưu proxy' })
        setEditing(null)
        router.refresh()
      } else {
        setNoti({ open: true, status: false, message: json.error || 'Lỗi' })
      }
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm tài khoản Zalo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-72"
        />
        <span className="text-xs text-[var(--text-secondary)]">{filtered.length}/{zaloAccounts.length} tài khoản</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] mt-12">Không có tài khoản Zalo</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(account => (
              <div key={account._id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={account.avt || defaultAvatarUrl()}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={e => { e.target.onerror = null; e.target.src = defaultAvatarUrl() }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{account.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{account.phone} · {account.uid}</p>
                      {account.roles?.length > 0 && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Người dùng: {account.roles.map(r => getUserName(r)).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 max-w-md">
                    {editing === account._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={proxyVal}
                          onChange={e => setProxyVal(e.target.value)}
                          placeholder="http://user:pass@host:port"
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none text-gray-700 font-mono"
                        />
                        <button onClick={() => saveProxy(account._id)} disabled={saving}
                          className="px-2 py-1.5 text-xs font-medium text-white bg-[var(--main_d)] rounded hover:opacity-90 disabled:opacity-40">
                          {saving ? '...' : 'Lưu'}
                        </button>
                        <button onClick={cancelEdit}
                          className="px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-gray-100 rounded hover:bg-gray-200">
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded text-gray-600 truncate font-mono">
                          {account.proxy || <span className="text-gray-400 italic">Chưa cấu hình proxy</span>}
                        </code>
                        <button onClick={() => startEdit(account)}
                          className="px-2 py-1.5 text-xs font-medium text-[var(--main_d)] hover:bg-[var(--main_l)] rounded shrink-0">
                          {account.proxy ? 'Sửa' : 'Thêm'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </>
  )
}

function DriveVerifyTab() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const handleVerify = async () => {
    setRunning(true)
    setProgress({ current: 0, total: 1, label: 'Đang kết nối...' })
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/drive-storage/verify', { method: 'POST' })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'progress') {
              setProgress({ current: msg.current, total: msg.total, label: msg.label })
            } else if (msg.type === 'done') {
              setResult(msg.data)
              setProgress(null)
              setRunning(false)
              setNoti({ open: true, status: true, message: `Xong: ${msg.data.summary.ok} OK · ${msg.data.summary.moved} di chuyển · ${msg.data.summary.renamed} đổi tên · ${msg.data.summary.recreated} tạo mới · ${msg.data.summary.failed} lỗi` })
            } else if (msg.type === 'error') {
              setError(msg.message)
              setProgress(null)
              setRunning(false)
            }
          } catch { }
        }
      }
    } catch (e) {
      setError(e.message)
      setProgress(null)
      setRunning(false)
    }
  }

  const summary = result?.summary
  const progressPct = progress && progress.total ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Đồng bộ cấu trúc thư mục Drive theo chuẩn: folder lớp
        <code className="mx-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">MãLớp</code> (vd 24FZ2007) và folder buổi
        <code className="mx-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">MãLớp-YYYY-MM-DD</code> nằm bên trong lớp.
        Thư mục bị thùng rác sẽ được khôi phục, thư mục ở sai vị trí sẽ được di chuyển vào đúng lớp, đổi tên theo chuẩn;
        thư mục ở drive cũ / không tồn tại sẽ được tạo mới trong
        <code className="mx-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">DRIVE_COURSE_FOLDER_ID</code> và cập nhật lại DB.
      </p>

      <button onClick={handleVerify} disabled={running}
        className="px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 cursor-pointer border-none">
        {running ? 'Đang đồng bộ...' : 'Đồng bộ cấu trúc Drive'}
      </button>

      {running && progress && (
        <div className="bg-white border rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{progress.label}</p>
            <p className="text-xs text-gray-400">{progressPct}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-[var(--main_d)] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-4">Lỗi: {error}</p>}

      {summary && !running && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { label: 'Tổng', value: summary.total, color: 'text-gray-700' },
              { label: 'OK', value: summary.ok, color: 'text-green-600' },
              { label: 'Khôi phục', value: summary.restored, color: 'text-blue-600' },
              { label: 'Di chuyển', value: summary.moved, color: 'text-cyan-600' },
              { label: 'Đổi tên', value: summary.renamed, color: 'text-yellow-600' },
              { label: 'Tạo mới', value: summary.recreated, color: 'text-orange-600' },
              { label: 'Tạo lớp', value: summary.createdClass, color: 'text-teal-600' },
              { label: 'Sửa DB', value: summary.dbUpdated, color: 'text-purple-600' },
              { label: 'Lỗi', value: summary.failed, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border rounded-lg p-3 flex-1 min-w-[90px] text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {result.details?.length > 0 && (
            <div className="max-h-72 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 border-b font-medium text-gray-600">Khóa học</th>
                    <th className="px-3 py-2 border-b font-medium text-gray-600">Folder cũ</th>
                    <th className="px-3 py-2 border-b font-medium text-gray-600">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((d, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2 font-medium">{d.name}</td>
                      <td className="px-3 py-2">
                        <code className="text-xs text-gray-500">{d.folderId}</code>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium ${d.action === 'ok' ? 'text-green-600' : d.action === 'restored' ? 'text-blue-600' : d.action === 'recreated' ? 'text-orange-600' : d.action === 'moved' ? 'text-cyan-600' : d.action === 'renamed' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {d.action}
                        </span>
                        {d.newId && <div className="text-xs text-gray-400 mt-0.5">→ <code>{d.newId}</code></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

function SlaTab() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const LABELS = {
    sla_reminder_minutes: 'Nhắc nhở điểm danh (phút)',
    sla_warning_minutes: 'Cảnh báo nhật ký (phút)',
    sla_resource_warning_minutes: 'Cảnh báo minh chứng (phút)',
    sla_incident_minutes: 'Vi phạm SLA (phút)',
    student_absent_threshold: 'Ngưỡng vắng học sinh',
  }

  const DESCRIPTIONS = {
    sla_reminder_minutes: 'Sau bao nhiêu phút kết thúc buổi học thì nhắc giáo viên điểm danh',
    sla_warning_minutes: 'Sau bao nhiêu phút thì cảnh báo thiếu nhật ký buổi học',
    sla_resource_warning_minutes: 'Sau bao nhiêu phút thì cảnh báo thiếu minh chứng (ảnh/video)',
    sla_incident_minutes: 'Sau bao nhiêu phút thì ghi nhận vi phạm SLA',
    student_absent_threshold: 'Số buổi vắng tối đa trước khi cảnh báo',
  }

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const map = {}
          json.data.forEach(s => { map[s.key] = s.value })
          setSettings(map)
        }
      })
      .catch(err => console.error('Fetch notification settings error:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, val) => {
    setSettings(p => ({ ...p, [key]: Number(val) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(settings).filter(([k]) => LABELS[k])
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: entries.map(([key, value]) => ({ key, value })) }),
      })
      const json = await res.json()
      setNoti({ open: true, status: json.success, message: json.success ? 'Đã lưu cấu hình SLA' : json.error })
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải...</div>

  return (
    <div className="max-w-xl">
      <p className="text-sm text-[var(--text-secondary)] mb-4">Cấu hình thời gian cảnh báo SLA cho từng giai đoạn sau khi buổi học kết thúc.</p>
      <div className="flex flex-col gap-4">
        {Object.keys(LABELS).map(key => (
          <div key={key}>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">{LABELS[key]}</label>
            <p className="text-xs text-[var(--text-secondary)] mb-1">{DESCRIPTIONS[key]}</p>
            <input type="number" min={0} value={settings[key] ?? ''}
              onChange={e => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700" />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="mt-6 px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 cursor-pointer border-none">
        {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
      </button>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

function ZaloLiteTab() {
  const [form, setForm] = useState({ baseUrl: '', apiKey: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const map = {}
          json.data.forEach(s => { map[s.key] = s.value })
          setForm({
            baseUrl: map.ZALOLITE_BASE_URL || 'https://sms-service.talab.io.vn/api/gateway/v1.0',
            apiKey: map.ZALOLITE_API_KEY || '',
          })
        }
      })
      .catch(err => console.error('Fetch ZaloLite settings error:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
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
      })
      const json = await res.json()
      setNoti({ open: true, status: json.success, message: json.success ? 'Đã lưu cấu hình ZaloLite' : json.error })
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải...</div>

  return (
    <div className="max-w-xl">
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Cấu hình API Gateway ZaloLite để gửi tin nhắn Zalo (lưu vào cơ sở dữ liệu, không cần biến môi trường).
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Base URL</label>
          <input type="text" value={form.baseUrl}
            onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
            placeholder="https://sms-service.talab.io.vn/api/gateway/v1.0"
            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">API Key</label>
          <input type="password" value={form.apiKey}
            onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
            placeholder="zlite_..."
            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 font-mono" />
          <p className="text-xs text-[var(--text-secondary)] mt-1">Bắt buộc để gửi tin nhắn Zalo.</p>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving}
        className="mt-6 px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 cursor-pointer border-none">
        {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
      </button>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

const GUIDE_ROLES = ROLES

function GuideTab() {
  const [selectedRole, setSelectedRole] = useState('Admin')
  const [sections, setSections] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const loadRole = async (role) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/guide?role=${role}`)
      const json = await res.json()
      if (json.success && json.data) {
        setSections(json.data.sections || [])
        setFaqs(json.data.faqs || [])
      } else {
        setSections([])
        setFaqs([])
      }
    } catch {
      setSections([])
      setFaqs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRole(selectedRole)
  }, [selectedRole])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/guide', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, sections, faqs }),
      })
      const json = await res.json()
      if (json.success) {
        setEditing(false)
        await loadRole(selectedRole)
        setNoti({ open: true, status: true, message: `Đã lưu hướng dẫn cho ${selectedRole}` })
      } else {
        setNoti({ open: true, status: false, message: json.error || 'Lỗi khi lưu' })
      }
    } catch {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/import-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success) {
        setNoti({ open: true, status: true, message: json.message || 'Đã nhập dữ liệu mặc định' })
        await loadRole(selectedRole)
      } else {
        setNoti({ open: true, status: false, message: json.error || 'Lỗi khi nhập dữ liệu' })
      }
    } catch {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setImporting(false)
    }
  }

  const updateSection = (i, field, value) => {
    setSections(p => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const updateStep = (si, sti, value) => {
    setSections(p => p.map((s, idx) => {
      if (idx !== si) return s
      const steps = s.steps.map((st, j) => j === sti ? { content: value } : st)
      return { ...s, steps }
    }))
  }

  const addSection = () => setSections(p => [...p, { title: '', steps: [] }])
  const removeSection = (i) => setSections(p => p.filter((_, idx) => idx !== i))
  const addStep = (si) => setSections(p => p.map((s, idx) => idx === si ? { ...s, steps: [...s.steps, { content: '' }] } : s))
  const removeStep = (si, sti) => setSections(p => p.map((s, idx) => idx === si ? { ...s, steps: s.steps.filter((_, j) => j !== sti) } : s))

  const updateFaq = (i, field, value) => {
    setFaqs(p => p.map((f, idx) => idx === i ? { ...f, [field]: value } : f))
  }

  const addFaq = () => setFaqs(p => [...p, { question: '', answer: '' }])
  const removeFaq = (i) => setFaqs(p => p.filter((_, idx) => idx !== i))

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải...</div>

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)] transition-colors"

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="rounded-2xl bg-white p-5"
        style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--boxshaw)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--main_l)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Nội dung hướng dẫn</h3>
              <p className="text-xs text-[var(--text-secondary)]">Hiển thị trong trang Thông tin theo role người đăng nhập</p>
            </div>
            <button onClick={handleImport} disabled={importing}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40 cursor-pointer border-none shrink-0"
              style={{ background: 'var(--main_d)' }}>
              {importing ? 'Đang nhập...' : 'Nhập dữ liệu mặc định'}
            </button>
          </div>

        <div className="mb-4">
          <RoleTabs roles={GUIDE_ROLES} active={selectedRole} onChange={(r) => { setSelectedRole(r); setEditing(false) }} />
        </div>

        {!editing ? (
          <div className="flex flex-col gap-4">
            {sections.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center"
                style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm text-[var(--text-secondary)]">Chưa có nội dung hướng dẫn cho vai trò này.</p>
              </div>
            )}
            {sections.map((s, si) => (
              <div key={si} className="rounded-xl p-4" style={{ border: '1px solid var(--border-color)', background: '#fafbfc' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--main_d)' }}>
                    {si + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{s.title || `Mục ${si + 1}`}</h4>
                </div>
                <div className="flex flex-col gap-2 pl-[26px]">
                  {(s.steps || []).map((st, sti) => (
                    <div key={sti} className="flex gap-2.5">
                      <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ background: 'var(--main_l)', color: 'var(--main_d)' }}>
                        {sti + 1}
                      </span>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">{st.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {faqs.length > 0 && (
              <>
                <div className="flex items-center gap-2.5 pt-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--main_l)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                  </span>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Câu hỏi thường gặp</h4>
                </div>
                {faqs.map((f, fi) => (
                  <div key={fi} className="rounded-xl p-4" style={{ border: '1px solid var(--border-color)', background: '#fafbfc' }}>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{f.question}</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </>
            )}

            <div>
              <button onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90 cursor-pointer border-none"
                style={{ background: 'var(--main_d)' }}>
                Chỉnh sửa
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sections.map((s, si) => (
              <div key={si} className="rounded-xl p-4" style={{ border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <input type="text" value={s.title}
                    onChange={e => updateSection(si, 'title', e.target.value)}
                    placeholder="Tên mục hướng dẫn"
                    className={inputCls} />
                  <button onClick={() => removeSection(si)}
                    className="px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors hover:opacity-90 cursor-pointer border-none whitespace-nowrap"
                    style={{ background: 'var(--red)' }}>
                    Xóa mục
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {(s.steps || []).map((st, sti) => (
                    <div key={sti} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-2"
                        style={{ background: 'var(--main_l)', color: 'var(--main_d)' }}>
                        {sti + 1}
                      </span>
                      <textarea value={st.content}
                        onChange={e => updateStep(si, sti, e.target.value)}
                        placeholder="Nội dung bước..."
                        rows={2}
                        className={`${inputCls} resize-y`} />
                      <button onClick={() => removeStep(si, sti)}
                        className="px-2.5 py-2 rounded-lg text-white text-xs transition-colors hover:opacity-90 cursor-pointer border-none mt-0.5 whitespace-nowrap"
                        style={{ background: 'var(--red)' }}>
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addStep(si)}
                    className="self-start px-3 py-2 rounded-lg text-gray-700 text-xs font-medium transition-colors hover:bg-gray-200 cursor-pointer border-none"
                    style={{ background: 'var(--bg-btn)' }}>
                    + Thêm bước
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2.5 pt-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--main_l)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Câu hỏi thường gặp</h4>
            </div>
            {faqs.map((f, fi) => (
              <div key={fi} className="rounded-xl p-4" style={{ border: '1px solid var(--border-color)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: 'var(--main_d)' }}>
                    ?
                  </span>
                  <input type="text" value={f.question}
                    onChange={e => updateFaq(fi, 'question', e.target.value)}
                    placeholder="Câu hỏi"
                    className={inputCls} />
                  <button onClick={() => removeFaq(fi)}
                    className="px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors hover:opacity-90 cursor-pointer border-none whitespace-nowrap"
                    style={{ background: 'var(--red)' }}>
                    Xóa
                  </button>
                </div>
                <textarea value={f.answer}
                  onChange={e => updateFaq(fi, 'answer', e.target.value)}
                  placeholder="Câu trả lời..."
                  rows={3}
                  className={`${inputCls} resize-y pl-8`} />
              </div>
            ))}
            <button onClick={addFaq}
              className="self-start px-3 py-2 rounded-lg text-gray-700 text-xs font-medium transition-colors hover:bg-gray-200 cursor-pointer border-none"
              style={{ background: 'var(--bg-btn)' }}>
              + Thêm câu hỏi
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={addSection}
                className="px-3 py-2 rounded-lg text-gray-700 text-sm font-medium transition-colors hover:bg-gray-200 cursor-pointer border-none"
                style={{ background: 'var(--bg-btn)' }}>
                + Thêm mục
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40 cursor-pointer border-none"
                style={{ background: 'var(--main_d)' }}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => { setEditing(false); loadRole(selectedRole) }}
                className="px-4 py-2 rounded-lg text-gray-700 text-sm font-medium transition-colors hover:bg-gray-200 cursor-pointer border-none"
                style={{ background: 'var(--bg-btn)' }}>
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

const TABS = [
  { key: 'guide', label: 'Hướng dẫn' },
  { key: 'quiz', label: 'Bài kiểm tra' },
  { key: 'zalo', label: 'Zalo Proxy' },
  { key: 'sla', label: 'Cấu hình SLA' },
  { key: 'zalolite', label: 'ZaloLite' },
  { key: 'drive', label: 'Đồng bộ Drive' },
  { key: 'migration', label: 'Di chuyển CSDL' },
]

export default function SettingClient({ zaloAccounts, users }) {
  const [tab, setTab] = useState('zalo')

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Cài đặt</h1>
      <div className="flex gap-0 border-b border-[var(--border-color)] mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-none ${tab === t.key ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'guide' && <GuideTab />}
        {tab === 'quiz' && <QuizTab />}
        {tab === 'zalo' && <ZaloTab zaloAccounts={zaloAccounts} users={users} />}
        {tab === 'sla' && <SlaTab />}
        {tab === 'zalolite' && <ZaloLiteTab />}
        {tab === 'drive' && <DriveVerifyTab />}
        {tab === 'migration' && <MigrationTab />}
      </div>
    </div>
  )
}
