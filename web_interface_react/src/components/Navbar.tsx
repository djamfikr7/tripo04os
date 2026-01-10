import { useState } from 'react';
import {
  Menu,
  X,
  Map,
  User,
  Clock,
  LogOut,
  Car,
} from 'lucide-react';

export default function Navbar({ activeRoute }: { activeRoute: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'book', label: 'Book Ride', icon: <Car className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">Tripo04OS</div>
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/book"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeRoute === 'book' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Book a Ride
            </a>
            <a
              href="/history"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeRoute === 'history' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              History
            </a>
            <a
              href="/profile"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeRoute === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Profile
            </a>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className={`md:hidden fixed inset-0 top-16 left-0 z-50 w-64 bg-white shadow-xl rounded-lg transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="py-4 px-6">
            <div className="space-y-2">
              <a
                href="/book"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeRoute === 'book' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <Car className="w-5 h-5 mr-3" />
                <span>Book a Ride</span>
              </a>
              <a
                href="/history"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeRoute === 'history' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <Clock className="w-5 h-5 mr-3" />
                <span>History</span>
              </a>
              <a
                href="/profile"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeRoute === 'profile' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5 mr-3" />
                <span>Profile</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <span className="text-xl font-bold">Log Out</span>
            <LogOut className="w-5 h-5" />
          </a>
        </div>
      </div>
    </nav>
  );
}
