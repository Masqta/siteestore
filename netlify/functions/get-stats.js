// Netlify Function: Get statistics from GitHub
// Returns counts of orders, reviews, and calculates revenue

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
    let totalOrders = 0;
    let totalRevenue = 0;
    let totalReviews = 0;
    let ordersByStatus = { new: 0, processing: 0, completed: 0, cancelled: 0 };

    // Get orders
    try {
      const ordersResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/data/orders?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (ordersResponse.ok) {
        const files = await ordersResponse.json();
        const jsonFiles = files.filter(f => f.name.endsWith('.json'));
        totalOrders = jsonFiles.length;

        // Calculate revenue and status counts
        for (const file of jsonFiles) {
          try {
            const contentResponse = await fetch(file.download_url);
            if (contentResponse.ok) {
              const order = await contentResponse.json();
              totalRevenue += parseFloat(order.totalEur || 0);
              const status = order.status || 'new';
              ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    // Get reviews count
    try {
      const reviewsResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/data/reviews?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (reviewsResponse.ok) {
        const files = await reviewsResponse.json();
        totalReviews = files.filter(f => f.name.endsWith('.json')).length;
      }
    } catch (e) {}

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        stats: {
          totalOrders,
          totalRevenue: totalRevenue.toFixed(2),
          totalReviews,
          ordersByStatus: [
            { status: 'new', count: ordersByStatus.new },
            { status: 'processing', count: ordersByStatus.processing },
            { status: 'completed', count: ordersByStatus.completed },
            { status: 'cancelled', count: ordersByStatus.cancelled }
          ]
        }
      })
    };

  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
