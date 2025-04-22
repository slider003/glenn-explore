import React from 'react';
import { ModelList } from '../components/model-list/model-list';
import { Card } from '@/shared/components/ui/card';
import { useGetApiModelsAdminAll } from '@/api/hooks/api';
import { Car, User, DollarSign, Package, Power, PowerOff } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
}) => (
  <Card className="p-6">
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-lg bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  </Card>
);

export const ModelsPage: React.FC = () => {
  const { data: models } = useGetApiModelsAdminAll({});

  const stats = React.useMemo(() => {
    if (!models) return null;

    const totalModels = models.length;
    const carModels = models.filter(m => m.type === 'car').length;
    const characterModels = models.filter(m => m.type === 'walking').length;
    const premiumModels = models.filter(m => m.isPremium).length;
    const activeModels = models.filter(m => m.isActive).length;
    const inactiveModels = models.filter(m => !m.isActive).length;

    return [
      {
        title: 'Total Models',
        value: totalModels,
        icon: <Package className="h-5 w-5 text-primary" />,
        description: 'Total number of models in your collection'
      },
      {
        title: 'Active Models',
        value: activeModels,
        icon: <Power className="h-5 w-5 text-primary" />,
        description: 'Models available to users'
      },
      {
        title: 'Inactive Models',
        value: inactiveModels,
        icon: <PowerOff className="h-5 w-5 text-primary" />,
        description: 'Models hidden from users'
      },
      {
        title: 'Vehicle Models',
        value: carModels,
        icon: <Car className="h-5 w-5 text-primary" />,
        description: 'Number of vehicle models available'
      },
      {
        title: 'Character Models',
        value: characterModels,
        icon: <User className="h-5 w-5 text-primary" />,
        description: 'Number of character models available'
      },
      {
        title: 'Premium Models',
        value: premiumModels,
        icon: <DollarSign className="h-5 w-5 text-primary" />,
        description: 'Models available for purchase'
      }
    ];
  }, [models]);

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Model Management</h1>
          <p className="text-muted-foreground">
            Create and manage your 3D models collection
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        )}

        <ModelList />
      </div>
    </div>
  );
}; 