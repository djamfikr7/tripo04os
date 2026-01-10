import { useState } from 'react';
import {
  Building,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  Shield,
  CheckCircle as CheckCircleIcon,
  AlertCircle,
  Document,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/// BMAD Phase 5: Implement
/// Driver onboarding portal for registration and verification
/// BMAD Principle: Streamlined onboarding increases driver acquisition
export default function DriverOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      vin: '',
      registrationNumber: '',
      insuranceCompany: '',
      policyNumber: '',
    },
    documents: {
      driversLicense: null as File | null,
      vehicleRegistration: null as File | null,
      insuranceCard: null as File | null,
      proofOfInsurance: null as File | null,
      backgroundCheck: null as File | null,
    profilePhoto: null as File | null,
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
    },
    preferences: {
      services: [] as string[],
      workSchedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '17:00' },
        sunday: { start: '09:00', end: '17:00' },
      },
      autoAccept: false,
      acceptCash: true,
      minimumFare: 5.0,
      preferredAreas: [''],
      agreeToTerms: false,
    },
  });

  const steps = [
    { number: 1, title: 'Personal Information', icon: <User className="w-5 h-5" /> },
    { number: 2, title: 'Vehicle Details', icon: <Building className="w-5 h-5" /> },
    { number: 3, title: 'Documents Upload', icon: <Upload className="w-5 h-5" /> },
    { number: 4, title: 'Bank Details', icon: <FileText className="w-5 h-5" /> },
    { number: 5, title: 'Preferences', icon: <Shield className="w-5 h-5" /> },
    { number: 6, title: 'Review & Submit', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  const serviceTypes = [
    { id: 'ride', name: 'Ride Hailing', icon: '🚗' },
    { id: 'moto', name: 'Moto', icon: '🏍' },
    { id: 'food', name: 'Food Delivery', icon: '🍔' },
    { id: 'grocery', name: 'Grocery Delivery', icon: '🛒' },
    { id: 'goods', name: 'Goods Delivery', icon: '📦' },
    { id: 'truck', name: 'Truck & Van', icon: '🚛' },
  ];

  const handleFileChange = (field: keyof typeof formData.documents, file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: file },
    }));
  };

  const handleStepChange = (step: number, direction: 'next' | 'back') => {
    if (direction === 'next' && !validateStep(currentStep)) return;
    setCurrentStep(direction === 'next' ? step + 1 : step - 1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.personalInfo.firstName && !!formData.personalInfo.lastName &&
               !!formData.personalInfo.email && !!formData.personalInfo.phone;
      case 2:
        return !!formData.vehicleInfo.make && !!formData.vehicleInfo.model &&
               !!formData.vehicleInfo.year && !!formData.vehicleInfo.licensePlate;
      case 3:
        return !!formData.documents.driversLicense && !!formData.documents.vehicleRegistration &&
               !!formData.documents.insuranceCard && !!formData.documents.proofOfInsurance;
      case 4:
        return !!formData.bankDetails.bankName && !!formData.bankDetails.accountNumber &&
               !!formData.bankDetails.routingNumber && !!formData.bankDetails.accountHolderName;
      case 5:
        return formData.preferences.services.length > 0;
      case 6:
        return formData.preferences.agreeToTerms;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    if (!validateStep(6)) return;

    // In a real app, this would submit to backend
    console.log('Submitting driver onboarding:', formData);
    alert('Application submitted successfully! You will hear back from us within 2-3 business days.');
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Driver Onboarding</h1>
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" />
              <span className="text-sm text-gray-600">Step {currentStep} of 6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 h-1">
        <div
          className="bg-blue-600 h-1 transition-all duration-300"
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Steps Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Onboarding Steps</h2>
              <div className="space-y-2">
                {steps.map((step) => (
                  <button
                    key={step.number}
                    onClick={() => handleStepChange(step.number, 'next')}
                    disabled={step.number > currentStep}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      step.number === currentStep
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          step.number < currentStep ? 'bg-green-600 text-white' :
                          step.number === currentStep ? 'bg-blue-600 text-white' :
                          'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {step.number < currentStep && <CheckCircle className="w-5 h-5" />}
                        {step.number === currentStep && step.icon}
                        {step.number > currentStep && <span className="font-bold">{step.number}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{step.title}</p>
                        {step.number < currentStep && (
                          <p className="text-sm text-gray-600">Completed</p>
                        )}
                        {step.number > currentStep && currentStep < step.number && (
                          <p className="text-sm text-gray-600">Next</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Valid drivers license</li>
                  <li>• Vehicle registration</li>
                  <li>• Proof of insurance</li>
                  <li>• Background check</li>
                  <li>• Bank account for payouts</li>
                  <li>• Minimum 21 years of age</li>
                  <li>• Clean driving record</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              {currentStep === 1 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={formData.personalInfo.firstName}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, firstName: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={formData.personalInfo.lastName}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, lastName: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          value={formData.personalInfo.email}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, email: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={formData.personalInfo.phone}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, phone: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          value={formData.personalInfo.dateOfBirth}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                        <input
                          type="text"
                          value={formData.personalInfo.zipCode}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, zipCode: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          value={formData.personalInfo.address}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, address: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                          <input
                            type="text"
                            value={formData.personalInfo.city}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, city: e.target.value },
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                          </input>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                          <input
                            type="text"
                            value={formData.personalInfo.state}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, state: e.target.value },
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                          </input>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Vehicle Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                      <select
                        value={formData.vehicleInfo.make}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          vehicleInfo: { ...prev.vehicleInfo, make: e.target.value },
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      >
                        <option value="">Select Make</option>
                        <option value="Toyota">Toyota</option>
                        <option value="Honda">Honda</option>
                        <option value="Ford">Ford</option>
                        <option value="Chevrolet">Chevrolet</option>
                        <option value="Nissan">Nissan</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Kia">Kia</option>
                        <option value="BMW">BMW</option>
                        <option value="Mercedes">Mercedes-Benz</option>
                        <option value="Audi">Audi</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                        <input
                          type="text"
                          value={formData.vehicleInfo.model}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            vehicleInfo: { ...prev.vehicleInfo, model: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                        <input
                          type="number"
                          min={2010}
                          max={new Date().getFullYear()}
                          value={formData.vehicleInfo.year}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            vehicleInfo: { ...prev.vehicleInfo, year: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                        <input
                          type="text"
                          value={formData.vehicleInfo.color}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            vehicleInfo: { ...prev.vehicleInfo, color: e.target.value },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
                        <input
                          type="text"
                          value={formData.vehicleInfo.licensePlate}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            vehicleInfo: { ...prev.vehicleInfo, licensePlate: e.target.value.toUpperCase() },
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <h2 className="upload text-xl font-bold text-gray-900 mb-6">Documents Upload</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Document className="w-5 h-5 text-blue-600" />
                        Driver's License *
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files && handleFileChange('driversLicense', e.target.files[0])}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      {formData.documents.driversLicense && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Uploaded: {formData.documents.driversLicense.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Document className="w-5 h-5 text-blue-600" />
                        Vehicle Registration *
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files && handleFileChange('vehicleRegistration', e.target.files[0])}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      {formData.documents.vehicleRegistration && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Uploaded: {formData.documents.vehicleRegistration.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Proof of Insurance *
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files && handleFileChange('proofOfInsurance', e.target.files[0])}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      {formData.documents.proofOfInsurance && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Uploaded: {formData.documents.proofOfInsurance.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Background Check
                      </label>
                      <p className="text-sm text-gray-600 mb-1">Optional but recommended</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => e.target.files && handleFileChange('backgroundCheck', e.target.files[0])}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {formData.documents.backgroundCheck && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Uploaded: {formData.documents.backgroundCheck.name}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Bank Details</h2>
                  <p className="text-gray-600 mb-4">
                    Provide your bank account information for weekly payout transfers.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        value={formData.bankDetails.bankName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, bankName: e.target.value },
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, accountNumber: e.target.value },
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                      <input
                        type="text"
                        value={formData.bankDetails.routingNumber}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, routingNumber: e.target.value },
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountHolderName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value },
                          }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Select Services You Want to Provide</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {serviceTypes.map((service) => (
                          <label key={service.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.preferences.services.includes(service.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    services: checked
                                      ? [...prev.preferences.services, service.id]
                                      : prev.preferences.services.filter(s => s !== service.id),
                                  },
                                });
                              })}
                              className="w-5 h-5"
                            />
                            <span className="text-gray-900">{service.icon} {service.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Work Schedule (9 AM - 5 PM)</label>
                    <p className="text-sm text-gray-600 mb-2">
                      Select which days you're available. You can change this anytime in your settings.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(formData.preferences.workSchedule).map(([day, schedule], index) => (
                        <label key={day} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={schedule.start !== '09:00' && schedule.end !== '17:00'}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  workSchedule: {
                                    ...prev.preferences.workSchedule,
                                    [day]: checked
                                      ? { ...schedule }
                                      : { start: '09:00', end: '17:00' },
                                  },
                                },
                              });
                            })}
                            className="w-5 h-5"
                          />
                          <span className="capitalize text-gray-900">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.preferences.autoAccept}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, autoAccept: e.target.checked },
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-gray-900">Auto-accept ride requests (within 15 seconds)</span>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.preferences.acceptCash}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, acceptCash: e.target.checked },
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-gray-900">Accept cash payments</span>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Minimum Fare ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={formData.preferences.minimumFare}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, minimumFare: parseFloat(e.target.value) },
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Areas (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Downtown, Midtown, Airport"
                      value={formData.preferences.preferredAreas.join(', ')}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, preferredAreas: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') },
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {currentStep === 6 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Review & Submit Application</h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-600">Name:</span> <span className="font-medium text-gray-900 ml-2">{formData.personalInfo.firstName} {formData.personalInfo.lastName}</span></div>
                        <div><span className="text-gray-600">Email:</span> <span className="font-medium text-gray-900 ml-2">{formData.personalInfo.email}</span></div>
                        <div><span className="text-gray-600">Phone:</span> <span className="font-medium text-gray-900 ml-2">{formData.personalInfo.phone}</span></div>
                        <div><span className="text-gray-600">Location:</span> <span className="font-medium text-gray-900 ml-2">{formData.personalInfo.city}, {formData.personalInfo.state}</span></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Vehicle Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-600">Make:</span> <span className="font-medium text-gray-900 ml-2">{formData.vehicleInfo.make} {formData.vehicleInfo.model}</span></div>
                        <div><span className="text-gray-600">Year:</span> <span className="font-medium text-gray-900 ml-2">{formData.vehicleInfo.year}</span></div>
                        <div><span className="text-gray-600">Color:</span> <span className="font-medium text-gray-900 ml-2">{formData.vehicleInfo.color}</span></div>
                        <div><span className="text-gray-600">License Plate:</span> <span className="font-medium text-gray-900 ml-2">{formData.vehicleInfo.licensePlate}</span></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Selected Services</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.preferences.services.length > 0 ? (
                          formData.preferences.services.map(serviceId => {
                            const service = serviceTypes.find(s => s.id === serviceId);
                            return service ? (
                              <span key={serviceId} className="px-3 py-1 bg-blue-100 rounded-full text-blue-600">
                                {service.icon} {service.name}
                              </span>
                            );
                          }) : (
                            <span key={serviceId} className="text-gray-500">None selected</span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Work Schedule</h3>
                      <div className="text-sm text-gray-600">
                        Available: {Object.entries(formData.preferences.workSchedule).filter(([day, schedule]) => schedule.start !== '09:00' || schedule.end !== '17:00').map(([day, schedule]) => day).join(', ')}
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 mb-1">Important</h4>
                          <p className="text-sm text-gray-700">
                            By submitting this application, you agree to:
                          </p>
                          <ul className="list-disc list-inside ml-4 text-sm text-gray-700 space-y-1">
                            <li>Our terms of service and privacy policy</li>
                            <li>Background check and verification process</li>
                            <li>Vehicle inspection requirements</li>
                            <li>Regular compliance with local regulations</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setCurrentStep(5)}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Go Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!validateStep(6)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Submit Application
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
