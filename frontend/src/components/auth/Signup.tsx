import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, Building, AlertCircle, Loader2, CheckCircle, Globe, GraduationCap, Briefcase, Users2, Shield } from 'lucide-react';

/**
 * Request Access Component (Redesigned Signup)
 * 
 * Approval-based access request system for institutional users.
 * NO self-assigned roles or subscriptions - all assigned after admin review.
 */

interface AccessRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organization: string;
  organizationType: string;
  intendedUse: string;
  intendedUseDetails?: string;
  country: string;
}

type UserPathType = 'government' | 'organization' | 'education' | 'individual' | null;

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuthContext();
  
  const [selectedPath, setSelectedPath] = useState<UserPathType>(null);
  const [credentials, setCredentials] = useState<AccessRequest>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organization: '',
    organizationType: '',
    intendedUse: '',
    intendedUseDetails: '',
    country: 'Zimbabwe'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Organization type options based on selected path
  const getOrganizationTypes = (): { value: string; label: string }[] => {
    switch (selectedPath) {
      case 'government':
        return [
          { value: 'local_council', label: 'Local Council / Municipality' },
          { value: 'provincial_government', label: 'Provincial Government' },
          { value: 'national_government', label: 'National Government Agency' },
          { value: 'ministry', label: 'Government Ministry' },
          { value: 'parastatal', label: 'Parastatal / State Enterprise' }
        ];
      case 'organization':
        return [
          { value: 'private_company', label: 'Private Company' },
          { value: 'ngo', label: 'NGO / Non-Profit' },
          { value: 'consulting', label: 'Consulting Firm' },
          { value: 'research_org', label: 'Research Organization' }
        ];
      case 'education':
        return [
          { value: 'university', label: 'University' },
          { value: 'college', label: 'College / Polytechnic' },
          { value: 'high_school', label: 'High School / Secondary School' },
          { value: 'primary_school', label: 'Primary School' },
          { value: 'research_institute', label: 'Research Institute' }
        ];
      case 'individual':
        return [
          { value: 'independent_researcher', label: 'Independent Researcher' },
          { value: 'student', label: 'Student' },
          { value: 'freelancer', label: 'Freelance Consultant' },
          { value: 'hobbyist', label: 'Personal / Learning' }
        ];
      default:
        return [];
    }
  };

  // Intended use options
  const intendedUseOptions = [
    { value: 'research', label: 'Academic Research' },
    { value: 'planning', label: 'Urban / Regional Planning' },
    { value: 'policy', label: 'Policy Development' },
    { value: 'education', label: 'Education / Teaching' },
    { value: 'analysis', label: 'Commercial Analysis' },
    { value: 'monitoring', label: 'Environmental Monitoring' },
    { value: 'mapping', label: 'Mapping / Cartography' },
    { value: 'agriculture', label: 'Agriculture / Land Management' },
    { value: 'disaster', label: 'Disaster Management' },
    { value: 'personal', label: 'Personal Learning' },
    { value: 'other', label: 'Other (Please specify)' }
  ];

  // User path cards
  const userPaths: Array<{
    type: UserPathType;
    title: string;
    icon: React.ReactNode;
    description: string;
    examples: string;
    gradient: string;
  }> = [
    {
      type: 'government',
      title: 'Government / Council',
      icon: <Shield className="h-10 w-10" />,
      description: 'For councils, ministries, and government agencies',
      examples: 'Urban planning, policy making, infrastructure development',
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      type: 'organization',
      title: 'Organization / Company',
      icon: <Briefcase className="h-10 w-10" />,
      description: 'For businesses, NGOs, and consulting firms',
      examples: 'Commercial analysis, project planning, consulting services',
      gradient: 'from-green-500 to-green-700'
    },
    {
      type: 'education',
      title: 'University / School',
      icon: <GraduationCap className="h-10 w-10" />,
      description: 'For educational institutions and research centers',
      examples: 'Academic research, teaching, student projects',
      gradient: 'from-purple-500 to-purple-700'
    },
    {
      type: 'individual',
      title: 'Individual / Student',
      icon: <Users2 className="h-10 w-10" />,
      description: 'For independent researchers and learners',
      examples: 'Personal research, learning, thesis work',
      gradient: 'from-orange-500 to-orange-700'
    }
  ];

  // Password strength validation
  const getPasswordStrength = (password: string): { score: number; feedback: string } => {
    let score = 0;
    let feedback = 'Too weak';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Too weak';
        break;
      case 2:
        feedback = 'Weak';
        break;
      case 3:
        feedback = 'Fair';
        break;
      case 4:
        feedback = 'Good';
        break;
      case 5:
        feedback = 'Strong';
        break;
    }

    return { score, feedback };
  };

  const passwordStrength = getPasswordStrength(credentials.password);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedPath) {
      errors.path = 'Please select your user type';
      setValidationErrors(errors);
      return false;
    }

    // Email validation
    if (!credentials.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Name validation
    if (!credentials.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!credentials.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Organization validation
    if (!credentials.organization.trim()) {
      errors.organization = selectedPath === 'individual' 
        ? 'Please enter your affiliation or "Independent"' 
        : 'Organization name is required';
    }

    // Organization type validation
    if (!credentials.organizationType) {
      errors.organizationType = 'Please select your organization type';
    }

    // Intended use validation
    if (!credentials.intendedUse) {
      errors.intendedUse = 'Please specify your intended use';
    } else if (credentials.intendedUse === 'other' && !credentials.intendedUseDetails?.trim()) {
      errors.intendedUseDetails = 'Please provide details about your intended use';
    }

    // Country validation
    if (!credentials.country.trim()) {
      errors.country = 'Country is required';
    }

    // Password validation
    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      errors.password = 'Password is too weak. Please include uppercase, lowercase, numbers, and special characters.';
    }

    // Confirm password validation
    if (!credentials.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (credentials.password !== credentials.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance
    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Transform to signup credentials format
      const signupData = {
        email: credentials.email,
        password: credentials.password,
        confirmPassword: credentials.confirmPassword,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        organization: credentials.organization,
        role: 'pending_user', // Always pending - admin assigns real role
        subscriptionPlan: 'free_pending', // Temporary - admin assigns real plan
        organizationType: credentials.organizationType,
        intendedUse: credentials.intendedUse,
        intendedUseDetails: credentials.intendedUseDetails,
        country: credentials.country,
        userPath: selectedPath
      };

      await signup(signupData as any);
      navigate('/dashboard');
    } catch (err) {
      console.error('Access request failed:', err);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof AccessRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getPasswordStrengthColor = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Render path selection
  if (!selectedPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-900">
              Request Access to Geospatial Repository
            </h2>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
              Join the national geospatial data platform for satellite imagery, analytics, and insights
            </p>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                <span>Used by planners & researchers</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-blue-600" />
                <span>Approval-based access</span>
              </div>
              <div className="flex items-center">
                <Users2 className="h-4 w-4 mr-1 text-purple-600" />
                <span>Trusted by institutions</span>
              </div>
            </div>
          </div>

          {/* Path Selection */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Who are you?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userPaths.map((path) => (
                <button
                  key={path.type}
                  onClick={() => setSelectedPath(path.type)}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-blue-300 transform hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${path.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                  <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${path.gradient} mb-4 shadow-lg`}>
                    <div className="text-white">
                      {path.icon}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {path.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {path.description}
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    e.g., {path.examples}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center pt-8">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render application form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={() => setSelectedPath(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-500 flex items-center mx-auto"
          >
            ← Change user type
          </button>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            {userPaths.find(p => p.type === selectedPath)?.icon}
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Request Access - {userPaths.find(p => p.type === selectedPath)?.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your application will be reviewed by our team
          </p>
        </div>

        {/* Application Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
            {/* Global Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {validationErrors.path && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{validationErrors.path}</p>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={credentials.firstName}
                    onChange={handleInputChange('firstName')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={credentials.lastName}
                    onChange={handleInputChange('lastName')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address * {selectedPath !== 'individual' && <span className="text-gray-500">(Work or institutional email preferred)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleInputChange('email')}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={selectedPath === 'individual' ? 'your.email@example.com' : 'john.doe@organization.com'}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Organization Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Organization Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedPath === 'individual' ? 'Affiliation *' : 'Organization Name *'}
                  </label>
                  <input
                    id="organization"
                    type="text"
                    value={credentials.organization}
                    onChange={handleInputChange('organization')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.organization ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={
                      selectedPath === 'individual' 
                        ? 'e.g., University of Zimbabwe, Independent, etc.' 
                        : 'e.g., Harare City Council'
                    }
                  />
                  {validationErrors.organization && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.organization}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Type *
                  </label>
                  <select
                    id="organizationType"
                    value={credentials.organizationType}
                    onChange={handleInputChange('organizationType')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.organizationType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select type...</option>
                    {getOrganizationTypes().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors.organizationType && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.organizationType}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country / Region *
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={credentials.country}
                    onChange={handleInputChange('country')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.country ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Zimbabwe"
                  />
                  {validationErrors.country && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Intended Use */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Intended Use
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="intendedUse" className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Intended Use *
                  </label>
                  <select
                    id="intendedUse"
                    value={credentials.intendedUse}
                    onChange={handleInputChange('intendedUse')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.intendedUse ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select intended use...</option>
                    {intendedUseOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors.intendedUse && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.intendedUse}</p>
                  )}
                </div>

                {credentials.intendedUse === 'other' && (
                  <div>
                    <label htmlFor="intendedUseDetails" className="block text-sm font-medium text-gray-700 mb-1">
                      Please specify your intended use *
                    </label>
                    <textarea
                      id="intendedUseDetails"
                      value={credentials.intendedUseDetails}
                      onChange={handleInputChange('intendedUseDetails')}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.intendedUseDetails ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe how you plan to use the geospatial data..."
                    />
                    {validationErrors.intendedUseDetails && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.intendedUseDetails}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-600" />
                Account Security
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={handleInputChange('password')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        validationErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {credentials.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.score >= 4 ? 'text-green-600' : 
                          passwordStrength.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={credentials.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-start">
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (validationErrors.terms) {
                      setValidationErrors(prev => ({
                        ...prev,
                        terms: ''
                      }));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div className="ml-3">
                  <label htmlFor="accept-terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
                      Privacy Policy
                    </Link>, and understand that my application will be reviewed before access is granted.
                  </label>
                </div>
              </div>
              {validationErrors.terms && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Request Access
                  </>
                )}
              </button>
              <p className="mt-3 text-xs text-center text-gray-500">
                Your application will be reviewed within 1-2 business days. You'll receive an email notification once your access has been approved.
              </p>
            </div>
          </div>
        </form>

        {/* Sign In Link */}
        <div className="text-center pb-8">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
