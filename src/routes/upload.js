const express = require("express");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const { parseExcel } = require("../services/excelParser");

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", (req, res) => {
  res.render("upload", { errors: null, uploaded: null });
});

router.post("/", upload.single("excel"), async (req, res) => {
  if (!req.file) {
    return res.render("upload", {
      errors: [{ row: 0, reason: "No file uploaded" }],
      uploaded: null,
    });
  }

  const { jobs, errors } = parseExcel(req.file.buffer);

  let created = 0;
  let skipped = 0;

  for (const job of jobs) {
    const existing = await prisma.emailJob.findFirst({
      where: {
        company: job.company,
        role: job.role,
        time: job.time,
        days: { equals: job.days },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.emailJob.create({
      data: {
        company: job.company,
        emails: job.emails,
        role: job.role,
        days: job.days,
        time: job.time,
      },
    });
    created++;
  }

  res.render("upload", {
    errors: errors.length > 0 ? errors : null,
    uploaded: { created, skipped, total: jobs.length + skipped },
  });
});

module.exports = router;
