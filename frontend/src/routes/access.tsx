import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "./configs";
import { DEFAULT_AUTHENTICATED_ROUTE } from "./index";

export type Access = "authenticated" | "public";

interface RouteAccessProps {
  children: React.ReactNode;
  permissions: string[];
  access?: Access;
}

export const RouteAccess: React.FC<RouteAccessProps> = ({ children, access, permissions }) => {
  const { isAuthenticated, user, hasPermission } = useAuth();
  const location = useLocation();

  // 🔐 Protected routes
  if (access === "authenticated") {
    if (!isAuthenticated || !user) {
      return ( <Navigate to={ROUTES.auth.login()} state={{ from: location }} replace />);
    }

    if(!hasPermission(permissions)){
      return <Navigate to={ROUTES.errors.unauthorized()} replace />;
    }

    if (user?.mustChangeDefaultPassword) {
      const changePasswordPath = ROUTES.auth.changePassword();
      if (location.pathname !== changePasswordPath) {
        return <Navigate to={changePasswordPath} replace />;
      }
    }

    return <>{children}</>;
  }

  // 🌍 Public routes
  if (access === "public" && isAuthenticated) {
    return <Navigate to={DEFAULT_AUTHENTICATED_ROUTE} replace />;
  }

  return <>{children}</>;
};
