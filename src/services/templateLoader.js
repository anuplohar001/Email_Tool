const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

const TEMPLATE_FILES = {
  initial: { subject: "subject.txt", body: "body.html" },
  followup: { subject: "followup-subject.txt", body: "followup-body.html" },
};

function readTemplateFile(filename, fallbackFilename) {
  try {
    return fs.readFileSync(path.join(TEMPLATES_DIR, filename), "utf-8");
  } catch (err) {
    if (fallbackFilename === filename) throw err;
    return fs.readFileSync(path.join(TEMPLATES_DIR, fallbackFilename), "utf-8");
  }
}

function loadTemplate(type = "initial") {
  const files = TEMPLATE_FILES[type] || TEMPLATE_FILES.initial;
  const base = TEMPLATE_FILES.initial;

  const subject = readTemplateFile(files.subject, base.subject).trim();
  const body = readTemplateFile(files.body, base.body);

  return { subject, body };
}

function renderTemplate(templateStr, vars) {
  let result = templateStr;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "");
  }
  return result;
}

function saveTemplate(type, subject, body) {
  const files = TEMPLATE_FILES[type] || TEMPLATE_FILES.initial;
  fs.writeFileSync(path.join(TEMPLATES_DIR, files.subject), subject, "utf-8");
  fs.writeFileSync(path.join(TEMPLATES_DIR, files.body), body, "utf-8");
}

module.exports = { loadTemplate, renderTemplate, saveTemplate };
