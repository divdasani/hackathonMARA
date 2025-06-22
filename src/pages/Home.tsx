import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
interface Quote {
  ask: number;
  capacity: number;
  minOrderSize: number;
}
export function Home() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'ask' | 'capacity'>('ask');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://fetch-quotes.divdasani.workers.dev');
        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }
        const data = await response.json();
        setQuotes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);
  const handleSort = (field: 'ask' | 'capacity') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const sortedQuotes = [...quotes].sort((a, b) => {
    const compareValue = a[sortField] - b[sortField];
    return sortDirection === 'asc' ? compareValue : -compareValue;
  });
  const chartData = quotes.map(quote => ({
    minOrderSize: quote.minOrderSize,
    ask: quote.ask
  })).sort((a, b) => a.minOrderSize - b.minOrderSize);
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
  return <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Inference Token Quotes
        </h1>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('ask')}>
                  <div className="flex items-center">
                    Ask
                    {sortField === 'ask' && (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('capacity')}>
                  <div className="flex items-center">
                    Capacity
                    {sortField === 'capacity' && (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Order Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedQuotes.map((quote, index) => <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.ask}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.minOrderSize}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Price vs. Min Order Size
        </h2>
        <div className="bg-white p-4 shadow sm:rounded-lg" style={{
        height: '400px'
      }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="minOrderSize" name="Min Order Size" label={{
              value: 'Min Order Size',
              position: 'insideBottomRight',
              offset: -10
            }} />
              <YAxis name="Ask Price" label={{
              value: 'Ask Price',
              angle: -90,
              position: 'insideLeft'
            }} />
              <Tooltip />
              <Line type="monotone" dataKey="ask" stroke="#4f46e5" activeDot={{
              r: 8
            }} name="Ask Price" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex justify-center">
        <button onClick={() => navigate('/buy')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md shadow-sm">
          Buy
        </button>
      </div>
    </div>;
}