import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DirectionsCar,
  Restaurant,
  ShoppingCart,
  LocalShipping,
  ElectricScooter,
  AirportShuttle,
  Star,
  Shield,
  TrendingUp,
  LocationOn,
  SupportAgent,
  Security as SecurityIcon,
  CheckCircle,
} from 'lucide-react';

/// BMAD Phase 5: Implement
/// Landing page with hero section, features, and CTAs
/// BMAD Principle: Clear value proposition increases conversion
export const Home = () => {
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const faqs = [
    {
      question: 'How do I book a ride?',
      answer: 'Simply enter your pickup and dropoff locations, select your service type, and confirm your booking. You can track your driver in real-time.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit and debit cards, PayPal, Apple Pay, Google Pay, and cash in select locations.',
    },
    {
      question: 'How do I become a driver?',
      answer: 'Sign up through our driver portal, complete the verification process, upload your documents, and start earning money on your schedule.',
    },
    {
      question: 'Do you offer corporate accounts?',
      answer: 'Yes! We offer custom solutions for businesses of all sizes. Contact our sales team to learn more about our corporate programs and volume discounts.',
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  const services = [
    {
      icon: <DirectionsCar size={40} className="text-blue-600" />,
      title: 'Ride',
      description: 'Standard and premium car rides with professional drivers',
      items: ['Solo Rides', 'Shared Rides', 'Scheduled Rides', 'Premium Cars', 'Women-Only'],
    },
    {
      icon: <ElectricScooter size={40} className="text-green-600" />,
      title: 'Moto',
      description: 'Quick and efficient motorcycle and scooter services',
      items: ['Motorcycle', 'Scooter', 'E-Scooter', 'Quick Delivery'],
    },
    {
      icon: <Restaurant size={40} className="text-orange-600" />,
      title: 'Food',
      description: 'Order from your favorite restaurants and track delivery',
      items: ['Food Delivery', 'Grocery Delivery', 'Restaurant Orders', 'Express Delivery'],
    },
    {
      icon: <ShoppingCart size={40} className="text-purple-600" />,
      title: 'Grocery',
      description: 'Get groceries delivered from local stores',
      items: ['Full Grocery', 'Express Shopping', 'Scheduled Delivery', 'Specialty Items'],
    },
    {
      icon: <LocalShipping size={40} className="text-indigo-600" />,
      title: 'Goods',
      description: 'Package and goods delivery services',
      items: ['Package Delivery', 'Document Delivery', 'Furniture Moving', 'Large Item Transport'],
    },
    {
      icon: <AirportShuttle size={40} className="text-cyan-600" />,
      title: 'Truck & Van',
      description: 'Large scale transportation solutions',
      items: ['Moving Services', 'Cargo Transport', 'Commercial Deliveries', 'Freight Services'],
    },
  ];

  const features = [
    {
      icon: <Shield className="text-blue-600" />,
      title: 'Safety First',
      description: '24/7 safety monitoring, SOS alerts, real-time trip sharing, and verified drivers.',
    },
    {
      icon: <Star className="text-yellow-600" />,
      title: 'Top-Rated Drivers',
      description: 'All drivers are background checked and rated 4.5+ by passengers.',
    },
    {
      icon: <TrendingUp className="text-green-600" />,
      title: 'Instant Matching',
      description: 'Get matched with a driver in under 2 minutes on average.',
    },
    {
      icon: <CheckCircle className="text-purple-600" />,
      title: 'Transparent Pricing',
      description: 'See your fare breakdown before you book with no hidden fees.',
    },
    {
      icon: <LocationOn className="text-red-600" />,
      title: 'Real-Time Tracking',
      description: 'Track your ride live on the map with estimated arrival times.',
    },
    {
      icon: <SupportAgent className="text-indigo-600" />,
      title: '24/7 Support',
      description: 'Get help anytime via chat, email, or phone.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <DirectionsCar className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">Tripo04OS</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50">
                Profile
              </Link>
              <Link
                to="/profile"
                className="text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Your One-Stop Platform for All Transportation Needs
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl">
                Rides, Food Delivery, Grocery, Goods, Truck & Van Services - All in One App
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/profile"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Book Now
                </Link>
                <Link
                  to="/profile"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
                <div className="flex items-center gap-4 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                  <span className="font-semibold">Trusted by 50K+ Riders</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <Star className="h-12 w-12 text-yellow-500" />
                  <span className="font-semibold">4.8/5 Average Rating</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <TrendingUp className="h-12 w-12 text-green-600" />
                  <span className="font-semibold">Average 2-min Match Time</span>
                </div>
                <div className="flex items-center gap-4">
                  <Shield className="h-12 w-12 text-blue-600" />
                  <span className="font-semibold">99.9% On-Time Pickups</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Service</h2>
            <p className="text-xl text-gray-600">
              From quick rides to large-scale logistics, we've got you covered
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Link
                key={index}
                to="/profile"
                className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 border-transparent"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 bg-blue-50 rounded-full p-4 group-hover:bg-blue-100 transition-colors">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="w-full">
                    <div className="text-sm font-semibold text-blue-600 mb-2">
                      Includes:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {service.items.map((item, i) => (
                        <span
                          key={i}
                          className="text-gray-700 bg-gray-100 px-3 py-1 rounded-md text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Tripo04OS?
            </h2>
            <p className="text-xl text-gray-600">
              We're committed to providing the best transportation experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Become a Driver Today
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-green-50 max-w-2xl">
                Earn money on your own schedule, be your own boss, and get weekly payouts
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="https://tripo04os.com/driver-signup"
                  className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors shadow-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sign Up to Drive
                </Link>
                <Link
                  to="/profile"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                  <span className="font-semibold">Flexible Schedule</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <TrendingUp className="h-12 w-12 text-green-600" />
                  <span className="font-semibold">Weekly Payouts</span>
                </div>
                <div className="flex items-center gap-4">
                  <Star className="h-12 w-12 text-yellow-500" />
                  <span className="font-semibold">Competitive Earnings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left flex justify-between items-center p-4 hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronRight
                    className={`text-gray-400 transition-transform ${
                      activeFaq === index ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                </button>
                {activeFaq === index && (
                  <p className="text-gray-600 mt-4 pt-4 border-t border-gray-200">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get the latest news, promotions, and tips delivered to your inbox
          </p>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 inline-block">
              <CheckCircle className="h-8 w-8 text-green-600 inline-block mb-2" />
              <p className="font-semibold text-green-600">Thanks for subscribing!</p>
              <p className="text-gray-700">Check your inbox for confirmation.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li>Ride Hailing</li>
                <li>Food Delivery</li>
                <li>Grocery Delivery</li>
                <li>Goods Delivery</li>
                <li>Truck & Van</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/about" className="hover:text-blue-400">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-blue-400">Careers</Link></li>
                <li><Link to="/blog" className="hover:text-blue-400">Blog</Link></li>
                <li><Link to="/press" className="hover:text-blue-400">Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/help" className="hover:text-blue-400">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400">Contact Us</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-blue-400">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Mobile Apps</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-blue-400">Download for iOS</a></li>
                <li><a href="#" className="hover:text-blue-400">Download for Android</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 mb-2">
              &copy; 2024 Tripo04OS. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              <Link to="/terms" className="hover:text-gray-400">Terms</Link> ·{' '}
              <Link to="/privacy" className="hover:text-gray-400">Privacy</Link> ·{' '}
              <Link to="/cookies" className="hover:text-gray-400">Cookies</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
