require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    await db.query("ALTER TABLE reservation_log ADD COLUMN reservation_type VARCHAR(50) DEFAULT 'standard'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN foods TEXT").catch(()=>{});
    
    // 👉 FIX: Add Cloud Memory Columns for KDS (Kitchen) and Floor Plan (Table Overrides)
    await db.query("ALTER TABLE reservation_log ADD COLUMN kds_status VARCHAR(50) DEFAULT 'pending'").catch(()=>{});
    await db.query("CREATE TABLE IF NOT EXISTS system_memory (mem_key VARCHAR(50) PRIMARY KEY, mem_val JSON)").catch(()=>{});
    
    await db.query("ALTER TABLE customer_credentials ADD COLUMN phone VARCHAR(20) DEFAULT ''").catch(()=>{});

    // 👉 NEW: Automatically create the missing Inventory tables so the kitchen can return ingredients!
    await db.query(`
        CREATE TABLE IF NOT EXISTS master_inventory (
            item_id VARCHAR(50) PRIMARY KEY,
            item_name VARCHAR(100),
            category VARCHAR(50),
            current_stock DECIMAL(10,2) DEFAULT 0,
            min_threshold DECIMAL(10,2) DEFAULT 0,
            unit_of_measurement VARCHAR(20),
            branch_location VARCHAR(100) DEFAULT 'General Santos City',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `).catch((e)=> console.error("Inv Table Error:", e));

    await db.query(`
        CREATE TABLE IF NOT EXISTS raw_ingredients_change_log (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            ingredient_name VARCHAR(100),
            previous_quantity DECIMAL(10,2),
            new_quantity DECIMAL(10,2),
            unit_of_measurement VARCHAR(20),
            updated_by INT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).catch((e)=> console.error("Log Table Error:", e));
    
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
    const { email, customerName, amount, reservationNumber, paymentMethod, arrivalDateTime, table, orderSummary } = req.body;
    if (!email) return res.status(200).json({ success: false, message: 'No email provided' });

    try {
        await transporter.sendMail({
            from: `"Roland's Steakhouse" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `E-Receipt & Confirmation (${reservationNumber}) - Roland's Steakhouse`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #1b5e20; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Roland's Steakhouse</h2>
                        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Official Reservation E-Receipt</p>
                    </div>
                    <div style="padding: 20px; color: #1e293b; font-size: 14px; line-height: 1.6;">
                        <p>Hi <strong>${escapeHtml(customerName || 'Valued Guest')}</strong>,</p>
                        <p>Your reservation is confirmed! Here are your booking details:</p>
                        <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 16px 0;">
                            <div><strong>Reservation #:</strong> ${escapeHtml(reservationNumber)}</div>
                            <div><strong>Table:</strong> ${escapeHtml(table)}</div>
                            <div><strong>Arrival:</strong> ${escapeHtml(arrivalDateTime)}</div>
                            <div><strong>Order:</strong> ${escapeHtml(orderSummary)}</div>
                            <div><strong>Payment Method:</strong> ${escapeHtml(paymentMethod)}</div>
                            <div style="margin-top: 8px; font-size: 16px; color: #1b5e20;"><strong>Total Paid:</strong> ₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <p style="font-size: 12px; color: #64748b;">Please present your Reservation # or QR Receipt upon arrival.</p>
                    </div>
                </div>
            `
        });
        res.status(200).json({ success: true });
    } catch (err) {
        console.log('[DEV MODE] Receipt email skipped:', err.message);
        res.status(200).json({ success: true, warning: 'Email not configured' });
    }
});

/* PAYMONGO CHECKOUT ROUTE */
app.post('/api/paymongo/checkout', async (req, res) => {
    const { amount, description, successUrl, cancelUrl, customerName, customerEmail, customerPhone } = req.body;
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    // Minimum amount for PayMongo is ₱20.00 (2000 centavos)
    const amountInCentavos = Math.max(2000, Math.round(Number(amount || 0) * 100));

    // If PAYMONGO_SECRET_KEY is not set in Vercel Environment Variables yet,
    // fallback cleanly to the success page so live demos never crash!
    if (!secretKey) {
        console.warn('⚠️ PAYMONGO_SECRET_KEY is missing in environment variables. Using direct demo redirect.');
        return res.json({
            checkout_url: successUrl,
            session_id: 'demo_session_' + Date.now()
        });
    }

    try {
        const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

        const payload = {
            data: {
                attributes: {
                    send_email_receipt: Boolean(customerEmail),
                    show_description: true,
                    show_line_items: true,
                    description: description || "Roland's Steakhouse Reservation",
                    payment_method_types: ['gcash', 'paymaya', 'card', 'dob'],
                    line_items: [
                        {
                            currency: 'PHP',
                            amount: amountInCentavos,
                            description: description || "Table Reservation & Pre-Order",
                            name: description || "Roland's Steakhouse Reservation",
                            quantity: 1
                        }
                    ],
                    success_url: successUrl,
                    cancel_url: cancelUrl
                }
            }
        };

        if (customerName || customerEmail || customerPhone) {
            payload.data.attributes.billing = {};
            if (customerName) payload.data.attributes.billing.name = customerName;
            if (customerEmail) payload.data.attributes.billing.email = customerEmail;
            if (customerPhone) payload.data.attributes.billing.phone = customerPhone;
        }

        const pmRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(payload)
        });

        const pmData = await pmRes.json();

        if (!pmRes.ok || !pmData.data) {
            const apiErr = pmData?.errors?.[0]?.detail || 'PayMongo rejected the checkout request.';
            return res.status(400).json({ error: apiErr });
        }

        res.json({
            checkout_url: pmData.data.attributes.checkout_url,
            session_id: pmData.data.id
        });
    } catch (err) {
        console.error('PayMongo Server Error:', err);
        res.status(500).json({ error: 'Failed to connect to PayMongo gateway.' });
    }
});

/* AUTH ROUTES */
// 👉 NEW: Helper function to generate 6-digit OTP codes
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Send OTP Code for New Account Signups
app.post('/api/auth/send-signup-code', emailLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    try {
        const [existing] = await db.query('SELECT customer_id FROM customer_credentials WHERE email = ?', [email]);
        if (existing.length > 0) return res.json({ success: false, error: 'An account with this email already exists.' });

        const code = generateOTP();
        tempCodes[email] = { code, expires: Date.now() + 10 * 60 * 1000 }; // 10 minute expiry

        try {
            await transporter.sendMail({
                from: `"Roland's Steakhouse" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Roland\'s Steakhouse Verification Code',
                html: `<h2>Welcome to Roland's!</h2><p>Your verification code is: <strong style="font-size:24px; color:#1b5e20;">${code}</strong></p><p>This code expires in 10 minutes.</p>`
            });
            res.json({ success: true });
        } catch (error) {
            console.log(`[DEV MODE] Email failed to send. The code for ${email} is: ${code}`);
            res.json({ success: true, warning: 'Check Vercel Logs for the code if email is not configured.' });
        }
    } catch (err) { res.status(500).json({ success: false, error: 'Database error' }); }
});

// 2. Verify the 6-digit OTP Code
app.post('/api/auth/verify-code', authLimiter, (req, res) => {
    const { email, code } = req.body;
    const record = tempCodes[email];

    if (!record) return res.json({ success: false, error: 'No verification code requested or code has expired.' });
    if (Date.now() > record.expires) {
        delete tempCodes[email];
        return res.json({ success: false, error: 'Code expired. Please request a new one.' });
    }
    if (record.code !== code) return res.json({ success: false, error: 'Invalid verification code.' });

    delete tempCodes[email]; // Consume code upon success
    res.json({ success: true });
});

// 3. Create the actual Customer Account in the Database (with Mobile Number)
app.post('/signup', authLimiter, async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        const [existing] = await db.query('SELECT customer_id FROM customer_credentials WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ success: false, error: 'Email already exists' });

        await db.query('INSERT INTO customer_credentials (name, email, password_hash, phone) VALUES (?, ?, ?, ?)', [name, email, password, phone || '']);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: 'Database error' }); }
});

// 4. Send OTP Code for Forgot Password
app.post('/api/auth/send-code', emailLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    try {
        const [existing] = await db.query('SELECT customer_id FROM customer_credentials WHERE email = ?', [email]);
        if (existing.length === 0) return res.json({ success: false, error: 'No account found with that email address.' });

        const code = generateOTP();
        tempCodes[email] = { code, expires: Date.now() + 10 * 60 * 1000 };

        try {
            await transporter.sendMail({
                from: `"Roland's Steakhouse" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Reset Code - Roland\'s Steakhouse',
                html: `<h2>Password Reset</h2><p>Your password reset code is: <strong style="font-size:24px; color:#1b5e20;">${code}</strong></p><p>This code expires in 10 minutes.</p>`
            });
            res.json({ success: true });
        } catch (error) {
            console.log(`[DEV MODE] Email failed to send. The reset code for ${email} is: ${code}`);
            res.json({ success: true, warning: 'Check Vercel Logs for the code if email is not configured.' });
        }
    } catch (err) { res.status(500).json({ success: false, error: 'Database error' }); }
});

// 5. Update Password in the Database
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        await db.query('UPDATE customer_credentials SET password_hash = ? WHERE email = ?', [password, email]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: 'Database error' }); }
});

// 6. Change Password (Inside Profile)
app.post('/api/auth/change-password', authLimiter, async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT customer_id FROM customer_credentials WHERE email = ? AND password_hash = ?', [email, currentPassword]);
        if (users.length === 0) return res.json({ success: false, error: 'Incorrect current password.' });
        
        await db.query('UPDATE customer_credentials SET password_hash = ? WHERE email = ?', [newPassword, email]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: 'Database error' }); }
});

// 6b. Get & Update Customer Profile (Mobile Number)
app.get('/api/auth/profile', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.json({ success: false });
    try {
        const [users] = await db.query('SELECT name, email, phone FROM customer_credentials WHERE email = ?', [email]);
        if (users.length > 0) res.json({ success: true, name: users[0].name, email: users[0].email, phone: users[0].phone || '' });
        else res.json({ success: false });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/auth/update-phone', authLimiter, async (req, res) => {
    const { email, phone } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    try {
        await db.query('UPDATE customer_credentials SET phone = ? WHERE email = ?', [phone || '', email]);
        res.json({ success: true, phone: phone || '' });
    } catch (err) { res.status(500).json({ success: false, error: 'Database error' }); }
});

app.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM customer_credentials WHERE email = ? AND password_hash = ?', [email, password]);
        if (users.length > 0) {
            await db.query("INSERT INTO login_logs (user_type, user_id, action) VALUES ('Customer', ?, 'Login Success')", [users[0].customer_id]);
            res.json({ success: true, name: users[0].name, phone: users[0].phone || '' });
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

/* CREATE NEW STAFF ACCOUNT */
app.post('/api/staff', async (req, res) => {
    const { username, passwordHash } = req.body;
    try {
        // 👉 FIX: Explicitly include the role so MySQL doesn't reject it
        await db.query(
            "INSERT INTO staff_credentials (username, password_hash, role) VALUES (?, ?, 'Staff')",
            [username, passwordHash]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Create Staff Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/* 👉 RESTORED: GET STAFF ACCOUNTS (This was missing, causing the blank lists!) */
app.get('/api/staff', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT username, password_hash, role, last_active FROM staff_credentials');
        res.json(rows);
    } catch (err) {
        console.error("Staff Fetch Error:", err);
        res.status(500).send("Database error");
    }
});

/* 👉 NEW: REAL CLOUD ONLINE STATUS TRACKER */
app.post('/api/staff/heartbeat', async (req, res) => {
    try {
        if (req.body.username) {
            await db.query('UPDATE staff_credentials SET last_active = ? WHERE username = ?', [Date.now(), req.body.username]);
        }
        res.json({success: true});
    } catch (err) {
        res.status(500).send("Database error");
    }
});

/* ── ANTI-DDOS RAM CACHES ── */
let cachedReservations = null;
let resCacheTime = 0;

app.get('/reservations', async (req, res) => {
    try {
        if (cachedReservations && (Date.now() - resCacheTime < 5000)) return res.json(cachedReservations); 
        
        // 👉 FIX: Pull the KDS status from the database so the phone can see it!
        const [rows] = await db.query(`
            SELECT r.reservation_id, c.name, r.reservation_time, r.table_number, r.status, r.booked_by, r.reservation_type, r.payment_amount, r.foods, r.kds_status
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
                reservationType: r.reservation_type || 'standard',
                paymentAmount: parseFloat(r.payment_amount) || 0,
                foods: parsedFoods,
                // 👉 FIX: Map the KDS status so it gets sent to the frontend
                kdsStatus: r.kds_status || 'pending'
            };
        });
        
        resCacheTime = Date.now();
        res.json(cachedReservations);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/reserve', async (req, res) => {
    const { name, email, date, time, table, status, reservationType, paymentAmount, foods } = req.body;
    try {
        const cleanName = (name || 'Guest').trim();
        const cleanEmail = (email || '').trim();

        let customers = [];
        if (cleanEmail && !cleanEmail.includes('@temp.com')) {
            [customers] = await db.query('SELECT customer_id, name FROM customer_credentials WHERE email = ? LIMIT 1', [cleanEmail]);
            if (customers.length > 0 && cleanName && customers[0].name !== cleanName) {
                await db.query('UPDATE customer_credentials SET name = ? WHERE customer_id = ?', [cleanName, customers[0].customer_id]);
            }
        } else {
            [customers] = await db.query('SELECT customer_id FROM customer_credentials WHERE name = ? LIMIT 1', [cleanName]);
        }

        let customerId;
        if (customers.length > 0) {
            customerId = customers[0].customer_id;
        } else {
            const [result] = await db.query(
                'INSERT INTO customer_credentials (name, email, password_hash) VALUES (?, ?, ?)',
                [cleanName, cleanEmail || `guest-${Date.now()}-${Math.floor(Math.random()*1000)}@temp.com`, 'guest']
            );
            customerId = result.insertId;
        }

        const tableInt = parseInt(String(table).replace(/[^0-9]/g, '')) || 1;
        const safeDate = (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : new Date().toISOString().split('T')[0];
        const safeTime = (time && /^\d{2}:\d{2}/.test(time)) ? time.substring(0, 5) : '12:00';
        const reservationTime = `${safeDate} ${safeTime}:00`;

        const isWalkin = cleanEmail.includes('walkin-');
        const isPos = cleanEmail.includes('pos-'); 
        const bookedBy = isWalkin ? 'staff' : (isPos ? 'pos' : 'online'); 
        
        const foodsJson = Array.isArray(foods) ? JSON.stringify(foods) : (foods ? JSON.stringify([foods]) : '[]');

        const [result] = await db.query(
            'INSERT INTO reservation_log (customer_id, table_number, reservation_time, status, booked_by, reservation_type, payment_amount, foods) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [customerId, tableInt, reservationTime, status || 'Pending', bookedBy, reservationType || 'standard', Number(paymentAmount) || 0, foodsJson]
        );

        cachedReservations = null;
        res.json({ success: true, reservationId: result.insertId }); 
    } catch (err) {
        console.error('Reserve DB Error:', err);
        res.status(500).json({ error: err.message });
    }
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

/* 👉 NEW: KITCHEN AND FLOOR PLAN SYNC ROUTES */
app.post('/api/reservations/update-kds', async (req, res) => {
    const { id, kdsStatus } = req.body;
    try {
        const numericId = String(id).replace(/[^0-9]/g, '');
        if (numericId) await db.query('UPDATE reservation_log SET kds_status = ? WHERE reservation_id = ?', [kdsStatus, numericId]);
        cachedReservations = null;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/memory/table-overrides', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT mem_val FROM system_memory WHERE mem_key = 'tableOverrides'");
        res.json(rows.length ? rows[0].mem_val : {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memory/table-overrides', async (req, res) => {
    try {
        await db.query("INSERT INTO system_memory (mem_key, mem_val) VALUES ('tableOverrides', ?) ON DUPLICATE KEY UPDATE mem_val = ?", [JSON.stringify(req.body), JSON.stringify(req.body)]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Cloud Live Chat Sync Engine
app.get('/api/memory/live-chats', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT mem_val FROM system_memory WHERE mem_key = 'liveChats'");
        res.json(rows.length ? rows[0].mem_val : {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memory/live-chats', async (req, res) => {
    try {
        await db.query("INSERT INTO system_memory (mem_key, mem_val) VALUES ('liveChats', ?) ON DUPLICATE KEY UPDATE mem_val = ?", [JSON.stringify(req.body), JSON.stringify(req.body)]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Safe append-only endpoint: adds a single message to a session without
// overwriting messages sent concurrently from other devices.
app.post('/api/memory/live-chats/message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message required' });

        // Read current state from DB
        const [rows] = await db.query("SELECT mem_val FROM system_memory WHERE mem_key = 'liveChats'");
        const allChats = rows.length ? rows[0].mem_val : {};

        if (!allChats[sessionId]) allChats[sessionId] = [];
        allChats[sessionId].push(message);

        await db.query("INSERT INTO system_memory (mem_key, mem_val) VALUES ('liveChats', ?) ON DUPLICATE KEY UPDATE mem_val = ?", [JSON.stringify(allChats), JSON.stringify(allChats)]);
        res.json({ success: true, allChats });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 👉 NEW: DELETE ALL RECORDS ROUTE */
app.delete('/api/reservations/all', async (req, res) => {
    try {
        // Wipe the table clean
        await db.query('DELETE FROM reservation_log');
        // Reset the ID counter back to 1
        await db.query('ALTER TABLE reservation_log AUTO_INCREMENT = 1'); 
        cachedReservations = null;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 👉 NEW: UPDATE ENTIRE ORDER DETAILS (Foods, Payment, Status) */
app.post('/api/reservations/update-order', async (req, res) => {
    const { id, paymentAmount, foods, status, kdsStatus } = req.body;
    try {
        const numericId = String(id).replace(/[^0-9]/g, '');
        const foodsJson = foods ? JSON.stringify(foods) : '[]';
        if (numericId) {
            await db.query(
                'UPDATE reservation_log SET payment_amount = ?, foods = ?, status = ?, kds_status = ? WHERE reservation_id = ?', 
                [paymentAmount, foodsJson, status, kdsStatus, numericId]
            );
        }
        cachedReservations = null;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 👉 CLOUD MENU & PRODUCT PHOTO SYNC ROUTES */
app.get('/api/memory/inventory-items', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT mem_val FROM system_memory WHERE mem_key = 'inventoryItems'");
        if (!rows.length || !rows[0].mem_val) return res.json([]);
        const val = typeof rows[0].mem_val === 'string' ? JSON.parse(rows[0].mem_val) : rows[0].mem_val;
        res.json(Array.isArray(val) ? val : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/memory/inventory-items', async (req, res) => {
    try {
        const items = Array.isArray(req.body) ? req.body : (req.body.items || []);
        const jsonStr = JSON.stringify(items);
        await db.query(
            "INSERT INTO system_memory (mem_key, mem_val) VALUES ('inventoryItems', ?) ON DUPLICATE KEY UPDATE mem_val = ?",
            [jsonStr, jsonStr]
        );
        res.json({ success: true, count: items.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/memory/inventory-items/item', async (req, res) => {
    try {
        const { item, deleteId } = req.body;
        const [rows] = await db.query("SELECT mem_val FROM system_memory WHERE mem_key = 'inventoryItems'");
        let items = [];
        if (rows.length && rows[0].mem_val) {
            items = typeof rows[0].mem_val === 'string' ? JSON.parse(rows[0].mem_val) : rows[0].mem_val;
            if (!Array.isArray(items)) items = [];
        }

        if (deleteId) {
            items = items.filter(i => i && i.id !== deleteId);
        } else if (item && item.id) {
            const idx = items.findIndex(i => i && i.id === item.id);
            if (idx > -1) items[idx] = { ...items[idx], ...item };
            else items.push(item);
        }

        const jsonStr = JSON.stringify(items);
        await db.query(
            "INSERT INTO system_memory (mem_key, mem_val) VALUES ('inventoryItems', ?) ON DUPLICATE KEY UPDATE mem_val = ?",
            [jsonStr, jsonStr]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
