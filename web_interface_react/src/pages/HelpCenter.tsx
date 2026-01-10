import { useState } from 'react';
import {
  Search,
  Book,
  MessageCircle,
  ExternalLink,
  HelpCircle,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/// BMAD Phase 5: Implement
/// Help center with FAQs, guides, and support tickets
/// BMAD Principle: Self-service support reduces support costs
export const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'riders' | 'drivers' | 'payments' | 'safety' | 'corporate'>('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = [
    { id: 'riders', name: 'Rider Help', icon: <Book className="w-5 h-5" />, count: 12 },
    { id: 'drivers', name: 'Driver Help', icon: <MessageCircle className="w-5 h-5" />, count: 8 },
    { id: 'payments', name: 'Payments & Billing', icon: <FileText className="w-5 h-5" />, count: 6 },
    { id: 'safety', name: 'Safety & Security', icon: <CheckCircle className="w-5 h-5" />, count: 5 },
    { id: 'corporate', name: 'Corporate Accounts', icon: <Building className="w-5 h-5" />, count: 4 },
  ];

  const faqs = [
    {
      id: 'r1',
      category: 'riders',
      question: 'How do I book a ride?',
      answer: 'Enter your pickup and dropoff locations, select your service type and vehicle preference. You can track your driver in real-time once matched.',
    },
    {
      id: 'r2',
      category: 'riders',
      question: 'How do I pay for my ride?',
      answer: 'We accept all major credit/debit cards, PayPal, Apple Pay, Google Pay, and cash in select locations. Payment is processed securely after your trip is complete.',
    },
    {
      id: 'r3',
      category: 'riders',
      question: 'Can I schedule a ride for later?',
      answer: 'Yes! You can schedule a ride up to 30 days in advance. Select your preferred pickup time and confirm the booking.',
    },
    {
      id: 'd1',
      category: 'drivers',
      question: 'How do I become a driver?',
      answer: 'Sign up through our driver portal, complete verification (background check, license verification, vehicle inspection), and start accepting rides.',
    },
    {
      id: 'd2',
      category: 'drivers',
      question: 'How do I get paid?',
      answer: 'Earnings are paid out weekly to your registered bank account. You can track all your trips and earnings in real-time through the app.',
    },
    {
      id: 'd3',
      category: 'drivers',
      question: 'What are the vehicle requirements?',
      answer: 'Vehicles must be 2010 or newer, pass safety inspection, have valid registration and insurance. Specific requirements vary by service type.',
    },
    {
      id: 'p1',
      category: 'payments',
      question: 'I was charged twice, what do I do?',
      answer: 'Contact support immediately with your ride ID and payment confirmation. We\'ll investigate and issue a refund if the charge was duplicate.',
    },
    {
      id: 'p2',
      category: 'payments',
      question: 'How do I get an invoice?',
      answer: 'Invoices are automatically generated after each trip and emailed to your registered email address. You can also download them from the payment history section.',
    },
    {
      id: 's1',
      category: 'safety',
      question: 'Is my personal information secure?',
      answer: 'Yes! We use bank-level encryption for all data, never share your information with third parties without consent, and comply with GDPR and CCPA regulations.',
    },
    {
      id: 's2',
      category: 'safety',
      question: 'What safety features are available?',
      answer: 'All rides are shareable with trusted contacts. Drivers are background-checked and rated. SOS emergency alerts are available 24/7. Trip recording is enabled for safety.',
    },
    {
      id: 's3',
      category: 'safety',
      question: 'How do I report a safety issue?',
      answer: 'Use the in-app SOS button for immediate emergencies. For non-emergency safety concerns, submit a safety report through the support form or call our 24/7 safety line.',
    },
    {
      id: 'c1',
      category: 'corporate',
      question: 'What are the benefits of corporate accounts?',
      answer: 'Corporate accounts get volume discounts (up to 25%), centralized billing, monthly invoices, detailed reporting, and dedicated account management.',
    },
    {
      id: 'c2',
      category: 'corporate',
      question: 'How do I sign up for a corporate account?',
      answer: 'Contact our sales team at sales@tripo04os.com. They\'ll help you set up your account, customize your plan, and onboard your employees.',
    },
  ];

  const quickActions = [
    {
      title: 'Track Your Ride',
      description: 'View real-time ride status and driver location',
      action: () => navigate('/profile'),
      icon: <Phone className="w-5 h-5" />,
    },
    {
      title: 'Report an Issue',
      description: 'Submit a safety report or payment dispute',
      action: () => navigate('/profile'),
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      title: 'Manage Payments',
      description: 'View payment methods and transaction history',
      action: () => navigate('/profile'),
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: 'Become a Driver',
      description: 'Start earning money on your own schedule',
      action: () => navigate('https://tripo04os.com/driver-signup'),
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      title: 'Contact Support',
      description: 'Chat, email or call our support team 24/7',
      action: () => window.open('mailto:support@tripo04os.com'),
      icon: <Mail className="w-5 h-5" />,
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    activeCategory === 'all' || faq.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How Can We Help You?
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Find answers to common questions, access guides, or contact our support team
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                activeCategory === category.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-center mb-3">
                {React.cloneElement(category.icon, { className: 'w-6 h-6' })}
              </div>
              <div className="font-semibold text-gray-900">{category.name}</div>
              <div className="text-sm text-gray-500">{category.count} articles</div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 hover:border-blue-300 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-full p-2">
                    {React.cloneElement(action.icon, { className: 'w-6 h-6 text-blue-600' })}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">{action.title}</div>
                    <div className="text-sm text-gray-600">{action.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {activeCategory === 'all' ? 'All FAQs' : `${categories.find((c) => c.id === activeCategory)?.name || 'Help'} FAQs`}
          </h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-2">{faq.question}</div>
                      <div className="text-sm text-blue-600 mb-3">
                        {categories.find((c) => c.id === faq.category)?.name || 'Help'}
                      </div>
                    </div>
                    <ChevronRight
                      className={`text-gray-400 transition-transform ${
                        expandedFaq === faq.id ? 'rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-6 pb-6 pt-4 border-t border-gray-200 text-gray-700">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Guides Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a
              href="/"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 hover:border-blue-300 block"
            >
              <Book className="w-8 h-8 text-blue-600 mb-3" />
              <div className="font-semibold text-gray-900 mb-2">Booking Guide</div>
              <div className="text-sm text-gray-600">
                Learn how to book rides across all service types
              </div>
            </a>
            <a
              href="/profile"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 hover:border-blue-300 block"
            >
              <User className="w-8 h-8 text-green-600 mb-3" />
              <div className="font-semibold text-gray-900 mb-2">Account Setup</div>
              <div className="text-sm text-gray-600">
                Manage your profile, payment methods, and preferences
              </div>
            </a>
            <a
              href="/"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 hover:border-blue-300 block"
            >
              <Shield className="w-8 h-8 text-red-600 mb-3" />
              <div className="font-semibold text-gray-900 mb-2">Safety Features</div>
              <div className="text-sm text-gray-600">
                Understand SOS, ride sharing, and safety monitoring
              </div>
            </a>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Still Need Help?</h2>
              <p className="text-green-100">
                Our support team is available 24/7 to assist you
              </p>
            </div>
            <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Support
            </button>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/"
            className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-all border hover:border-blue-300 block"
          >
            <Book className="w-6 h-6 text-blue-600 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700">User Guide</span>
          </a>
          <a
            href="/"
            className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-all border hover:border-blue-300 block"
          >
            <Building className="w-6 h-6 text-purple-600 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700">Corporate Guide</span>
          </a>
          <a
            href="/"
            className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-all border hover:border-blue-300 block"
          >
            <CheckCircle className="w-6 h-6 text-green-600 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700">Safety Guide</span>
          </a>
          <a
            href=""
            className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-all border hover:border-blue-300 block"
          >
            <FileText className="w-6 h-6 text-orange-600 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700">Billing Guide</span>
          </a>
        </div>
      </div>
    </div>
  );
};
