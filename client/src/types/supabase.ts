/**
 * User metadata types for the application
 */

export interface UserMetadata {
  // Role can be 'tenant' or 'manager'
  role: 'tenant' | 'manager';

  // Additional user metadata properties can be added here as needed
  name?: string;
  phone?: string;
  avatar_url?: string;
}
