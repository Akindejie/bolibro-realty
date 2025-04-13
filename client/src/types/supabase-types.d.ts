import { Manager, Tenant } from './prismaTypes';

declare global {
  interface SupabaseUser {
    id: string;
    email?: string;
    user_metadata?: {
      role?: string;
      name?: string;
      phone_number?: string;
    };
  }

  interface User {
    supabaseUser: SupabaseUser;
    userInfo: Tenant | Manager;
    userRole: string;
  }
}

export {};
