export default {
  async fetch(request, env, ctx) {
	  if (request.method === "OPTIONS") {
      return handleCors();
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
    }

    try {
      const data = await request.json();
      let { id, demand, bid, prompt } = data;

      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id field' }), { status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
      }

      if (demand == null || bid == null || prompt == null) {
        return new Response(JSON.stringify({ error: 'Missing required fields: demand, bid, prompt' }), { status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
      }
	        if (bid <= 0) {
        return new Response(JSON.stringify({ error: 'Bid must be greater than 0' }), { status: 400,
			headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
      }

      let buyer;

      if (id === 'new') {
        // Generate new UUID
        id = crypto.randomUUID();

        await env.DBbuyer.prepare(
          `INSERT INTO buyer (id, demand, bid, prompt)
           VALUES (?, ?, ?, ?)`
        ).bind(id, demand, bid, prompt).run();

      } else {
        // Look up existing buyer
        const existing = await env.DBbuyer.prepare(
          `SELECT * FROM buyer WHERE id = ?`
        ).bind(id).first();

        if (!existing) {
          return new Response(JSON.stringify({ error: 'Buyer ID not found' }), { status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
        }

        // Update: add to demand, overwrite bid and prompt
        const newDemand = existing.demand + demand;
		if (newDemand <= 0) {
          return new Response(JSON.stringify({ error: `Resulting demand must be greater than 0 (attempted: ${newDemand})` }), { status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
        }

        await env.DBbuyer.prepare(
          `UPDATE buyer
           SET demand = ?, bid = ?, prompt = ?
           WHERE id = ?`
        ).bind(newDemand, bid, prompt, id).run();
      }

      // Return full buyer data
      buyer = await env.DBbuyer.prepare(
        `SELECT * FROM buyer WHERE id = ?`
      ).bind(id).first();

	  // Only attempt matching if buyer.output == "None"
      if (buyer.output === "None") {
        // Find eligible seller
        const matchingSeller = await env.DBseller.prepare(
          `SELECT * FROM seller
           WHERE ask <= ?
             AND minOrderSize <= ?
             AND capacity >= ?
           ORDER BY ask ASC
           LIMIT 1`
        ).bind(buyer.bid, buyer.demand, buyer.demand).first();

        if (matchingSeller) {
          const newCapacity = matchingSeller.capacity - buyer.demand;
          const newBalance = matchingSeller.balance + (buyer.demand * matchingSeller.ask);

          await env.DBseller.prepare(
            `UPDATE seller SET capacity = ?, balance = ? WHERE id = ?`
          ).bind(newCapacity, newBalance, matchingSeller.id).run();

		  // Now call OpenAI to get output
          const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			  method: 'POST',
			  headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
			  },
			  body: JSON.stringify({
				model: 'chatgpt-4o-latest',
				messages: [
				  {
					role: 'user',
					content: [
					  {
						type: 'text',
						text: buyer.prompt
					  }
					],
				  },
				],
				max_tokens: buyer.demand,
			  }),
			});

		  if (openAiResponse.ok) {
			  const openAiResult = await openAiResponse.json();
			  const outputText = openAiResult.choices?.[0]?.message?.content;
			  // Write output into buyer table
			  await env.DBbuyer.prepare(
				`UPDATE buyer SET demand = ?, bid = ?, output = ? WHERE id = ?`
			  ).bind(0, 0, outputText, buyer.id).run();
        }
		  // Fetch updated buyer
		  buyer = await env.DBbuyer.prepare(
			`SELECT * FROM buyer WHERE id = ?`
		  ).bind(buyer.id).first();
        // If no seller found: do nothing
      }

      return new Response(JSON.stringify(buyer), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    }} catch (err) {
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
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function handleCors() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
