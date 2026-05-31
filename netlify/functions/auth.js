// netlify/functions/auth.js

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { password } = JSON.parse(event.body);

    if (!process.env.ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD environment variable is not set.");
      return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
    }

    if (password === process.env.ADMIN_PASSWORD) {
      // Create a simple token for session validation
      // In a real app, this would be a JWT or secure session ID
      const token = Buffer.from(`${password}:${Date.now()}`).toString('base64');
      return {
        statusCode: 200,
        body: JSON.stringify({ token, success: true }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid password" }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request payload" }),
    };
  }
};
