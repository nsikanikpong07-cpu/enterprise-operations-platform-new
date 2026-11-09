require("dotenv").config(); //this loads.env//

const express = require("express");
const practiceRoutes = require("./routes/practice.routes");
const pool = require("./db");
const companiesRoutes = require("./routes/companies.routes");

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

app.get("/health/database", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "ok",
      message: "Database connection is working",
    });
  } catch (err) {
    next(err);
  }
});

app.use("/companies", companiesRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


//handling malformed JSON//

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON in request body",
    });
  }

  console.error(err);

  return res.status(500).json({
    message: "Internal server error",
  });
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
