import checkAuthToken from "@/utils/checktoken"

export default async function MakeupLayout({ children }) {
    const user = await checkAuthToken()
    if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Academic') && !user.role?.includes('Teacher'))) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
            </div>
        )
    }
    return <>{children}</>
}
