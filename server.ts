import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory fallback database
let fallbackBookings: any[] = [];

// Initialize PostgreSQL Pool if DATABASE_URL is available
let pool: Pool | null = null;
if (process.env.DATABASE_URL) {
  console.log('Connecting to PostgreSQL database...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Ensure bookings table exists
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
      lead_source VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).then(() => {
    console.log('PostgreSQL "bookings" table initialized successfully.');
  }).catch((err) => {
    console.error('Failed to initialize PostgreSQL table, falling back to memory:', err);
    pool = null;
  });
} else {
  console.warn('DATABASE_URL environment variable is missing. Running with in-memory fallback.');
}

// Zapier Webhook Helper
const sendToZapier = async (booking: any) => {
  const zapierUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!zapierUrl) {
    console.log('ZAPIER_WEBHOOK_URL is not set. Skipping Zapier dispatch.');
    return;
  }

  try {
    console.log(`Sending booking details for ${booking.customerName} to Zapier...`);
    const response = await fetch(zapierUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'booking_created',
        timestamp: new Date().toISOString(),
        data: booking
      }),
    });

    if (response.ok) {
      console.log('Zapier webhook executed successfully.');
    } else {
      console.error(`Zapier webhook returned status code: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to dispatch booking to Zapier webhook:', error);
  }
};

// Resend Email Notification Helper
const sendEmailNotification = async (booking: any) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log('RESEND_API_KEY is not set. Skipping email notification.');
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
        <tr style="background-color: #ffffff; border-bottom: 1px solid #efe8e6;">
          <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #5c5a59; text-transform: uppercase;">Lead Source</td>
          <td style="padding: 10px; font-size: 14px; color: #1c1a19; text-align: right;">${booking.leadSource || 'N/A'}</td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #7d7977;">
        <p>© Hair 2000. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    console.log(`Sending booking notification email to Resend...`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hair 2000 <onboarding@resend.dev>',
        to: ['admin@velociholdings.com', 'nayem.adsmanager@gmail.com'],
        subject: `New Booking: ${booking.customerName} - ${booking.serviceName}`,
        html: emailHtml,
      }),
    });

    if (response.ok) {
      console.log('Resend email notification dispatched successfully.');
    } else {
      const errData = await response.json();
      console.error('Resend email failed:', errData);
    }
  } catch (error) {
    console.error('Failed to send Resend email:', error);
  }
};

// --- API ROUTES ---

// GET: Fetch free slots from GoHighLevel calendar
app.get('/api/ghl/free-slots', async (req, res) => {
  const { calendarId, startDate, endDate, userId } = req.query;

  if (!calendarId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required query parameters calendarId, startDate, or endDate.' });
  }

  const token = process.env.GHL_TOKEN || 'pit-222fd3b0-718a-490f-ba7d-2594c1b7396c';
  let url = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}`;
  if (userId) {
    url += `&userId=${userId}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error fetching GHL slots:', error);
    return res.status(500).json({ error: 'Failed to fetch free slots from GoHighLevel.' });
  }
});

// POST: Book an appointment by upserting contact and creating appointment in GHL
app.post('/api/ghl/bookings', async (req, res) => {
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
    timeSlot,
    leadSource
  } = req.body;

  if (!calendarId || !startTime || !customerName || !customerPhone) {
    return res.status(400).json({ error: 'Missing required booking details.' });
  }

  const token = process.env.GHL_TOKEN || 'pit-222fd3b0-718a-490f-ba7d-2594c1b7396c';
  const locationId = 'BzlIzxBih6N3hAKXGiVi';

  try {
    // Step 1: Upsert Contact
    console.log(`Upserting GHL contact for: ${customerName} (${customerPhone})`);
    const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        locationId,
        firstName: customerName,
        phone: customerPhone
      })
    });

    if (!contactRes.ok) {
      const errorData = await contactRes.json();
      console.error('Failed to upsert GHL contact:', errorData);
      return res.status(contactRes.status).json({ error: 'Failed to upsert GoHighLevel contact.', details: errorData });
    }

    const contactData = await contactRes.json();
    const contactId = contactData.contact.id;
    console.log(`Successfully upserted GHL contact. ID: ${contactId}`);

    // Step 2: Create Appointment
    console.log(`Booking GHL appointment on calendar ${calendarId} for contact ${contactId} at ${startTime}`);
    const appointmentRes = await fetch('https://services.leadconnectorhq.com/calendars/events/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        calendarId,
        locationId,
        contactId,
        startTime,
        selectedTimezone: 'America/Los_Angeles',
        assignedUserId: userId || undefined
      })
    });

    if (!appointmentRes.ok) {
      const errorData = await appointmentRes.json();
      console.error('Failed to book GHL appointment:', errorData);
      return res.status(appointmentRes.status).json({ error: 'Failed to book GoHighLevel appointment.', details: errorData });
    }

    const appointmentData = await appointmentRes.json();
    console.log(`Successfully booked GHL appointment. ID: ${appointmentData.id}`);

    // Step 3: Save to local PostgreSQL database/memory cache and send to Zapier
    const localId = appointmentData.id || Math.random().toString(36).substring(2, 11);
    const newBooking = {
      id: localId,
      customerName,
      customerPhone,
      serviceName: serviceName || 'Hair Treatment',
      servicePrice: Number(servicePrice) || 0,
      stylistName: stylistName || 'First Available',
      stylistRole: stylistRole || 'Hair Expert',
      dateStr: dateStr || new Date(startTime).toLocaleDateString(),
      timeSlot: timeSlot || new Date(startTime).toLocaleTimeString(),
      leadSource: leadSource || '',
      createdAt: new Date().toISOString(),
    };

    if (pool) {
      await pool.query(
        `INSERT INTO bookings \n         (id, customer_name, customer_phone, service_name, service_price, stylist_name, stylist_role, date_str, time_slot, lead_source, created_at)\n         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
          newBooking.leadSource,
          newBooking.createdAt
        ]
      );
      console.log(`Booking ${newBooking.id} saved to PostgreSQL.`);
    } else {
      fallbackBookings = [newBooking, ...fallbackBookings];
      console.log(`Booking ${newBooking.id} saved to memory.`);
    }

    // Trigger Zapier Webhook and Resend Email notification asynchronously
    sendToZapier(newBooking);
    sendEmailNotification(newBooking);

    return res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error in GHL booking execution flow:', error);
    return res.status(500).json({ error: 'GHL booking execution flow failed.' });
  }
});

// GET: Retrieve all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
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
        leadSource: row.lead_source || '',
        createdAt: row.created_at
      }));
      return res.json(formatted);
    } else {
      return res.json(fallbackBookings);
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

// POST: Create a new booking
app.post('/api/bookings', async (req, res) => {
  const {
    id,
    customerName,
    customerPhone,
    serviceName,
    servicePrice,
    stylistName,
    stylistRole,
    dateStr,
    timeSlot,
    leadSource,
  } = req.body;

  if (!customerName || !customerPhone || !serviceName || !stylistName || !dateStr || !timeSlot) {
    return res.status(400).json({ error: 'Missing required booking details.' });
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
    leadSource: leadSource || '',
    createdAt: new Date().toISOString(),
  };

  try {
    if (pool) {
      await pool.query(
        `INSERT INTO bookings \n         (id, customer_name, customer_phone, service_name, service_price, stylist_name, stylist_role, date_str, time_slot, lead_source, created_at)\n         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
          newBooking.leadSource,
          newBooking.createdAt
        ]
      );
      console.log(`Booking ${newBooking.id} saved to PostgreSQL.`);
    } else {
      fallbackBookings = [newBooking, ...fallbackBookings];
      console.log(`Booking ${newBooking.id} saved to memory.`);
    }

    // Trigger Zapier Webhook and Resend Email notification asynchronously
    sendToZapier(newBooking);
    sendEmailNotification(newBooking);

    return res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// DELETE: Cancel a booking
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (pool) {
      const result = await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
      if ((result.rowCount ?? 0) > 0) {
        console.log(`Booking ${id} deleted from PostgreSQL.`);
        return res.json({ success: true, message: 'Booking deleted successfully.' });
      } else {
        return res.status(404).json({ error: 'Booking not found.' });
      }
    } else {
      const originalLen = fallbackBookings.length;
      fallbackBookings = fallbackBookings.filter((b) => b.id !== id);
      if (fallbackBookings.length < originalLen) {
        console.log(`Booking ${id} deleted from memory.`);
        return res.json({ success: true, message: 'Booking deleted successfully.' });
      } else {
        return res.status(404).json({ error: 'Booking not found.' });
      }
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Serve static assets from the compiled React Vite app
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Route to serve thank-you.html directly
app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(distPath, 'thank-you.html'));
});

// Fallback all routes to Index.html for SPA support
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
