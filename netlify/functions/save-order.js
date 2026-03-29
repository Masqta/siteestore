// Netlify Function: Save order to GitHub repository as a file
// This saves orders as JSON files in the /data/orders/ folder

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

  // GitHub API settings from environment variables
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO || 'Masqta/airpods'; // Your repo
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'GITHUB_TOKEN not set. Please add it in Netlify Environment Variables.' 
      })
    };
  }

  try {
    const orderData = JSON.parse(event.body);
    
    // Create order object with timestamp - ensure proper data types
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      name: String(orderData.name || ''),
      phone: String(orderData.phone || ''),
      city: String(orderData.city || ''),
      courier: String(orderData.courier || ''),
      deliveryType: String(orderData.deliveryType || ''),
      address: String(orderData.address || ''),
      qty: parseInt(orderData.qty) || 1,
      totalEur: parseFloat(orderData.totalEur) || 0,
      totalBgn: parseFloat(orderData.totalBgn) || 0,
      promoCode: String(orderData.promoCode || ''),
      status: 'new'
    };

    // File path in repo: data/orders/order-{timestamp}.json
    const fileName = `order-${order.id}.json`;
    const filePath = `data/orders/${fileName}`;
    
    // Content encoded in base64
    const content = Buffer.from(JSON.stringify(order, null, 2)).toString('base64');

    // First, check if the file already exists (to get SHA for updates)
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
    } catch (e) {
      // File doesn't exist, that's fine
    }

    // Create or update file in GitHub
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
          message: `New order from ${order.name}`,
          content: content,
          branch: GITHUB_BRANCH,
          sha: sha // Include SHA if updating existing file
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save to GitHub');
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order: order,
        message: 'Order saved to GitHub',
        fileUrl: result.content.html_url
      })
    };

  } catch (error) {
    console.error('Error saving order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        message: 'Failed to save order'
      })
    };
  }
};
