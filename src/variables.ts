export const getAuthBaseUrl = (): string => process.env.XUND_AUTH_BASE_URL ?? 'https://login.xund.solutions/api';

export const getApiBaseUrl = (): string => process.env.XUND_API_BASE_URL ?? 'https://medical.api.xund.solutions';

export const getClientId = (): string => {
  if (!process.env.XUND_AUTH_CLIENT_ID) {
    throw new Error('No XUND_AUTH_CLIENT_ID set');
  }
  return process.env.XUND_AUTH_CLIENT_ID;
};

export const getApiKey = (): string => {
  if (!process.env.XUND_AUTH_API_KEY) {
    throw new Error('No XUND_AUTH_API_KEY set');
  }
  return process.env.XUND_AUTH_API_KEY;
};

export const getRedirectUri = (): string => {
  if (!process.env.XUND_AUTH_REDIRECT_URI) {
    throw new Error('No XUND_AUTH_REDIRECT_URI set');
  }
  return encodeURIComponent(process.env.XUND_AUTH_REDIRECT_URI);
};

export const getTokenType = (): string => 'Bearer'
