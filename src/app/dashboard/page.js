import { CheckRole } from "@/function/server"
import Overview from '@/components/dashboard/overview'
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const user = await CheckRole();
  if (!user) {
    redirect('/login');
  }

  const roles = Array.isArray(user.role) ? user.role : [user.role]
  const allowed = roles.some(r => r === 'Admin' || r === 'Academic')
  if (!allowed) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
      </div>
    )
  }

  return <Overview />
}
