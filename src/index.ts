import express from "express";
import dotenv from "dotenv";
import axios, { isAxiosError } from "axios";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.get("/redirect", async (req, res) => {
  console.log('redirect called!');
  res.end()
});

app.get("/", async (req, res) => {
  // Step 1: Call /authorize endpoint
  let authorizeURL_authCode = `${process.env.XUND_AUTH_BASE_URL}/authorize?clientId=${process.env.XUND_AUTH_CLIENT_ID}`;
  if (process.env.AUTH_CODE) {
    authorizeURL_authCode += `&authCode=${process.env.AUTH_CODE}`;
  }
  const authorizeResponse_authCode = await axios.get<{ authCode: string }>(authorizeURL_authCode);

  const authCode = authorizeResponse_authCode.data.authCode;

    // Step 2: Get JWT access token
  const tokenURL_authCode = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}&authCode=${authCode}`;
  const tokenResponse_authCode = await axios.get<{ access_token: string }>(tokenURL_authCode, {
    headers: { "api-key": process.env.XUND_AUTH_API_KEY },
  });


  // Step 3: Use XUND API
  const xundApiURL_authCode = `${process.env.XUND_API_BASE_URL}/v1/imprintResources`;
  const xundApiRes_authCode = await axios.get(xundApiURL_authCode, {
    headers: {
      authorization: `Bearer ${tokenResponse_authCode.data.access_token}`,
      language: "en",
    },
  });


    // The /authorize endpoint just checks the clientId and the origin if given and returns 200
  const authorizeURL = `${process.env.XUND_AUTH_BASE_URL}/authorize?clientId=${process.env.XUND_AUTH_CLIENT_ID}`;
  try {
    const authorizeResponse = await axios.get(authorizeURL);
    console.log(`Authorize status: ${authorizeResponse.status}`);
  }
  catch (err) {
    if (isAxiosError(err)) {
      console.log('authorize failed');
      res.status(500).send('Authorize failed');
      return;
    }
  }

    // Get JWT access token with clientId and clientSecret (we use the api-key as clientSecret)
  const tokenURL = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}&clientSecret=${process.env.XUND_AUTH_API_KEY}`;
  const tokenResponse = await axios.get<{ access_token: string, token_type: string }>(tokenURL);

    // Get JWT access token with the clientId and api-key header (soon to be deprecated)
  const tokenURL_apiKey = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}`;
  const tokenResponse_apiKey = await axios.get<{ access_token: string, token_type: string }>(tokenURL_apiKey, {
    headers: { "api-key": process.env.XUND_AUTH_API_KEY },
  });

    // Use XUND API with the token
  const xundApiURL = `${process.env.XUND_API_BASE_URL}/v1/imprintResources`;
  let xundApiRes;
  try {
    xundApiRes = await axios.get(xundApiURL, {
      headers: {
        authorization: `Bearer ${tokenResponse.data.access_token}`,
        language: "en",
      },
    });
  }
  catch (err) {
    if (isAxiosError(err)) {
      console.log('api error');
      res.status(500).send(err);
      return;
    }
  }

    // Use XUND API with the api-key
  let xundApiRes_apiKey;
  try {
    xundApiRes_apiKey = await axios.get(xundApiURL, {
      headers: {
        apikey: process.env.XUND_AUTH_API_KEY,
        language: "en",
      },
    });
  }
  catch (err) {
    if (isAxiosError(err)) {
      console.log('api error');
      res.status(500).send(err);
      return;
    }
  }

  const response = {
    clientCredentials: {
      access_token: tokenResponse.data.access_token,
      token_type: tokenResponse.data.token_type,
      xund_api_response: xundApiRes?.data,
    },
    apiKey: {
      access_token: tokenResponse_apiKey.data.access_token,
      token_type: tokenResponse_apiKey.data.token_type,
      xund_api_response: xundApiRes_apiKey?.data,
    },
    authCode: {
      access_token: tokenResponse_authCode.data.access_token,
      token_type: "Bearer",
      xund_api_response: xundApiRes_authCode?.data,
    },
  };
  res.send(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
