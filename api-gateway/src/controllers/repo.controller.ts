import { Request, Response } from "express";

export async function repoHandler(req: Request, res: Response) {

    const token = req.session.githubToken;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No GitHub token found"
        });
    }

    try {
        const response = await fetch("https://api.github.com/user/repos?per_page=100", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json"
            },
        });
        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ 
                success: false, 
                message: "Failed to fetch repos",
                details: text 
            });
        }

        const repos = await response.json();
        const simplified = repos.map((repo:any)=>({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            private: repo.private,
            owner: {
                login: repo.owner.login,
                id: repo.owner.id
            }
        }));

        res.json({
            success: true,
            repos: simplified
        })

    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error fetching Github repos",
            error: error.message,
        });
    }
}
