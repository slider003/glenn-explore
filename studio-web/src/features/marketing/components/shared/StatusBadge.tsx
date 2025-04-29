import { Badge } from '@/shared/components/ui/badge';
import * as React from 'react';

type StatusBadgeProps = {
  status: string;
  size?: 'small' | 'medium';
};

const getStatusColor = (status: string): 'green' | 'yellow' | 'red' | 'blue' => {
  switch (status.toLowerCase()) {
    case 'sent':
    case 'completed':
    case 'success':
      return 'green';
    case 'pending':
    case 'sending':
      return 'yellow';
    case 'error':
    case 'failed':
      return 'red';
    default:
      return 'blue';
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const color = getStatusColor(status);
  
  return (
    <Badge color={color}>
      {status}
    </Badge>
  );
};
