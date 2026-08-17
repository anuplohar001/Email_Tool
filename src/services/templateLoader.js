const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

function loadTemplate() {
  const subjectPath = path.join(TEMPLATES_DIR, "subject.txt");
  const bodyPath = path.join(TEMPLATES_DIR, "body.html");

  const subject = fs.readFileSync(subjectPath, "utf-8").trim();
  const body = fs.readFileSync(bodyPath, "utf-8");

  return { subject, body };
}

function renderTemplate(templateStr, vars) {
  let result = templateStr;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "");
  }
  return result;
}

function saveTemplate(subject, body) {
  const subjectPath = path.join(TEMPLATES_DIR, "subject.txt");
  const bodyPath = path.join(TEMPLATES_DIR, "body.html");
  fs.writeFileSync(subjectPath, subject, "utf-8");
  fs.writeFileSync(bodyPath, body, "utf-8");
}

module.exports = { loadTemplate, renderTemplate, saveTemplate };
