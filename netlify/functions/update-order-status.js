// Netlify Function: Update order status in GitHub
// Updates the status field in the order JSON file

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
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
    const { id, status } = JSON.parse(event.body);
    
    // Validate status
    const validStatuses = ['new', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid status' })
      };
    }

    // Find the order file
    const fileName = `order-${id}.json`;
    const filePath = `data/orders/${fileName}`;

    // Get current file content
    const getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!getResponse.ok) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Order not found' })
      };
    }

    const fileData = await getResponse.json();
    
    // Decode current content
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
    
    // Update status
    currentContent.status = status;
    currentContent.updatedAt = new Date().toISOString();
    
    // Encode new content
    const newContent = Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64');

    // Update file in GitHub
    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update order ${id} status to ${status}`,
          content: newContent,
          sha: fileData.sha,
          branch: GITHUB_BRANCH
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to update order');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order: currentContent
      })
    };

  } catch (error) {
    console.error('Error updating order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
