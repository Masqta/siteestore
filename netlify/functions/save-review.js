const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO || 'Masqta/airpods';
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GITHUB_TOKEN not set' })
    };
  }

  try {
    // Get list of files in data/reviews/
    const listResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data/reviews?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'netlify-function'
        }
      }
    );

    if (!listResponse.ok) {
      // Folder doesn't exist yet - return empty array
      if (listResponse.status === 404) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, reviews: [] })
        };
      }
      const err = await listResponse.json();
      throw new Error(err.message || 'Failed to list reviews');
    }

    const files = await listResponse.json();
    
    // Fetch content of each review file (max 50 to avoid timeout)
    const reviewFiles = files
      .filter(f => f.name.endsWith('.json'))
      .slice(0, 50);

    const reviews = [];
    for (const file of reviewFiles) {
      try {
        const contentResponse = await fetch(file.download_url);
        if (contentResponse.ok) {
          const review = await contentResponse.json();
          reviews.push(review);
        }
      } catch (e) {
        console.log('Failed to load review:', file.name);
      }
    }

    // Sort by date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, reviews })
    };

  } catch (error) {
    console.error('Error getting reviews:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
