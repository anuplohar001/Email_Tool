const express = require("express");
const { loadTemplate, saveTemplate } = require("../services/templateLoader");

const router = express.Router();

function getTemplates() {
  return {
    initial: loadTemplate("initial"),
    followup: loadTemplate("followup"),
  };
}

router.get("/", (req, res) => {
  res.render("template", { templates: getTemplates(), saved: false });
});

router.post("/", (req, res) => {
  const { initialSubject, initialBody, followupSubject, followupBody } = req.body;

  saveTemplate("initial", initialSubject || "", initialBody || "");
  saveTemplate("followup", followupSubject || "", followupBody || "");

  res.render("template", { templates: getTemplates(), saved: true });
});

module.exports = router;
