import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { createHmac } from 'crypto';
import { v4 as uuid } from 'uuid';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

type TokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  origin?: string;
};

type AuthorizeResponse = {
  authCode: string;
  state?: string;
};

// Method 1: Using client-credentials
app.get('/client-credentials', async (req, res) => {
  // Step 1: Get JWT access token
  const tokenURL = `${process.env.XUND_AUTH_BASE_URL}/token`
  const tokenResponse = await axios.post<TokenResponse>(tokenURL, {
    grant_type: 'client_credentials',
    clientId: process.env.XUND_AUTH_CLIENT_ID,
    clientSecret: process.env.XUND_AUTH_API_KEY,
  });

  // Step 2: Use XUND API
  const xundApiURL = `${process.env.XUND_API_BASE_URL}/v1/imprintResources`;
  const xundApiRes = await axios.get(xundApiURL, {
    headers: {
      authorization: `Bearer ${tokenResponse.data.access_token}`,
      language: 'en',
    },
  });

  const response = {
    access_token: tokenResponse.data.access_token,
    token_type: tokenResponse.data.token_type,
    xund_api_response: xundApiRes.data,
  };
  res.send(response);
});

// Method 2: Using authorization-code
app.get('/authorization-code', async (req, res) => {
  // Step 1: Call /authorize endpoint
  const state = uuid();
  if (!process.env.XUND_AUTH_API_KEY) {
    throw new Error('Api key must be set in environment variables');
  }
  const hasher = createHmac('sha256', process.env.XUND_AUTH_API_KEY);
  hasher.update(`${state}${process.env.XUND_AUTH_CLIENT_ID}`);
  const secretHash = hasher.digest('hex');

  const authorizeURL = `${process.env.XUND_AUTH_BASE_URL}/authorize`;
  const authorizeResponse = await axios.get<AuthorizeResponse>(authorizeURL, {
    params: {
      clientId: process.env.XUND_AUTH_CLIENT_ID,
      secretHash: secretHash,
      state: state,
      authCode: process.env.XUND_AUTH_CODE ? process.env.XUND_AUTH_CODE : undefined,
    },
  });

  // Step 2: Get JWT access token
  const tokenURL = `${process.env.XUND_AUTH_BASE_URL}/token`;
  const tokenResponse = await axios.post<TokenResponse>(tokenURL, {
    grant_type: 'authorization_code',
    clientId: process.env.XUND_AUTH_CLIENT_ID,
    code: authorizeResponse.data.authCode,
  });

  // Step 3: Use XUND API
  const xundApiURL = `${process.env.XUND_API_BASE_URL}/v1/imprintResources`;
  const xundApiRes = await axios.get(xundApiURL, {
    headers: {
      authorization: `Bearer ${tokenResponse.data.access_token}`,
      language: 'en',
    },
  });

  const response = {
    access_token: tokenResponse.data.access_token,
    token_type: tokenResponse.data.token_type,
    xund_api_response: xundApiRes.data,
  };
  res.send(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
