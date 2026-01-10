import React from 'react';
import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import { Home } from '@/pages/Home';
import { BookingWidget } from '@/components/BookingWidget';
import { RideHistory } from '@/components/RideHistory';
import { ProfileWidget } from '@/components/ProfileWidget';
import { CorporatePortal } from '@/pages/CorporatePortal';
import { HelpCenter } from '@/pages/HelpCenter';

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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/history',
    element: <RideHistory />,
  },
  {
    path: '/profile',
    element: <ProfileWidget />,
  },
  {
    path: '/corporate',
    element: <CorporatePortal />,
  },
  {
    path: '/help',
    element: <HelpCenter />,
  },
]);

export default function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/history" element={<RideHistory />} />
                <Route path="/profile" element={<ProfileWidget />} />
                <Route path="/corporate" element={<CorporatePortal />} />
                <Route path="/help" element={<HelpCenter />} />
              </Routes>
            </div>
            <Toaster />
          </div>
        </RouterProvider>
      </StrictMode>
    );
}
