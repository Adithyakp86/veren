import { Router } from "express";
import { LoginController, CallbackController,refreshAccessToken, logOutController, getMe } from "../controllers/auth.controller.js"
import { verifyJwt } from "../middlewares/auth.middlewares.js";
const router = Router();

//LOGIN ROUTE - Manages both signup and login
router.route("/login").get(LoginController);

router.route("/callback").get(CallbackController)

router.route("/logout").get(logOutController)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/me").get(verifyJwt,getMe)


export default router;