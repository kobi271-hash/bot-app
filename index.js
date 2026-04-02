const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const USERNAME = process.env.TV_USER;
const PASSWORD = process.env.TV_PASS;
const ACCOUNT_NAME = process.env.ACCOUNT_NAME; // לדוגמה: LTD1007248197001
const SYMBOL = process.env.SYMBOL || "ESM6";   // אפשר לשנות ל-MNQM6 אם תרצה

const API_BASE = "https://demo.tradovateapi.com/v1";

// מונע כפילויות
let lastAction = null;

// התחברות ל-Tradovate
async function login() {
  const res = await axios.post(`${API_BASE}/auth/accessTokenRequest`, {
    name: USERNAME,
    password: PASSWORD,
    appId: "app",
    appVersion: "1.0",
    deviceId: "bot",
  });

  return res.data.accessToken;
}

// מציאת החשבון לפי השם
async function getAccount(token) {
  const res = await axios.get(`${API_BASE}/account/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const acc = res.data.find((a) => a.name === ACCOUNT_NAME);

  if (!acc) {
    throw new Error(`Account not found: ${ACCOUNT_NAME}`);
  }

  return acc;
}

// שליחת פקודת מסחר
async function placeOrder(action) {
  const token = await login();
  const account = await getAccount(token);

  const side = action === "BUY" ? "Buy" : "Sell";

  const order = {
    accountSpec: account.name,
    accountId: account.id,
    action: side,
    symbol: SYMBOL,
    orderQty: 1,
    orderType: "Market",
    timeInForce: "Day",
    isAutomated: true,
  };

  console.log("🔥 Sending:", order);

  const res = await axios.post(`${API_BASE}/order/placeorder`, order, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("✅ Order:", res.data);
  return res.data;
}

// בדיקת חיים
app.get("/", (req, res) => {
  res.send("Bot is running");
});

// קבלת Webhook מ-TradingView
app.post("/", async (req, res) => {
  try {
    console.log("📩 BODY:", JSON.stringify(req.body));

    const text = JSON.stringify(req.body).toUpperCase();

    let action = null;
    if (text.includes("BUY")) action = "BUY";
    if (text.includes("SELL")) action = "SELL";

    if (!action) {
      console.log("⚠️ No valid action found");
      return res.status(200).send("No action");
    }

    // מניעת כפילויות
    if (action === lastAction) {
      console.log("⛔ Duplicate skipped:", action);
      return res.status(200).send("Duplicate skipped");
    }

    lastAction = action;

    console.log("📩 Received:", action);

    await placeOrder(action);

    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ ERROR:", err.response?.data || err.message);
    return res.status(500).send("Error");
  }
});

app.listen(PORT, () => {
  console.log("🚀 Bot started");
});
