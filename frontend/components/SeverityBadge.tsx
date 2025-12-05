import React from 'react';

export const SeverityBadge = ({ severity }: { severity: string }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  const s = severity?.toLowerCase() || '';

  if (s === 'critical') colorClass = 'bg-red-100 text-red-800';
  else if (s === 'major') colorClass = 'bg-orange-100 text-orange-800';
  else if (s === 'minor') colorClass = 'bg-blue-100 text-blue-800';
  else if (s === 'low') colorClass = 'bg-green-100 text-green-800';

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
      {severity || '-'}
    </span>
  );
};
