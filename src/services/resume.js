const fs = require("fs");
const path = require("path");

const RESUME_PATH = path.join(__dirname, "..", "..", "Anup_Lohar.pdf");
const RESUME_FILENAME = path.basename(RESUME_PATH);

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getResumeInfo() {
  try {
    const stat = fs.statSync(RESUME_PATH);
    return {
      exists: true,
      filename: RESUME_FILENAME,
      size: formatSize(stat.size),
      updatedAt: stat.mtime.toLocaleString(),
    };
  } catch (err) {
    return { exists: false, filename: RESUME_FILENAME, size: null, updatedAt: null };
  }
}

function saveResume(buffer) {
  fs.writeFileSync(RESUME_PATH, buffer);
}

module.exports = { RESUME_PATH, RESUME_FILENAME, getResumeInfo, saveResume };
