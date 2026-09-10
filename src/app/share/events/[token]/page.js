import PublicEventViewer from './ui/PublicEventViewer';

export const metadata = {
    title: 'Kịch bản & Kế hoạch Sự kiện | AI Robotic',
    description: 'Cổng thông tin xem kịch bản điều phối và kế hoạch sự kiện trực tuyến.',
};

export default async function PublicEventPage({ params }) {
    const { token } = await params;
    return <PublicEventViewer token={token} />;
}
