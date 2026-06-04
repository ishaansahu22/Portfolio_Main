// netlify/functions/upload-resume.js

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
    const { password, fileBase64, fileName } = JSON.parse(event.body);

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    if (!process.env.GITHUB_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error: GITHUB_TOKEN not set." })
      };
    }

    if (!fileBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No file data provided" }) };
    }

    const repoOwner = "ishaansahu22";
    const repoName = "Portfolio_Main";
    const filePath = `assets/${fileName || 'resume.pdf'}`;
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    // 1. Get current file SHA if it exists
    let currentSha = null;
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
      }
    } catch (e) {
      console.log("File doesn't exist yet, creating new:", e);
    }

    // 2. Upload/update file
    const putBody = {
      message: `chore: update resume (${fileName || 'resume.pdf'})`,
      content: fileBase64
    };
    if (currentSha) putBody.sha = currentSha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error("GitHub API Error:", errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Failed to upload resume. GitHub returned: ${putRes.status}` })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Resume uploaded — deploying in ~30s", path: filePath }),
    };
  } catch (err) {
    console.error("Upload Resume Error:", err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request payload" }),
    };
  }
};
