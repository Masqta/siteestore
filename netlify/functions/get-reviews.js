// Netlify Function: Get all reviews from GitHub repository
// Reads all JSON files from /data/reviews/ folder

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
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
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
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
          count: 0
        })
      };
    }

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
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

    // Sort by date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get limit from query
    const limit = parseInt(event.queryStringParameters?.limit) || 100;
    const limitedReviews = reviews.slice(0, limit);

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

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
      body: JSON.stringify({ error: error.message })
    };
  }
};
