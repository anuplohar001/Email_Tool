# Personal Email Scheduler Tool

A personal-use email scheduling tool that allows scheduled emails to be managed through an Excel file. Jobs are stored in MongoDB, managed through Prisma, and automatically processed by a timezone-aware cron scheduler.

The application provides a simple server-rendered dashboard for managing scheduled email jobs, uploading schedules, and editing the shared email template.

## Features

* Upload scheduled email jobs from `.xlsx` files
* Support multiple recipient email addresses per job
* Schedule emails by specific days and time
* Timezone-aware scheduling using **Asia/Kolkata (IST)**
* Automatic email delivery through Gmail SMTP
* Configurable maximum number of sends per job
* Prevent duplicate sends on the same day
* Pause, resume, and delete scheduled jobs
* Dashboard showing job status and sending history
* Shared email subject and body templates stored on disk
* Edit email templates directly through the web interface
* Dynamic `{{company}}` and `{{role}}` template placeholders
* Duplicate upload detection
* Validation and reporting for invalid Excel rows
* Per-job error handling so one failed email does not stop other scheduled jobs

---

## Tech Stack

### Backend

* Node.js
* Express.js
* Prisma ORM
* MongoDB

### Email

* Nodemailer
* Gmail SMTP
* Gmail App Password authentication

### Scheduling

* node-cron
* moment-timezone
* Asia/Kolkata (IST)

### Frontend

* EJS
* Server-rendered HTML
* Vanilla JavaScript
* CSS

### File Processing

* xlsx — Excel file parsing
* multer — Excel file uploads

### Configuration

* dotenv

---

## How It Works

The application follows a simple workflow:

```text
Excel File
    │
    ▼
Excel Upload
    │
    ▼
Excel Parser
    │
    ▼
Validation & Duplicate Check
    │
    ▼
MongoDB via Prisma
    │
    ▼
Scheduled Email Jobs
    │
    ▼
Cron runs every minute
    │
    ▼
Check IST day + time
    │
    ▼
Load Email Template
    │
    ▼
Replace {{company}} / {{role}}
    │
    ▼
Send through Gmail SMTP
    │
    ▼
Update Job Status & Send Count
```

The scheduler runs every minute and checks whether any active jobs are scheduled for the current day and time in IST.

---

## Excel Format

Scheduled jobs are imported from an `.xlsx` file.

The expected columns are:

| Column     | Description                                  |
| ---------- | -------------------------------------------- |
| `company`  | Company name                                 |
| `email`    | Recipient email address(es), comma-separated |
| `role`     | Job/position name                            |
| `schedule` | Days and time for sending                    |

### Example

| company          | email                                                                     | role               | schedule          |
| ---------------- | ------------------------------------------------------------------------- | ------------------ | ----------------- |
| ABC Technologies | [hr@abc.com](mailto:hr@abc.com),[careers@abc.com](mailto:careers@abc.com) | Software Developer | Mon,Wed,Fri 09:00 |
| XYZ Solutions    | [jobs@xyz.com](mailto:jobs@xyz.com)                                       | React Developer    | Tue,Thu 10:30     |

The schedule uses:

```text
Day1,Day2,Day3 HH:mm
```

For example:

```text
Mon,Wed,Fri 09:00
```

All schedules are interpreted using:

```text
Asia/Kolkata
```

regardless of the server's operating-system timezone.

---

## Email Scheduling

Each imported Excel row becomes an `EmailJob`.

A job contains:

* Company
* Recipient email addresses
* Role
* Scheduled days
* Scheduled time
* Timezone
* Maximum send count
* Current send count
* Last sent date
* Current status
* Last error, if any

By default, each job can be sent up to **3 times**.

Once the configured `maxSends` value is reached, the job automatically changes to:

```text
completed
```

### Job statuses

| Status      | Meaning                                  |
| ----------- | ---------------------------------------- |
| `active`    | Job is currently scheduled               |
| `paused`    | Job has been temporarily stopped         |
| `completed` | Maximum number of sends has been reached |
| `failed`    | The latest email attempt failed          |

---

## Scheduler

The scheduler runs once every minute using `node-cron`.

On every tick, it determines:

* Current day
* Current time
* Current date

using the `Asia/Kolkata` timezone.

It then looks for active jobs matching the current schedule.

A job is eligible to send when:

```text
status = active
current day exists in days
current time matches time
lastSentDate is not today's date
```

The `lastSentDate` check prevents the same job from being sent multiple times during the same scheduled minute/day.

After a successful send:

```text
sendCount
lastSentDate
status
```

are updated accordingly.

If a send fails, the job is marked as `failed` and the error is stored in `lastError`. The scheduler continues processing other jobs.

---

## Email Templates

Email templates are stored as files rather than in MongoDB.

```text
templates/
├── subject.txt
└── body.html
```

The template supports the following placeholders:

```text
{{company}}
{{role}}
```

For example:

```html
Hello,

I am interested in the {{role}} opportunity at {{company}}.

Regards,
Anup
```

The template files are read when an email is sent, so changes made to the files are picked up without restarting the server.

The templates can also be viewed and edited from:

```text
/template
```

---

## Gmail SMTP

Email delivery is handled through Nodemailer using Gmail SMTP.

The application uses:

```text
EMAIL_USER
EMAIL_APP_PASSWORD
```

from environment variables.

Credentials are not stored in the source code.

Emails sent through Gmail SMTP naturally appear in the Gmail account's **Sent** folder.

---

## Dashboard

The main dashboard is available at:

```text
/
```

It displays all scheduled jobs along with information such as:

* Company
* Role
* Recipient emails
* Scheduled days
* Scheduled time
* Send count
* Maximum sends
* Status
* Last sent date

Available actions include:

* Pause
* Resume
* Delete

---

## Application Pages

### Dashboard

```text
/
```

Displays and manages all scheduled email jobs.

### Excel Upload

```text
/upload
```

Used to upload `.xlsx` files containing scheduled jobs.

### Email Template

```text
/template
```

Used to view and edit the shared email subject and body templates.

---

## Database

MongoDB is accessed through Prisma.

The main database model is:

```prisma
model EmailJob {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  company      String
  emails       String[]
  role         String
  days         String[]
  time         String
  timezone     String   @default("Asia/Kolkata")
  maxSends     Int      @default(3)
  sendCount    Int      @default(0)
  lastSentDate String?
  status       String   @default("active")
  lastError    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Important fields

`days`

Stores the scheduled days:

```text
["Mon", "Wed", "Fri"]
```

`time`

Stores the scheduled time in 24-hour format:

```text
09:00
```

`lastSentDate`

Stores the date of the last successful send:

```text
YYYY-MM-DD
```

This is used to prevent duplicate sends.

---

## Project Structure

```text
/
├── prisma/
│   └── schema.prisma
│
├── templates/
│   ├── subject.txt
│   └── body.html
│
├── src/
│   ├── routes/
│   │   ├── upload.js
│   │   ├── jobs.js
│   │   └── template.js
│   │
│   ├── services/
│   │   ├── excelParser.js
│   │   ├── templateLoader.js
│   │   ├── mailer.js
│   │   └── scheduler.js
│   │
│   ├── views/
│   │   ├── dashboard.ejs
│   │   ├── upload.ejs
│   │   └── template.ejs
│   │
│   ├── app.js
│   └── server.js
│
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file containing the application's configuration:

```env
DATABASE_URL="mongodb+srv://..."
EMAIL_USER="you@gmail.com"
EMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
PORT=3000
```

### Variables

| Variable             | Description                    |
| -------------------- | ------------------------------ |
| `DATABASE_URL`       | MongoDB connection string      |
| `EMAIL_USER`         | Gmail account used for sending |
| `EMAIL_APP_PASSWORD` | Gmail App Password             |
| `PORT`               | Express server port            |

Credentials should remain in `.env` and should not be committed to source control.

---

## Running the Project

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Synchronize the Prisma schema with MongoDB:

```bash
npx prisma db push
```

Start the application:

```bash
npm start
```

The application then runs on the configured port, for example:

```text
http://localhost:3000
```

---

## Duplicate Upload Handling

The application checks for duplicate scheduled jobs when processing an Excel upload.

A duplicate is identified using the relevant combination of:

```text
company + email + schedule
```

Duplicate records are not silently created again. The upload process reports skipped rows so the user can understand what happened during the import.

---

## Excel Validation

Invalid rows are handled individually rather than causing the entire upload to fail.

Examples of invalid data include:

* Missing company
* Missing email
* Invalid email values
* Missing role
* Malformed schedule
* Invalid day abbreviations
* Invalid time format

Valid rows can still be imported while invalid rows are reported to the user.

Excel schedule values are also handled carefully so that Excel date/time serial values do not unintentionally replace the expected schedule string.

---

## Error Handling

Email sending is isolated per job.

If one scheduled email fails:

```text
Job A → Failed
Job B → Still processed
Job C → Still processed
```

The failed job stores its error in:

```text
lastError
```

and changes its status to:

```text
failed
```

The scheduler itself continues running.

---

## Timezone Handling

Scheduling is explicitly based on:

```text
Asia/Kolkata
```

The application does not depend on the server's local timezone.

For example, even if the server is running with a UTC timezone, a schedule such as:

```text
Mon,Wed,Fri 09:00
```

is evaluated as:

```text
09:00 IST
```

This makes the scheduler suitable for deployment on servers whose system timezone is different from India.

---

## Typical Usage

1. Prepare an Excel file containing company, email, role, and schedule information.
2. Open the upload page.
3. Upload the `.xlsx` file.
4. Valid rows are stored as scheduled email jobs.
5. Review the jobs from the dashboard.
6. Edit the shared email template if required.
7. Leave the application/server running.
8. The scheduler checks for matching jobs every minute.
9. Matching jobs are sent automatically through Gmail.
10. Send counts and job status are updated after each successful attempt.
11. Jobs are marked `completed` after reaching their maximum send count.

---

## Intended Use

This is a **personal/internal email scheduling tool** rather than a multi-user email marketing platform.

It is designed for a lightweight workflow where scheduled email jobs can be maintained through Excel and automatically sent according to predefined schedules.

The application intentionally uses a simple server-rendered EJS interface without a separate frontend build or React application.
