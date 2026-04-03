const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const TV_USER = process.env.TV_USER;
const TV_PASS = process.env.TV_PASS;
const ACCOUNT_NAME = process.env.ACCOUNT_NAME; // לדוגמה: LTD1007248197001
const SYMBOL = process.env.SYMBOL || "MNQM6";
const TRADOVATE_ENV = (process.env.TRADOVATE_ENV || "demo").toLowerCase();

const API_BASE =
  TRADOVATE_ENV === "live"
    ? "https://live.tradovateapi.com/v1"
    : "https://demo.tradovateapi.com/v1";

// מונע כפילויות רצופות
let lastAction = null;

// deviceId עקבי
const DEVICE_ID = "railway-bot-001";

function getActionFromBody(body) {
  const raw = JSON.stringify(body || {}).toUpperCase();

  if (raw.includes('"ACTION":"BUY"')) return "BUY";
  if (raw.includes('"ACTION":"SELL"')) return "SELL";

  if (raw.includes("BUY")) return "BUY";
  if (raw.includes("SELL")) return "SELL";

  return null;
}

async function login() {
  const payload = {
    name: TV_USER,
    password: TV_PASS,
    appId: "railway-bot",
    appVersion: "1.0",
    deviceId: DEVICE_ID,
  };

  const res = await axios.post(`${API_BASE}/auth/accessTokenRequest`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  if (!res.data || !res.data.accessToken) {
    throw new Error("Login failed: no accessToken returned");
  }

  return res.data.accessToken;
}

async function getAccount(accessToken) {
  const res = await axios.get(`${API_BASE}/account/list`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    timeout: 15000,
  });

  const accounts = Array.isArray(res.data) ? res.data : [];
  const account = accounts.find((a) => a.name === ACCOUNT_NAME);

  if (!account) {
    throw new Error(
      `Account not found. Expected ACCOUNT_NAME=${ACCOUNT_NAME}. Available accounts: ${accounts
        .map((a) => a.name)
        .join(", ")}`
    );
  }

  return {
    accountId: account.id,     // מספרי
    accountSpec: account.name, // מחרוזת, לדוגמה LTD1007248197001
  };
}

async function placeOrder(action) {
  const accessToken = await login();
  const { accountId, accountSpec } = await getAccount(accessToken);

  const side = action === "BUY" ? "Buy" : "Sell";

  const orderPayload = {
    accountSpec,
    accountId,
    action: side,
    symbol: SYMBOL,
    orderQty: 1,
    orderType: "Market",
    timeInForce: "Day",
    isAutomated: true,
  };

  console.log("🔥 Sending order:", JSON.stringify(orderPayload));

  const res = await axios.post(`${API_BASE}/order/placeorder`, orderPayload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  console.log("✅ Order response:", JSON.stringify(res.data));
  return res.data;
}

app.get("/", (req, res) => {
  res.status(200).send("Bot is running");
});

app.post("/", async (req, res) => {
  try {
    console.log("📩 BODY:", JSON.stringify(req.body));

    const action = getActionFromBody(req.body);

    if (!action) {
      console.log("⚠️ No valid action found");
      return res.status(200).send("No valid action found");
    }

    console.log("📩 Received:", action);

    if (action === lastAction) {
      console.log("⛔ Duplicate skipped:", action);
      return res.status(200).send("Duplicate skipped");
    }

    lastAction = action;

    const result = await placeOrder(action);

    return res.status(200).json({
      ok: true,
      action,
      result,
    });
  } catch (err) {
    const msg =
      err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message || "Unknown error";

    console.error("❌ ERROR:", msg);
    return res.status(500).send(msg);
  }
});

app.listen(PORT, () => {
  console.log("🚀 Bot started");
  console.log(`🌐 Environment: ${TRADOVATE_ENV}`);
  console.log(`📈 Symbol: ${SYMBOL}`);
  console.log(`👤 Account name: ${ACCOUNT_NAME}`);
});
