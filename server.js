const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Rajlakshmi@123",
  database: "job_detector"
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

// 🧠 Analyze Job API
app.post("/analyze-job", (req, res) => {
  const { description } = req.body;

  const text = description.toLowerCase();

  let score = 100;
  let reasons = [];

  // ❌ Money detection
  if (/\bpay\b|\bfee\b|\bregistration\b/.test(text)) {
    score -= 40;
    reasons.push("Asking for money");
  }

  // ❌ Free email domains
  if (/@gmail\.com|@yahoo\.com/.test(text)) {
    score -= 20;
    reasons.push("Free email domain used");
  }

  // ❌ WhatsApp / Telegram
  if (text.includes("whatsapp") || text.includes("telegram")) {
    score -= 15;
    reasons.push("Shifting to private messaging");
  }

  // ❌ Generic selection message
  if (text.includes("shortlisted") || text.includes("congratulations")) {
    score -= 5;
    reasons.push("Generic selection message");
  }

  // 🔥 Dynamic Domain Mismatch Detection
  const emailMatch = description.match(/@([a-zA-Z0-9.-]+)/);
  const emailDomain = emailMatch ? emailMatch[1] : "";

  const websiteMatch = description.match(/www\.([a-zA-Z0-9.-]+)/);
  const websiteDomain = websiteMatch ? websiteMatch[1] : "";

  if (emailDomain && websiteDomain && !websiteDomain.includes(emailDomain)) {
    score -= 30;
    reasons.push("Email domain does not match company website");
  }

  // ✅ Positive signals
  if (text.includes("linkedin")) {
    score += 5;
  }

  if (text.includes("www.")) {
    score += 5;
  }

  // Normalize score
  if (score > 100) score = 100;
  if (score < 0) score = 0;

 // 🎯 Final status
let status =
  score < 40 ? "Likely Fake" :
  score < 75 ? "Suspicious" :
  "Looks Safe";

// 🤖 AI additions
let confidence =
  score < 40 ? "High Risk" :
  score < 75 ? "Medium Risk" :
  "Low Risk";

let suggestions = [];

if (score < 50) {
  suggestions.push("Do not share personal details");
  suggestions.push("Avoid paying any fees");
}

if (score < 75) {
  suggestions.push("Verify company on LinkedIn");
}

// 💾 Save to DB
const sql = "INSERT INTO jobs (description, score, status) VALUES (?, ?, ?)";
//db.query(sql, [description, score, status]);

// ✅ Final response
res.json({ score, status, confidence, reasons, suggestions });
});

// 📜 Get History API
app.get("/history", (req, res) => {
  const sql = "SELECT * FROM jobs ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(result);
    }
  });
});

// 🚀 Start Server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});