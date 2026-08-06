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
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data/reviews?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'airstore-reviews/1.0'
        }
      }
    );

    if (response.status === 404) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          reviews: [],
          count: 0,
          averageRating: 0
        })
      };
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `GitHub API ${response.status}`);
    }

    const files = await response.json();
    const jsonFiles = files.filter(file => file.name.endsWith('.json'));
    
    const reviews = [];
    for (const file of jsonFiles) {
      try {
        const contentResponse = await fetch(file.download_url);
        if (contentResponse.ok) {
          const review = await contentResponse.json();
          reviews.push(review);
        }
      } catch (e) {
        console.log('Error reading file:', file.name);
      }
    }

    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const limit = parseInt(event.queryStringParameters?.limit) || 100;
    const limitedReviews = reviews.slice(0, limit);

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + (parseInt(r.rating) || 5), 0) / reviews.length).toFixed(1)
      : '0';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        reviews: limitedReviews,
        count: reviews.length,
        averageRating: avgRating
      })
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
