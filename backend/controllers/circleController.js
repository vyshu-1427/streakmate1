import Circle from "../models/Circle.js";
import JoinRequest from "../models/JoinRequest.js";
import CirclePost from "../models/CirclePost.js";
import User from "../models/user.js";

// Create a new circle
export const createCircle = async (req, res) => {
    try {
        const { name, description, category, visibility, latitude, longitude, radius } = req.body;
        const userId = req.user.id;

        const newCircle = new Circle({
            name,
            description,
            category,
            visibility: visibility || "public",
            createdBy: userId,
            admins: [userId],
            members: [userId],
            radius: radius || 10,
        });

        if (latitude && longitude) {
            newCircle.location = {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)], // GeoJSON format: [lng, lat]
            };
        }

        await newCircle.save();

        res.status(201).json({
            success: true,
            message: "Circle created successfully",
            circle: newCircle,
        });
    } catch (error) {
        console.error("Error creating circle:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get circles (all public, or nearby if location provided)
export const getCircles = async (req, res) => {
    try {
        const { lat, lng, radius, category } = req.query;
        let query = { visibility: "public" };

        if (category) {
            query.category = category;
        }

        if (lat && lng) {
            const radiusInMeters = (radius ? parseFloat(radius) : 10) * 1000;
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: radiusInMeters,
                },
            };
        }

        const circles = await Circle.find(query).populate("members", "name").populate("admins", "name");

        res.status(200).json({ success: true, circles });
    } catch (error) {
        console.error("Error fetching circles:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get circle details
export const getCircleDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const circle = await Circle.findById(id)
            .populate("members", "name _id")
            .populate("admins", "name _id")
            .populate("createdBy", "name _id");

        if (!circle) {
            return res.status(404).json({ success: false, message: "Circle not found" });
        }

        res.status(200).json({ success: true, circle });
    } catch (error) {
        console.error("Error fetching circle details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Handle joining a circle
export const joinCircle = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const userId = req.user.id;

        const circle = await Circle.findById(circleId);
        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });

        if (circle.members.includes(userId)) {
            return res.status(400).json({ success: false, message: "You are already a member limit" });
        }

        if (circle.visibility === "public") {
            // Direct join
            circle.members.push(userId);
            await circle.save();
            return res.status(200).json({ success: true, message: "Successfully joined the circle" });
        } else {
            // Private circle -> create join request
            const existingRequest = await JoinRequest.findOne({ circleId, userId });
            if (existingRequest) {
                return res.status(400).json({ success: false, message: "Join request already sent" });
            }

            await JoinRequest.create({ circleId, userId });
            return res.status(200).json({ success: true, message: "Join request sent successfully" });
        }
    } catch (error) {
        console.error("Error joining circle:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Admin approve join request
export const approveJoinRequest = async (req, res) => {
    try {
        const { id: requestId } = req.params;
        const adminId = req.user.id;

        const request = await JoinRequest.findById(requestId).populate("circleId");
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        const circle = await Circle.findById(request.circleId);
        if (!circle.admins.includes(adminId)) {
            return res.status(403).json({ success: false, message: "Only admins can approve requests" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ success: false, message: "Request already processed" });
        }

        request.status = "accepted";
        await request.save();

        if (!circle.members.includes(request.userId)) {
            circle.members.push(request.userId);
            await circle.save();
        }

        res.status(200).json({ success: true, message: "Request approved and user added to circle" });
    } catch (error) {
        console.error("Error approving join request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Admin reject join request
export const rejectJoinRequest = async (req, res) => {
    try {
        const { id: requestId } = req.params;
        const adminId = req.user.id;

        const request = await JoinRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        const circle = await Circle.findById(request.circleId);
        if (!circle.admins.includes(adminId)) {
            return res.status(403).json({ success: false, message: "Only admins can reject requests" });
        }

        request.status = "rejected";
        await request.save();

        res.status(200).json({ success: true, message: "Request rejected" });
    } catch (error) {
        console.error("Error rejecting join request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get pending join requests for a circle (admin only)
export const getPendingRequests = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const adminId = req.user.id;

        const circle = await Circle.findById(circleId);
        if (!circle.admins.includes(adminId)) {
            return res.status(403).json({ success: false, message: "Only admins can view requests" });
        }

        const requests = await JoinRequest.find({ circleId, status: "pending" })
            .populate("userId", "name email");

        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error("Error fetching join requests:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Create a post in a circle
export const createPost = async (req, res) => {
    try {
        const { id: circleId } = req.params;
        const { content, imageUrl } = req.body;
        const userId = req.user.id;

        const circle = await Circle.findById(circleId);
        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });

        if (!circle.members.includes(userId)) {
            return res.status(403).json({ success: false, message: "Only members can post" });
        }

        const post = new CirclePost({
            circleId,
            userId,
            content,
            imageUrl,
        });

        await post.save();

        // Populate user info before returning
        await post.populate("userId", "name");

        res.status(201).json({ success: true, message: "Post created successfully", post });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get posts for a circle
export const getCirclePosts = async (req, res) => {
    try {
        const { id: circleId } = req.params;

        // Allow any user to see posts of public circles; restrict private circles to members
        const circle = await Circle.findById(circleId);
        if (!circle) return res.status(404).json({ success: false, message: "Circle not found" });

        if (circle.visibility === "private" && !circle.members.includes(req.user.id)) {
            return res.status(403).json({ success: false, message: "Private circle posts are restricted to members" });
        }

        const posts = await CirclePost.find({ circleId })
            .populate("userId", "name -_id")
            .populate("comments.userId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Like/Unlike a post
export const toggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await CirclePost.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(userId);
        }

        await post.save();
        res.status(200).json({ success: true, likes: post.likes.length });
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Comment on a post
export const commentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ success: false, message: "Comment content is required" });

        const post = await CirclePost.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        post.comments.push({ userId, content });
        await post.save();

        // Re-populate the comments with user names to return
        await post.populate("comments.userId", "name");

        res.status(200).json({ success: true, comments: post.comments });
    } catch (error) {
        console.error("Error commenting on post:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
