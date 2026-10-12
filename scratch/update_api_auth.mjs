import fs from 'fs';

const filePath = 'e:/ReactJS/field_visit_crm/src/services/api.js';
let code = fs.readFileSync(filePath, 'utf8');

const authHelpers = `const API_BASE = 'http://localhost:5000/api';

// Helper to retrieve token from localStorage
export const getAuthToken = () => {
  try {
    return localStorage.getItem('field_crm_token') || '';
  } catch {
    return '';
  }
};

// Helper to generate auth headers with Bearer token based on login user details
export const getAuthHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }
  return headers;
};

// Central fetch wrapper that injects Authorization Bearer token from login user details
export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }
  return fetch(url, { ...options, headers });
};
`;

// Replace API_BASE definition with authHelpers
if (!code.includes('export const authFetch')) {
  code = code.replace("const API_BASE = 'http://localhost:5000/api';", authHelpers);

  // Replace fetch( with authFetch( EXCEPT inside authFetch definition
  code = code.replace(/return fetch\(url/g, '__INTERNAL_FETCH_CALL__');
  code = code.replace(/fetch\(/g, 'authFetch(');
  code = code.replace('__INTERNAL_FETCH_CALL__', 'return fetch(url');

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully updated src/services/api.js with authFetch!');
} else {
  console.log('authFetch already present in src/services/api.js');
}
