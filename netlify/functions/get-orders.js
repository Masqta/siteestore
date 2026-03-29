// Netlify Function: Get all orders from GitHub repository
// Reads all JSON files from /data/orders/ folder

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
      body: JSON.stringify({ 
        error: 'GITHUB_TOKEN not set. Please add it in Netlify Environment Variables.' 
      })
    };
  }

  try {
    // Get list of files in data/orders folder
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data/orders?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    // If folder doesn't exist, return empty array
    if (response.status === 404) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          orders: [],
          count: 0
        })
      };
    }

    if (!response.ok) {
      throw new Error('Failed to fetch orders from GitHub');
    }

    const files = await response.json();
    
    // Filter only JSON files
    const jsonFiles = files.filter(file => file.name.endsWith('.json'));
    
    // Fetch content of each file
    const orders = [];
    for (const file of jsonFiles) {
      try {
        const contentResponse = await fetch(file.download_url);
        if (contentResponse.ok) {
          const order = await contentResponse.json();
          orders.push(order);
        }
      } catch (e) {
        console.log('Error reading file:', file.name);
      }
    }

    // Sort by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get status filter from query
    const status = event.queryStringParameters?.status;
    let filteredOrders = orders;
    if (status && status !== 'all') {
      filteredOrders = orders.filter(o => o.status === status);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orders: filteredOrders,
        count: filteredOrders.length
      })
    };

  } catch (error) {
    console.error('Error getting orders:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        message: 'Failed to get orders'
      })
    };
  }
};
