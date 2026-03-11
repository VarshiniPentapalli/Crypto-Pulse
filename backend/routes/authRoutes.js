import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import {
  signUp,
  login,
  sendOTP,
  verifyOTP,
  googleSignIn
} from "../controller/authController.js";

const router = express.Router();

/* ======================
   AUTH ROUTES
====================== */

router.post("/signup", signUp);
router.post("/login", login);
router.post("/forgot-password", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/google", googleSignIn);


/* ======================
   AUTH MIDDLEWARE
====================== */

const authenticateUser = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    req.user = user;

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
      error: err.message
    });
  }
};


/* ======================
   GET USER CRYPTOS
====================== */

router.get("/crypto", authenticateUser, async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const symbols = user.cryptos;

    if (!symbols || symbols.length === 0)
      return res.json([]);

    const ids = symbols.join(",");

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: ids,
          price_change_percentage: "1h,24h,7d"
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("Error fetching crypto:", err.message);
    res.status(500).json({ message: "Failed to fetch crypto data" });
  }
});


/* ======================
   ADD CRYPTO
====================== */

router.post("/crypto/add", authenticateUser, async (req, res) => {
  try {

    const { symbol } = req.body;

    if (!symbol)
      return res.status(400).json({ message: "Symbol is required" });

    const coinId = symbol.toLowerCase();

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: coinId
        }
      }
    );

    if (!response.data || response.data.length === 0)
      return res.status(404).json({
        message: `Coin with ID "${symbol}" not found`
      });

    if (!req.user.cryptos.includes(coinId)) {
      req.user.cryptos.push(coinId);
      await req.user.save();
    }

    res.json({
      success: true,
      message: `${coinId} added successfully`
    });

  } catch (err) {
    console.error("Add crypto error:", err);
    res.status(500).json({ message: "Failed to add cryptocurrency" });
  }
});


/* ======================
   SEARCH CRYPTO
====================== */

router.get("/crypto/search", authenticateUser, async (req, res) => {
  try {

    const query = req.query.query?.toLowerCase() || "";

    if (!query)
      return res.json([]);

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${query}`
    );

    const result = response.data.coins.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol
    }));

    res.json(result.slice(0, 10));

  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({
      message: "Search failed"
    });
  }
});


/* ======================
   DELETE CRYPTO
====================== */

router.delete("/crypto/delete/:symbol", authenticateUser, async (req, res) => {
  try {

    const { symbol } = req.params;

    const index = req.user.cryptos.findIndex(
      coin => coin.toLowerCase() === symbol.toLowerCase()
    );

    if (index === -1)
      return res.status(404).json({
        message: `"${symbol}" not found in your portfolio`
      });

    req.user.cryptos.splice(index, 1);

    await req.user.save();

    res.json({
      success: true,
      message: `${symbol} removed successfully`
    });

  } catch (err) {
    console.error("Delete error:", err);

    res.status(500).json({
      message: "Server error during deletion"
    });
  }
});


export default router;