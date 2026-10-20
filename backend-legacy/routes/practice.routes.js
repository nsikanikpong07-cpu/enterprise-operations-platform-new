const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
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

module.exports = router;