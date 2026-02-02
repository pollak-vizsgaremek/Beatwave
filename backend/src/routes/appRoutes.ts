import { Router } from "express";
import { createUser, authenticateUser } from "../controllers/authController";
import { getUserProfile } from "../controllers/userProfile";

const router = Router();

router.post("/register", createUser);
router.post("/login", authenticateUser);
router.get("UserProfile", getUserProfile);

export default router;
