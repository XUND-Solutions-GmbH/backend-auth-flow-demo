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
  const authorizeResponse_authCode = await axios.get<{ authCode: string }>(authorizeURL_authCode, {
    headers: {
      origin: 'http://localhost:8000',
    }
  });

  console.log(`authCode authorize status: ${authorizeResponse_authCode.status}`);
  const authCode = authorizeResponse_authCode.data.authCode;

    // Step 2: Get JWT access token
  const tokenURL_authCode = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}&authCode=${authCode}&redirectUri=${process.env.XUND_AUTH_REDIRECT_URI}`;
  const tokenResponse_authCode = await axios.get<{ accessToken: string }>(tokenURL_authCode );

  const token = tokenResponse_authCode.request.res.responseUrl.match(/\/#([^&]+)/)[1];

  if (token) {
    console.log('authCode auth passed');
  }



  // Step 3: Use XUND API
  const xundApiURL_authCode = `${process.env.XUND_API_BASE_URL}/v1/imprintResources`;
  const xundApiRes_authCode = await axios.get(xundApiURL_authCode, {
    headers: {
      authorization: `Bearer ${token}`,
      language: "en",
    },
  });


    // The /authorize endpoint just checks the clientId and the origin if given and returns 200
  const authorizeURL = `${process.env.XUND_AUTH_BASE_URL}/authorize?clientId=${process.env.XUND_AUTH_CLIENT_ID}`;
  try {
    const authorizeResponse = await axios.get(authorizeURL, {
    headers: {
      origin: 'http://localhost:8000',
    }
  });

    console.log(`clientSecret authorize status: ${authorizeResponse.status}`);
  }
  catch (err) {
    if (isAxiosError(err)) {
      console.log('authorize failed');
      res.status(500).send('Authorize failed');
      return;
    }
  }


    // Get JWT access token with POST clientId and clientSecret (we use the api-key as clientSecret)
  const tokenURL_POST = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}&clientSecret=${process.env.XUND_AUTH_API_KEY}&grant_type=client_credentials`;
  const tokenResponse_POST = await axios.post<{ access_token: string, token_type: string }>(tokenURL_POST);

  console.log('clientSecret auth passed');

    // Use XUND API with the token
  const xundApiURL = `${process.env.XUND_API_BASE_URL}/v1/imprintResources`;

  let xundApiRes_POST;
  try {
    xundApiRes_POST = await axios.get(xundApiURL, {
      headers: {
        authorization: `${tokenResponse_POST.data.token_type} ${tokenResponse_POST.data.access_token}`,
        language: "en",
      },
    });
  }
  catch (err) {
    if (isAxiosError(err)) {
      console.log('api error POST');
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
      console.log('api error api-key');
      res.status(500).send(err);
      return;
    }
  }

  const response = {
    clientCredentials_POST: {
      accessToken: tokenResponse_POST.data.access_token,
      token_type: "Bearer",
      xund_api_response: xundApiRes_POST?.data,
    },
    apiKey: {
      xund_api_response: xundApiRes_apiKey?.data,
    },
    authCode: {
      accessToken: tokenResponse_authCode.data.accessToken,
      token_type: "Bearer",
      xund_api_response: xundApiRes_authCode?.data,
    },
  };
  res.send(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
