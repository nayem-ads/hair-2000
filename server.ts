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

// --- API ROUTES ---

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
    createdAt: new Date().toISOString(),
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

    // Trigger Zapier Webhook asynchronously
    sendToZapier(newBooking);

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

// Fallback all routes to Index.html for SPA support
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
