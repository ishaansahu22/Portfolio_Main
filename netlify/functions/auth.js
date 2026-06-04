// netlify/functions/auth.js

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { password } = JSON.parse(event.body);

    if (!process.env.ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD environment variable is not set.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error: ADMIN_PASSWORD not set. Please add it in Netlify Environment Variables." })
      };
    }

    if (password === process.env.ADMIN_PASSWORD) {
      const token = Buffer.from(`${password}:${Date.now()}`).toString('base64');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ token, success: true }),
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid password" }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request payload" }),
    };
  }
};
