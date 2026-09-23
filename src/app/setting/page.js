import checkAuthToken from "@/utils/checktoken"
import SettingClient from "./main"

export default async function SettingPage() {
  let user = await checkAuthToken()
  const roles = Array.isArray(user?.role) ? user.role : typeof user?.role === 'string' ? [user.role] : []
  if (!roles.some(r => /^admin$/i.test(r)) && !roles.some(r => /^academic$/i.test(r))) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100%', width: '100%' }}>
        <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
      </div>
    )
  }

  return <SettingClient />
}
