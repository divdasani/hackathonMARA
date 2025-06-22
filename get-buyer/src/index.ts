export default {
  async fetch(request, env, ctx) {
	  	  	  if (request.method === "OPTIONS") {
      return handleCors();
    }
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    try {
      const buyer = await env.DBbuyer.prepare(
        `SELECT * FROM buyer WHERE id = ?`
      ).bind(id).first();

      if (!buyer) {
        return new Response(JSON.stringify({ error: 'Buyer not found' }), {
          status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
        });
      }

      return new Response(JSON.stringify(buyer), {status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    } catch (err) {
      console.error('Error:', err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
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
