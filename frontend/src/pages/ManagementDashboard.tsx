import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Filter, PenTool as Tool, Plug, Droplet, Wrench } from 'lucide-react';
import axios from 'axios';

// Define the Issue interface to match backend data structure
interface Issue {
  id: string;
  ticket_id: string;
  service_type: string;
  description: string;
  location: string;
  status: string;
  timestamp: string;
  student_name: string;
}

export const ManagementDashboard: React.FC = () => {
  const [filter, setFilter] = React.useState({
    status: 'all',
    serviceType: 'all',
    search: '',
  });
  const [requests, setRequests] = React.useState<Issue[]>([]);
  const token = localStorage.getItem('token');
  const intervalRef = useRef<number | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('http://localhost:8000/issues/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch requests');
      console.error('Error fetching requests:', error);
    }
  };

  // Set up auto-refresh - fixed at 10 seconds with no UI controls
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up new interval for auto-refresh
    intervalRef.current = window.setInterval(() => {
      fetchRequests();
    }, 10000); // Fixed 10 second refresh

    // Initial fetch
    fetchRequests();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      // Update API endpoint to use ticket_id
      await axios.put(
        `http://localhost:8000/issues/mark-complete/${ticketId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      toast.success(`Request ${ticketId} status updated to ${newStatus}`);
      // Refresh requests immediately after update
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'furniture':
        return <Tool className="w-5 h-5" />;
      case 'electrical':
        return <Plug className="w-5 h-5" />;
      case 'plumbing':
        return <Droplet className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredRequests = requests.filter((request) => {
    if (filter.status !== 'all' && request.status !== filter.status) return false;
    if (filter.serviceType !== 'all' && request.service_type !== filter.serviceType) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        request.ticket_id.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower) ||
        request.location.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={filter.serviceType}
              onChange={(e) => setFilter({ ...filter, serviceType: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="furniture">Furniture</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="cleaning">Cleaning</option>
              <option value="it_support">IT Support</option>
              <option value="others">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <motion.tr
                  key={request.id}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{request.ticket_id}</span>
                      <span className="text-sm text-gray-500">{request.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="flex-shrink-0 text-gray-500">
                        {getServiceIcon(request.service_type)}
                      </span>
                      <span className="ml-2 text-sm text-gray-900 capitalize">{request.service_type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{request.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{request.student_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(request.timestamp)}</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.ticket_id, e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};