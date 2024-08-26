import express from "express";
import dotenv from "dotenv";
import axios, { isAxiosError } from "axios";

const STATE = 'cd1f934d-6d68-4888-853e-78993bd28e41';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.get("/redirect", async (req, res) => {
  console.log('redirect called!');
  res.end()
});

app.get("/", async (req, res) => {
  const FRONTEND_AUTH = process.env.FRONTEND_AUTH == "true";
  let response:any = {};
  if (FRONTEND_AUTH) {
  // Step 1: Call /authorize endpoint
  let authorizeURL_authCode = `${process.env.XUND_AUTH_BASE_URL}/authorize?clientId=${process.env.XUND_AUTH_CLIENT_ID}&scope=state&state=${STATE}`;
  if (process.env.AUTH_CODE) {
    authorizeURL_authCode += `&authCode=${process.env.AUTH_CODE}`;
  }
  const authorizeResponse_authCode = await axios.get<{ authCode: string, state: string }>(authorizeURL_authCode, {
    headers: {
      origin: 'http://localhost:8000',
    }
  });

  console.log(`authCode authorize status: ${authorizeResponse_authCode.status}`);
  console.log(`authCode authorize res data: ${JSON.stringify(authorizeResponse_authCode.data,null,2)}`);
  const authCode = authorizeResponse_authCode.data.authCode;
  const state_authCode = authorizeResponse_authCode.data.state;

    // Step 2: Get JWT access token
  const tokenURL_authCode = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}&authCode=${authCode}&redirectUri=${process.env.XUND_AUTH_REDIRECT_URI}`;
  const tokenResponse_authCode = await axios.get<{ accessToken: string }>(tokenURL_authCode, {
    headers: {
    }
  });

  console.log(`authCode token status: ${tokenResponse_authCode.status}`);

  const token = tokenResponse_authCode.request.res.responseUrl.match(/\/#([^&]+)/)[1];

  if (token) {
    console.log(`authCode token data: ${token}`);
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
  const authorizeURL = `${process.env.XUND_AUTH_BASE_URL}/authorize?clientId=${process.env.XUND_AUTH_CLIENT_ID}&authCode=${process.env.AUTH_CODE}`;
  let authCode_noState;
  try {
    const authorizeResponse = await axios.get(authorizeURL, {
      headers: {
        origin: 'http://localhost:8000',
      }
    });

    console.log(`noState authorize status: ${authorizeResponse.status}`);
    console.log(`noState authorize res data: ${JSON.stringify(authorizeResponse.data,null,2)}`);
    authCode_noState = authorizeResponse_authCode.data.authCode;
    //state_authCode_noState = authorizeResponse_authCode.data.state;
    console.log(authCode_noState);
  }
  catch (err) {
    if (isAxiosError(err)) {
      console.log('authorize failed');
      res.status(500).send('Authorize failed');
      return;
    }
  }

    // Step 2: Get JWT access token
  const tokenURL_authCode_noState = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}&authCode=${authCode_noState}&redirectUri=${process.env.XUND_AUTH_REDIRECT_URI}`;
  const tokenResponse_authCode_noState = await axios.get<{ accessToken: string }>(tokenURL_authCode_noState );

  const token_noState = tokenResponse_authCode_noState.request.res.responseUrl.match(/\/#([^&]+)/)[1];

  if (token_noState) {
    console.log(`noState token status: ${tokenResponse_authCode_noState.status}`);
    console.log(`noState token data: ${token_noState}`);
  }

    response.authCode = {
      accessToken: token,
      state: state_authCode,
      token_type: "Bearer",
      xund_api_response: xundApiRes_authCode?.data,
    };
    response.noState = {
      accessToken: token_noState,
      state: state_authCode,
      token_type: "Bearer",
    };
  }

    // Get JWT access token with POST clientId and clientSecret (we use the api-key as clientSecret)
  const tokenURL_POST = `${process.env.XUND_AUTH_BASE_URL}/token?grant_type=client_credentials&state=${STATE}`;
  const tokenResponse_POST = await axios.post<{ access_token: string, token_type: string }>(tokenURL_POST, {
    clientId: process.env.XUND_AUTH_CLIENT_ID,
    clientSecret: process.env.XUND_AUTH_API_KEY,
    grant_type: 'client_credentials',
  });

    console.log(`clientSecret token status: ${tokenResponse_POST.status}`);
    console.log(`clientSecret token res data: ${JSON.stringify(tokenResponse_POST.data,null,2)}`);

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

  response.clientCredentials_POST = {
      accessToken: tokenResponse_POST.data.access_token,
      token_type: "Bearer",
      xund_api_response: xundApiRes_POST?.data,
    };
    response.apiKey = {
      xund_api_response: xundApiRes_apiKey?.data,
    };
  res.send(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
