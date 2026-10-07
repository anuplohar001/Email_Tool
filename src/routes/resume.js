const express = require("express");
const multer = require("multer");
const { RESUME_PATH, RESUME_FILENAME, getResumeInfo, saveResume } = require("../services/resume");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdf) return cb(null, true);
    cb(new Error("Only PDF files are allowed"));
  },
});

router.get("/", (req, res) => {
  res.render("resume", { info: getResumeInfo(), saved: false, error: null });
});

router.get("/file", (req, res) => {
  if (!getResumeInfo().exists) {
    return res.status(404).send("Resume not found");
  }
  res.sendFile(RESUME_PATH, {
    headers: { "Content-Disposition": `inline; filename="${RESUME_FILENAME}"` },
  });
});

router.post("/", (req, res) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      return res.render("resume", {
        info: getResumeInfo(),
        saved: false,
        error: err.message,
      });
    }

    if (!req.file) {
      return res.render("resume", {
        info: getResumeInfo(),
        saved: false,
        error: "No file selected.",
      });
    }

    saveResume(req.file.buffer);

    res.render("resume", { info: getResumeInfo(), saved: true, error: null });
  });
});

module.exports = router;
