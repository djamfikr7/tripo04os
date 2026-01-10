import { useState } from 'react';
import { User, MapPin, Clock, LogOut, Settings, CreditCard, Shield } from 'lucide-react';

export default function ProfileWidget() {
  const [activeTab, setActiveTab] = useState<'profile' | 'payment' | 'settings'>('profile');

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'payment'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                      JD
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-800">John Doe</div>
                      <div className="text-sm text-gray-500">john.doe@example.com</div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    Edit Profile
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="font-medium text-gray-800">+1 234 567 8900</div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        Edit
                      </button>
                    </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500">Default Vehicle</div>
                          <div className="font-semibold text-gray-800">Sedan</div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          Change
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Favorite Locations</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Home</div>
                          <div className="font-medium text-gray-800">123 Main St, New York, NY</div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        Edit
                      </button>
                      </div>
                      <div className="flex items-start space-x-4">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Work</div>
                          <div className="font-medium text-gray-800">456 Broadway, New York, NY</div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        Edit
                      </button>
                      </div>
                      <button className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        + Add Location
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <CreditCard className="w-12 h-8 text-blue-600 mr-3" />
                      <div className="flex-1">
                        <div>
                          <div className="text-lg font-semibold text-gray-800">Visa ending in 4242</div>
                          <div className="text-sm text-gray-500">Primary card</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-green-600">Default</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-8 bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                        <PayPal />
                      </div>
                      <div className="flex-1">
                        <div>
                          <div className="text-lg font-semibold text-gray-800">PayPal</div>
                          <div className="text-sm text-gray-500">john.doe@paypal.com</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-green-600">Default</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <ApplePay className="w-12 h-8 text-gray-800 mr-3" />
                      <div className="flex-1">
                        <div>
                          <div className="text-lg font-semibold text-gray-800">Apple Pay</div>
                          <div className="text-sm text-gray-500">Connected</div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        Add
                      </button>
                    </div>
                  </div>

                  <button className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    + Add Payment Method
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Notifications</div>
                      <div className="font-semibold text-gray-800">Enabled</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={true} className="sr-only w-5 h-5 h-5 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 w-12 h-6 bg-gray-200 rounded-full"></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">SMS Notifications</div>
                    <div className="font-semibold text-gray-800">Disabled</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only w-5 h-5 text-gray-400 focus:ring-blue-500" />
                    <span className="ml-2 w-12 h-6 bg-gray-200 rounded-full"></span>
                  </label>
                </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Email Notifications</div>
                    <div className="font-semibold text-gray-800">Enabled</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={true} className="sr-only w-5 h-5 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 w-12 h-6 bg-gray-200 rounded-full"></span>
                  </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Location Sharing</div>
                    <div className="font-semibold text-gray-800">Always Ask</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={true} className="sr-only w-5 h-5 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 w-12 h-6 bg-gray-200 rounded-full"></span>
                  </label>
                  </div>
                </div>

                <div className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-gray-500">Language</div>
                      <div className="font-semibold text-gray-800">English</div>
                    </div>
                    <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Arabic</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Theme</div>
                      <div className="font-semibold text-gray-800">Light</div>
                    </div>
                    <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>Auto</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Security</h3>
                  <div className="flex items-center space-x-4">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div className="text-sm text-gray-500">Two-factor authentication</div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    Setup
                  </button>
                </div>

                <button className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
