import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar, Sidebar } from '@components/layout';
import { PageLoader } from '@components/loaders';
import { AppRoutes } from '@/routes';
import { useStore } from '@store';
import '@assets/css/global.css';

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
  const { isAuthenticated, user, isGlobalLoading } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed] = useState(false);

  const handleLogout = () => {
    useStore.getState().logout();
  };

  // Show page loader during global loading
  if (isGlobalLoading) {
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
            userRole={user?.roles?.[0]?.name || 'Admin'}
            onLogout={handleLogout}
          />
          <Sidebar
            isOpen={sidebarOpen}
            isCollapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            userName={user?.fullname || 'Utilisateur'}
            userRole={user?.roles?.[0]?.name || 'Admin'}
            onLogout={handleLogout}
          />
        </>
      )}

      {/* Main content */}
      <main
        className={
          isAuthenticated
            ? `main-content ${sidebarOpen ? 'with-sidebar' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`
            : ''
        }
      >
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
