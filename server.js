// server.ts
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config();
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json());
var fallbackBookings = [];
var pool = null;
if (process.env.DATABASE_URL) {
  console.log("Connecting to PostgreSQL database...");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });
  pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(255) PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(255) NOT NULL,
      service_name VARCHAR(255) NOT NULL,
      service_price NUMERIC NOT NULL,
      stylist_name VARCHAR(255) NOT NULL,
      stylist_role VARCHAR(255) NOT NULL,
      date_str VARCHAR(255) NOT NULL,
      time_slot VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).then(() => {
    console.log('PostgreSQL "bookings" table initialized successfully.');
  }).catch((err) => {
    console.error("Failed to initialize PostgreSQL table, falling back to memory:", err);
    pool = null;
  });
} else {
  console.warn("DATABASE_URL environment variable is missing. Running with in-memory fallback.");
}
var sendToZapier = async (booking) => {
  const zapierUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!zapierUrl) {
    console.log("ZAPIER_WEBHOOK_URL is not set. Skipping Zapier dispatch.");
    return;
  }
  try {
    console.log(`Sending booking details for ${booking.customerName} to Zapier...`);
    const response = await fetch(zapierUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event: "booking_created",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: booking
      })
    });
    if (response.ok) {
      console.log("Zapier webhook executed successfully.");
    } else {
      console.error(`Zapier webhook returned status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to dispatch booking to Zapier webhook:", error);
  }
};
var sendEmailNotification = async (booking) => {
  const resendApiKey = process.env.RESEND_API_KEY || "re_GoVseCMG_DWz7C7xou5EdYjGB8NtVaUrq";
  if (!resendApiKey) {
    console.log("RESEND_API_KEY is not set. Skipping email notification.");
    return;
  }
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #efe8e6; border-radius: 12px; background-color: #faf8f6;">
      <h2 style="color: #80140b; font-family: serif; border-bottom: 2px solid #80140b; padding-bottom: 10px; margin-top: 0;">New Booking Confirmed!</h2>
      <p style="font-size: 14px; color: #1c1a19;">A new appointment has been scheduled and booked successfully.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr style="background-color: #ffffff; border-bottom: 1px solid #efe8e6;">
          <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #5c5a59; text-transform: uppercase;">Customer Name</td>
          <td style="padding: 10px; font-size: 14px; color: #1c1a19; text-align: right;">${booking.customerName}</td>
        </tr>
        <tr style="background-color: #ffffff; border-bottom: 1px solid #efe8e6;">
          <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #5c5a59; text-transform: uppercase;">Customer Phone</td>
          <td style="padding: 10px; font-size: 14px; color: #1c1a19; text-align: right;"><a href="tel:${booking.customerPhone}" style="color: #80140b; text-decoration: none;">${booking.customerPhone}</a></td>
        </tr>
        <tr style="background-color: #ffffff; border-bottom: 1px solid #efe8e6;">
          <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #5c5a59; text-transform: uppercase;">Service</td>
          <td style="padding: 10px; font-size: 14px; color: #1c1a19; text-align: right;">${booking.serviceName} ($${booking.servicePrice})</td>
        </tr>
        <tr style="background-color: #ffffff; border-bottom: 1px solid #efe8e6;">
          <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #5c5a59; text-transform: uppercase;">Stylist</td>
          <td style="padding: 10px; font-size: 14px; color: #1c1a19; text-align: right;">${booking.stylistName} (${booking.stylistRole})</td>
        </tr>
        <tr style="background-color: #ffffff; border-bottom: 1px solid #efe8e6;">
          <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #5c5a59; text-transform: uppercase;">Date & Time</td>
          <td style="padding: 10px; font-size: 14px; color: #1c1a19; text-align: right;"><strong>${booking.dateStr} @ ${booking.timeSlot}</strong></td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #7d7977;">
        <p>\xA9 Hair 2000. All rights reserved.</p>
      </div>
    </div>
  `;
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Hair 2000 <onboarding@resend.dev>";
    const toEmails = fromEmail.includes("onboarding@resend.dev") ? ["nayem.adsmanager@gmail.com"] : ["admin@velociholdings.com", "nayem.adsmanager@gmail.com"];
    console.log(`Sending booking notification email to Resend... (From: ${fromEmail}, To: ${toEmails.join(", ")})`);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmails,
        subject: `New Booking: ${booking.customerName} - ${booking.serviceName}`,
        html: emailHtml
      })
    });
    if (response.ok) {
      console.log("Resend email notification dispatched successfully.");
    } else {
      const errData = await response.json();
      console.error("Resend email failed:", errData);
    }
  } catch (error) {
    console.error("Failed to send Resend email:", error);
  }
};
function getLAMilliseconds(dateStr, isEnd) {
  try {
    const timePart = isEnd ? "23:59:59" : "00:00:00";
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const partMap = {};
    parts.forEach((p) => {
      partMap[p.type] = p.value;
    });
    const laYear = parseInt(partMap.year);
    const laMonth = parseInt(partMap.month) - 1;
    const laDay = parseInt(partMap.day);
    const laHour = parseInt(partMap.hour);
    const laMinute = parseInt(partMap.minute);
    const laSecond = parseInt(partMap.second);
    const laUTCDate = new Date(Date.UTC(laYear, laMonth, laDay, laHour, laMinute, laSecond));
    const offset = date.getTime() - laUTCDate.getTime();
    return date.getTime() + offset;
  } catch (error) {
    console.error("Error in getLAMilliseconds helper, falling back to standard PDT offset:", error);
    const timePart = isEnd ? "23:59:59" : "00:00:00";
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    const dateUTC = Date.UTC(year, month - 1, day, hour, minute, second);
    return dateUTC + 7 * 60 * 60 * 1e3;
  }
}
app.get("/api/ghl/free-slots", async (req, res) => {
  const { calendarId, startDate, endDate, userId } = req.query;
  if (!calendarId || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required query parameters calendarId, startDate, or endDate." });
  }
  let startMs;
  let endMs;
  if (typeof startDate === "string" && startDate.includes("-")) {
    startMs = getLAMilliseconds(startDate, false);
  } else {
    startMs = Number(startDate);
  }
  if (typeof endDate === "string" && endDate.includes("-")) {
    endMs = getLAMilliseconds(endDate, true);
  } else {
    endMs = Number(endDate);
  }
  if (isNaN(startMs)) startMs = Number(startDate);
  if (isNaN(endMs)) endMs = Number(endDate);
  console.log(`[GHL Slots Request] calendarId: ${calendarId}, userId: ${userId || "none"}`);
  console.log(`[GHL Slots Request] Raw inputs -> startDate: ${startDate}, endDate: ${endDate}`);
  console.log(`[GHL Slots Request] Converted timestamps -> startDate: ${startMs} (${new Date(startMs).toISOString()}), endDate: ${endMs} (${new Date(endMs).toISOString()})`);
  const token = process.env.GHL_TOKEN || "pit-222fd3b0-718a-490f-ba7d-2594c1b7396c";
  let url = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${startMs}&endDate=${endMs}&timezone=America/Los_Angeles`;
  if (userId) {
    url += `&userId=${userId}`;
  }
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Version": "2021-07-28",
        "Accept": "application/json"
      }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error fetching GHL slots:", error);
    return res.status(500).json({ error: "Failed to fetch free slots from GoHighLevel." });
  }
});
app.post("/api/ghl/bookings", async (req, res) => {
  const {
    calendarId,
    startTime,
    customerName,
    customerPhone,
    userId,
    serviceName,
    servicePrice,
    stylistName,
    stylistRole,
    dateStr,
    timeSlot
  } = req.body;
  if (!calendarId || !startTime || !customerName || !customerPhone) {
    return res.status(400).json({ error: "Missing required booking details." });
  }
  const token = process.env.GHL_TOKEN || "pit-222fd3b0-718a-490f-ba7d-2594c1b7396c";
  const locationId = "BzlIzxBih6N3hAKXGiVi";
  try {
    console.log(`Upserting GHL contact for: ${customerName} (${customerPhone})`);
    const contactRes = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        locationId,
        firstName: customerName,
        phone: customerPhone
      })
    });
    if (!contactRes.ok) {
      const errorData = await contactRes.json();
      console.error("Failed to upsert GHL contact:", errorData);
      return res.status(contactRes.status).json({ error: "Failed to upsert GoHighLevel contact.", details: errorData });
    }
    const contactData = await contactRes.json();
    const contactId = contactData.contact.id;
    console.log(`Successfully upserted GHL contact. ID: ${contactId}`);
    console.log(`Booking GHL appointment on calendar ${calendarId} for contact ${contactId} at ${startTime}`);
    const appointmentRes = await fetch("https://services.leadconnectorhq.com/calendars/events/appointments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        calendarId,
        locationId,
        contactId,
        startTime,
        selectedTimezone: "America/Los_Angeles",
        assignedUserId: userId || void 0
      })
    });
    if (!appointmentRes.ok) {
      const errorData = await appointmentRes.json();
      console.error("Failed to book GHL appointment:", errorData);
      return res.status(appointmentRes.status).json({ error: "Failed to book GoHighLevel appointment.", details: errorData });
    }
    const appointmentData = await appointmentRes.json();
    console.log(`Successfully booked GHL appointment. ID: ${appointmentData.id}`);
    const localId = appointmentData.id || Math.random().toString(36).substring(2, 11);
    const newBooking = {
      id: localId,
      customerName,
      customerPhone,
      serviceName: serviceName || "Hair Treatment",
      servicePrice: Number(servicePrice) || 0,
      stylistName: stylistName || "First Available",
      stylistRole: stylistRole || "Hair Expert",
      dateStr: dateStr || new Date(startTime).toLocaleDateString(),
      timeSlot: timeSlot || new Date(startTime).toLocaleTimeString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (pool) {
      await pool.query(
        `INSERT INTO bookings 
         (id, customer_name, customer_phone, service_name, service_price, stylist_name, stylist_role, date_str, time_slot, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newBooking.id,
          newBooking.customerName,
          newBooking.customerPhone,
          newBooking.serviceName,
          newBooking.servicePrice,
          newBooking.stylistName,
          newBooking.stylistRole,
          newBooking.dateStr,
          newBooking.timeSlot,
          newBooking.createdAt
        ]
      );
      console.log(`Booking ${newBooking.id} saved to PostgreSQL.`);
    } else {
      fallbackBookings = [newBooking, ...fallbackBookings];
      console.log(`Booking ${newBooking.id} saved to memory.`);
    }
    sendToZapier(newBooking);
    sendEmailNotification(newBooking);
    return res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error in GHL booking execution flow:", error);
    return res.status(500).json({ error: "GHL booking execution flow failed." });
  }
});
app.get("/api/bookings", async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
      const formatted = result.rows.map((row) => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        serviceName: row.service_name,
        servicePrice: Number(row.service_price),
        stylistName: row.stylist_name,
        stylistRole: row.stylist_role,
        dateStr: row.date_str,
        timeSlot: row.time_slot,
        createdAt: row.created_at
      }));
      return res.json(formatted);
    } else {
      return res.json(fallbackBookings);
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to retrieve bookings" });
  }
});
app.post("/api/bookings", async (req, res) => {
  const {
    id,
    customerName,
    customerPhone,
    serviceName,
    servicePrice,
    stylistName,
    stylistRole,
    dateStr,
    timeSlot
  } = req.body;
  if (!customerName || !customerPhone || !serviceName || !stylistName || !dateStr || !timeSlot) {
    return res.status(400).json({ error: "Missing required booking details." });
  }
  const newBooking = {
    id: id || Math.random().toString(36).substring(2, 11),
    customerName,
    customerPhone,
    serviceName,
    servicePrice: Number(servicePrice) || 0,
    stylistName,
    stylistRole,
    dateStr,
    timeSlot,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    if (pool) {
      await pool.query(
        `INSERT INTO bookings 
         (id, customer_name, customer_phone, service_name, service_price, stylist_name, stylist_role, date_str, time_slot, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newBooking.id,
          newBooking.customerName,
          newBooking.customerPhone,
          newBooking.serviceName,
          newBooking.servicePrice,
          newBooking.stylistName,
          newBooking.stylistRole,
          newBooking.dateStr,
          newBooking.timeSlot,
          newBooking.createdAt
        ]
      );
      console.log(`Booking ${newBooking.id} saved to PostgreSQL.`);
    } else {
      fallbackBookings = [newBooking, ...fallbackBookings];
      console.log(`Booking ${newBooking.id} saved to memory.`);
    }
    sendToZapier(newBooking);
    sendEmailNotification(newBooking);
    return res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to save booking" });
  }
});
app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (pool) {
      const result = await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
      if ((result.rowCount ?? 0) > 0) {
        console.log(`Booking ${id} deleted from PostgreSQL.`);
        return res.json({ success: true, message: "Booking deleted successfully." });
      } else {
        return res.status(404).json({ error: "Booking not found." });
      }
    } else {
      const originalLen = fallbackBookings.length;
      fallbackBookings = fallbackBookings.filter((b) => b.id !== id);
      if (fallbackBookings.length < originalLen) {
        console.log(`Booking ${id} deleted from memory.`);
        return res.json({ success: true, message: "Booking deleted successfully." });
      } else {
        return res.status(404).json({ error: "Booking not found." });
      }
    }
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});
var distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("/thank-you", (req, res) => {
  res.sendFile(path.join(distPath, "thank-you.html"));
});
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
