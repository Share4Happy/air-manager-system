import { Roboto } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import Layout_Login from '@/app/(auth)/login';
import Nav from '@/components/(layout)/nav';
import MobileHeader from '@/components/(layout)/mobileHeader';
import '@/styles/all.css';
import '@/styles/font.css';
import { getAppUrl, getCookieName } from '@/utils/env';

export const dynamic = 'force-dynamic';

const roboto = Roboto({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata = {
  title: "AI Robotic",
  description: "Khóa học công nghệ cho trẻ"
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  let data = null;
  let pathname = '';

  try {
    const headerList = await headers();
    pathname = headerList.get('x-pathname') || '';
  } catch (err) {
    // Ignore header read error
  }

  const isPublicRoute = pathname.startsWith('/share/');

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getCookieName())?.value;
    if (token) {
      const response = await fetch(`${getAppUrl()}/api/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ source: 1 }),
        cache: 'no-store'
      });
      const result = await response.json();
      if (result?.status === 2) { data = result.data; }
    }
  } catch (error) {
    console.error('RootLayout check failed:', error);
  }

  // If public route, render clean standalone layout without admin sidebar
  if (isPublicRoute) {
    return (
      <html lang="vi">
        <body className={`${roboto.variable} bg-[var(--bg-secondary)] text-[var(--text-primary)] min-h-screen antialiased`}>
          <div className="w-full min-h-screen bg-[var(--bg-secondary)] overflow-x-hidden">
            {children}
          </div>
        </body>
      </html>
    );
  }
  
  return (
    <html lang="vi">
      <body className={roboto.variable}>
        {data ?
          <div className="w-full h-full overflow-hidden flex">
            <div className="fixed top-0 left-0 h-full w-[var(--sidebar-w,240px)] border-r border-[var(--border-color)] bg-[var(--bg-primary)] z-[99] max-lg:hidden transition-all duration-300">
              <Nav data={data} />
            </div>
            <MobileHeader>
              <Nav data={data} />
            </MobileHeader>
            <div className="ml-[var(--sidebar-w,240px)] w-[calc(100%-var(--sidebar-w,240px))] h-full bg-[var(--bg-secondary)] overflow-hidden overflow-y-auto p-2 max-lg:ml-0 max-lg:w-full max-lg:h-[calc(100%-48px)] max-lg:pt-12 max-lg:p-2 transition-all duration-300">
              {children}
            </div>
          </div> :
          <Layout_Login />}
      </body>
    </html>
  );
}
