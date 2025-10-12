import { Request, Response } from "express";
import axios from "axios";

export async function handleUrl(req: Request, res: Response) {
  try {
    console.log("Request received at API Gateway");
    const { url } = req.body;
    console.log("URL:", url);
    console.log("SESSION: ",req.session);

    console.log("Session Token:", req.session.githubToken);
    const response = await axios.post(
      "http://submission-service:3000/api/v1/url",
      { url, token: req.session.githubToken },  
      { timeout: 10000 } 
    );

    res.json({
      success: true,
      message: "Please wait while we process your request",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}