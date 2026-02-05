import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@components/layout/Navbar/Navbar';
import { Sidebar } from '@components/layout/Sidebar/Sidebar';
import { PageLoader } from '@components/loaders/PageLoader/PageLoader';
import { AppRoutes } from '@routes/routes';
// import { useStore } from '@/stores/OLD';
import { useAuth } from "@/contexts/AuthContext";
import '@assets/css/global.css';
import { AuthProvider } from './contexts/AuthContext';

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Show page loader during global loading
  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="app">
      {/* Show navbar and sidebar only when authenticated */}
      {isAuthenticated && (
        <>
          <Navbar
            isMenuOpen={sidebarOpen}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            userName={user?.fullname || 'Utilisateur'}
            // userRole={user?.roles?.[0]?.name || 'Admin'}
            onLogout={handleLogout}
          />
          <Sidebar
            isOpen={sidebarOpen}
            isCollapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            userName={user?.fullname || 'Utilisateur'}
            // userRole={user?.roles?.[0]?.name || 'Admin'}
            onLogout={handleLogout}
          />
        </>
      )}

      {/* Main content */}
      <main className={isAuthenticated ? `main-content ${sidebarOpen ? 'with-sidebar' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}` : ''}>
        <AppRoutes />
      </main>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <AppContent />
      </AuthProvider >
    </QueryClientProvider>
  );
}

export default App;
