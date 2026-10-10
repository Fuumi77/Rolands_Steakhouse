require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

db.query('SELECT 1').then(async () => {
    console.log('✅ Connected to Hostinger MySQL Database!');
    await db.query("ALTER TABLE reservation_log MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN booked_by VARCHAR(50) DEFAULT 'online'").catch(()=>{});
    
    // 👉 FIX: Automatically add the missing columns to your database so it can remember foods and payments!
    await db.query("ALTER TABLE reservation_log ADD COLUMN reservation_type VARCHAR(50) DEFAULT 'standard'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN foods TEXT").catch(()=>{});
}).catch(err => console.error('❌ MySQL Connection Failed:', err));

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const rateLimitMap = new Map();
const tempCodes = {}; 

setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) rateLimitMap.delete(key);
    }
    for (const email in tempCodes) {
        if (tempCodes[email] && tempCodes[email].expires && now > tempCodes[email].expires) {
            delete tempCodes[email];
        }
    }
}, 5 * 60 * 1000);

function createRateLimiter(maxRequests = 10, windowMs = 60000) {
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'client';
        const key = `${req.path}:${ip}`;
        const now = Date.now();
        const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
        } else {
            record.count++;
        }

        rateLimitMap.set(key, record);
        if (record.count > maxRequests) {
            return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
        }
        next();
    };
}

const authLimiter = createRateLimiter(10, 60000); 
const emailLimiter = createRateLimiter(5, 60000);  

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your.restaurant.email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

app.post('/api/send-receipt', emailLimiter, async (req, res) => {
    res.status(200).json({ success: true, message: 'Email placeholder' });
});

/* AUTH ROUTES */
app.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM customer_credentials WHERE email = ? AND password_hash = ?', [email, password]);
        if (users.length > 0) {
            await db.query("INSERT INTO login_logs (user_type, user_id, action) VALUES ('Customer', ?, 'Login Success')", [users[0].customer_id]);
            res.json({ success: true, name: users[0].name });
        } else {
            res.json({ success: false, error: 'Invalid email or password' });
        }
    } catch (err) { res.status(500).json({ success: false, error: "Server error" }); }
});

app.post('/api/staff/log-login', async (req, res) => {
    const { username } = req.body;
    try {
        const [staff] = await db.query('SELECT staff_id FROM staff_credentials WHERE username = ?', [username]);
        if (staff.length > 0) {
            await db.query("INSERT INTO login_logs (user_type, user_id, action) VALUES ('Staff', ?, 'Login Success')", [staff[0].staff_id]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).send("Database error"); }
});

/* DELETE STAFF ACCOUNT */
app.delete('/api/staff/:username', async (req, res) => {
    try {
        await db.query('DELETE FROM staff_credentials WHERE username = ?', [req.params.username]);
        res.json({ success: true });
    } catch (err) { res.status(500).send("Database error"); }
});

/* UPDATE STAFF PASSWORD */
app.put('/api/staff/:username/password', async (req, res) => {
    const { passwordHash } = req.body;
    try {
        await db.query('UPDATE staff_credentials SET password_hash = ? WHERE username = ?', [passwordHash, req.params.username]);
        res.json({ success: true });
    } catch (err) { res.status(500).send("Database error"); }
});

app.get('/api/staff', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT username, password_hash FROM staff_credentials');
        res.json(rows);
    } catch (err) { res.status(500).send("Database error"); }
});

/* ── ANTI-DDOS RAM CACHES ── */
let cachedReservations = null;
let resCacheTime = 0;

app.get('/reservations', async (req, res) => {
    try {
        if (cachedReservations && (Date.now() - resCacheTime < 5000)) return res.json(cachedReservations); 
        
        // 👉 FIX: Pull the new columns from the database!
        const [rows] = await db.query(`
            SELECT r.reservation_id, c.name, r.reservation_time, r.table_number, r.status, r.booked_by, r.reservation_type, r.payment_amount, r.foods
            FROM reservation_log r
            JOIN customer_credentials c ON r.customer_id = c.customer_id
        `);

        cachedReservations = rows.map(r => {
            const d = new Date(r.reservation_time);
            const isStaff = r.booked_by === 'staff';
            const isPos = r.booked_by === 'pos';
            const prefix = isPos ? 'POS-' : (isStaff ? 'WI-' : 'RES-');
            
            let parsedFoods = [];
            try { parsedFoods = r.foods ? JSON.parse(r.foods) : []; } catch(e) {}

            return {
                reservationNumber: `${prefix}${r.reservation_id}`, customerName: r.name,
                arrivalDate: d.toISOString().split('T')[0], arrivalTime: d.toTimeString().substring(0, 5),
                bookedTable: `Table ${r.table_number}`, 
                status: r.status, bookedBy: r.booked_by,
                // 👉 FIX: Send the rich data to the frontend
                reservationType: r.reservation_type || 'standard',
                paymentAmount: parseFloat(r.payment_amount) || 0,
                foods: parsedFoods
            };
        });
        
        resCacheTime = Date.now();
        res.json(cachedReservations);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/reserve', async (req, res) => {
    // 👉 FIX: Accept the new fields from the frontend
    const { name, email, date, time, table, status, reservationType, paymentAmount, foods } = req.body;
    try {
        let [customers] = await db.query('SELECT customer_id FROM customer_credentials WHERE name = ? OR email = ? LIMIT 1', [name, email || '']);
        let customerId;
        if (customers.length > 0) customerId = customers[0].customer_id;
        else {
            const [result] = await db.query('INSERT INTO customer_credentials (name, email, password_hash) VALUES (?, ?, ?)', [name, email || `guest-${Date.now()}@temp.com`, 'guest']);
            customerId = result.insertId;
        }

        const tableInt = parseInt(String(table).replace(/[^0-9]/g, '')) || 0;
        const reservationTime = `${date} ${time}:00`;
        const isWalkin = email && String(email).includes('walkin-');
        const isPos = email && String(email).includes('pos-'); 
        const bookedBy = isWalkin ? 'staff' : (isPos ? 'pos' : 'online'); 
        
        const foodsJson = foods ? JSON.stringify(foods) : '[]';

        // 👉 FIX: Save everything into the database
        const [result] = await db.query(
            'INSERT INTO reservation_log (customer_id, table_number, reservation_time, status, booked_by, reservation_type, payment_amount, foods) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [customerId, tableInt, reservationTime, status || 'Pending', bookedBy, reservationType || 'standard', paymentAmount || 0, foodsJson]
        );

        cachedReservations = null; // Clear cache
        res.json({ success: true, reservationId: result.insertId }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================
   LIVE INVENTORY & INGREDIENT APIs
========================================== */
let cachedInventory = null;
let invCacheTime = 0;

app.get('/api/inventory/raw', async (req, res) => {
    try {
        if (cachedInventory && (Date.now() - invCacheTime < 5000)) return res.json(cachedInventory);
        
        const [rows] = await db.query('SELECT * FROM master_inventory');
        cachedInventory = rows.map(r => ({
            id: r.item_id, name: r.item_name, category: r.category,
            stock: r.current_stock, minThreshold: r.min_threshold, unit: r.unit_of_measurement
        }));
        invCacheTime = Date.now();
        res.json(cachedInventory);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/restock', async (req, res) => {
    const { id, name, addAmount, unit } = req.body;
    try {
        const [current] = await db.query('SELECT current_stock FROM master_inventory WHERE item_id = ? OR item_name = ?', [id, name]);
        const prevStock = current.length > 0 ? parseFloat(current[0].current_stock) : 0;
        const newStock = prevStock + Number(addAmount);

        if (current.length > 0) await db.query('UPDATE master_inventory SET current_stock = ? WHERE item_id = ? OR item_name = ?', [newStock, id, name]);
        else await db.query('INSERT INTO master_inventory (item_id, item_name, current_stock, unit_of_measurement) VALUES (?, ?, ?, ?)', [id, name, newStock, unit]);

        await db.query('INSERT INTO raw_ingredients_change_log (ingredient_name, previous_quantity, new_quantity, unit_of_measurement, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, NOW())', [name, prevStock, newStock, unit || 'g', 1]);
        cachedInventory = null; 
        res.json({ success: true, newStock: newStock });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/deduct-raw', async (req, res) => {
    const { items, operator } = req.body;
    try {
        const staffId = parseInt(operator) || 1; 
        for (let i of items) {
            const [current] = await db.query('SELECT current_stock FROM master_inventory WHERE item_id = ? OR item_name = ?', [i.id, i.name]);
            const prevStock = current.length > 0 ? parseFloat(current[0].current_stock) : 0;
            const newStock = Math.max(0, prevStock - Number(i.deductQty));

            if (current.length > 0) await db.query('UPDATE master_inventory SET current_stock = ? WHERE item_id = ? OR item_name = ?', [newStock, i.id, i.name]);
            
            await db.query('INSERT INTO raw_ingredients_change_log (ingredient_name, previous_quantity, new_quantity, unit_of_measurement, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, NOW())', [i.name, prevStock, newStock, i.unit || 'g', staffId]);
        }
        cachedInventory = null; 
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/sync-movement', async (req, res) => {
    const { ingredientId, ingredientName, changeQty, newStock, unit, operator } = req.body;
    try {
        const [current] = await db.query('SELECT current_stock FROM master_inventory WHERE item_id = ?', [ingredientId]);
        let prevStock = 0;

        if (current.length > 0) {
            prevStock = parseFloat(current[0].current_stock);
            await db.query('UPDATE master_inventory SET current_stock = ?, item_name = ? WHERE item_id = ?', [newStock, ingredientName, ingredientId]);
        } else {
            await db.query('INSERT INTO master_inventory (item_id, item_name, category, current_stock, min_threshold, branch_location) VALUES (?, ?, ?, ?, ?, ?)', [ingredientId, ingredientName, 'General', newStock, 10, 'General Santos City']);
            prevStock = newStock - changeQty; 
        }

        const staffId = parseInt(operator) || 1; 
        await db.query('INSERT INTO raw_ingredients_change_log (ingredient_name, previous_quantity, new_quantity, unit_of_measurement, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, NOW())', [ingredientName, prevStock, newStock, unit || 'g', staffId]);

        cachedInventory = null; 
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reservations/update-status', async (req, res) => {
    const { id, status } = req.body;
    try {
        const numericId = String(id).replace(/[^0-9]/g, '');
        if (numericId) await db.query('UPDATE reservation_log SET status = ? WHERE reservation_id = ?', [status, numericId]);
        cachedReservations = null;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = app;
