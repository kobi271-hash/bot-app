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

// 🔥 זה החלק החדש (בלי Alerts)
setInterval(async () => {
  try {
    console.log("Bot checking signal...");

    // כאן תוכל להכניס לוגיקה בהמשך
    // כרגע רק בדיקה שהבוט רץ

  } catch (err) {
    console.log(err.message);
  }
}, 5000);

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
