import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, Activity, User as UserIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom avatar icon
const createAvatarIcon = (name, initialStatus) => {
    const color = initialStatus === 'completed' ? '#10B981' : initialStatus === 'missed' ? '#EF4444' : '#8B5CF6';

    return L.divIcon({
        className: 'custom-avatar-marker',
        html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        font-family: sans-serif;
      " title="${name}">
        ${name.charAt(0).toUpperCase()}
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
};

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 13, { animate: true });
        }
    }, [center, map]);
    return null;
};

const HabitMap = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchHabit, setSearchHabit] = useState('');
    const [radius, setRadius] = useState(10); // in km
    const [myLocation, setMyLocation] = useState(null);

    // Get token and default location
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5003';

    // Ask for location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setMyLocation([lat, lng]);

                    // Optionally update user's location on backend
                    try {
                        await axios.put(`${API_URL}/api/map/location`, { lat, lng }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchNearbyUsers(lat, lng, searchHabit, radius);
                    } catch (err) {
                        console.error("Error updating location:", err);
                    }
                },
                (err) => {
                    console.error(err);
                    toast.error("Could not get your location. Displaying default map.");
                    setLoading(false);
                }
            );
        } else {
            toast.error("Geolocation is not supported by your browser");
            setLoading(false);
        }
    }, []);

    const fetchNearbyUsers = async (lat, lng, habitFilter, searchRadius) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/map/nearby-users`, {
                params: { lat, lng, radius: searchRadius, habit: habitFilter },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (err) {
            console.error("Error fetching nearby users:", err);
            toast.error("Failed to fetch map data");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (myLocation) {
            fetchNearbyUsers(myLocation[0], myLocation[1], searchHabit, radius);
        } else {
            toast.error("Location not available. Cannot search.");
        }
    };

    return (
        <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
            <motion.div
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-display font-bold text-neutral-900 flex items-center gap-2">
                        <MapPin className="text-primary-600" size={32} />
                        Habit Map
                    </h1>
                    <p className="text-neutral-600 mt-1">Discover nearby users tracking similar habits</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <input
                            type="text"
                            placeholder="Search habit (e.g. Running)"
                            value={searchHabit}
                            onChange={(e) => setSearchHabit(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        />
                        <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                    </div>
                    <select
                        value={radius}
                        onChange={(e) => {
                            setRadius(Number(e.target.value));
                            if (myLocation) fetchNearbyUsers(myLocation[0], myLocation[1], searchHabit, Number(e.target.value));
                        }}
                        className="rounded-xl border border-neutral-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                    </select>
                    <button
                        type="submit"
                        className="bg-primary-600 text-white p-2 rounded-xl hover:bg-primary-700"
                        aria-label="Search"
                    >
                        <Navigation size={20} />
                    </button>
                </form>
            </motion.div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white h-[600px] bg-neutral-100 z-0">
                {!myLocation && loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full" />
                    </div>
                )}

                {myLocation && (
                    <MapContainer
                        center={myLocation}
                        zoom={13}
                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                        <MapUpdater center={myLocation} />

                        {/* Current user marker */}
                        <Marker position={myLocation} icon={createAvatarIcon("Me", "pending")}>
                            <Popup className="rounded-xl overflow-hidden">
                                <div className="p-1 text-center font-bold font-display text-primary-700">You are here</div>
                            </Popup>
                        </Marker>

                        {/* Nearby users markers */}
                        {users.map((u) => {
                            // Get primary status indicator from their habits (e.g., if one is completed, green)
                            const hasCompleted = u.habits.some(h => h.status === 'completed');
                            const initStatus = hasCompleted ? 'completed' : 'pending';

                            return (
                                <Marker
                                    key={u._id}
                                    position={[u.location.coordinates[1], u.location.coordinates[0]]}
                                    icon={createAvatarIcon(u.name, initStatus)}
                                >
                                    <Popup className="custom-popup min-w-[200px]">
                                        <div className="p-1">
                                            <div className="flex items-center gap-2 mb-3 border-b pb-2">
                                                <UserIcon className="text-primary-600 bg-primary-100 rounded-full p-1 w-8 h-8" />
                                                <h3 className="font-display font-bold text-lg text-neutral-900">{u.name}</h3>
                                            </div>

                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">
                                                    Matched Habits
                                                </p>
                                                {u.habits.map((habit) => (
                                                    <div key={habit._id} className="flex justify-between items-center bg-neutral-50 p-2 rounded-lg text-sm border">
                                                        <span className="font-medium text-neutral-800 flex items-center gap-1">
                                                            {habit.emoji} {habit.name}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-orange-500 font-bold bg-orange-100 px-2 rounded-md">
                                                            <Activity size={12} /> {habit.streak}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button className="w-full mt-4 bg-primary-600 text-white font-semibold py-2 rounded-lg hover:bg-primary-700 transition">
                                                Send Connection
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                )}
            </div>
        </div>
    );
};

export default HabitMap;
