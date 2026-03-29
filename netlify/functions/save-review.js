// Netlify Function: Save review to GitHub repository as a file
// Saves reviews as JSON files in the /data/reviews/ folder

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
    
    const review = {
      id: Date.now(),
      name: reviewData.name || 'Anonymous',
      rating: parseInt(reviewData.rating) || 5,
      text: reviewData.text || '',
      verified: reviewData.verified || false,
      createdAt: new Date().toISOString()
    };

    const fileName = `review-${review.id}.json`;
    const filePath = `data/reviews/${fileName}`;
    const content = Buffer.from(JSON.stringify(review, null, 2)).toString('base64');

    // Check if file exists
    let sha = null;
    try {
      const checkResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      if (checkResponse.ok) {
        const fileData = await checkResponse.json();
        sha = fileData.sha;
      }
    } catch (e) {}

    // Save to GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `New review from ${review.name}`,
          content: content,
          branch: GITHUB_BRANCH,
          sha: sha
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save review');
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        review: review,
        fileUrl: result.content.html_url
      })
    };

  } catch (error) {
    console.error('Error saving review:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
