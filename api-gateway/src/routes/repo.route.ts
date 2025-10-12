import { Router } from "express";
import {repoHandler} from "../controllers/repo.controller.js";
const router = Router();

router.route("/getrepo").get(repoHandler);

export default router;