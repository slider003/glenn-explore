import { Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthStatus } from '../../features/auth/components/auth-status';
import { Button } from './ui/button';
import { routes } from '../../routes';
import { useAuth } from '../../features/auth/context/auth-context';

export function Header() {
  const { isAuthenticated, user } = useAuth();
  let headerItems = routes.filter(route => route.isHeaderItem);
  if (!isAuthenticated) {
    headerItems = []
  }

  if(!user?.isAdmin) {
    headerItems = headerItems.filter(item => !item.requiresAdmin)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <Bot className="h-6 w-6" />
              <span className="font-bold">Glenn Studio</span>
            </Link>
            <nav className="flex items-center space-x-4">
              {headerItems.map(item => (
                <Button key={item.path} variant="ghost" asChild>
                  <Link to={item.path} className="flex items-center space-x-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}