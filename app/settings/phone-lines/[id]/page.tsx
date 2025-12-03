import { RoutingRulesList } from './components/RoutingRulesList';
import { PhoneLineHeader } from './components/PhoneLineHeader';

interface PhoneLinePageProps {
  params: Promise<{ id: string }>;
}

export default async function PhoneLinePage({ params }: PhoneLinePageProps) {
  const { id } = await params;

  return (
    <div>
      <PhoneLineHeader phoneLineId={id} />
      <RoutingRulesList phoneLineId={id} />
    </div>
  );
}
