const express = require("express");
const practiceRoutes = require("./routes/practice.routes");

const app = express();
app.use(express.json());
app.use("/practice", practiceRoutes);
const PORT = 3000;

//get request handling//
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});


app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
