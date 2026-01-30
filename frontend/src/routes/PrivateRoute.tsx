import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@store';
import { ROUTES } from './routes';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, user } = useStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to={ROUTES.auth.login()} state={{ from: location }} replace />;
  }

  // If user must change password, redirect to change password page
  const changePasswordPath = ROUTES.auth.changePassword();
  if (user?.mustChangeDefaultPassword && location.pathname !== changePasswordPath) {
    return <Navigate to={changePasswordPath} replace />;
  }

  return <>{children}</>;
}
