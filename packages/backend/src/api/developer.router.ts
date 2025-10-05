// packages/backend/src/api/developer.router.ts
import { Router, Request, Response } from "express";

const router = Router();

// GET /api/developer/test - Test endpoint for developer tools
router.get("/test", async (req: Request, res: Response) => {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    res.json({
      status: "success",
      message: "Test API call successful",
      timestamp: new Date().toISOString(),
      data: {
        userId: "dev-user",
        environment: "development",
        version: "0.3.11"
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "Test API call failed",
      error: error.message
    });
  }
});

// POST /api/developer/test - Test endpoint for POST requests
router.post("/test", async (req: Request, res: Response) => {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    res.json({
      status: "success",
      message: "Test POST API call successful",
      timestamp: new Date().toISOString(),
      receivedData: req.body
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "Test POST API call failed",
      error: error.message
    });
  }
});

// GET /api/developer/slow - Simulate slow API endpoint
router.get("/slow", async (req: Request, res: Response) => {
  try {
    // Simulate slow response (2-5 seconds)
    const delay = 2000 + Math.random() * 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    res.json({
      status: "success",
      message: "Slow API call completed",
      delay: `${Math.round(delay)}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "Slow API call failed",
      error: error.message
    });
  }
});

// GET /api/developer/error - Simulate API error
router.get("/error", async (req: Request, res: Response) => {
  try {
    // Simulate an error
    throw new Error("Simulated API error for testing purposes");
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "Simulated error response",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;