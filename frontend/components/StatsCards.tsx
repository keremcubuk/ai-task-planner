import React from 'react';
import { Folder, CheckCircle, AlertCircle, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, iconColor, valueColor = 'text-gray-900' }) => (
  <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium uppercase">{label}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
    <Icon className={iconColor} size={40} />
  </div>
);

interface StatsCardsProps {
  total: number;
  completed: number;
  critical: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ total, completed, critical }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard 
        label="Total Tasks" 
        value={total} 
        icon={Folder} 
        iconColor="text-gray-300" 
      />
      <StatCard 
        label="Completed" 
        value={completed} 
        icon={CheckCircle} 
        iconColor="text-green-200" 
        valueColor="text-green-600"
      />
      <StatCard 
        label="Critical Issues" 
        value={critical} 
        icon={AlertCircle} 
        iconColor="text-red-200" 
        valueColor="text-red-600"
      />
    </div>
  );
};
