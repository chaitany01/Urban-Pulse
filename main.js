// server.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 5000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("uploads"));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/urban_pulse", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

// Report Schema
const reportSchema = new mongoose.Schema({
  city: String,
  address: String,
  description: String,
  imageUrl: String,
  date: { type: Date, default: Date.now }
});
const Report = mongoose.model("Report", reportSchema);

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// POST: Upload report
app.post("/report", upload.single("image"), async (req, res) => {
  try {
    const { city, address, description } = req.body;
    const imageUrl = req.file ? `http://localhost:${PORT}/${req.file.filename}` : "";

    const newReport = new Report({ city, address, description, imageUrl });
    await newReport.save();

    // Email municipality (Dummy Example)
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    let mailOptions = {
      from: process.env.EMAIL,
      to: "municipality@example.com", // Change later
      subject: `Urban Pulse Report - ${city}`,
      text: `Address: ${address}\nDescription: ${description}\nImage: ${imageUrl}`
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Report submitted & email sent!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error submitting report" });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
