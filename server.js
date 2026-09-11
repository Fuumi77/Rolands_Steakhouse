require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

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

// Initialize Supabase (Pulls from your .env file or Vercel Environment Variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('⚠️  Supabase credentials missing — DB features disabled, but PayMongo will still work.');
}


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
        // 1. Attempt to find the user
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password);

        if (error) throw error;

        const isSuccess = data && data.length > 0;
        const fullName = isSuccess ? data[0].name : 'Unknown Attempt';

        // 2. Record the login attempt
        await supabase
            .from('login_attempts')
            .insert([{ email: email, name: fullName, status: isSuccess ? 'SUCCESS' : 'FAILED' }]);

        if (isSuccess) {
            res.json({ success: true, name: fullName });
        } else {
            res.json({ success: false });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error during login");
    }
});

/* SIGNUP */
app.post('/signup', authLimiter, async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const { error } = await supabase
            .from('users')
            .insert([{ name, email, password }]);

        if (error) throw error;
        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

/* SIGNUP VERIFICATION */
app.post('/api/auth/send-signup-code', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    try {
        if (supabase) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (user) {
                return res.status(400).json({ success: false, error: "An account with this email already exists." });
            }
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        tempCodes[email] = { code, expires: Date.now() + (10 * 60 * 1000) };

        const mailOptions = {
            from: process.env.EMAIL_USER || 'your.restaurant.email@gmail.com',
            to: email,
            subject: "Verify your email - Roland's Steak House",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #1b5e20; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0;">Roland's Steak House</h2>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <h3 style="color: #1e293b; margin-top: 0;">Verify Your Email Address</h3>
                        <p style="color: #475569; margin-bottom: 25px;">Welcome! Please use the verification code below to complete your sign up:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1b5e20; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 2px dashed #86efac; display: inline-block; margin-bottom: 25px;">
                            ${escapeHtml(code)}
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">This code will expire in 10 minutes.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to send verification email." });
    }
});

/* FORGOT PASSWORD - USPEEDO INTEGRATION */

app.post('/api/auth/send-code', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    try {
        // 1. Verify user exists (Skip if Supabase is not configured)
        if (supabase) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (userError || !user) {
                return res.status(404).json({ success: false, error: "No account found with this email." });
            }
        } else {
            console.log("Supabase not configured, bypassing user check for prototype.");
        }

        // 2. Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        tempCodes[email] = {
            code: code,
            expires: Date.now() + (10 * 60 * 1000) // 10 minutes
        };

        // 3. Send via Gmail (Nodemailer)
        console.log(`✉️ Sending verification code ${code} to ${email} via Gmail...`);
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your.restaurant.email@gmail.com',
            to: email,
            subject: "Password Reset Code - Roland's Steak House",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #1b5e20; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0;">Roland's Steak House</h2>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <h3 style="color: #1e293b; margin-top: 0;">Password Reset Request</h3>
                        <p style="color: #475569; margin-bottom: 25px;">You requested a password reset. Here is your verification code:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1b5e20; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 2px dashed #86efac; display: inline-block; margin-bottom: 25px;">
                            ${code}
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">This code will expire in 10 minutes.<br>If you did not request this, please ignore this email.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to send email." });
    }
});

app.post('/api/auth/verify-code', (req, res) => {
    const { email, code } = req.body;
    const stored = tempCodes[email];

    if (stored && stored.code === code && Date.now() < stored.expires) {
        res.json({ success: true });
    } else {
        res.json({ success: false, error: "Invalid or expired code." });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { error } = await supabase
            .from('users')
            .update({ password: password })
            .eq('email', email);

        if (error) throw error;

        // Clear the code
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
        const { data, error } = await supabase.from('staff_accounts').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).send("Database error");
    }
});

/* CREATE STAFF ACCOUNT */
app.post('/api/staff', async (req, res) => {
    const { username, passwordHash } = req.body;
    try {
        // PGSQL automatically makes column names lowercase, so we use passwordhash
        const { error } = await supabase
            .from('staff_accounts')
            .insert([{ username: username, passwordhash: passwordHash }]);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).send("Database error");
    }
});

/* DELETE STAFF ACCOUNT */
app.delete('/api/staff/:username', async (req, res) => {
    try {
        const { error } = await supabase
            .from('staff_accounts')
            .delete()
            .eq('username', req.params.username);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).send("Database error");
    }
});

/* RESERVATIONS */
app.get('/reservations', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('id, name, arrivalDate, arrivalTime, tableNo');

        if (error) throw error;

        // Map columns on the fly to match your admin.html JS
        const mappedData = data.map(r => ({
            reservationNumber: r.id,
            customerName: r.name,
            arrivalDate: r.arrivalDate,
            arrivalTime: r.arrivalTime,
            bookedTable: r.tableNo,
            reservationType: 'priority'
        }));

        res.json(mappedData);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database fetch error");
    }
});

/* SAVE NEW RESERVATION */
app.post('/reserve', async (req, res) => {
    console.log("Saving new reservation for:", req.body.name);
    const { name, date, time, table, cartItems, status } = req.body;

    try {
        const { error } = await supabase
            .from('reservations')
            .insert([{
                name: name,
                arrivalDate: date,
                arrivalTime: time,
                tableNo: table,
                status: status || 'pending'
            }]);

        if (error) throw error;

        // Trigger stock deduction if cartItems provided
        if (cartItems && cartItems.length > 0) {
            await deductStock(cartItems);
        }

        res.json({ success: true });

    } catch (err) {
        console.error("Supabase Save Error:", err);
        res.status(500).send("Error saving to database");
    }
});

/* DEDUCT STOCK HELPER */
async function deductStock(cartItems) {
    if (!supabase) return; // Skip if no DB connection
    console.log(`Deducting stock for ${cartItems.length} items...`);
    try {
        for (const item of cartItems) {
            // Find current item in DB
            const { data: invData, error: invError } = await supabase
                .from('inventoryItems')
                .select('id, total_stock')
                .eq('id', item.id)
                .single();

            if (invError || !invData) continue;

            const qty = item.quantity || 1;
            const newStock = Math.max(0, (invData.total_stock || 0) - qty);

            await supabase
                .from('inventoryItems')
                .update({ total_stock: newStock })
                .eq('id', item.id);
        }
    } catch (err) {
        console.error("Stock Deduction Error:", err);
    }
}

/* UPDATE RESERVATION STATUS */
app.post('/api/reservations/update-status', async (req, res) => {
    const { id, status } = req.body;
    try {
        if (!supabase) throw new Error("No database connection");

        // Find by name/date/time since 'id' might be a reservation number string
        // If frontend passes a real Supabase UUID, use it. Otherwise, match by name if id is missing.
        // We'll assume the frontend passes `resNumber` which corresponds to Supabase `id`.

        // To be safe and compatible with local testing where Supabase might not have the ID:
        if (id) {
            const { error } = await supabase
                .from('reservations')
                .update({ status: status })
                .eq('id', id);

            if (error) throw error;
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
