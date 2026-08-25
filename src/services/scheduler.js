const cron = require("node-cron");
const moment = require("moment-timezone");
const { PrismaClient } = require("@prisma/client");
const { loadTemplate, renderTemplate } = require("./templateLoader");
const { sendEmail } = require("./mailer");

const prisma = new PrismaClient(); 

async function tick() {
  const now = moment().tz("Asia/Kolkata");
  const todayAbbrev = now.format("ddd"); // e.g. "Mon"
  const todayTime = now.format("HH:mm"); // e.g. "09:00"
  const todayDate = now.format("YYYY-MM-DD");

  console.log(`[Scheduler] Tick at ${todayDate} ${todayTime} IST (${todayAbbrev})`);

  let allJobs;
  try {
    allJobs = await prisma.emailJob.findMany({
      where: { status: "active" },
    });
    console.log(`[Scheduler] Active jobs in DB: ${allJobs.length}`);
  } catch (err) {
    console.error("[Scheduler] DB query error:", err.message);
    return;
  }
  
  const jobs = allJobs.filter(
    (j) =>
      j.days.includes(todayAbbrev) &&
      j.time === todayTime &&
      j.lastSentDate !== todayDate
  );

  console.log(`[Scheduler] Matched jobs for today: ${jobs.length}`);

  if (jobs.length === 0) return;

  const template = loadTemplate();
 
  for (const job of jobs) {
    try {
      const subject = renderTemplate(template.subject, {
        company: job.company,
        role: job.role,
      });
      const body = renderTemplate(template.body, {
        company: job.company,
        role: job.role,
      });

      await sendEmail(job.emails, subject, body);

      const newSendCount = job.sendCount + 1;
      const newStatus = newSendCount >= job.maxSends ? "completed" : "active";

      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          sendCount: newSendCount,
          lastSentDate: todayDate,
          status: newStatus,
          lastError: null,
        },
      });

      console.log(
        `[Scheduler] Sent to ${job.company} (${job.emails.join(",")}) - count ${newSendCount}/${job.maxSends}`
      );
    } catch (err) {
      console.error(
        `[Scheduler] Error = for ${err}: ${err.message}`
      );
      try {
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            lastError: err.message,
          },
        });
      } catch (updateErr) {
        console.error(
          `[Scheduler] Failed to update status for ${job.company}: ${updateErr.message}`
        );
      }
    }
  }
}

function startScheduler() {
  cron.schedule("* * * * *", tick);
  console.log("[Scheduler] Cron job registered (every minute, IST)");
}

module.exports = { startScheduler };
