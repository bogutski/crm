import { StagesList } from './components/StagesList';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PipelineDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <StagesList pipelineId={id} />;
}
