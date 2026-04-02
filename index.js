const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const USERNAME = process.env.TV_USER;
const PASSWORD = process.env.TV_PASS;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

async function login() {
  const res = await axios.post("https://live.tradovateapi.com/v1/auth/accesstokenrequest", {
    name: USERNAME,
    password: PASSWORD,
    appId: "app",
    appVersion: "1.0",
    deviceId: "device"
  });

  return res.data.accessToken;
}

async function placeOrder(action) {
  const token = await login();

  console.log("Connected to Tradovate LIVE");

  await axios.post(
    "https://live.tradovateapi.com/v1/order/placeorder",
    {
      accountId: ACCOUNT_ID,
      symbol: "MNQ1!",
      action: action,
      orderQty: 1,
      orderType: "Market"
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Order sent:", action);
}

app.post("/", async (req, res) => {
  console.log("Received:", req.body);

  const action = req.body.action;

  if (action === "BUY" || action === "SELL") {
    await placeOrder(action);
  }

  res.send("OK");
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
