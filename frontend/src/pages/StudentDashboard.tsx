import React from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, ClipboardList, Plus, PenTool as Tool, Plug, Droplet, Laptop2, Brush, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const RaiseIssue: React.FC = () => {
  const [selectedService, setSelectedService] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    location: '',
    description: '',
    image: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Map frontend service IDs to backend ServiceType enum values
  const serviceTypeMapping: Record<string, string> = {
    'carpenter': 'furniture',
    'electrician': 'electrical',
    'plumber': 'plumbing',
    'cleaning': 'cleaning',
    'it-support': 'it_support',
    'other': 'others'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) {
      toast.error('Please select a service type');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Map frontend service ID to backend ServiceType enum
      const backendServiceType = serviceTypeMapping[selectedService];
      
      // Create form data for API with image support
      let imageUrl = null;
      
      // In a real implementation, you would upload the image first
      if (formData.image) {
        // This is a mock implementation - in production, use a proper image upload service
        // const formDataWithImage = new FormData();
        // formDataWithImage.append('file', formData.image);
        // const uploadResponse = await axios.post('http://localhost:8000/upload', formDataWithImage, {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //     'Content-Type': 'multipart/form-data'
        //   }
        // });
        // imageUrl = uploadResponse.data.url;
        console.log('Image would be uploaded:', formData.image.name);
      }
      
      // Create the issue
      const payload = {
        service_type: backendServiceType,
        description: formData.description,
        location: formData.location,
        image_url: imageUrl
      };

      const response = await axios.post(
        'http://localhost:8000/issues/raise',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success(`Issue submitted successfully! Ticket ID: ${response.data.ticket_id}`);
      setSelectedService(null);
      setFormData({ location: '', description: '', image: null });
      
      // Navigate to track requests page after successful submission
      navigate('/student/track-requests');
    } catch (error: any) {
      console.error('Error submitting issue:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { id: 'carpenter', icon: Tool, label: 'Carpenter' },
    { id: 'electrician', icon: Plug, label: 'Electrician' },
    { id: 'plumber', icon: Droplet, label: 'Plumber' },
    { id: 'cleaning', icon: Brush, label: 'Cleaning' },
    { id: 'it-support', icon: Laptop2, label: 'IT Support' },
    { id: 'other', icon: Wrench, label: 'Others' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Raise an Issue</h2>
      
      {!selectedService ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((service) => (
            <motion.button
              key={service.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedService(service.id)}
              className="p-6 bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <service.icon className="w-8 h-8 text-blue-600 mb-3" />
              <span className="font-medium">{service.label}</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              <span className="text-sm font-medium capitalize">{selectedService.replace('-', ' ')}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Room 101, Block A"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe the issue in detail..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {formData.image && (
              <div className="mt-2">
                <p className="text-sm text-green-600">File selected: {formData.image.name}</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
};

interface IssueDetails {
  id: string;
  ticket_id: string;
  service_type: string;
  serviceType: string;
  location: string;
  description: string;
  status: string;
  timestamp: string;
  dateRaised: string;
  student_name?: string;
  image_url?: string | null;
}

const RequestDetail: React.FC<{ request: IssueDetails, onClose: () => void }> = ({ request, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string): string => {
    return status
      .replace('_', '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-xl shadow-md"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Ticket Details</h3>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          &times;
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-500">Ticket ID</p>
          <p className="font-medium">{request.ticket_id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
            {formatStatus(request.status)}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Service Type</p>
          <p className="font-medium capitalize">{request.serviceType}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Date Raised</p>
          <p className="font-medium">{request.dateRaised}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Location</p>
          <p className="font-medium">{request.location}</p>
        </div>
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-500">Description</p>
        <p className="mt-1 text-gray-700">{request.description}</p>
      </div>
      
      {request.image_url && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Image</p>
          <img 
            src={request.image_url} 
            alt="Issue" 
            className="max-w-full h-auto rounded-lg border border-gray-200" 
          />
        </div>
      )}
      
      <div className="mt-8">
        <button
          onClick={onClose}
          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

const TrackRequests: React.FC = () => {
  const [requests, setRequests] = React.useState<IssueDetails[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = React.useState<IssueDetails | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const token = localStorage.getItem('token');

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add status query parameter if filter is not 'all'
      const url = filterStatus !== 'all' 
        ? `http://localhost:8000/issues/my?status=${filterStatus}`
        : 'http://localhost:8000/issues/my';
        
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform the response data
      const formattedRequests = response.data.map((issue: any) => ({
        ...issue,
        serviceType: mapServiceType(issue.service_type),
        dateRaised: new Date(issue.timestamp).toLocaleDateString()
      }));
      
      setRequests(formattedRequests);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      setError(error.response?.data?.detail || 'Failed to fetch requests');
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, [token, filterStatus]);

  // Map backend service types to more user-friendly display names
  const mapServiceType = (backendType: string): string => {
    const mapping: Record<string, string> = {
      'furniture': 'Carpenter',
      'electrical': 'Electrician',
      'plumbing': 'Plumber',
      'cleaning': 'Cleaning',
      'it_support': 'IT Support',
      'others': 'Other'
    };
    
    return mapping[backendType] || backendType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string): string => {
    return status
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleViewDetails = (request: IssueDetails) => {
    setSelectedRequest(request);
  };

  const handleRefresh = () => {
    fetchRequests();
    toast.success('Refreshed requests');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Track Requests</h2>
        <div className="flex space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 py-1 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"
            aria-label="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 bg-white shadow-sm rounded-lg">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading your requests...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6 bg-white shadow-sm rounded-lg">
          <p className="text-red-500">Error: {error}</p>
          <button 
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white shadow-sm rounded-lg border border-gray-200">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">You haven't raised any issues yet.</p>
          <Link 
            to="/student/raise-issue"
            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Raise an Issue
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <motion.tr
                  key={request.id}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewDetails(request)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.ticket_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{request.serviceType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {formatStatus(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.dateRaised}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <RequestDetail 
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentDashboard: React.FC = () => {
  const location = useLocation();
  
  return (
    <div>
      <div className="mb-8 flex space-x-4">
        <Link
          to="/student/raise-issue"
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
            location.pathname.includes('raise-issue')
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Raise an Issue
        </Link>
        <Link
          to="/student/track-requests"
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
            location.pathname.includes('track-requests')
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ClipboardList className="w-5 h-5 mr-2" />
          Track Requests
        </Link>
      </div>

      <Routes>
        <Route path="raise-issue" element={<RaiseIssue />} />
        <Route path="track-requests" element={<TrackRequests />} />
        <Route path="*" element={<RaiseIssue />} />
      </Routes>
    </div>
  );
};