import { Bot, Users, FolderOpen, Box } from 'lucide-react';
import { CreateUserPage } from './features/users/pages/create-user-page';
import { UsersPage } from './features/users/pages/users-page';
import { FilesPage } from './features/files/pages/files-page';
import { Card, CardDescription, CardHeader, CardTitle } from './shared/components/ui/card';
import { ModelsPage } from './features/models/pages/models-page';
import { CreateModelPage } from './features/models/pages/create-model-page';
import { EditModelPage } from './features/models/pages/edit-model-page';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  isHeaderItem?: boolean;
  requiresAuth?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

function WelcomePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to AI-Stack</CardTitle>
          <CardDescription>
            Play around and see what you can build!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export const routes: RouteConfig[] = [
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
    requiresAuth: true,
    icon: <Users className="h-4 w-4" />,
    label: 'Users'
  },
  {
    path: '/studio/users/create',
    element: <CreateUserPage />,
    isHeaderItem: false,
    requiresAuth: true
  },
  {
    path: '/studio/files',
    element: <FilesPage />,
    isHeaderItem: true,
    requiresAuth: true,
    icon: <FolderOpen className="h-4 w-4" />,
    label: 'Files'
  },
  {
    path: '/studio/models',
    element: <ModelsPage />,
    isHeaderItem: true,
    requiresAuth: true,
    icon: <Box className="h-4 w-4" />,
    label: 'Models'
  },
  {
    path: '/studio/models/create',
    element: <CreateModelPage />,
    isHeaderItem: false,
    requiresAuth: true
  },
  {
    path: '/studio/models/:id',
    element: <EditModelPage />,
    isHeaderItem: false,
    requiresAuth: true
  }
]; 