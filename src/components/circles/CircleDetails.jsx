import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Shield, MessageSquare, Plus, Check } from 'lucide-react';
import axios from 'axios';
import CircleFeed from './CircleFeed';
import JoinRequestsPanel from './JoinRequestsPanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const CircleDetails = ({ circleId, onBack, currentUserId }) => {
    const [circle, setCircle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'members', 'requests'

    useEffect(() => {
        fetchCircleDetails();
    }, [circleId]);

    const fetchCircleDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/circles/${circleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCircle(res.data.circle);
        } catch (error) {
            console.error('Error fetching circle details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-10">Loading circle details...</div>;
    if (!circle) return <div className="text-center py-10">Circle not found</div>;

    const isAdmin = circle.admins.some(a => a._id === currentUserId);
    const isMember = circle.members.some(m => m._id === currentUserId);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
        >
            <button
                onClick={onBack}
                className="flex items-center text-neutral-500 hover:text-neutral-800 mb-6 w-fit transition-colors"
            >
                <ArrowLeft size={16} className="mr-2" /> Back to Circles
            </button>

            <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mr-10 -mt-20 opacity-50 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-900">{circle.name}</h1>
                            <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full list-none">
                                {circle.category}
                            </span>
                            {circle.visibility === 'private' && (
                                <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full list-none flex items-center">
                                    Private
                                </span>
                            )}
                        </div>
                        <p className="text-neutral-600 max-w-2xl mb-4">{circle.description}</p>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <div className="flex items-center"><Users size={16} className="mr-1" /> {circle.members.length} Members</div>
                            <div className="flex items-center text-primary-600"><Shield size={16} className="mr-1" /> Created by {circle.createdBy?.name || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 border-b border-neutral-200 mb-6">
                <button
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'feed' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setActiveTab('feed')}
                >
                    Feed
                    {activeTab === 'feed' && <motion.div layoutId="DetailsTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
                <button
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'members' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setActiveTab('members')}
                >
                    Members
                    {activeTab === 'members' && <motion.div layoutId="DetailsTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
                {isAdmin && (
                    <button
                        className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'requests' ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Join Requests
                        {activeTab === 'requests' && <motion.div layoutId="DetailsTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                    </button>
                )}
            </div>

            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'feed' && (
                        <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {isMember ? <CircleFeed circleId={circleId} currentUserId={currentUserId} /> : <div className="text-center py-10 text-neutral-500">You must be a member to see the feed.</div>}
                        </motion.div>
                    )}

                    {activeTab === 'members' && (
                        <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {circle.members.map(member => {
                                const isMemberAdmin = circle.admins.some(a => a._id === member._id);
                                return (
                                    <div key={member._id} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
                                        <div className="w-10 h-10 bg-primary-100 text-primary-700 font-bold rounded-full flex items-center justify-center mr-3 uppercase">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-900 flex items-center gap-2">
                                                {member.name}
                                                {isMemberAdmin && <Shield size={14} className="text-amber-500" title="Admin" />}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {activeTab === 'requests' && isAdmin && (
                        <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <JoinRequestsPanel circleId={circleId} onUpdate={fetchCircleDetails} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CircleDetails;
