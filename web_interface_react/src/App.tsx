import { StrictMode } from 'react';
import { createRootRoute, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  });

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Outlet />
          <Toaster />
        </div>
      </QueryClientProvider>
    </StrictMode>
  );
}

export const RootRoute = createRootRoute();
