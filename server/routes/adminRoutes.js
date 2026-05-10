const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "admin" });
});

module.exports = router;
