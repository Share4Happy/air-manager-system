'use client'

import { useState, useEffect } from 'react'
import { ROLES, RoleBadge, RoleTabs } from './shared'

export default function GuideView() {
  const [role, setRole] = useState(null)
  const [sections, setSections] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        const json = await res.json()
        const r = json.user?.role?.[0]
        if (cancelled) return
        if (ROLES.includes(r)) {
          setRole(r)
          await loadGuide(r)
        } else {
          setRole(null)
          setSections([])
          setFaqs([])
        }
      } catch {
        if (!cancelled) { setRole(null); setSections([]); setFaqs([]) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const loadGuide = async (r) => {
    try {
      const g = await fetch(`/api/guide?role=${r}`)
      const gj = await g.json()
      if (gj.success && gj.data) {
        setSections(gj.data.sections || [])
        setFaqs(gj.data.faqs || [])
      } else {
        setSections([])
        setFaqs([])
      }
    } catch {
      setSections([])
      setFaqs([])
    }
  }

  const handleRoleChange = (r) => {
    setRole(r)
    setExpandedFaq(null)
    loadGuide(r)
  }

  if (loading) return <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-secondary)]">Đang tải...</div>

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto py-6 px-4 flex flex-col gap-5">
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #e8f4ff 0%, #f8fbff 60%, #ffffff 100%)', border: '1px solid #d9ecff', boxShadow: 'var(--boxshaw)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #0374da 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#0374da', boxShadow: 'var(--boxshaw)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Hướng dẫn sử dụng</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Các bước thao tác chính theo vai trò của bạn</p>
            </div>
            {role && <div className="ml-auto"><RoleBadge role={role} size="lg" /></div>}
          </div>
        </div>

        <RoleTabs roles={ROLES} active={role} onChange={handleRoleChange} />

        {sections.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center"
            style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--main_l)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Chưa có nội dung hướng dẫn cho vai trò này.</p>
            <p className="text-xs text-[var(--text-secondary)] opacity-70">Admin có thể cập nhật trong Cài đặt → Hướng dẫn.</p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {sections.map((s, si) => (
            <section key={si} className="rounded-2xl bg-white p-5"
              style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--boxshaw)' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--main_d)' }}>
                  {si + 1}
                </span>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{s.title || `Mục ${si + 1}`}</h3>
              </div>
              <div className="flex flex-col">
                {(s.steps || []).map((st, sti) => (
                  <div key={sti} className="relative flex gap-3 pb-4 last:pb-0">
                    {sti < (s.steps || []).length - 1 && (
                      <span className="absolute left-[11px] top-7 bottom-0 w-px" style={{ background: 'var(--border-color)' }} />
                    )}
                    <span className="w-[23px] h-[23px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                      style={{ background: 'var(--main_l)', color: 'var(--main_d)', border: '1px solid #bfe0ff' }}>
                      {sti + 1}
                    </span>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed pt-0.5">{st.content}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {faqs.length > 0 && (
          <section className="rounded-2xl bg-white p-5"
            style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--boxshaw)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--main_l)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Câu hỏi thường gặp</h3>
            </div>
            <div className="flex flex-col gap-2">
              {faqs.map((f, fi) => {
                const isOpen = expandedFaq === fi
                return (
                  <div key={fi} className="rounded-xl transition-colors"
                    style={{ border: '1px solid var(--border-color)', background: isOpen ? 'var(--main_l)' : 'transparent' }}>
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : fi)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer border-none bg-transparent"
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">{f.question}</span>
                      <span className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} style={{ color: 'var(--main_d)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </button>
                    {isOpen && (
                      <p className="px-4 pb-4 text-sm text-[var(--text-primary)] leading-relaxed">{f.answer}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
