const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AdminRequestFormInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: number | string | null;
}

export function validateAdminRequestForm(
  formData: AdminRequestFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  if (!formData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(formData.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }
  if (!formData.password?.trim()) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (formData.phone !== undefined && formData.phone !== null && formData.phone !== '') {
    const digits = String(formData.phone).replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 12) {
      errors.phone = 'Phone number must be between 10 and 12 digits';
    }
  }

  return errors;
}
