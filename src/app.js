const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", require("./routes/jobs"));
app.use("/upload", require("./routes/upload"));
app.use("/template", require("./routes/template"));

module.exports = app;
