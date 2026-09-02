// Dev talks to the local server, so server changes are testable before they're
// deployed. Vite inlines DEV, so the branch never reaches the prod bundle.
export const API_URL = import.meta.env.DEV
    ? 'http://localhost:3001'
    : 'https://filmjousting.onrender.com';
