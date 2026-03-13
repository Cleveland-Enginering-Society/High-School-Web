'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InfoTooltip } from '@/components/InfoTooltip';

/** Options for host_options (select all that apply). Stored as jsonb array. */
const HOST_OPTION_LABELS = [
  'Provide job shadowing opportunities',
  'Provide internship or co-op opportunities',
  'Partner with CES to host a career fair',
  'Attend in school STEM Education program (hosted by CES)',
  'Other',
] as const;

interface FormData {
  contactEmail: string;
  password: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone: number | undefined;
  secondaryFirstName: string;
  secondaryLastName: string;
  secondaryEmail: string;
  secondaryPhone: number | undefined;
  companyName: string;
  industry: string;
  companyLocation: string;
  hostOptions: string[];
  hostOptionsOther: string;
}

interface FormErrors {
  contactEmail?: string;
  password?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactPhone?: string;
  secondaryFirstName?: string;
  secondaryLastName?: string;
  secondaryEmail?: string;
  secondaryPhone?: string;
  companyName?: string;
  industry?: string;
  companyLocation?: string;
  hostOptions?: string;
  hostOptionsOther?: string;
}

export default function CompanySignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    contactEmail: '',
    password: '',
    contactFirstName: '',
    contactLastName: '',
    contactPhone: undefined,
    secondaryFirstName: '',
    secondaryLastName: '',
    secondaryEmail: '',
    secondaryPhone: undefined,
    companyName: '',
    industry: '',
    companyLocation: '',
    hostOptions: [],
    hostOptionsOther: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router, supabase.auth]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
  };

  const validatePhone = (phone: number | undefined): boolean => {
    if (phone === undefined) return true;
    const phoneLength = phone.toString().length;
    return phoneLength >= 10 && phoneLength <= 12;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!validateEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.contactFirstName.trim()) {
      newErrors.contactFirstName = 'Contact first name is required';
    }
    if (!formData.contactLastName.trim()) {
      newErrors.contactLastName = 'Contact last name is required';
    }
    if (formData.contactPhone !== undefined && !validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = 'Phone number must be between 10 and 12 digits';
    }

    if (formData.secondaryEmail.trim() && !validateEmail(formData.secondaryEmail)) {
      newErrors.secondaryEmail = 'Please enter a valid email address';
    }
    if (formData.secondaryPhone !== undefined && formData.secondaryPhone !== 0 && !validatePhone(formData.secondaryPhone)) {
      newErrors.secondaryPhone = 'Phone number must be between 10 and 12 digits';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.companyLocation.trim()) {
      newErrors.companyLocation = 'Company location is required';
    }

    if (formData.hostOptions.includes('Other') && !formData.hostOptionsOther.trim()) {
      newErrors.hostOptionsOther = 'Please specify when selecting Other';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (field: keyof FormData, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    const limitedDigits = digitsOnly.slice(0, 12);
    if (limitedDigits === '') {
      handleInputChange(field, undefined);
    } else {
      const numValue = parseInt(limitedDigits, 10);
      if (!isNaN(numValue)) {
        handleInputChange(field, numValue);
      }
    }
  };

  const handleHostOptionToggle = (option: string) => {
    setFormData((prev) => {
      const current = prev.hostOptions;
      const next = current.includes(option)
        ? current.filter((s) => s !== option)
        : [...current, option];
      return { ...prev, hostOptions: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signup/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        if (data.requiresEmailConfirmation) {
          router.push(`/confirm-email?email=${encodeURIComponent(formData.contactEmail)}`);
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        setSubmitError(data.error || 'Failed to create account');
        setIsSubmitting(false);
        setFormData({
          contactEmail: '',
          password: '',
          contactFirstName: '',
          contactLastName: '',
          contactPhone: undefined,
          secondaryFirstName: '',
          secondaryLastName: '',
          secondaryEmail: '',
          secondaryPhone: undefined,
          companyName: '',
          industry: '',
          companyLocation: '',
          hostOptions: [],
          hostOptionsOther: '',
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
      setFormData({
        contactEmail: '',
        password: '',
        contactFirstName: '',
        contactLastName: '',
        contactPhone: undefined,
        secondaryFirstName: '',
        secondaryLastName: '',
        secondaryEmail: '',
        secondaryPhone: undefined,
        companyName: '',
        industry: '',
        companyLocation: '',
        hostOptions: [],
        hostOptionsOther: '',
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Company Sign Up</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account: Contact Email (login) + Password */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">
                  Main Contact Email <span className="text-red-500">*</span>
                  <InfoTooltip description="This email is used to sign in to your account and must be unique. Use the primary contact's work email." id="company-contact-email-tooltip" />
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6" />

          {/* Main Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Main Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactFirstName" className="block text-sm font-medium mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactFirstName"
                  value={formData.contactFirstName}
                  onChange={(e) => handleInputChange('contactFirstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.contactFirstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.contactFirstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactFirstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactLastName" className="block text-sm font-medium mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactLastName"
                  value={formData.contactLastName}
                  onChange={(e) => handleInputChange('contactLastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.contactLastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.contactLastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactLastName}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={formData.contactPhone ?? ''}
                  onChange={(e) => handlePhoneChange('contactPhone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10–12 digits"
                  maxLength={12}
                />
                {errors.contactPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6" />

          {/* Secondary Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Secondary Contact Information</h2>
            <p className="text-sm text-gray-600">This section is optional, but it would provide an additional contact person for us to reach out to for events or follow-up.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="secondaryFirstName" className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="secondaryFirstName"
                  value={formData.secondaryFirstName}
                  onChange={(e) => handleInputChange('secondaryFirstName', e.target.value)}
                  className="w-full px-3 py-2 border rounded border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="secondaryLastName" className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="secondaryLastName"
                  value={formData.secondaryLastName}
                  onChange={(e) => handleInputChange('secondaryLastName', e.target.value)}
                  className="w-full px-3 py-2 border rounded border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="secondaryEmail" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="secondaryEmail"
                  value={formData.secondaryEmail}
                  onChange={(e) => handleInputChange('secondaryEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.secondaryEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.secondaryEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.secondaryEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor="secondaryPhone" className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="secondaryPhone"
                  value={formData.secondaryPhone ?? ''}
                  onChange={(e) => handlePhoneChange('secondaryPhone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.secondaryPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10–12 digits"
                  maxLength={12}
                />
                {errors.secondaryPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.secondaryPhone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6" />

          {/* Company Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.companyName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium mb-1">
                  Industry <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.industry ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Technology, Healthcare"
                />
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                )}
              </div>

              <div>
                <label htmlFor="companyLocation" className="block text-sm font-medium mb-1">
                  Company Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyLocation"
                  value={formData.companyLocation}
                  onChange={(e) => handleInputChange('companyLocation', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    errors.companyLocation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder=""
                />
                {errors.companyLocation && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyLocation}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6" />

          {/* Host options (optional, select all that apply + Other textbox) */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Outside of a tour, are you interested in working with students in any or all of these ways? <span className="text-gray-500 font-normal">(optional)</span>
            </h2>
            <p className="text-sm text-gray-600 mb-2">Choose all that apply.</p>
            <div className="space-y-2">
              {HOST_OPTION_LABELS.map((option) => (
                <div key={option}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.hostOptions.includes(option)}
                        onChange={() => handleHostOptionToggle(option)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span>{option}</span>
                    </label>
                    {option === 'Other' && formData.hostOptions.includes('Other') && (
                      <input
                        type="text"
                        value={formData.hostOptionsOther}
                        onChange={(e) => handleInputChange('hostOptionsOther', e.target.value)}
                        placeholder="Please specify (required)"
                        className={`flex-1 min-w-[200px] max-w-md px-3 py-2 border rounded text-sm ${
                          errors.hostOptionsOther ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    )}
                  </div>
                  {option === 'Other' && formData.hostOptions.includes('Other') && errors.hostOptionsOther && (
                    <p className="text-red-500 text-sm mt-1 ml-6">{errors.hostOptionsOther}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {submitError}
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
