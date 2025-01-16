import { z } from 'zod';

export const publishProfileParamSchema = z.object({
  userId: z
    .number()
    .int('User ID must be an integer.')
    .positive('User ID must be a positive number.'),
});

export const privateProfileParamSchema = z.object({
  userId: z
    .number()
    .int('User ID must be an integer.')
    .positive('User ID must be a positive number.'),
});
export const getInTouchMailRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address.'),
  email_to: z.string().email('Email To must be a valid email address.'),
  inquiry: z
    .string()
    .min(1, 'Inquiry is required.')
    .max(500, 'Inquiry must not exceed 500 characters.'),
  name: z.string().min(1, 'Name is required.').max(100, 'Name must not exceed 100 characters.'),
  phone: z
    .string()
    .regex(
      /^\+?[0-9]{7,15}$/,
      "Phone must be a valid phone number (7-15 digits, optional leading '+').",
    ),
});

export const getPublicProfileParamSchema = z.object({
  userName: z
    .string()
    .min(1, 'Username is required.')
    .max(50, 'Username must not exceed 50 characters.'),
});

export const inviteUserRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address.'),
  full_name: z
    .string()
    .min(1, 'Full name is required.')
    .max(100, 'Full name must not exceed 100 characters.'),
  role: z.string().min(1, 'Role is required.').max(50, 'Role must not exceed 50 characters.'),
});

export const updateRecruiterUserSchema = inviteUserRequestSchema.partial();

export const recruiterUserParamSchema = z.object({
  id: z.number().int('ID must be an integer.').positive('ID must be a positive number.'),
});

export const applicantUserParamSchema = z.object({
  id: z.number().int('ID must be an integer.').positive('ID must be a positive number.'),
});

export const recruiterUserAuthRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(50, 'Password must not exceed 50 characters.'),
  first_name: z
    .string()
    .min(1, 'First name is required.')
    .max(50, 'First name must not exceed 50 characters.'),
  last_name: z
    .string()
    .min(1, 'Last name is required.')
    .max(50, 'Last name must not exceed 50 characters.'),
});

export const loginRecruiterUserRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(50, 'Password must not exceed 50 characters.'),
});

export const changePasswordRequestSchema = z.object({
  current_password: z
    .string()
    .min(6, 'Current password must be at least 6 characters long.')
    .max(50, 'Current password must not exceed 50 characters.'),
  new_password: z
    .string()
    .min(6, 'New password must be at least 6 characters long.')
    .max(50, 'New password must not exceed 50 characters.')
    .refine((val) => !val.includes(' '), 'New password must not contain spaces.'),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address.'),
});

export const verifyTokenRequestSchema = z.object({
  token: z.string().min(1, 'Token is required.').max(255, 'Token must not exceed 255 characters.'),
});

export const resetPasswordRequestSchema = z.object({
  new_password: z
    .string()
    .min(6, 'New password must be at least 6 characters long.')
    .max(50, 'New password must not exceed 50 characters.')
    .refine((val) => !val.includes(' '), 'New password must not contain spaces.'),
});

export const getUserDetailsParamSchema = z.object({
  userId: z
    .number()
    .int('User ID must be an integer.')
    .positive('User ID must be a positive number.'),
});

export const adminBlockRequestSchema = z.object({
  block_status: z
    .boolean()
    .nullable()
    .optional()
    .refine((val) => val !== undefined, 'Block status must be true, false, or null.'),
  user_id: z
    .number()
    .int('User ID must be an integer.')
    .positive('User ID must be a positive number.'),
});

export const impersonateUserRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address.'),
  user_id: z
    .number()
    .int('User ID must be an integer.')
    .positive('User ID must be a positive number.'),
  username: z
    .string()
    .min(1, 'Username is required.')
    .max(50, 'Username must not exceed 50 characters.'),
});

export const createUpdateKeywordRequestSchema = z.object({
  keywords: z
    .array(z.string().min(1, 'Each keyword must not be empty.'))
    .min(1, 'At least one keyword is required.')
    .max(50, 'No more than 50 keywords are allowed.'),
});

export const userParamSchema = z.object({
  userId: z
    .number()
    .int('User ID must be an integer.')
    .positive('User ID must be a positive number.'),
});

export const updatePreferencesRequestSchema = z.object({
  about: z.string().nullable().optional(),
  city: z
    .string()
    .min(1, 'City is required.')
    .max(100, 'City must not exceed 100 characters.')
    .nullable()
    .optional(),
  currency: z
    .string()
    .min(1, 'Currency is required.')
    .max(10, 'Currency must not exceed 10 characters.')
    .nullable()
    .optional(),
  currency_country: z
    .string()
    .min(1, 'Currency country is required.')
    .max(100, 'Currency country must not exceed 100 characters.')
    .nullable()
    .optional(),
  current_ote: z.number().nullable().optional(),
  custom_current_role: z.string().nullable().optional(),
  email: z.string().email('Email must be a valid email address.').nullable().optional(),
  full_name: z
    .string()
    .min(1, 'Full name is required.')
    .max(100, 'Full name must not exceed 100 characters.')
    .nullable()
    .optional(),
  languages: z
    .array(z.string().min(1, 'Language must not be empty.'))
    .min(1, 'At least one language is required.')
    .nullable()
    .optional(),
  location_preferences: z
    .array(z.string().min(1, 'Location preference must not be empty.'))
    .min(1, 'At least one location preference is required.')
    .nullable()
    .optional(),
  next_desired_titles: z
    .array(z.string().min(1, 'Desired title must not be empty.'))
    .min(1, 'At least one desired title is required.')
    .nullable()
    .optional(),
  open_to_work: z.boolean().nullable().optional(),
  ote_expectation: z.number().nullable().optional(),
  ote_max: z.number().nullable().optional(),
  ote_min: z.number().nullable().optional(),
  phone: z.string().nullable().optional(),
  public_profile_username: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  preference_step: z.number().nullable().optional(),
  is_preferences_save: z.boolean().optional(),
});

