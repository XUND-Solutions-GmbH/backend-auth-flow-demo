import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.get("/redirect", async (req, res) => {
  res.end()
});

app.get("/", async (req, res) => {
  // Step 1: Call /authorize endpoint
  const authorizeURL = `${process.env.XUND_AUTH_BASE_URL}/authorize?clientId=${process.env.XUND_AUTH_CLIENT_ID}&redirectUri=${process.env.XUND_AUTH_REDIRECT_URI}`;
  const authorizeResponse = await axios.get<{ authCode: string }>(authorizeURL);
  const authCode = authorizeResponse.request.path.match(/code=([^&]+)/)[1];

    // Step 2: Get JWT access token
  const tokenURL = `${process.env.XUND_AUTH_BASE_URL}/token?clientId=${process.env.XUND_AUTH_CLIENT_ID}&authCode=${authCode}`;
  const tokenResponse = await axios.get<{ accessToken: string }>(tokenURL, {
    headers: { "api-key": process.env.XUND_AUTH_API_KEY },
  });

  // Step 3: Use XUND API
  const xundApiURL = `${process.env.XUND_API_BASE_URL}/v1/imprintResources`;
  const xundApiRes = await axios.get(xundApiURL, {
    headers: {
      authorization: `Bearer ${tokenResponse.data.accessToken}`,
      language: "en",
    },
  });

  const response = {
    access_token: tokenResponse.data.accessToken,
    token_type: "Bearer",
    xund_api_response: xundApiRes.data,
  };
  res.send(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
