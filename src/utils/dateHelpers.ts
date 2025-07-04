// Safe date creation and formatting helpers to avoid timezone issues

// Safe date creation helper to avoid timezone issues
export const createLocalDate = (dateString: string): Date => {
  try {
    // Parse YYYY-MM-DD format safely in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create date in local timezone (month is 0-indexed)
    const date = new Date(year, month - 1, day);
    
    // Validate the date was created correctly
    if (date.getFullYear() === year && 
        date.getMonth() === month - 1 && 
        date.getDate() === day) {
      return date;
    }
    
    // Fallback if date creation failed
    return new Date();
  } catch (error) {
    console.error('Error creating local date from string:', dateString, error);
    return new Date();
  }
};

// Helper to format date as YYYY-MM-DD string safely
export const formatDateString = (date: Date): string => {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date to string:', error);
    return new Date().toISOString().split('T')[0];
  }
};

// Safe string operations helper - Enhanced with better null/undefined handling
export const safeString = (value: any): string => {
  try {
    // Handle null and undefined explicitly
    if (value === null || value === undefined) {
      return '';
    }
    
    // Handle already string values
    if (typeof value === 'string') {
      return value;
    }
    
    // Handle numbers
    if (typeof value === 'number') {
      return String(value);
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return String(value);
    }
    
    // Handle objects with toString method
    if (value && typeof value === 'object' && typeof value.toString === 'function') {
      return value.toString();
    }
    
    // Final fallback
    return String(value);
  } catch (error) {
    console.error('Error in safeString:', error, 'value:', value);
    return '';
  }
};

// Safe toLowerCase operation - Enhanced with better error handling
export const safeToLowerCase = (value: any): string => {
  try {
    const str = safeString(value);
    
    // Double check the result is a string
    if (typeof str !== 'string') {
      console.warn('safeToLowerCase: safeString did not return a string', { value, str });
      return '';
    }
    
    return str.toLowerCase();
  } catch (error) {
    console.error('Error in safeToLowerCase:', error, 'value:', value);
    return '';
  }
};

// Safe toUpperCase operation - Enhanced with better error handling
export const safeToUpperCase = (value: any): string => {
  try {
    const str = safeString(value);
    
    // Double check the result is a string
    if (typeof str !== 'string') {
      console.warn('safeToUpperCase: safeString did not return a string', { value, str });
      return '';
    }
    
    return str.toUpperCase();
  } catch (error) {
    console.error('Error in safeToUpperCase:', error, 'value:', value);
    return '';
  }
};

// Additional helper to safely get object properties
export const safeGetProperty = (obj: any, property: string, fallback: any = ''): any => {
  try {
    if (!obj || typeof obj !== 'object') {
      return fallback;
    }
    
    if (!(property in obj)) {
      return fallback;
    }
    
    const value = obj[property];
    
    // Return the value if it's not null/undefined, otherwise return fallback
    return value !== null && value !== undefined ? value : fallback;
  } catch (error) {
    console.error('Error in safeGetProperty:', error, 'obj:', obj, 'property:', property);
    return fallback;
  }
};

// Safe email extraction helper
export const safeGetEmail = (user: any): string => {
  try {
    if (!user) return '';
    
    // Try user.email first
    if (user.email && typeof user.email === 'string') {
      return user.email;
    }
    
    // Try user.user_metadata.email
    if (user.user_metadata && user.user_metadata.email && typeof user.user_metadata.email === 'string') {
      return user.user_metadata.email;
    }
    
    // Try user.identities[0].email
    if (user.identities && Array.isArray(user.identities) && user.identities.length > 0) {
      const identity = user.identities[0];
      if (identity && identity.email && typeof identity.email === 'string') {
        return identity.email;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error in safeGetEmail:', error, 'user:', user);
    return '';
  }
};