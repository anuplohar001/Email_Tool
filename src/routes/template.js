const express = require("express");
const { loadTemplate, saveTemplate } = require("../services/templateLoader");

const router = express.Router();

router.get("/", (req, res) => {
  const { subject, body } = loadTemplate();
  res.render("template", { subject, body, saved: false });
});

router.post("/", (req, res) => {
  const { subject, body } = req.body;
  saveTemplate(subject || "", body || "");
  const updated = loadTemplate();
  res.render("template", {
    subject: updated.subject,
    body: updated.body,
    saved: true,
  });
});

module.exports = router;
