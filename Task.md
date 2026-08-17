# Build Prompt: Personal Email Scheduler Tool

Copy everything below into your coding agent.

---

## Project overview

Build a **personal-use email scheduling tool** with the following stack:

- **Backend**: Node.js + Express
- **Database**: MongoDB, accessed via **Prisma** (Prisma's Mongo connector)
- **Email sending**: Nodemailer via Gmail SMTP (App Password auth)
- **Scheduling**: `node-cron` + `moment-timezone`, timezone-aware (Asia/Kolkata / IST)
- **Frontend**: Plain server-rendered HTML (EJS templates), no React/build step — just Express serving views and static JS/CSS. Keep it in the same repo/server, no separate frontend project.
- **Excel parsing**: `xlsx` package for `.xlsx` upload handling (`multer` for file upload)
- **Email template**: stored as a **file on disk** (not in MongoDB) so it can be hand-edited directly on the server. Support `{{company}}` and `{{role}}` placeholders.

---

## Functional requirements

### 1. Excel upload
- A page with a file upload form (`multipart/form-data`) accepting `.xlsx`.
- Expected columns in the sheet: `company`, `email` (comma-separated if multiple), `role`, `schedule`.
- The `schedule` column format: `"Mon,Wed,Fri 09:00"` — comma-separated day abbreviations + 24hr time, always interpreted as **IST (Asia/Kolkata)**.
- On upload: parse each row into a job document (see schema below) and bulk-insert into MongoDB via Prisma. Skip/report rows with missing company, email, or malformed schedule instead of crashing the whole upload.
- After parsing, redirect to a dashboard listing all jobs with status.

### 2. Data model (Prisma schema, MongoDB provider)

```prisma
model EmailJob {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  company       String
  emails        String[]
  role          String

  days          String[] // e.g. ["Mon", "Wed", "Fri"]
  time          String   // "09:00" 24hr IST
  timezone      String   @default("Asia/Kolkata")

  maxSends      Int      @default(3)
  sendCount     Int      @default(0)
  lastSentDate  String?  // "YYYY-MM-DD", guards against double-send same day

  status        String   @default("active") // active | completed | failed | paused
  lastError     String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3. Email template (file-based, not DB)
- Store the template at something like `/templates/default.html` (or `.txt`), with a plain-text or simple-HTML body containing `{{company}}` and `{{role}}` placeholders, plus a separate first line or small header comment for the subject — OR split into `subject.txt` and `body.html` for simplicity. Pick the split-file approach: `/templates/subject.txt` and `/templates/body.html`.
- Build a small template-loading utility that reads these files fresh on every send (don't cache in memory) so edits on disk take effect immediately without a server restart.
- Provide a simple HTML page (`/template`) that displays the current subject/body in a `<textarea>` for reference and lets the user **save edits back to the same files** via a form POST — still file-based, just editable through the UI too, not just by hand.

### 4. Scheduler (cron)
- Run a `node-cron` job every minute.
- On each tick, compute current day (`ddd` format, e.g. "Mon") and time (`HH:mm`) **in Asia/Kolkata**, using `moment-timezone`.
- Query for `EmailJob`s where:
  - `status = "active"`
  - `days` array contains today's day abbreviation
  - `time` equals current `HH:mm`
  - `lastSentDate` is not today's date (prevents double sends)
- For each matching job: load the template, substitute `{{company}}` and `{{role}}`, send via Nodemailer to all addresses in `emails`, then update `sendCount`, `lastSentDate`, and flip `status` to `"completed"` once `sendCount >= maxSends`. On send failure, set `status = "failed"` and store `lastError`, but don't crash the loop — continue to the next job.
- Wrap the whole per-job send in try/catch so one failure doesn't block others in the same tick.

### 5. Nodemailer setup
- Use Gmail SMTP with `EMAIL_USER` and `EMAIL_APP_PASSWORD` from environment variables (`.env`, loaded via `dotenv`). Never hardcode credentials.
- Because this goes through Gmail SMTP, sent emails will naturally appear in the Gmail account's own **Sent** folder — no extra logging needed for that.

### 6. Dashboard UI (EJS, server-rendered, minimal styling)
- `/` — table of all jobs: company, role, emails, schedule (days + time), sendCount/maxSends, status, lastSentDate. Include simple action buttons: **Pause**, **Resume**, **Delete** per row (just status/record updates, no page reload needed if you want to add a little vanilla JS + fetch, otherwise plain form posts are fine).
- `/upload` — the Excel upload form.
- `/template` — view/edit the on-disk template.
- Keep styling minimal (basic CSS file is fine) — this is a personal internal tool, not a polished product.

### 7. Project structure (suggested)

```
/prisma
  schema.prisma
/templates
  subject.txt
  body.html
/src
  /routes
    upload.js
    jobs.js
    template.js
  /services
    excelParser.js
    templateLoader.js
    mailer.js
    scheduler.js
  /views
    dashboard.ejs
    upload.ejs
    template.ejs
  app.js
  server.js
.env.example
package.json
```

### 8. Environment variables (`.env.example`)

```
DATABASE_URL="mongodb+srv://..."
EMAIL_USER="you@gmail.com"
EMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
PORT=3000
```

### 9. Edge cases to handle
- Excel dates/cells: make sure `schedule` is read as a plain string, not misinterpreted as an Excel serial date/time value.
- Duplicate uploads: if the same company+email+schedule combination is uploaded twice, either skip duplicates or let the user know how many were skipped — don't silently double-create jobs.
- Empty/malformed `email` cells: skip the row and report it back on the upload result page rather than failing the whole batch.
- Cron correctness: explicitly test that the day/time comparison uses IST regardless of the server's own OS timezone (assume the server could be UTC).

---

## Deliverable

A working Express app, runnable locally with:
```
npm install
npx prisma generate
npx prisma db push
npm start
```
...that lets me upload an Excel sheet, see scheduled jobs on a dashboard, edit the shared email template on disk (via UI or directly on disk), and have emails automatically sent Mon/Wed/Fri at 9am IST (or whatever schedule the sheet specifies) until each job's `maxSends` is reached.