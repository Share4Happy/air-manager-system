export default function GuidePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6 pb-4 border-b border-[var(--border-color)]" style={{color: 'var(--text-primary)'}}>Hướng dẫn</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mt-6 mb-3" style={{color: 'var(--text-primary)'}}>1. Upload ảnh / Minh chứng buổi học</h2>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Sơ đồ luồng</h3>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code>{`User chọn file (UI)
  → POST /api/updateimage (FormData: folderId + file + fileType)
    → Google Drive API: drive.files.create({ parents: [folderId], media: file })
    → Lưu file ID vào MongoDB
      → PostCourse.Detail[].DetailImage[] (hoặc TrialCourse.sessions[].images[])
  → Response: { data: [{ id, type }] }`}</code></pre>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Tạo thư mục Drive cho từng buổi học</h3>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>Backend gọi <strong>Google Drive API</strong> trực tiếp (không qua Apps Script):</p>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code className="language-js">{`const drive = getDriveClient()
const folderId = await createDriveFolder(drive, dayName, parentFolderId)`}</code></pre>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>Dùng hàm <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-300">createDriveFolder</code> từ <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-300">src/function/drive/folder.js</code>:</p>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code className="language-js">{`export async function createDriveFolder(drive, name, parentId) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    supportsAllDrives: true,
    fields: 'id',
  })
  return res.data.id
}`}</code></pre>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>Parent folder ID mặc định: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-300">1Ri-Cl-R7Exl7vP6Qy8tDHtoiSqMXVmhf</code> (có thể ghi đè qua env <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-300">DRIVE_COURSE_FOLDER_ID</code>).</p>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>API endpoints</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Endpoint</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Method</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Chức năng</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>File</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['/api/image', 'POST', 'Upload ảnh mới vào session', 'src/app/api/(image)/image/route.js'],
                  ['/api/image', 'PUT', 'Thay thế ảnh cũ (upload mới, xóa cũ)', 'same'],
                  ['/api/image', 'DELETE', 'Xóa ảnh khỏi Drive + DB', 'same'],
                  ['/api/updateimage', 'POST', 'Upload ảnh (PostCourse + TrialCourse)', 'src/app/api/(course)/updateimage/route.js'],
                  ['/api/updateimage', 'PUT', 'Thay thế ảnh (PostCourse + TrialCourse)', 'same'],
                  ['/api/updateimage', 'DELETE', 'Xóa ảnh', 'same'],
                  ['/api/updateimagestudent', 'POST', 'Gán ảnh session vào học sinh', 'src/app/api/(course)/updateimagestudent/route.js'],
                  ['/api/course', 'POST', 'Tạo course → tạo folder Drive', 'src/app/api/(course)/course/route.js'],
                  ['/api/course/ucalendarcourse', 'POST', 'Tạo buổi bù → tạo folder Drive', 'src/app/api/(course)/course/ucalendarcourse/route.js'],
                ].map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>
                        {j === 3 ? <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-300">{cell}</code> : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Xác thực Google Drive</h3>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>Dùng <strong>service account</strong> (googleapis):</p>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code className="language-js">{`const auth = new google.auth.GoogleAuth({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});`}</code></pre>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>URL hiển thị ảnh</h3>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Ảnh: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">{'https://lh3.googleusercontent.com/d/${fileId}=w800'}</code></li>
            <li>Ảnh thumb: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">{'https://lh3.googleusercontent.com/d/${fileId}=w400'}</code></li>
            <li>Video embed: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">{'https://drive.google.com/file/d/${fileId}/preview'}</code></li>
            <li>Video thumb: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">{'https://drive.google.com/thumbnail?id=${fileId}'}</code></li>
            <li>Download: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">{'https://drive.google.com/uc?export=download&id=${fileId}'}</code></li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Folder ID cố định (không qua Apps Script)</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Mục đích</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Folder ID</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>File code</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Avatar học sinh</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">1h8n0ueMwKumXlYkCDKffgNCyKYRIUJQy</code></td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/api/(student)/student/route.js</code></td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Ảnh bìa sách</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">17O3YymfFPxMfYLXvMxO7aAfJv50alJiI</code></td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/api/(course)/book/route.js</code></td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Folder cha trial course</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">1Ri-Cl-R7Exl7vP6Qy8tDHtoiSqMXVmhf</code></td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/api/(course)/coursetry/route.js</code></td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Client UI</h3>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Upload gallery: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/calendar/[id]/ui/formimage/index.js</code></li>
            <li>Gán ảnh cho học sinh: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/calendar/[id]/ui/formimages/index.js</code></li>
            <li>Component ảnh (replace/delete/download): <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/components/(ui)/(image)/index.js</code></li>
          </ul>
        </section>

        <hr className="my-6" style={{borderColor: 'var(--border-color)'}} />

        <section className="mb-8">
          <h2 className="text-lg font-semibold mt-6 mb-3" style={{color: 'var(--text-primary)'}}>2. Lịch (Calendar)</h2>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Cấu trúc trang</h3>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}><strong>Desktop</strong> (<code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">hidden lg:flex</code>): grid 7 cột, mỗi ô <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">minHeight: 180</code>, responsive padding/card.</p>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}><strong>Mobile</strong> (<code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">lg:hidden</code>): danh sách 7 ngày dạng flex column, mỗi ngày:</p>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Trái: sidebar xanh dương (tên thứ, ngày) — <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">w-[80px]</code></li>
            <li>Phải: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">DayLessons</code> component — <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">p-2 overflow-y-auto</code></li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Highlight hôm nay</h3>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Header ô: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">bg-red-600 text-white</code></li>
            <li>Cell: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">bg-red-50</code></li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Nhãn ngày</h3>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code className="language-js">{`['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']`}</code></pre>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Buổi bù (Makeup)</h3>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Nút "Tạo buổi bù" (xanh lá) hiển thị trong component Calendar entry</li>
            <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">openMakeupForCancelled</code> prop truyền qua <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">MoreIcons</code> → <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">ScheduleTable</code></li>
            <li>API: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">POST /api/course/ucalendarcourse</code> → tạo folder Drive + buổi học mới</li>
          </ul>
        </section>

        <hr className="my-6" style={{borderColor: 'var(--border-color)'}} />

        <section className="mb-8">
          <h2 className="text-lg font-semibold mt-6 mb-3" style={{color: 'var(--text-primary)'}}>3. Quản lý người dùng (Teacher UI)</h2>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>File: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/teacher/ui/main/index.js</code></p>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Tính năng</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Tính năng</th><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Mô tả</th></tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-2 border-b border-gray-100 font-semibold" style={{color: 'var(--text-primary)'}}>Filter trạng thái</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Dropdown (Tất cả / Hoạt động / Đã vô hiệu)</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100 font-semibold" style={{color: 'var(--text-primary)'}}>Menu hành động</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Fixed positioning, tự động đảo chiều lên/xuống</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100 font-semibold" style={{color: 'var(--text-primary)'}}>Nút 3-dot</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">text-center relative</code> + <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">inline-flex items-center justify-center w-8 h-8</code></td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100 font-semibold" style={{color: 'var(--text-primary)'}}>Menu items</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Text only (không icon): "Thông tin tài khoản", "Vô hiệu/Kích hoạt", "Chuyển đổi role"</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100 font-semibold" style={{color: 'var(--text-primary)'}}>Kiểm tra disabled</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Khi chuyển role trên tài khoản bị khóa → noti trước API call</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Responsive table</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Cột</th><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Ẩn khi</th></tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Email</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sm</code></td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>SĐT</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">md</code></td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Ngày tạo</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">lg</code></td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>Padding: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">px-2 sm:px-4</code></p>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Menu positioning</h3>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code className="language-js">{`const spaceBelow = window.innerHeight - rect.bottom;
menuH = 200;
menuPos = spaceBelow >= menuH ? rect.bottom + 4 : rect.top - menuH;`}</code></pre>
        </section>

        <hr className="my-6" style={{borderColor: 'var(--border-color)'}} />

        <section className="mb-8">
          <h2 className="text-lg font-semibold mt-6 mb-3" style={{color: 'var(--text-primary)'}}>4. Trang Cài đặt (Settings)</h2>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>File: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/setting/main.js</code></p>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Các tab</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Tab</th><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Key</th><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Component</th></tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Zalo Proxy</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">zalo</code></td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">ZaloTab</code></td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Cấu hình SLA</td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla</code></td><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">SlaTab</code></td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>ZaloTab</h3>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Danh sách tài khoản Zalo, search theo name/phone/uid</li>
            <li>Mỗi tài khoản hiển thị: avatar, tên, phone, UID, người dùng được gán</li>
            <li>Inline edit proxy (http://user:pass@host:port)</li>
            <li>Gọi <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">PATCH /api/zalo/:id</code> để lưu proxy</li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>SlaTab (Cấu hình SLA)</h3>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Đọc: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">GET /api/notifications/settings</code></li>
            <li>Ghi: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">PUT /api/notifications/settings</code></li>
          </ul>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Key</th><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Mô tả</th><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Default</th></tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_reminder_minutes</code></td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Nhắc nhở điểm danh (phút)</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>30</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_warning_minutes</code></td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Cảnh báo nhật ký (phút)</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>60</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_resource_warning_minutes</code></td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Cảnh báo minh chứng (phút)</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>90</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_incident_minutes</code></td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Vi phạm SLA (phút)</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>120</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">student_absent_threshold</code></td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Ngưỡng vắng học sinh</td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>3</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <hr className="my-6" style={{borderColor: 'var(--border-color)'}} />

        <section className="mb-8">
          <h2 className="text-lg font-semibold mt-6 mb-3" style={{color: 'var(--text-primary)'}}>5. Điểm danh (Attendance)</h2>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>File: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/academic/report/attendance-tab.js</code></p>
          <ul className="list-disc pl-6 mb-3 text-sm" style={{color: 'var(--text-primary)'}}>
            <li>Luôn hiển thị 10 hàng (hàng trống dùng <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">{'<tr>'}</code> trắng)</li>
            <li>Sticky header: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">position: sticky; top: 0</code> trong container <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">overflow-auto</code> với <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">height: 560px</code></li>
            <li>Font size tăng</li>
            <li>Pagination: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">ITEMS_PER_PAGE</code></li>
            <li>Tab mặc định: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">useState('attendance')</code> (file <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">client.js</code>)</li>
          </ul>
        </section>

        <hr className="my-6" style={{borderColor: 'var(--border-color)'}} />

        <section className="mb-8">
          <h2 className="text-lg font-semibold mt-6 mb-3" style={{color: 'var(--text-primary)'}}>6. Chi tiết khóa học (Course Detail)</h2>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>File: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/course/[...id]/ui/detailcourse/index.js</code></p>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>Các guard null-safe:</p>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code className="language-js">{`element.Cmt?.length || 0
element.Image?.length || 0
stu.Learn?.length || 0
learnDetailsArray?.length || 0
lesson?.LessonDetails?.Slide || data.Detail[0]
program.Image ? program.Image.split('/') : '/placeholder.png'`}</code></pre>
        </section>

        <hr className="my-6" style={{borderColor: 'var(--border-color)'}} />

        <section className="mb-8">
          <h2 className="text-lg font-semibold mt-6 mb-3" style={{color: 'var(--text-primary)'}}>7. Notification Settings (API)</h2>
          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>File: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">src/app/api/notifications/settings/route.js</code></p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Method</th><th className="px-3 py-2 text-left font-semibold" style={{color: 'var(--text-primary)'}}>Chức năng</th></tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">GET</code></td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Lấy tất cả settings</td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">PUT</code></td><td className="px-3 py-2 border-b border-gray-100" style={{color: 'var(--text-primary)'}}>Cập nhật một hoặc nhiều settings</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold mt-4 mb-2" style={{color: 'var(--text-primary)'}}>Schema MongoDB (<code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">notificationSetting</code>)</h3>
          <pre className="bg-[#0d1117] rounded-lg p-4 mb-4 overflow-x-auto text-sm text-gray-100"><code className="language-js">{`{
  key: String,        // unique
  value: Mixed,
  description: String,
  updated_by: ObjectId,
  timestamps: true
}`}</code></pre>

          <p className="text-sm mb-3 leading-relaxed" style={{color: 'var(--text-primary)'}}>Các key hiện tại: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_reminder_minutes</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_warning_minutes</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_resource_warning_minutes</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">sla_incident_minutes</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">student_absent_threshold</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-300">teacher_late_report_threshold</code>.</p>
        </section>
      </div>
    </div>
  )
}
