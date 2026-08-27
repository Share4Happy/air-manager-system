import ReportClient from './client'
import { user_data, zalo_data, area_data } from '@/data/actions/get'
import checkAuthToken from "@/utils/checktoken"

export default async function AcademicReportPage() {
    const user = await checkAuthToken()
    if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Academic'))) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
            </div>
        )
    }
    let [data, users, zalo, areas] = await Promise.all([
        user_data({ type: 'report' }),
        user_data({}),
        zalo_data(),
        area_data(),
    ])
    return <ReportClient initialReports={data} users={users || []} zalo={zalo || []} areas={areas || []} />
}
