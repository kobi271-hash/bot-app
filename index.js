const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const USERNAME = process.env.TV_USER;
const PASSWORD = process.env.TV_PASS;
const ACCOUNT_NAME = process.env.ACCOUNT_NAME;
const SYMBOL = process.env.SYMBOL || "MNQM6";

const API_BASE = "https://demo.tradovateapi.com/v1";

// התחברות
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

// מציאת חשבון
async function getAccount(token) {
  const res = await axios.get(`${API_BASE}/account/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const acc = res.data.find(a => a.name === ACCOUNT_NAME);
  if (!acc) throw new Error("Account not found");

  return acc;
}

// שליחת פקודה
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
    timeInForce: "Day"
  };

  console.log("🔥 Sending:", order);

  const res = await axios.post(`${API_BASE}/order/placeorder`, order, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("✅ Order:", res.data);
}

// קבלת webhook
app.post("/", async (req, res) => {
  console.log("📩 BODY:", req.body);

  const text = JSON.stringify(req.body).toUpperCase();

  let action = null;
  if (text.includes("BUY")) action = "BUY";
  if (text.includes("SELL")) action = "SELL";

  if (!action) return res.send("No action");

  await placeOrder(action);

  res.send("OK");
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("🚀 Bot started");
});
