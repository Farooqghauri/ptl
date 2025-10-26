// Validation schemas for form inputs

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate lawyer form data
 */
export function validateLawyerForm(data: {
  name: string;
  email: string;
  telephone: string;
  city: string;
  licenseNumber: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Name validation
  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  // Email validation
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  // Phone validation
  if (!data.telephone.trim()) {
    errors.telephone = "Phone number is required";
  } else {
    const cleaned = data.telephone.replace(/\D/g, "");
    if (cleaned.length !== 10 && !(cleaned.length === 11 && cleaned.startsWith("0"))) {
      errors.telephone = "Please enter a valid Pakistani phone number";
    }
  }

  // City validation
  if (!data.city.trim()) {
    errors.city = "City is required";
  }

  // License number validation
  if (!data.licenseNumber.trim()) {
    errors.licenseNumber = "License number is required";
  } else if (data.licenseNumber.trim().length < 3) {
    errors.licenseNumber = "License number must be at least 3 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate contact form data
 */
export function validateContactForm(data: {
  name: string;
  email: string;
  message: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.message.trim()) {
    errors.message = "Message is required";
  } else if (data.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!query.trim()) {
    errors.query = "Search query is required";
  } else if (query.trim().length < 2) {
    errors.query = "Search query must be at least 2 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
