import rateLimit from "express-rate-limit";

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({
      error: { code: "rate_limit_exceeded", message: "Too many requests. Please wait and try again." },
    });
  },
});
