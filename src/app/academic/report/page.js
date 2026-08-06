import ReportClient from './client'
import { user_data, zalo_data, area_data } from '@/data/actions/get'

export default async function AcademicReportPage() {
    let [data, users, zalo, areas] = await Promise.all([
        user_data({ type: 'report' }),
        user_data({}),
        zalo_data(),
        area_data(),
    ])
    return <ReportClient initialReports={data} users={users || []} zalo={zalo || []} areas={areas || []} />
}
