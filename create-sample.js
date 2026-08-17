const XLSX = require("xlsx");

const data = [
  { company: "Google", email: "hr@google.com,recruiter@google.com", role: "Software Engineer", schedule: "Mon,Wed,Fri 09:00" },
  { company: "Amazon", email: "jobs@amazon.com", role: "DevOps Engineer", schedule: "Tue,Thu 10:30" },
  { company: "Microsoft", email: "hiring@microsoft.com", role: "Frontend Developer", schedule: "Mon 09:00" },
  { company: "Meta", email: "talent@meta.com,recruiting@meta.com", role: "Backend Engineer", schedule: "Wed,Fri 14:00" },
  { company: "Netflix", email: "jobs@netflix.com", role: "Data Scientist", schedule: "Mon,Tue,Wed,Thu,Fri 10:00" },
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Jobs");
XLSX.writeFile(wb, "sample.xlsx");

console.log("Created sample.xlsx");
