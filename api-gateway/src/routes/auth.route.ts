import { Router } from "express";
import { repoHandler } from "../controllers/repo.controller.js";
import { LoginController, CallbackController, Redirected } from "../controllers/auth.controller.js"
const router = Router();

//LOGIN ROUTE
router.get("/github", LoginController);

router.get("/callback",CallbackController)
router.get("/redirect",Redirected)

router.route("/getrepo").get(repoHandler);

export default router;