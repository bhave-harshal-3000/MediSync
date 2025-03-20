require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/Cluster4", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected Successfully"))
.catch((err) => console.error("MongoDB Connection Error:", err));

// Twilio Setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to Send SMS to User
const sendSMSToUser = async (to, body) => {
    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_FROM_NUMBER,
            to: process.env.TO_NUMBER,
            body: body,
        });
        console.log("SMS Sent to User:", message.sid);
    } catch (error) {
        console.error("Error sending SMS to User:", error.message);
    }
};
const client2 = twilio(process.env.TWILIO_ACCOUNT_SID2, process.env.TWILIO_AUTH_TOKEN2);
// Function to Send SMS to Caregiver
const sendSMSToCaregiver = async (to, body) => {
    try {
        const message = await client2.messages.create({
            from: process.env.TWILIO_FROM_NUMBER2,
            to: process.env.TO_NUMBER2,
            body: body,
        });
        console.log("SMS Sent to Caregiver:", message.sid);
    } catch (error) {
        console.error("Error sending SMS to Caregiver:", error.message);
    }
};

// Store Scheduled Reminders
let scheduledReminders = [];

// API to Add Medication & Schedule Reminder
app.post("/add-medication", (req, res) => {
    const { medName, medTime, medQuantity, phoneNumber, caregiverNumber } = req.body;

    if (!medName || !medTime || !phoneNumber || !caregiverNumber) {
        return res.status(400).json({ message: "Missing required fields!" });
    }

    // Convert medTime (HH:MM) to cron format
    const [hours, minutes] = medTime.split(":");
    const cronTime = `${minutes} ${hours} * * *`;

    // Schedule Initial SMS to User
    const initialJob = cron.schedule(cronTime, () => {
        sendSMS(phoneNumber, `Hello! It's time to take your medication: ${medName} at ${medTime}`);
    }, { timezone: "Asia/Kolkata" });

    // Schedule Follow-up SMS to Caregiver after 30 minutes
    const followUpJob = cron.schedule(cronTime, () => {
        setTimeout(async () => {
            // Check if the medication was marked as taken (you can implement this logic in your frontend)
            // For now, assume it's not taken
            const message = `Alert: ${phoneNumber} has not taken their medication (${medName}) at ${medTime}. Please check on them.`;
            await sendSMS(caregiverNumber, message); // Send SMS to caregiver
        }, 2 * 60 * 1000); // 30 minutes delay
    }, { timezone: "Asia/Kolkata" });

    // Store the reminder jobs
    scheduledReminders.push({ medName, medTime, initialJob, followUpJob });

    res.json({ message: `Reminder set for ${medName} at ${medTime}!` });
});

// API to Mark Medication as Taken
app.post("/mark-taken", (req, res) => {
    const { medName, medTime, phoneNumber } = req.body;

    if (!medName || !medTime || !phoneNumber) {
        return res.status(400).json({ message: "Missing required fields!" });
    }

    // Find and cancel the follow-up job for this medication
    const reminderIndex = scheduledReminders.findIndex(
        (reminder) => reminder.medName === medName && reminder.medTime === medTime
    );

    if (reminderIndex !== -1) {
        const reminder = scheduledReminders[reminderIndex];
        reminder.followUpJob.stop(); // Stop the follow-up job
        scheduledReminders.splice(reminderIndex, 1); // Remove the reminder from the list
        console.log(`Follow-up reminder for ${medName} at ${medTime} canceled.`);
    }

    res.json({ message: `Medication ${medName} marked as taken!` });
});

// API to Fetch Nearby Pharmacies
app.get("/api/pharmacies", async (req, res) => {
    try {
        const { lat, lon } = req.query; // Get user location
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=pharmacy](around:5000,${lat},${lon});out;`;

        const response = await axios.get(overpassUrl);
        res.json(response.data.elements);
    } catch (error) {
        res.status(500).json({ error: "Error fetching pharmacies" });
    }
});

// Default Route
app.get("/", (req, res) => {
    res.send("Server is running");
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});