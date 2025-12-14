import { Router } from "express";
import { createUser, authenticateUser } from "../controllers/authController";

const router = Router();

router.post("/register", createUser);
router.post("/login", authenticateUser);

export default router;
