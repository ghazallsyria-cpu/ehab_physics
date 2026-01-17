/**
 * Security Service for Syrian Science Center
 * Implements client-side hashing to ensure raw passwords never leave the client.
 */

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "SSC_SALT_2024"); // Adding a static salt for extra security
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) return { isValid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' };
  if (!/[A-Z]/.test(password)) return { isValid: false, message: 'يجب أن تحتوي على حرف كبير واحد على الأقل.' };
  if (!/[0-9]/.test(password)) return { isValid: false, message: 'يجب أن تحتوي على رقم واحد على الأقل.' };
  return { isValid: true, message: 'كلمة مرور قوية.' };
};