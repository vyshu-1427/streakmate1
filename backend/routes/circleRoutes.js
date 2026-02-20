import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkStreakThreshold } from "../middleware/streakCheck.js";
import {
    createCircle,
    getCircles,
    getCircleDetails,
    joinCircle,
    getPendingRequests,
    approveJoinRequest,
    rejectJoinRequest,
    createPost,
    getCirclePosts,
    toggleLikePost,
    commentPost,
} from "../controllers/circleController.js";

const router = express.Router();

// Apply auth middleware to all circle routes
router.use(authMiddleware);

// --- Circles ---
// Create a circle (requires streak >= threshold)
router.post("/", checkStreakThreshold, createCircle);

// Get circles (public/nearby)
router.get("/", getCircles);

// Get specific circle details
router.get("/:id", getCircleDetails);

// Request/Join a circle
router.post("/:id/join", joinCircle);

// --- Admin Request Management ---
// Get pending requests for a circle
router.get("/:id/requests", getPendingRequests);
// Approve a request
router.post("/requests/:id/approve", approveJoinRequest);
// Reject a request
router.post("/requests/:id/reject", rejectJoinRequest);

// --- Circle Feed (Posts, Likes, Comments) ---
// Create a post in a circle
router.post("/:id/post", createPost);
// Get posts for a circle
router.get("/:id/posts", getCirclePosts);
// Like a post
router.post("/posts/:postId/like", toggleLikePost);
// Comment on a post
router.post("/posts/:postId/comment", commentPost);

export default router;
