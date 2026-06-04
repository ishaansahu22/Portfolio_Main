// netlify/functions/track.js

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Silent tracking should support simple requests from any source, but we only record if it's a POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: "ok" }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const page = payload.page || '#hero';
    const referrer = payload.referrer || '';
    
    // Parse client IP
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '0.0.0.0';
    const userAgent = event.headers['user-agent'] || '';
    const timestamp = new Date().toISOString();

    const visitRecord = {
      ip,
      page,
      referrer,
      userAgent,
      timestamp
    };

    if (!process.env.GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN is not set, tracking locally logged only.");
      console.log("Visit Logged:", visitRecord);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    const repoOwner = "ishaansahu22";
    const repoName = "Portfolio_Main";
    const filePath = "visitors.json";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    // 1. Get the current file's SHA & content
    let currentSha = null;
    let existingLogs = [];

    try {
      const getFileRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        currentSha = fileData.sha;
        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingLogs = JSON.parse(decodedContent || '[]');
      }
    } catch (e) {
      console.warn("Could not retrieve existing visitors.json, starting fresh:", e);
    }

    // 2. Append new visit record to top (most recent first)
    existingLogs.unshift(visitRecord);

    // Keep it optimized (max 2000 visits stored in file to stay within size bounds)
    if (existingLogs.length > 2000) {
      existingLogs = existingLogs.slice(0, 2000);
    }

    // 3. Base64 encode the new content
    const base64Content = Buffer.from(JSON.stringify(existingLogs, null, 2)).toString('base64');

    // 4. Update visitors.json
    await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'chore: log silent visit',
        content: base64Content,
        sha: currentSha
      })
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("Track Function Error:", err);
    // Return innocuous status ok anyway to avoid revealing issues or interrupting user flow
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  }
};
