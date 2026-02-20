import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const JoinRequestsPanel = ({ circleId, onUpdate }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, [circleId]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/circles/${circleId}/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data.requests);
        } catch (error) {
            console.error('Error fetching join requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/circles/requests/${requestId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove handled request from list
            setRequests(requests.filter(r => r._id !== requestId));

            if (action === 'approve') onUpdate(); // Refresh circle details (e.g. member count)
        } catch (error) {
            console.error(`Error trying to ${action} request:`, error);
        }
    };

    if (loading) return <div className="text-center py-6 text-neutral-500">Loading requests...</div>;

    if (requests.length === 0) return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-8 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={20} className="text-neutral-400" />
            </div>
            <h3 className="text-neutral-900 font-medium">No pending requests</h3>
            <p className="text-sm text-neutral-500 mt-1">You're all caught up!</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="font-semibold text-neutral-900">Pending Requests ({requests.length})</h3>
            </div>
            <div className="divide-y divide-neutral-100">
                {requests.map(request => (
                    <div key={request._id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">
                                {request.userId?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <p className="font-medium text-neutral-900">{request.userId?.name || 'Unknown User'}</p>
                                <p className="text-sm text-neutral-500">{request.userId?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleAction(request._id, 'reject')}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Reject"
                            >
                                <X size={18} />
                            </button>
                            <button
                                onClick={() => handleAction(request._id, 'approve')}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Approve"
                            >
                                <Check size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JoinRequestsPanel;
