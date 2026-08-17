const XLSX = require("xlsx");

const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseSchedule(scheduleStr) {
  if (!scheduleStr || typeof scheduleStr !== "string") return null;

  const trimmed = scheduleStr.trim();
  const match = trimmed.match(/^([A-Za-z,]+)\s+(\d{1,2}:\d{2})$/);
  if (!match) return null;

  const dayPart = match[1];
  const timePart = match[2];

  const days = dayPart.split(",").map((d) => d.trim());
  const capitalizedDays = days.map((d) => {
    const lower = d.toLowerCase();
    const found = VALID_DAYS.find((v) => v.toLowerCase() === lower);
    return found || null;
  });

  if (capitalizedDays.includes(null)) return null;
  if (!/^\d{2}:\d{2}$/.test(timePart)) return null;

  return { days: capitalizedDays, time: timePart };
}

function parseEmails(emailStr) {
  if (!emailStr || typeof emailStr !== "string") return null;
  const emails = emailStr
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.includes("@"));
  return emails.length > 0 ? emails : null;
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const jobs = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 for 1-indexed + header row
    const company = typeof row.company === "string" ? row.company.trim() : "";
    const emailRaw = row.email;
    const role = typeof row.role === "string" ? row.role.trim() : "";
    const scheduleRaw = row.schedule;

    const scheduleStr =
      typeof scheduleRaw === "number"
        ? String(Math.round(scheduleRaw))
        : typeof scheduleRaw === "string"
          ? scheduleRaw
          : "";

    console.log(`[ExcelParser] Row ${rowNum}: company="${company}" email="${emailRaw}" role="${role}" scheduleRaw=${scheduleRaw} (type: ${typeof scheduleRaw}) scheduleStr="${scheduleStr}"`);

    if (!company) {
      errors.push({ row: rowNum, reason: "Missing company" });
      return;
    }

    const emails = parseEmails(
      typeof emailRaw === "string" ? emailRaw : String(emailRaw)
    );
    if (!emails) {
      errors.push({ row: rowNum, reason: "Invalid or missing email(s)" });
      return;
    }

    if (!role) {
      errors.push({ row: rowNum, reason: "Missing role" });
      return;
    }

    const schedule = parseSchedule(scheduleStr);
    if (!schedule) {
      console.log(`[ExcelParser] Row ${rowNum}: INVALID schedule "${scheduleStr}"`);
      errors.push({
        row: rowNum,
        reason: `Invalid schedule format: "${scheduleStr}" (expected "Mon,Wed,Fri 09:00")`,
      });
      return;
    }

    jobs.push({ company, emails, role, ...schedule });
    console.log(`[ExcelParser] Row ${rowNum}: OK -> days=[${schedule.days}] time=${schedule.time}`);
  });

  return { jobs, errors };
}

module.exports = { parseExcel };
