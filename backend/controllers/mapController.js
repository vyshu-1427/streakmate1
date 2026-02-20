import User from "../models/user.js";
import Habit from "../models/habit.js";

export const getNearbyUsers = async (req, res) => {
    try {
        const { lat, lng, radius, habit } = req.query;
        const currentUserId = req.user.id;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required." });
        }

        const radiusInMeters = (radius ? parseFloat(radius) : 10) * 1000;

        // 1. Find users within radius
        const nearbyUsers = await User.find({
            _id: { $ne: currentUserId },
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: radiusInMeters,
                },
            },
        }).select("name avatar");

        if (!nearbyUsers.length) {
            return res.status(200).json({ success: true, users: [] });
        }

        const userIds = nearbyUsers.map((u) => u._id);

        // 2. Filter these users by the specified active habit
        // To match Snapchat style, we only show standard info + the matching habit data
        let habitQuery = { user: { $in: userIds } };
        if (habit) {
            // Case-insensitive regex match or strict match depending on use case. Let's do regex.
            habitQuery.name = { $regex: new RegExp(habit, "i") };
        }

        const activeHabits = await Habit.find(habitQuery);

        // Filter users who actually have the requested habit
        const result = nearbyUsers
            .map((user) => {
                // Find habits belonging to this user that matched the query
                const userMatchedHabits = activeHabits.filter((h) => h.user.toString() === user._id.toString());
                if (userMatchedHabits.length > 0) {
                    return {
                        _id: user._id,
                        name: user.name,
                        location: user.location,
                        habits: userMatchedHabits.map((h) => ({
                            _id: h._id,
                            name: h.name,
                            streak: h.streak,
                            status: h.status,
                            icon: h.icon,
                            emoji: h.emoji
                        })),
                    };
                }
                return null;
            })
            .filter(Boolean); // removes nulls

        res.status(200).json({ success: true, users: result });
    } catch (error) {
        console.error("getNearbyUsers build error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch nearby users." });
    }
};

export const updateUserLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: "Missing coordinates." });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.location = {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
        };

        await user.save();

        res.status(200).json({ success: true, message: "Location updated successfully." });
    } catch (error) {
        console.error("updateUserLocation error:", error);
        res.status(500).json({ success: false, message: "Failed to update location." });
    }
};
