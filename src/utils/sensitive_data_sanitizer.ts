/* eslint-disable @typescript-eslint/no-explicit-any */
export class SensitiveDataSanitizer {
    private static _sensitiveKeys: string[] = ['token', 'password', 'cuurent_password', 'new_password', 'old_password'];
  
    /**
     * Initialize the sanitizer with a list of keys to sanitize
     * @param keys - Array of sensitive keys
     */
    static configure(keys: string[]): void {
      this._sensitiveKeys = keys.map((key) => key.toLowerCase()); 
    }
  
    /**
     * Sanitize an object by replacing sensitive fields with masked values
     * @param data - The object to sanitize
     * @returns - The sanitized object
     */
    static sanitize(data: unknown): any {
      // If data is an object or array, recursively sanitize sensitive keys
      if (typeof data === 'object' && data !== null) {
        const sanitized: Record<string, any> = Array.isArray(data)
          ? [...data]
          : { ...data };
  
        for (const key of Object.keys(sanitized)) {
          const normalizedKey = key.toLowerCase(); // Normalize key for case-insensitive matching
  
          if (this._sensitiveKeys.includes(normalizedKey)) {
            sanitized[key] = '*'.repeat(String(sanitized[key]).length);
          } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = this.sanitize(sanitized[key]); // Recursive sanitization
          }
        }
        return sanitized;
      }
  
      return data;
    }
  }