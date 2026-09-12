require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); // REPLACED SUPABASE WITH MYSQL

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets with no-cache in local development to ensure instant updates
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(express.static(__dirname, {
    etag: false,
    lastModified: false
}));

// Initialize Hostinger MySQL Connection
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

db.query('SELECT 1')
    .then(() => console.log('✅ Connected to Hostinger MySQL Database!'))
    .catch(err => console.error('❌ MySQL Connection Failed:', err));


// ── SECURITY & SANITIZATION HELPERS ──
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Memory Rate Limiter
const rateLimitMap = new Map();
const tempCodes = {}; // In-memory storage for codes: { email: { code, expires } }

// ── AUTOMATED MEMORY SWEEPER (PREVENTS MEMORY LEAKS UNDER HIGH TRAFFIC) ──
setInterval(() => {
    const now = Date.now();
    // 1. Prune expired rate limit records
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key);
        }
    }
    // 2. Prune expired temp verification codes
    for (const email in tempCodes) {
        if (tempCodes[email] && tempCodes[email].expires && now > tempCodes[email].expires) {
            delete tempCodes[email];
        }
    }
}, 5 * 60 * 1000); // Sweeps every 5 minutes

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

const authLimiter = createRateLimiter(10, 60000); // 10 attempts per min
const emailLimiter = createRateLimiter(5, 60000);  // 5 email receipts per min

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

    if (!email) {
        return res.status(400).json({ error: 'No email provided' });
    }

    const safeName = escapeHtml(customerName || 'Guest');
    const safeResNumber = escapeHtml(reservationNumber || 'N/A');
    const safeArrival = escapeHtml(arrivalDateTime || 'N/A');
    const safeTable = escapeHtml(table || 'Unassigned');
    const safeMethod = escapeHtml(paymentMethod || 'Online');
    const safeSummary = escapeHtml(orderSummary || 'Standard Reservation (No Pre-Orders)');
    const safeAmount = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const mailOptions = {
        from: process.env.EMAIL_USER || 'your.restaurant.email@gmail.com',
        to: email,
        subject: `Roland's Steak House - Receipt for ${safeResNumber}`,
        html: `
            <div style="font-family: 'Inter', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1b5e20 0%, #0d3811 100%); padding: 35px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: 800;">Roland's Steak House</h1>
                    <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Official E-Receipt</p>
                </div>

                <!-- Body -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Hi ${safeName},</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">Thank you for securing your table with us. Your priority reservation is officially confirmed and your payment has been processed successfully.</p>
                    
                    <!-- Details Card -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
                        
                        <div style="margin-bottom: 15px;">
                            <span style="color: #64748b; font-size: 14px;">Reservation No.</span>
                            <div style="float: right;">
                                <strong style="color: #0f172a; font-size: 15px; background: #e2e8f0; padding: 4px 10px; border-radius: 6px;">${safeResNumber}</strong>
                            </div>
                            <div style="clear: both;"></div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <span style="color: #64748b; font-size: 14px;">Arrival Time</span>
                            <div style="float: right;">
                                <strong style="color: #0f172a; font-size: 14px;">${safeArrival}</strong>
                            </div>
                            <div style="clear: both;"></div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <span style="color: #64748b; font-size: 14px;">Table Assignment</span>
                            <div style="float: right;">
                                <strong style="color: #0f172a; font-size: 14px;">${safeTable}</strong>
                            </div>
                            <div style="clear: both;"></div>
                        </div>

                        <div style="border-top: 1px dashed #cbd5e1; margin: 20px 0;"></div>

                        <div style="margin-bottom: 20px;">
                            <span style="display: block; color: #64748b; font-size: 14px; margin-bottom: 8px;">Pre-Order Summary</span>
                            <div style="color: #334155; font-size: 14px; line-height: 1.5; background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                ${safeSummary}
                            </div>
                        </div>

                        <div style="border-top: 1px dashed #cbd5e1; margin: 20px 0; padding-top: 20px;">
                            <span style="color: #64748b; font-size: 15px; font-weight: 600;">Total Paid (${safeMethod})</span>
                            <div style="float: right;">
                                <strong style="color: #16a34a; font-size: 24px;">₱${safeAmount}</strong>
                            </div>
                            <div style="clear: both;"></div>
                        </div>
                    </div>

                    <!-- Call to Action -->
                    <div style="text-align: center; margin-top: 35px;">
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">For the fastest check-in, please present your digital QR code to our hostess upon arrival.</p>
                        <a href="http://localhost:3000/receipt.html?res=${encodeURIComponent(reservationNumber || '')}" 
                           style="background: #16a34a; color: #ffffff; padding: 16px 36px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                           📋 View Digital QR Receipt
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background: #f1f5f9; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0;">Jose Catolico Sr. Ave., General Santos City</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Roland's Steak House. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Email sent!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

/* LOGIN */
app.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Search MySQL for the user
        const [users] = await db.query(
            'SELECT * FROM customer_credentials WHERE email = ? AND password_hash = ?',
            [email, password]
        );

        const isSuccess = users.length > 0;

        if (isSuccess) {
            const user = users[0];
            
            // 2. Record the successful login attempt
            await db.query(
                "INSERT INTO login_logs (user_type, user_id, action) VALUES ('Customer', ?, 'Login Success')",
                [user.customer_id]
            );

            res.json({ success: true, name: user.name });
        } else {
            res.json({ success: false, error: 'Invalid email or password' });
        }

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, error: "Server error during login" });
    }
});

/* SIGNUP */
app.post('/signup', authLimiter, async (req, res) => {
    const { name, email, password } = req.body;

    try {
        await db.query(
            'INSERT INTO customer_credentials (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, password]
        );
        res.json({ success: true });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ success: false, error: "Database error during signup" });
    }
});

/* SIGNUP VERIFICATION */
app.post('/api/auth/send-signup-code', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    try {
        // Check MySQL if user already exists
        const [existing] = await db.query('SELECT * FROM customer_credentials WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: "An account with this email already exists." });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        tempCodes[email] = { code, expires: Date.now() + (10 * 60 * 1000) };

        const mailOptions = {
            from: process.env.EMAIL_USER || 'your.restaurant.email@gmail.com',
            to: email,
            subject: "Verify your email - Roland's Steak House",
            html: `<h2>Roland's Steak House</h2><p>Your verification code is: <strong>${escapeHtml(code)}</strong></p>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to send verification email." });
    }
});

/* FORGOT PASSWORD */
app.post('/api/auth/send-code', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    try {
        // Verify user exists in MySQL
        const [existing] = await db.query('SELECT * FROM customer_credentials WHERE email = ?', [email]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "No account found with this email." });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        tempCodes[email] = { code, expires: Date.now() + (10 * 60 * 1000) };
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your.restaurant.email@gmail.com',
            to: email,
            subject: "Password Reset Code - Roland's Steak House",
            html: `<h2>Roland's Steak House</h2><p>Your password reset code is: <strong>${code}</strong></p>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to send email." });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email, password } = req.body;

    try {
        await db.query(
            'UPDATE customer_credentials SET password_hash = ? WHERE email = ?', 
            [password, email]
        );
        delete tempCodes[email];
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Database error." });
    }
});

/* GET STAFF ACCOUNTS */
app.get('/api/staff', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT username, password_hash FROM staff_credentials');
        res.json(rows);
    } catch (err) {
        console.error("Staff Fetch Error:", err);
        res.status(500).send("Database error");
    }
});

/* GET STAFF ACCOUNTS */
app.get('/api/staff', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT username, password_hash FROM staff_credentials');
        res.json(rows);
    } catch (err) {
        console.error("Staff Fetch Error:", err);
        res.status(500).send("Database error");
    }
});

/* CREATE STAFF ACCOUNT */
app.post('/api/staff', async (req, res) => {
    const { username, passwordHash } = req.body;
    try {
        await db.query(
            "INSERT INTO staff_credentials (username, password_hash, role) VALUES (?, ?, 'Staff')",
            [username, passwordHash]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Create Staff Error:", err);
        res.status(500).send("Database error");
    }
});

/* DELETE STAFF ACCOUNT */
app.delete('/api/staff/:username', async (req, res) => {
    try {
        await db.query('DELETE FROM staff_credentials WHERE username = ?', [req.params.username]);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete Staff Error:", err);
        res.status(500).send("Database error");
    }
});

/* RESERVATIONS */
app.get('/reservations', async (req, res) => {
    try {
        // Fetch all reservations and join with customer data
        const [rows] = await db.query(`
            SELECT r.reservation_id, c.name, r.reservation_time, r.table_number, r.status
            FROM reservation_log r
            JOIN customer_credentials c ON r.customer_id = c.customer_id
        `);

        // Map the SQL columns to match what your frontend JS expects
        const mappedData = rows.map(r => {
            const d = new Date(r.reservation_time);
            return {
                reservationNumber: `RES-${r.reservation_id}`,
                customerName: r.name,
                arrivalDate: d.toISOString().split('T')[0],
                arrivalTime: d.toTimeString().substring(0, 5),
                bookedTable: `Table ${r.table_number}`,
                reservationType: 'priority',
                status: r.status
            };
        });

        res.json(mappedData);
    } catch (err) {
        console.error("Database fetch error:", err);
        res.status(500).send("Database fetch error");
    }
});

/* SAVE NEW RESERVATION */
app.post('/reserve', async (req, res) => {
    console.log("Saving new reservation for:", req.body.name);
    const { name, email, date, time, table, cartItems, status } = req.body;

    try {
        // 1. Check if customer exists, or create a temporary guest account
        let [customers] = await db.query('SELECT customer_id FROM customer_credentials WHERE name = ? OR email = ? LIMIT 1', [name, email || '']);
        let customerId;

        if (customers.length > 0) {
            customerId = customers[0].customer_id;
        } else {
            const [result] = await db.query(
                'INSERT INTO customer_credentials (name, email, password_hash) VALUES (?, ?, ?)', 
                [name, email || `guest-${Date.now()}@temp.com`, 'guest-no-password']
            );
            customerId = result.insertId;
        }

        // 2. Parse the table string (e.g., "Table 4") into an integer for the database
        const tableInt = parseInt(String(table).replace(/[^0-9]/g, '')) || 0;
        const reservationTime = `${date} ${time}:00`;

        // 3. Insert the reservation
        await db.query(
            'INSERT INTO reservation_log (customer_id, table_number, reservation_time, status) VALUES (?, ?, ?, ?)',
            [customerId, tableInt, reservationTime, status || 'pending']
        );

        // 4. Deduct Stock if items were ordered
        if (cartItems && cartItems.length > 0) {
            await deductStock(cartItems);
        }

        res.json({ success: true });

    } catch (err) {
        console.error("Save Reservation Error:", err);
        res.status(500).send("Error saving to database");
    }
});

/* DEDUCT STOCK HELPER */
async function deductStock(cartItems, branch = 'General Santos City') {
    console.log(`Deducting stock for ${cartItems.length} items at ${branch}...`);
    try {
        for (const item of cartItems) {
            const qty = item.quantity || 1;
            
            // 1. Deduct from the live master inventory
            await db.query(
                'UPDATE master_inventory SET current_stock = current_stock - ? WHERE (item_id = ? OR item_name = ?) AND branch_location = ?',
                [qty, item.id, item.name || item.title || item.id, branch]
            );

            // 2. (Optional but recommended) Record the change in your log table
            // You would normally grab the previous stock first, but this keeps the log flowing!
            await db.query(
                'INSERT INTO menu_stock_change_log (item_name, previous_stock, new_stock, updated_by) VALUES (?, ?, ?, ?)',
                [item.name || item.title, 0, 0, 1] // 1 represents a generic system/admin ID
            );
        }
    } catch (err) {
        console.error("Stock Deduction Error:", err);
    }
}

/* UPDATE RESERVATION STATUS */
app.post('/api/reservations/update-status', async (req, res) => {
    const { id, status } = req.body;
    try {
        // Strip "RES-" prefix from the frontend string to get the SQL ID
        const numericId = String(id).replace(/[^0-9]/g, '');
        
        if (numericId) {
            await db.query(
                'UPDATE reservation_log SET status = ? WHERE reservation_id = ?', 
                [status, numericId]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/* CREATE PAYMONGO CHECKOUT SESSION (Card-only, no QR) */
app.post('/api/paymongo/checkout', async (req, res) => {
    const { amount, description, customerName } = req.body;

    const mode = (process.env.PAYMONGO_MODE || 'test').toLowerCase();
    const finalKey = mode === 'live'
        ? (process.env.PAYMONGO_SECRET_KEY_LIVE || process.env.PAYMONGO_SECRET_KEY)
        : (process.env.PAYMONGO_SECRET_KEY_TEST || process.env.PAYMONGO_SECRET_KEY);

    if (!finalKey) {
        return res.status(500).json({ error: 'PayMongo secret key not configured.' });
    }

    const amountInCentavos = Math.round(Number(amount) * 100);

    try {
        const pmRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(finalKey + ':').toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        send_email_receipt: true,
                        show_description: true,
                        show_line_items: true,
                        description: description || 'Reservation Deposit',
                        payment_method_types: ['card', 'gcash', 'paymaya'], // Enables the Grid UI
                        line_items: [
                            {
                                amount: amountInCentavos,
                                currency: 'PHP',
                                name: description || 'Reservation Deposit',
                                quantity: 1
                            }
                        ],
                        success_url: req.body.successUrl,
                        cancel_url: req.body.cancelUrl
                    }
                }
            })
        });

        const data = await pmRes.json();

        if (!pmRes.ok) {
            const errMsg = data?.errors?.[0]?.detail || JSON.stringify(data);
            return res.status(pmRes.status).json({ error: errMsg });
        }

        const checkoutUrl = data?.data?.attributes?.checkout_url;
        const sessionId   = data?.data?.id;
        res.json({ checkout_url: checkoutUrl, session_id: sessionId });

    } catch (err) {
        console.error('PayMongo error:', err);
        res.status(500).json({ error: 'Could not reach PayMongo.' });
    }
});

/* PROCESS PAYMONGO REFUND (Optional Gateway Call) */
app.post('/api/paymongo/refund', async (req, res) => {
    const { amount, paymentId, reason, notes } = req.body;

    const mode = (process.env.PAYMONGO_MODE || 'test').toLowerCase();
    const finalKey = mode === 'live'
        ? (process.env.PAYMONGO_SECRET_KEY_LIVE || process.env.PAYMONGO_SECRET_KEY)
        : (process.env.PAYMONGO_SECRET_KEY_TEST || process.env.PAYMONGO_SECRET_KEY);

    if (!finalKey) {
        return res.status(200).json({ success: false, fallback: true, message: 'PayMongo secret key not configured. Recorded as manual refund.' });
    }

    if (!paymentId) {
        return res.status(200).json({ success: false, fallback: true, message: 'No PayMongo paymentId provided. Recorded as manual refund.' });
    }

    const amountInCentavos = Math.round(Number(amount) * 100);

    try {
        const pmRes = await fetch('https://api.paymongo.com/v1/refunds', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(finalKey + ':').toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        amount: amountInCentavos,
                        payment_id: paymentId,
                        reason: reason || 'requested_by_customer',
                        notes: notes || 'Roland Steakhouse refund'
                    }
                }
            })
        });

        const data = await pmRes.json();
        if (!pmRes.ok) {
            const errMsg = data?.errors?.[0]?.detail || JSON.stringify(data);
            return res.status(200).json({ success: false, error: errMsg, fallback: true });
        }

        res.json({ success: true, refund: data?.data });
    } catch (err) {
        console.error('PayMongo refund error:', err);
        res.status(200).json({ success: false, error: err.message, fallback: true });
    }
});

// Run locally if testing on your laptop
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log("Server running locally on port 3000"));
}

// Export for Vercel deployment
module.exports = app;
