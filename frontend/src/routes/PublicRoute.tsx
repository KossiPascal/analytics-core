import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@store';
import { ROUTES } from './routes';
import { DEFAULT_AUTHENTICATED_ROUTE } from './config';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, user } = useStore();
  const location = useLocation();

  // Get the intended destination from state, or default to dashboard
  const from = (location.state as { from?: Location })?.from?.pathname || DEFAULT_AUTHENTICATED_ROUTE;

  if (isAuthenticated) {
    // If user must change password, allow access to change password page
    const changePasswordPath = ROUTES.auth.changePassword();
    if (user?.mustChangeDefaultPassword && location.pathname === changePasswordPath) {
      return <>{children}</>;
    }

    // Redirect authenticated users away from public routes
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
