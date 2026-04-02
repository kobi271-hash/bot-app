const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const USERNAME = process.env.TV_USER;
const PASSWORD = process.env.TV_PASS;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

// התחברות ל-Tradovate
async function login() {
  const res = await axios.post(
    "https://live.tradovateapi.com/v1/auth/accesstokenrequest",
    {
      name: USERNAME,
      password: PASSWORD,
      appId: "app",
      appVersion: "1.0",
      deviceId: "device",
    }
  );

  return res.data.accessToken;
}

// שליחת פקודה
async function placeOrder(action) {
  const token = await login();

  console.log("🔥 Sending order:", action);

  await axios.post(
    "https://live.tradovateapi.com/v1/order/placeorder",
    {
      accountId: ACCOUNT_ID,
      symbol: "MNQ1!",
      action: action,
      orderQty: 1,
      orderType: "Market",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

// 🔥 קבלת Webhook מ-TradingView
app.post("/", async (req, res) => {
  try {
    const action = req.body.action;

    console.log("📩 Received:", action);

    if (action === "BUY") {
      await placeOrder("Buy");
    }

    if (action === "SELL") {
      await placeOrder("Sell");
    }

    res.send("OK");
  } catch (err) {
    console.log(err.message);
    res.send("ERROR");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
