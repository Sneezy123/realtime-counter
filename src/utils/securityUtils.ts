export const generateAccessKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const isValidHexKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Check if it's valid hex and at least 16 characters
  return /^[0-9a-fA-F]+$/.test(key) && key.length >= 16 && key.length <= 128;
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim()
              .substring(0, 1000); // Limit length to prevent abuse
};