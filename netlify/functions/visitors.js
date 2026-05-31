// netlify/functions/visitors.js

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { password } = JSON.parse(event.body || '{}');

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    if (!process.env.GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN is not set.");
      return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, logs })
    };
  } catch (err) {
    console.error("Visitors Function Error:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request" })
    };
  }
};
