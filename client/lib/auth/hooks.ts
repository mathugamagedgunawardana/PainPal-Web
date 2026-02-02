'use client';

import { useAuth } from './AuthContext';
export { useAuth } from './AuthContext';

/**
 * Hook to check if user has specific role(s)
 */
export function useRole(...roles: Array<'ADMIN' | 'DOCTOR' | 'PATIENT'>) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  return roles.includes(user.role);
}

/**
 * Hook to get user's full information
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
