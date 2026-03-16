import { Badge } from './ui';

export const SeverityBadge = ({ severity }: { severity: string }) => {
  const s = severity?.toLowerCase() || '';

  let color: 'gray' | 'red' | 'orange' | 'blue' | 'green' = 'gray';
  if (s === 'critical') color = 'red';
  else if (s === 'major') color = 'orange';
  else if (s === 'minor') color = 'blue';
  else if (s === 'low') color = 'green';

  return (
    <Badge color={color} size="sm">
      {severity || '-'}
    </Badge>
  );
};
