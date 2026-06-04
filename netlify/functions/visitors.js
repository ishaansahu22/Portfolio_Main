// netlify/functions/visitors.js

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
    const { password } = JSON.parse(event.body || '{}');

    if (!process.env.ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD environment variable is not set.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error: ADMIN_PASSWORD not set. Please add it in Netlify → Site Settings → Environment Variables." })
      };
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    if (!process.env.GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN is not set.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error: GITHUB_TOKEN not set. Please add a GitHub Personal Access Token (with repo scope) in Netlify → Site Settings → Environment Variables." })
      };
    }

    const repoOwner = "ishaansahu22";
    const repoName = "Portfolio_Main";
    const filePath = "visitors.json";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    let logs = [];
    
    try {
      const getFileRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        logs = JSON.parse(decodedContent || '[]');
      }
    } catch (e) {
      console.warn("Could not retrieve visitors.json:", e);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, logs })
    };
  } catch (err) {
    console.error("Visitors Function Error:", err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request" })
    };
  }
};
