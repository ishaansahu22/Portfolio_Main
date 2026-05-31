// netlify/functions/save.js

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { password, content } = JSON.parse(event.body);

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    if (!process.env.GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN environment variable is not set.");
      return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
    }

    // 1. Get the current file's SHA (required by GitHub API to update a file)
    const repoOwner = "ishaansahu22";
    const repoName = "Portfolio_Main";
    const filePath = "content.json"; // This depends on how it's deployed. Let's assume it's root for now, or if it's inside portfolio folder in the repo it should be 'portfolio/content.json'.
    // Assuming the netlify site is linked to the portfolio repository and content.json is at the root of the repo.
    // If the repo is a monorepo, the path might be different. Let's assume it's just 'content.json' in the repo root.
    
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
    
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
      console.log("Error fetching current file, it might not exist yet:", e);
    }

    // 2. Base64 encode the new content
    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // 3. Update the file
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'chore: update content via admin panel',
        content: base64Content,
        sha: currentSha
      })
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error("GitHub API Error:", errorText);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to update GitHub repository" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Saved — deploying in ~30s" }),
    };
  } catch (err) {
    console.error("Save Function Error:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request payload" }),
    };
  }
};
