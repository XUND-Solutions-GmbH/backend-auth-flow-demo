# XUND API Backend Authentication Method Demo

This project provides a guide on how to utilize the backend authentication flow. Whether you're looking to integrate secure authentication into your application or explore the capabilities of the XUND API, this repository contains an examples to get you started.

## Getting Started
### Prerequisites
Before you begin, ensure you have the following prerequisites installed:
- Node.js (18.14.x)
- Configured XUND SCIC API Key
- Redirect endpoint available by XUND auth service

### Installion
Installation
Clone the repository:

```bash
git clone https://github.com/XUND/backend-auth-flow-demo.git
cd backend-auth-flow-demo
```

Install the necessary dependencies:

```bash
npm install
```

### Configuration
Create a `.env` file in the root directory and add your XUND SCIC API credentials. Use `.env.example` as a guiding example

### Usage

1. Run the backend application on port 8000 by `npm start` command
2. Open `http://localhost:8000`
3. The backend application tries to authenticate and send an example request
4. If the authentication was successful the backend sends the following response:

```json
{
  "access_token": "eyJh...eF6qr-N2k",
  "token_type": "Bearer",
  "xund_api_response": {...}
}
```

## API Documentation
Detailed API documentation is available on the [XUND API Documentation Site](https://xund-api-documentation.scrollhelp.site/?l=en). It provides comprehensive information on endpoints, request parameters, and response structures.
