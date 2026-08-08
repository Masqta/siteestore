const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
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
    const reviewData = JSON.parse(event.body);

    // Use client-provided id to prevent duplicates on retry
    const reviewId = reviewData.id || Date.now();

    const review = {
      id: reviewId,
      name: reviewData.name || 'Anonymous',
      rating: parseInt(reviewData.rating) || 5,
      text: reviewData.text || '',
      verified: reviewData.verified !== false,
      createdAt: reviewData.createdAt || new Date().toISOString()
    };

    const fileName = `review-${reviewId}.json`;
    const filePath = `data/reviews/${fileName}`;
    const content = Buffer.from(JSON.stringify(review, null, 2)).toString('base64');

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'airstore-reviews/1.0'
        },
        body: JSON.stringify({
          message: `New review from ${review.name}`,
          content: content,
          branch: GITHUB_BRANCH
        })
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      // If file already exists (422), it's a duplicate - return success
      if (response.status === 422 && responseData.message && responseData.message.includes('already exists')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            review: review,
            duplicate: true
          })
        };
      }
      console.error('GitHub error:', responseData);
      throw new Error(responseData.message || `GitHub API ${response.status}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        review: review
      })
    };

  } catch (error) {
    console.error('Error saving review:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
