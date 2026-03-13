// Shared config exports
export const APP_CONFIG = {
  name: 'HardGraph',
  description: 'Interactive skill tree builder',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
} as const;
