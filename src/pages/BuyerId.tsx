import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
interface BuyerData {
  id: string;
  bid: number;
  demand: number;
  prompt: string;
  output: string;
}
export function BuyerId() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  
  console.log('BuyerId component rendered');
  console.log('URL parameter id:', id);
  console.log('Current URL:', window.location.href);
  
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchBuyerData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        console.log('Fetching buyer data for ID:', id);
        
        const response = await fetch(`https://get-buyer.divdasani.workers.dev?id=${encodeURIComponent(id)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:');
        for (const [key, value] of response.headers.entries()) {
          console.log(`  ${key}: ${value}`);
        }
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        // Validate response has all required fields
        if (!data || typeof data.id !== 'string' || typeof data.bid !== 'number' || typeof data.demand !== 'number' || typeof data.prompt !== 'string' || typeof data.output !== 'string') {
          throw new Error('Invalid response format from server');
        }
        setBuyerData(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchBuyerData();
  }, [id]);
  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>;
  }
  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded-md text-sm">
          Retry
        </button>
      </div>;
  }
  if (!buyerData) {
    return <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
        <p>No buyer data found for ID: {id}</p>
      </div>;
  }
  return <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buyer Details</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Buyer ID: {buyerData?.id}
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Bid</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {buyerData?.bid}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Demand</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {buyerData?.demand}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Prompt</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {buyerData?.prompt}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Output</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
                  {buyerData?.output || 'No output available'}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>;
}