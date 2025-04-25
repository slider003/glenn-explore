import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/shared/components/ui/toaster';
import { RootLayout } from './shared/layouts/root-layout';
import { routes, RouteConfig } from './routes';
import { AuthGuard } from './features/auth/components/auth-guard';
import { AuthProvider } from './features/auth/context/auth-context';
import { LoginPage } from './features/auth/pages/login';

function renderRoutes(routes: RouteConfig[]) {
  return routes.map(route => {

    if(route.requiresAdmin) {
      return <Route key={route.path} path={route.path} element={<AuthGuard requireAdmin>{route.element}</AuthGuard>} />;
    }

    if(route.requiresAuth) {
      return <Route key={route.path} path={route.path} element={<AuthGuard>{route.element}</AuthGuard>} />;
    }

    return <Route key={route.path} path={route.path} element={route.element} />;
  });
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            {renderRoutes(routes)}
          </Route>
          <Route path="/studio/login" element={<LoginPage />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}