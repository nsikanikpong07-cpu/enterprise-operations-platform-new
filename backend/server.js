const express = require("express");

const app = express();
app.use(express.json());
const PORT = 3000;

//get request handling//
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

//validation testing//

app.post("/practice", (req, res) => {
  const { item, quantity } = req.body ?? {};

  if (typeof item !== "string" || item.trim() === "") {
    return res.status(400).json({
      message: "Item must be non-empty text",
    });
  }

  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({
      message: "Quantity must be a number greater than zero",
    });
  }

  return res.status(200).json({
    message: "Data accepted",
    data: {
      item: item.trim(),
      quantity: quantity,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
