const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const jobs = await prisma.emailJob.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.render("dashboard", { jobs });
});

router.post("/pause/:id", async (req, res) => {
  await prisma.emailJob.update({
    where: { id: req.params.id },
    data: { status: "paused" },
  });
  res.redirect("/");
});

router.post("/resume/:id", async (req, res) => {
  await prisma.emailJob.update({
    where: { id: req.params.id },
    data: { status: "active" },
  });
  res.redirect("/");
});

router.post("/create", async (req, res) => {
  const { company, role, emails, time } = req.body;
  const days = req.body.days ? (Array.isArray(req.body.days) ? req.body.days : [req.body.days]) : [];

  if (!company || !role || !emails || !time || days.length === 0) {
    return res.redirect("/");
  }

  const emailList = emails
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.includes("@"));

  if (emailList.length === 0) {
    return res.redirect("/");
  }

  const existing = await prisma.emailJob.findFirst({
    where: { company, role, time, days: { hasEvery: days } },
  });

  if (existing) {
    return res.redirect("/");
  }

  await prisma.emailJob.create({
    data: {
      company,
      role,
      emails: emailList,
      days,
      time,
    },
  });

  res.redirect("/");
});

router.post("/delete/:id", async (req, res) => {
  await prisma.emailJob.delete({ where: { id: req.params.id } });
  res.redirect("/");
});

module.exports = router;
