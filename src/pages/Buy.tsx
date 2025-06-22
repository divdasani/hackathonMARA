import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Buy() {
  const [bid, setBid] = useState('');
  const [demand, setDemand] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid || !demand || !prompt) {
      setError('All fields are required');
      return;
    }
    
    const bidNum = parseFloat(bid);
    const demandNum = parseInt(demand, 10); // Ensure demand is an integer
    if (isNaN(bidNum) || isNaN(demandNum)) {
      setError('Bid and demand must be valid numbers');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const requestBody = {
        id: 'new',
        bid: bidNum,
        demand: demandNum,
        prompt
      };
      
      console.log('Sending request:', requestBody);
      console.log('Request URL:', 'https://update-buyer.divdasani.workers.dev');
      
      const response = await fetch('https://update-buyer.divdasani.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // Validate response has required fields
      if (!data || typeof data.id !== 'string') {
        throw new Error('Invalid response: missing or invalid ID');
      }
      
      navigate(`/buyer/${data.id}`);
    } catch (err) {
      console.error('Submit Error:', err);
      console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace available');
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to the server. This might be due to CORS restrictions. Please check the browser console for more details.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Buy Inference Tokens
      </h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
        </div>}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="bid" className="block text-sm font-medium text-gray-700">
              Bid
            </label>
            <input type="number" id="bid" value={bid} onChange={e => setBid(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Enter your bid amount" step="0.001" min="0" required />
          </div>
          <div>
            <label htmlFor="demand" className="block text-sm font-medium text-gray-700">
              Demand
            </label>
            <input type="number" id="demand" value={demand} onChange={e => setDemand(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Enter your demand amount" step="1" min="0" required />
          </div>
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
              Prompt
            </label>
            <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Enter your prompt" required />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className={`
                inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              `}>
              {loading ? <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </> : 'Submit Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>;
}