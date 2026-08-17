require("dotenv").config();

const app = require("./app");
const { startScheduler } = require("./services/scheduler");

const PORT = process.env.PORT || 3000;

console.log(`[Server] EMAIL_USER: ${process.env.EMAIL_USER || "NOT SET"}`);
console.log(`[Server] EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? "SET (hidden)" : "NOT SET"}`);

startScheduler();    

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
