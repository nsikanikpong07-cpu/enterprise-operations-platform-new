const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT company_id, name, created_at
      FROM app.companies
      ORDER BY created_at, company_id
    `);

    return res.status(200).json({
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { name } = req.body ?? {};

  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      message: "Company name is required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO app.companies (name)
       VALUES ($1)
       RETURNING company_id, name, created_at`,
      [name.trim()]
    );

    return res.status(201).json({
      message: "Company created",
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { name } = req.body ?? {};

  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      message: "Company name is required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO app.companies (name)
       VALUES ($1)
       RETURNING company_id, name, created_at`,
      [name.trim()]
    );

    return res.status(201).json({
      message: "Company created",
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});
//retrieve a company by ID//
router.get("/:companyId", async (req, res, next) => {
  const companyId = req.params.companyId;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(companyId)) {
    return res.status(400).json({
      message: "Company ID must be a valid UUID",
    });
  }

  try {
    const result = await pool.query(
      `SELECT company_id, name, created_at
       FROM app.companies
       WHERE company_id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json({
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:companyId", async (req, res, next) => {
  // Read the ID from the URL and the new name from the body.
  const companyId = req.params.companyId;
  const body = req.body ?? {};
  const name = body.name;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Reject an incorrectly formatted ID before querying.
  if (!uuidPattern.test(companyId)) {
    return res.status(400).json({
      message: "Company ID must be a valid UUID",
    });
  }

  // Require a non-empty company name.
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      message: "Company name is required",
    });
  }

  try {
    // $1 receives the name; $2 receives the company ID.
    const result = await pool.query(
      `UPDATE app.companies
       SET name = $1
       WHERE company_id = $2
       RETURNING company_id, name, created_at`,
      [name.trim(), companyId]
    );

    // No returned row means no company matched the ID.
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json({
      message: "Company updated",
      data: result.rows[0],
    });
  } catch (err) {
    next(err); // Forward database errors to the shared handler.
  }
});

module.exports = router;