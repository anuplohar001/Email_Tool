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

router.post("/delete/:id", async (req, res) => {
  await prisma.emailJob.delete({ where: { id: req.params.id } });
  res.redirect("/");
});

module.exports = router;
