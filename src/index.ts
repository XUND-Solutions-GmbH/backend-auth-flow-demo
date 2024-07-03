import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { getApiBaseUrl, getApiKey, getAuthBaseUrl, getClientId, getRedirectUri, getTokenType } from './variables';
import { authorize, waitForAuthCode, getJWTToken, sendXUNDApiRequest } from './functions';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

let authCode: string | undefined = undefined;
let jwtAccessToken: string | undefined = undefined;

app.get('/redirect', async (req: Request, res: Response) => {
  authCode = req.query.code as string;
  res.sendStatus(200);
});

app.get('/', async (req: Request, res: Response) => {
  // Step 1: Call /authorize endpoint 
  await authorize({ baseUrl: getAuthBaseUrl(), clientId: getClientId(), redirectUri: getRedirectUri() });

  // Step 2: Wait for receiving the auth code via /redirect endpoint
  try {
    await waitForAuthCode(() => authCode);
    if (!authCode) {
      throw Error('Undefined auth code');
    }
  } catch (error) {
    res.json({ message: 'Failed to get an auth code', error });
    return;
  }

  // Step 3: Get JWT access token
  jwtAccessToken = await getJWTToken({
    baseUrl: getAuthBaseUrl(),
    clientId: getClientId(),
    authCode: authCode,
    apiKey: getApiKey(),
  });

  if (!jwtAccessToken) {
    res.json({ message: 'Failed to get a jwt access token' });
    return;
  }

  // Step 4: Use XUND API
  const xundApiRes = await sendXUNDApiRequest({ apiBaseUrl: getApiBaseUrl(), tokenType: getTokenType(), jwtAccessToken: jwtAccessToken });

  const response = {
    access_token: jwtAccessToken,
    token_type: 'Bearer',
    xund_api_response: xundApiRes,
  };
  res.send(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
