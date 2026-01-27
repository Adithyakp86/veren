import { Router, Request, Response } from "express";
import {handleFirstDeployment, handleEnvironmentVariable} from "../controllers/url.controller.js";
import axios from "axios";
const router = Router();

router.post("/", handleFirstDeployment);
router.post("/env", handleEnvironmentVariable)

export default router;
