import axios from 'axios';

export async function authorize(params: { baseUrl: string; clientId: string; redirectUri: string }): Promise<void> {
  try {
    const url = `${params.baseUrl}/authorize?clientId=${params.clientId}&redirectUri=${params.redirectUri}`;
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error('/authorize request failed');
    }
  } catch (error) {
    console.error(error);
  }
}

export async function waitForAuthCode(getAuthCode: () => string | undefined): Promise<void> {
  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  for (let i = 0; i < 5; i += 1) {
    delay(1000);
    if (getAuthCode()) {
      return;
    }
  }
  throw Error('Auth code not received');
}

export async function getJWTToken(params: { baseUrl: string; clientId: string; authCode: string; apiKey: string }): Promise<string | undefined> {
  try {
    const url = `${params.baseUrl}/token?clientId=${params.clientId}&authCode=${params.authCode}`;
    const response = await axios.get(url, { headers: { 'api-key': params.apiKey } });
    return response.data.accessToken as string;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function sendXUNDApiRequest(params: { apiBaseUrl: string; jwtAccessToken: string; tokenType: string }): Promise<any> {
  try {
    const url = `${params.apiBaseUrl}/v1/imprintResources`;
    const authorizationHeader = `${params.tokenType} ${params.jwtAccessToken}`;
    const response = await axios.get(url, { headers: { authorization: authorizationHeader, language: 'en' } });
    return response.data;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
