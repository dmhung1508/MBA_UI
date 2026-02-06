/**
 * Example Component: How to use the new refresh token system
 *
 * This component demonstrates:
 * 1. Using useAuthAxios hook for API calls
 * 2. Automatic token refresh on 401
 * 3. Proper error handling
 */

import { useState, useEffect } from 'react';
import { useAuthAxios } from '../hooks/useAuthAxios';
import { API_ENDPOINTS } from '../config/api';

function RefreshTokenExample() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get the authenticated axios instance
  const api = useAuthAxios();

  // Example 1: Fetch data on component mount
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        // No need to manually add Authorization header!
        // The interceptor does it automatically
        const data = await api.get(API_ENDPOINTS.MY_TICKETS(10, 0));
        setTickets(data.tickets || []);
      } catch (err) {
        // If token refresh fails, user is automatically redirected to login
        // This catch only handles other errors (network, 500, etc.)
        setError(err.detail || 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [api]);

  // Example 2: Create a new ticket
  const handleCreateTicket = async () => {
    try {
      const newTicket = await api.post(API_ENDPOINTS.TICKET_CREATE, {
        title: 'Test Ticket',
        description: 'This is a test',
        type: 'question',
        priority: 'medium'
      });

      console.log('Ticket created:', newTicket);

      // Refresh the list
      const data = await api.get(API_ENDPOINTS.MY_TICKETS(10, 0));
      setTickets(data.tickets || []);
    } catch (err) {
      alert('Error creating ticket: ' + (err.detail || err));
    }
  };

  // Example 3: Update ticket status
  const handleCloseTicket = async (ticketId) => {
    try {
      await api.put(API_ENDPOINTS.TICKET_CLOSE(ticketId));

      // Refresh the list
      const data = await api.get(API_ENDPOINTS.MY_TICKETS(10, 0));
      setTickets(data.tickets || []);
    } catch (err) {
      alert('Error closing ticket: ' + (err.detail || err));
    }
  };

  // Example 4: Delete ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Are you sure?')) return;

    try {
      await api.delete(API_ENDPOINTS.ADMIN_TICKET_DELETE(ticketId));

      // Remove from list
      setTickets(prev => prev.filter(t => t.ticket_number !== ticketId));
    } catch (err) {
      alert('Error deleting ticket: ' + (err.detail || err));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Refresh Token Example</h1>

      <button
        onClick={handleCreateTicket}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Create Test Ticket
      </button>

      <div className="space-y-2">
        {tickets.map(ticket => (
          <div key={ticket.ticket_number} className="border p-4 rounded">
            <h3 className="font-bold">{ticket.title}</h3>
            <p className="text-sm text-gray-600">{ticket.ticket_number}</p>
            <p className="text-sm">Status: {ticket.status}</p>

            <div className="mt-2 space-x-2">
              <button
                onClick={() => handleCloseTicket(ticket.ticket_number)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                Close
              </button>
              <button
                onClick={() => handleDeleteTicket(ticket.ticket_number)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">How This Works:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>useAuthAxios hook provides authenticated API methods</li>
          <li>Access token automatically added to request headers</li>
          <li>If token expires (401), automatic refresh happens</li>
          <li>Original request retries with new token</li>
          <li>If refresh fails, user redirected to login</li>
          <li>All of this happens behind the scenes!</li>
        </ol>
      </div>
    </div>
  );
}

export default RefreshTokenExample;
