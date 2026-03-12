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

/* ================= AUTH ROUTES ================= */

router.post("/signup", signUp);
router.post("/login", login);
router.post("/forgot-password", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/google", googleSignIn);


/* ================= AUTH MIDDLEWARE ================= */

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

    console.error("Auth error:", err.message);

    return res.status(401).json({ message: "Unauthorized" });

  }
};


/* ================= CACHE ================= */

const cryptoCache = new Map();
const searchCache = new Map();

const CACHE_DURATION = 600000; // 10 minutes


/* ================= GET PORTFOLIO ================= */

router.get("/crypto", authenticateUser, async (req, res) => {

  try {

    const symbols = req.user.cryptos || [];

    if (!symbols.length) return res.json([]);

    const ids = symbols.join(",");

    const cached = cryptoCache.get(ids);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids,
          price_change_percentage: "1h,24h,7d"
        }
      }
    );

    const data = response.data.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: coin.image,
      current_price: coin.current_price,
      price_change_percentage_1h_in_currency:
        coin.price_change_percentage_1h_in_currency,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      price_change_percentage_7d_in_currency:
        coin.price_change_percentage_7d_in_currency
    }));

    cryptoCache.set(ids, {
      data,
      timestamp: Date.now()
    });

    res.json(data);

  } catch (err) {

    if (err.response?.status === 429) {
      return res.status(429).json({
        message: "CoinGecko rate limit reached. Please wait a moment."
      });
    }

    console.error("Crypto fetch error:", err.message);

    res.status(500).json({
      message: "Internal server error"
    });

  }

});


/* ================= ADD CRYPTO ================= */

router.post("/crypto/add", authenticateUser, async (req, res) => {

  try {

    const coinInput = req.body.symbol || req.body.id;

    if (!coinInput)
      return res.status(400).json({ message: "Coin required" });

    const coinId = coinInput.toLowerCase().trim();

    if (!req.user.cryptos)
      req.user.cryptos = [];

    if (req.user.cryptos.includes(coinId))
      return res.status(400).json({
        message: `${coinId} already exists`
      });

    req.user.cryptos.push(coinId);

    await req.user.save();

    cryptoCache.clear();

    res.json({
      success: true,
      message: `${coinId} added successfully`
    });

  } catch (err) {

    console.error("Add crypto error:", err.message);

    res.status(500).json({
      message: "Failed to add cryptocurrency"
    });

  }

});


/* ================= SEARCH CRYPTO ================= */

router.get("/crypto/search", authenticateUser, async (req, res) => {

  try {

    const query = req.query.query?.toLowerCase() || "";

    if (!query) return res.json([]);

    const cached = searchCache.get(query);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${query}`
    );

    const result = response.data.coins
      .map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol
      }))
      .slice(0, 10);

    searchCache.set(query, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);

  } catch (err) {

    if (err.response?.status === 429) {
      return res.status(429).json({
        message: "Too many search requests. Please wait a moment."
      });
    }

    console.error("Search error:", err.message);

    res.status(500).json({
      message: "Search failed"
    });

  }

});


/* ================= DELETE CRYPTO ================= */

router.delete("/crypto/delete/:id", authenticateUser, async (req, res) => {

  try {

    const { id } = req.params;

    if (!req.user.cryptos)
      req.user.cryptos = [];

    const index = req.user.cryptos.findIndex(
      (coin) => coin.toLowerCase() === id.toLowerCase()
    );

    if (index === -1)
      return res.status(404).json({
        message: `"${id}" not found in portfolio`
      });

    req.user.cryptos.splice(index, 1);

    await req.user.save();

    cryptoCache.clear();

    res.json({
      success: true,
      message: `${id} removed successfully`
    });

  } catch (err) {

    console.error("Delete error:", err.message);

    res.status(500).json({
      message: "Server error during deletion"
    });

  }

});


export default router;