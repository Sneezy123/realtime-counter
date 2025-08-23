/**
 * URL Access Key Utilities
 * 
 * This module provides utilities for handling access keys in URLs while maintaining
 * security by keeping them hashed in the database.
 */

import { isValidHexKey, hashAccessKey, validateAccessKey } from './securityUtils';

/**
 * Validates an access key from URL against the stored hash
 * @param providedKey - The access key from URL (unhashed)
 * @param storedHash - The hashed access key from database
 * @returns Promise<boolean> - Whether the key is valid
 */
export const validateUrlAccessKey = async (
  providedKey: string,
  storedHash: string
): Promise<boolean> => {
  if (!isValidHexKey(providedKey)) {
    return false;
  }
  return await validateAccessKey(providedKey, storedHash);
};

/**
 * Extracts access key from URL parameters
 * @param searchParams - URLSearchParams from location
 * @returns string | null - The access key if present
 */
export const extractAccessKeyFromUrl = (
  searchParams: URLSearchParams
): string | null => {
  const key = searchParams.get('key');
  return key && isValidHexKey(key) ? key : null;
};

/**
 * Generates a share URL with access key
 * @param groupName - The group name
 * @param accessKey - The unhashed access key
 * @returns string - The complete share URL
 */
export const generateShareUrl = (groupName: string, accessKey: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/${groupName}?key=${accessKey}`;
};

/**
 * Creates a new group with access key
 * @param groupName - The group name
 * @param accessKey - The unhashed access key
 * @returns Promise<string> - The group ID
 */
export const createGroupWithAccessKey = async (
  groupName: string,
  accessKey: string
): Promise<string> => {
  const hashedKey = await hashAccessKey(accessKey);
  
  // This function will be implemented in the CounterGroup component
  // as it needs access to the supabase client
  return hashedKey;
};
