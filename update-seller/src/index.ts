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
      let { id, capacity, ask, minOrderSize } = data;

      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id field' }), { status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
      }

      if (capacity == null || ask == null) {
        return new Response(JSON.stringify({ error: 'Missing required fields: capacity and ask' }), { status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
      }

      let seller;

      if (id === 'new') {
        // Generate new UUID
        id = crypto.randomUUID();

        await env.DBseller.prepare(
          `INSERT INTO seller (id, capacity, ask, balance, minOrderSize)
           VALUES (?, ?, ?, 0, ?)`
        ).bind(id, capacity, ask, minOrderSize ?? null).run();

      } else {
        // Look up existing seller
        const existing = await env.DBseller.prepare(
          `SELECT * FROM seller WHERE id = ?`
        ).bind(id).first();

        if (!existing) {
          return new Response(JSON.stringify({ error: 'Seller ID not found' }), { status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        } });
        }

        // Update: add to capacity, update ask, update minOrderSize if provided
        const newCapacity = existing.capacity + capacity;

        await env.DBseller.prepare(
          `UPDATE seller
           SET capacity = ?, ask = ?, minOrderSize = COALESCE(?, minOrderSize)
           WHERE id = ?`
        ).bind(newCapacity, ask, minOrderSize ?? existing.minOrderSize, id).run();
      }

		// Fetch updated seller row
		seller = await env.DBseller.prepare(
		  `SELECT * FROM seller WHERE id = ?`
		).bind(id).first();

		// Keep processing while seller has remaining capacity
		while (seller.capacity > 0) {
		  const matchingBuyer = await env.DBbuyer.prepare(
			`SELECT * FROM buyer
			 WHERE bid >= ?
			   AND demand >= ?
			   AND demand <= ?
			   AND output = 'None'
			 ORDER BY bid DESC
			 LIMIT 1`
		  ).bind(seller.ask, seller.minOrderSize, seller.capacity).first();

		  if (!matchingBuyer) {
			break; // No more buyers to match
		  }

		  const newSellerCapacity = seller.capacity - matchingBuyer.demand;
		  const newSellerBalance = seller.balance + (matchingBuyer.demand * seller.ask);

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
						text: matchingBuyer.prompt
					  }
					],
				  },
				],
				max_tokens: matchingBuyer.demand,
			  }),
			});
		  let outputText = "Failed";
		  if (openAiResponse.ok) {
			  const openAiResult = await openAiResponse.json();
			  outputText = openAiResult.choices?.[0]?.message?.content;
        	}
		  // Update seller capacity and balance
		  await env.DBseller.prepare(
			`UPDATE seller SET capacity = ?, balance = ? WHERE id = ?`
		  ).bind(newSellerCapacity, newSellerBalance, seller.id).run();
		  // Write output into buyer table
		  await env.DBbuyer.prepare(
			`UPDATE buyer SET demand = ?, bid = ?, output = ? WHERE id = ?`
		  ).bind(0, 0, outputText, matchingBuyer.id).run();

		  // Set buyer demand & bid to zero
		  await env.DBbuyer.prepare(
			`UPDATE buyer SET demand = 0, bid = 0 WHERE id = ?`
		  ).bind(matchingBuyer.id).run();

		}


      return new Response(JSON.stringify(seller), { status: 200,
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
