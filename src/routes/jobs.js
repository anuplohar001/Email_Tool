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

const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VALID_STATUSES = ["active", "paused", "completed", "failed"];

router.get("/edit/:id", async (req, res) => {
  const job = await prisma.emailJob.findUnique({ where: { id: req.params.id } });
  if (!job) {
    return res.redirect("/");
  }
  res.render("edit", { job, error: null });
});

router.post("/edit/:id", async (req, res) => {
  const job = await prisma.emailJob.findUnique({ where: { id: req.params.id } });
  if (!job) {
    return res.redirect("/");
  }

  const { company, role, emails, time, status } = req.body;
  const days = req.body.days ? (Array.isArray(req.body.days) ? req.body.days : [req.body.days]) : [];

  const fail = (error) => res.render("edit", { job, error });

  if (!company || !company.trim() || !role || !role.trim() || !emails || !time || days.length === 0) {
    return fail("Company, role, emails, at least one day and time are all required.");
  }

  if (days.some((d) => !VALID_DAYS.includes(d))) {
    return fail("Invalid schedule day selected.");
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return fail("Invalid time format.");
  }

  if (!VALID_STATUSES.includes(status)) {
    return fail("Invalid status selected.");
  }

  const emailList = emails
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.includes("@"));

  if (emailList.length === 0) {
    return fail("Enter at least one valid email address.");
  }

  const existing = await prisma.emailJob.findFirst({
    where: {
      company: company.trim(),
      role: role.trim(),
      time,
      days: { equals: days },
      NOT: { id: job.id },
    },
  });

  if (existing) {
    return fail("Another job with the same company, role and schedule already exists.");
  }

  await prisma.emailJob.update({
    where: { id: job.id },
    data: {
      company: company.trim(),
      role: role.trim(),
      emails: emailList,
      days,
      time,
      status,
    },
  });

  res.redirect("/");
});

router.post("/delete/:id", async (req, res) => {
  await prisma.emailJob.delete({ where: { id: req.params.id } });
  res.redirect("/");
});

module.exports = router;
