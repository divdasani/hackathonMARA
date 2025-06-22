export default {
  async fetch(request, env, ctx) {
	  	  if (request.method === "OPTIONS") {
      return handleCors();
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
    }

    try {
      // Query all sellers
      const sellers = await env.DBseller.prepare(
        `SELECT ask, capacity, minOrderSize FROM seller`
      ).all();

      return new Response(JSON.stringify(sellers.results), { status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    } catch (err) {
      console.error('Error:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
    }
  }
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function handleCors() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
