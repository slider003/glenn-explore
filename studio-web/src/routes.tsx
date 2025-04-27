import { Bot, Users, FolderOpen, Box, BarChart } from 'lucide-react';
import { CreateUserPage } from './features/users/pages/create-user-page';
import { UsersPage } from './features/users/pages/users-page';
import { UserDetailsPage } from './features/users/pages/user-details-page';
import { FilesPage } from './features/files/pages/files-page';
import { Card, CardDescription, CardHeader, CardTitle } from './shared/components/ui/card';
import { ModelsPage } from './features/models/pages/models-page';
import { CreateModelPage } from './features/models/pages/create-model-page';
import { EditModelPage } from './features/models/pages/edit-model-page';
import { CreatePublicModelPage } from './features/public-models/pages/create-public-model-page';
import { PublicModelsPage } from './features/public-models/pages/public-models-page';
import { Link } from 'react-router-dom';
import { EditPublicModelPage } from './features/public-models/pages/edit-public-model-page';
import { DashboardPage } from './features/dashboard/pages/dashboard-page';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  isHeaderItem?: boolean;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

function WelcomePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Glenn STUDIO!</CardTitle>
          <CardDescription>
            You can upload your own models here! <Link to="/studio/public-models" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Create a model</Link>

          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export const routes: RouteConfig[] = [
  {
    path: '/studio/dashboard',
    element: <DashboardPage />,
    isHeaderItem: true,
    requiresAdmin: true,
    icon: <BarChart className="h-4 w-4" />,
    label: 'Dashboard'
  },
  {
    path: '/studio',
    element: <WelcomePage />,
    isHeaderItem: true,
    icon: <Bot className="h-4 w-4" />,
    label: 'Home'
  },
  {
    path: '/studio/users',
    element: <UsersPage />,
    isHeaderItem: true,
    requiresAdmin: true,
    icon: <Users className="h-4 w-4" />,
    label: 'Users'
  },
  {
    path: '/studio/users/create',
    element: <CreateUserPage />,
    isHeaderItem: false,
    requiresAdmin: true
  },
  {
    path: '/studio/users/:userId',
    element: <UserDetailsPage />,
    isHeaderItem: false,
    requiresAdmin: true
  },
  {
    path: '/studio/files',
    element: <FilesPage />,
    isHeaderItem: true,
    requiresAdmin: true,
    icon: <FolderOpen className="h-4 w-4" />,
    label: 'Files'
  },
  {
    path: '/studio/models',
    element: <ModelsPage />,
    isHeaderItem: true,
    requiresAdmin: true,
    icon: <Box className="h-4 w-4" />,
    label: 'Models'
  },
  {
    path: '/studio/models/create',
    element: <CreateModelPage />,
    isHeaderItem: false,
    requiresAdmin: true
  },
  {
    path: '/studio/models/:id',
    element: <EditModelPage />,
    isHeaderItem: false,
    requiresAdmin: true
  },
  {
    path: '/studio/public-models',
    element: <PublicModelsPage />,
    isHeaderItem: true,
    requiresAdmin: false,
    requiresAuth: true,
    icon: <Box className="h-4 w-4" />,
    label: 'Models'
  },
  {
    path: '/studio/public-models/create',
    element: <CreatePublicModelPage />,
    isHeaderItem: false,
    requiresAdmin: false,
    requiresAuth: true
  },
  {
    path: '/studio/public-models/edit/:id',
    element: <EditPublicModelPage />,
    isHeaderItem: false,
    requiresAdmin: false,
    requiresAuth: true
  }
]; 