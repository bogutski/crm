import { WebhookDetail } from './components/WebhookDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WebhookDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <WebhookDetail webhookId={id} />;
}
