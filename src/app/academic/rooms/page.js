import { area_data } from '@/data/actions/get'
import RoomManager from './ui'
import checkAuthToken from "@/utils/checktoken"

export default async function RoomsPage() {
  const user = await checkAuthToken()
  if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Academic'))) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
      </div>
    )
  }
  const areas = await area_data()
  return (
    <div className="p-4 h-full overflow-auto">
      <RoomManager areas={areas || []} />
    </div>
  )
}
