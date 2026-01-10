import { createBrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BookingWidget } from '@/components/BookingWidget';
import { RideHistory } from '@/components/RideHistory';
import { ProfileWidget } from '@/components/ProfileWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeRoute={useLocation().pathname} />
      <Routes>
        <Route path="/" element={<BookingWidget />} />
        <Route path="/history" element={<RideHistory />} />
        <Route path="/profile" element={<ProfileWidget />} />
      </Routes>
    </div>
  );
}
