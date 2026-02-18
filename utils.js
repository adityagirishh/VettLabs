// Input sanitization utilities
export function sanitizeEmail(email) {
  return email.trim().toLowerCase().replace(/[<>\"']/g, '');
}

export function sanitizeString(str) {
  if (!str) return '';
  return str.replace(/[<>\"'&]/g, (char) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
    return entities[char] || char;
  });
}

// Rate limiting
const submissions = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SUBMISSIONS = 3;

export function checkRateLimit(identifier) {
  const now = Date.now();
  const userSubmissions = submissions.get(identifier) || [];
  
  const recentSubmissions = userSubmissions.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentSubmissions.length >= MAX_SUBMISSIONS) {
    return false;
  }
  
  recentSubmissions.push(now);
  submissions.set(identifier, recentSubmissions);
  return true;
}

// Enhanced email validation
export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}
