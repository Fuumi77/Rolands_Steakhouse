require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const ALLOWED_ORIGINS = [
    'https:' + '//rolandssteakhouse.com',
    'https:' + '//www.rolandssteakhouse.com',
    'https:' + '//rolands-steakhouse-vqtr.vercel.app',
    'http:' + '//localhost:3000',
    'http:' + '//127.0.0.1:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(null, true); // permissive: log but don't block
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
}));

app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    // Only disable caching on API routes — let images, fonts, and CSS cache in the browser!
    if (req.path.startsWith('/api/') || req.path.startsWith('/reservations') || req.path.startsWith('/reserve')) {
        res.set('Cache-Control', 'no-cache');
    } else if (/\.(jpg|jpeg|png|gif|webp|svg|ico|woff2?|ttf|css)$/i.test(req.path)) {
        res.set('Cache-Control', 'public, max-age=604800'); // Cache static assets for 7 days!
    }
    global.__activeReqBranch = (req.query.branch || (req.body && req.body.branch) || 'General Santos City').trim();
    next();
});

const pool = global.__rolandsMysqlPool || (global.__rolandsMysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    maxIdle: 1,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 5000,
    connectTimeout: 10000,
}));

// 👈 Detect and drop dead connections so the pool rebuilds them
pool.on('connection', (conn) => {
    conn.on('error', (err) => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
            console.warn('MySQL connection dropped, pool will reconnect:', err.code);
        }
    });
});

const db = pool.promise();

async function queryWithRetry(sql, params) {
    try {
        return await db.query(sql, params);
    } catch (err) {
        if (['ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ECONNRESET'].includes(err.code)) {
            console.warn('Retrying query after', err.code);
            return await db.query(sql, params);
        }
        throw err;
    }
}

// Global RAM Cache for system_memory & staff so 5-second polls use 0 MySQL connections!
const memoryCache = global.__rolandsMemCache || (global.__rolandsMemCache = {
    tableOverrides: { data: null, time: 0 },
    floorPlanConfig: { data: null, time: 0 },
    liveChats: { data: null, time: 0 },
    inventoryItems: { data: null, time: 0 },
    inventoryAuditLog: { data: null, time: 0 },
    staffList: { data: null, time: 0 }
});

db.query('SELECT 1').then(async () => {
    console.log('✅ Connected to Hostinger MySQL Database!');
    await db.query("SET time_zone = '+08:00'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN booked_by VARCHAR(50) DEFAULT 'online'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN reservation_type VARCHAR(50) DEFAULT 'standard'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN foods TEXT").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN kds_status VARCHAR(50) DEFAULT 'pending'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN refund_method VARCHAR(50) DEFAULT ''").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN refund_ref VARCHAR(100) DEFAULT ''").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN refunded_by VARCHAR(50) DEFAULT ''").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN refunded_at DATETIME NULL").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN branch VARCHAR(100) DEFAULT 'General Santos City'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN discount_type VARCHAR(50) DEFAULT 'none'").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0").catch(()=>{});
    await db.query("ALTER TABLE reservation_log ADD COLUMN voucher_code VARCHAR(50) DEFAULT ''").catch(()=>{});
    await db.query("CREATE TABLE IF NOT EXISTS system_memory (mem_key VARCHAR(50) PRIMARY KEY, mem_val LONGTEXT)").catch(()=>{});
    await db.query("ALTER TABLE system_memory MODIFY COLUMN mem_val LONGTEXT").catch(()=>{});
    await db.query("ALTER TABLE customer_credentials ADD COLUMN phone VARCHAR(20) DEFAULT ''").catch(()=>{});
    await db.query("ALTER TABLE staff_credentials ADD COLUMN assigned_branch VARCHAR(100) DEFAULT 'General Santos City'").catch(()=>{});

    await db.query(`
        CREATE TABLE IF NOT EXISTS master_inventory (
            item_id VARCHAR(50) PRIMARY KEY,
            item_name VARCHAR(100),
            category VARCHAR(50),
            current_stock DECIMAL(10,2) DEFAULT 0,
            min_threshold DECIMAL(10,2) DEFAULT 0,
            unit_of_measurement VARCHAR(20) DEFAULT 'g',
            branch_location VARCHAR(100) DEFAULT 'General Santos City',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `).catch((e)=> console.error("Inv Table Error:", e));

    // 👉 CRITICAL FIX: Add unit_of_measurement to existing master_inventory table so updates don't fail!
    await db.query("ALTER TABLE master_inventory ADD COLUMN unit_of_measurement VARCHAR(20) DEFAULT 'g'").catch(()=>{});

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

function getConfiguredTransporter() {
    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').trim();
    if (!emailUser || !emailPass || emailUser === 'your.restaurant.email@gmail.com' || emailPass === 'your-app-password') {
        return null;
    }
    return {
        emailUser,
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT || 465),
            secure: String(process.env.SMTP_PORT || '465') === '465',
            connectionTimeout: 6000,
            greetingTimeout: 6000,
            socketTimeout: 8000,
            auth: { user: emailUser, pass: emailPass }
        })
    };
}

// Unified email sender: prefers HTTPS port-443 relays (Render Free Tier blocks SMTP ports 25/465/587)
async function sendRestaurantEmail({ to, subject, html, text }) {
    const cleanTo = String(to || '').trim();
    if (!cleanTo) return { sent: false, warning: 'No recipient email provided.' };

    const senderEmail = (process.env.EMAIL_FROM || process.env.EMAIL_USER || 'rolandssteakhouse1994@gmail.com').trim();
    const senderName = "Roland's Steakhouse";

    // 1. Google Apps Script or custom HTTPS Email Webhook (Free, sends via Gmail over Port 443)
    const webhookUrl = (process.env.EMAIL_WEBHOOK_URL || '').trim();
    if (webhookUrl) {
        const resp = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            body: JSON.stringify({
                to: cleanTo,
                subject,
                html,
                text: text || '',
                fromName: senderName,
                replyTo: senderEmail,
                secret: (process.env.EMAIL_WEBHOOK_SECRET || '').trim()
            })
        });
        const rawText = await resp.text().catch(() => '');
        if (!resp.ok) throw new Error(`Webhook HTTP ${resp.status}`);
        let parsed = null;
        try {
            parsed = JSON.parse(rawText);
        } catch (e) {
            if (/<html|accounts\.google\.com|Sign in/i.test(rawText)) {
                throw new Error('Google Apps Script denied access — redeploy the Web App with "Who has access: Anyone".');
            }
            throw new Error('Email webhook returned an invalid response (expected JSON {success:true}).');
        }
        if (!parsed || parsed.success !== true) {
            throw new Error((parsed && parsed.error) || 'Email webhook rejected request.');
        }
        return { sent: true, via: 'webhook' };
    }

    // 2. Brevo HTTP API (Port 443, allows single-sender Gmail without domain DNS changes)
    const brevoKey = (process.env.BREVO_API_KEY || '').trim();
    if (brevoKey) {
        const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': brevoKey,
                'accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: senderName, email: senderEmail },
                to: [{ email: cleanTo }],
                subject,
                htmlContent: html
            })
        });
        if (!resp.ok) {
            const errBody = await resp.json().catch(() => ({}));
            throw new Error(errBody.message || `Brevo API HTTP ${resp.status}`);
        }
        return { sent: true, via: 'brevo' };
    }

    // 3. Resend HTTP API (Port 443)
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendKey) {
        const resendFrom = (process.env.RESEND_FROM || `${senderName} <onboarding@resend.dev>`).trim();
        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`
            },
            body: JSON.stringify({
                from: resendFrom,
                to: [cleanTo],
                reply_to: senderEmail,
                subject,
                html
            })
        });
        if (!resp.ok) {
            const errBody = await resp.json().catch(() => ({}));
            throw new Error(errBody.message || `Resend API HTTP ${resp.status}`);
        }
        return { sent: true, via: 'resend' };
    }

    // 4. Direct SMTP fallback (works locally or on paid hosts; Render Free tier blocks ports 25/465/587)
    const smtpCfg = getConfiguredTransporter();
    if (!smtpCfg) {
        return {
            sent: false,
            warning: 'No email transport configured (set EMAIL_WEBHOOK_URL, BREVO_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS).'
        };
    }

    try {
        await smtpCfg.transporter.sendMail({
            from: `"${senderName}" <${smtpCfg.emailUser}>`,
            to: cleanTo,
            subject,
            html
        });
        return { sent: true, via: 'smtp' };
    } catch (smtpErr) {
        const msg = String(smtpErr && smtpErr.message || 'SMTP error');
        if (/timeout|ETIMEDOUT|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH/i.test(msg)) {
            throw new Error('Render Free tier blocks outbound Gmail SMTP (Connection timeout). Add EMAIL_WEBHOOK_URL (free Google Apps Script) or BREVO_API_KEY in Render Environment Variables to send over HTTPS.');
        }
        throw smtpErr;
    }
}

app.post('/api/send-receipt', emailLimiter, async (req, res) => {
    const { email, subject, html, customerName, amount, reservationNumber, paymentMethod, arrivalDateTime, table, orderSummary, branch, discountType, discountAmount } = req.body;
    if (!email) return res.status(200).json({ success: false, message: 'No email provided' });

    const resCode = String(reservationNumber || 'N/A').trim();
    const receiptVerifyUrl = `https://rolandssteakhouse.com/receipt.html?res=${encodeURIComponent(resCode)}`;
    // QR encodes the exact receipt verification URL & reservation ID scanned for payment proof
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(receiptVerifyUrl)}`;
    const branchLabel = branch || global.__activeReqBranch || 'General Santos City';
    const discAmt = Number(discountAmount || 0);
    const discRowHtml = (discountType && discountType !== 'none' && discAmt > 0)
        ? `<div style="color:#c2410c;"><strong>Discount (${escapeHtml(String(discountType).toUpperCase())}):</strong> -₱${discAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>`
        : '';

    const finalSubject = subject || `Official E-Receipt & QR Payment Proof (${resCode}) - Roland's Steakhouse`;
    let finalHtml = html || `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #1b5e20, #166534); color: white; padding: 22px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px;">Roland's Steakhouse</h2>
                <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Official E-Receipt & QR Payment Proof — ${escapeHtml(branchLabel)}</p>
            </div>
            <div style="padding: 22px; color: #1e293b; font-size: 14px; line-height: 1.6;">
                <p>Hi <strong>${escapeHtml(customerName || 'Valued Guest')}</strong>,</p>
                <p>Your reservation and payment have been recorded! Present the QR code below upon arrival for instant proof verification:</p>
                
                <!-- SCANNABLE QR CODE FOR PAYMENT PROOF -->
                <div style="text-align: center; margin: 18px 0; background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 18px;">
                    <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">Scan QR for Official Payment Proof</div>
                    <img src="${qrUrl}" alt="Payment Proof QR Code" width="180" height="180" style="border: 1px solid #bbf7d0; border-radius: 10px; padding: 8px; background: #ffffff; display: inline-block;" />
                    <div style="font-size: 16px; font-weight: 900; color: #15803d; margin-top: 8px; letter-spacing: 1px;">${escapeHtml(resCode)}</div>
                    <div style="font-size: 11.5px; color: #475569; margin-top: 4px;">
                        <a href="${receiptVerifyUrl}" style="color: #15803d; font-weight: bold; text-decoration: underline;">Open Digital Receipt & QR Proof in Browser</a>
                    </div>
                </div>

                <div style="background: #f8fafc; padding: 14px 16px; border-radius: 10px; border: 1px solid #cbd5e1; margin: 16px 0;">
                    <div><strong>Reservation #:</strong> ${escapeHtml(resCode)}</div>
                    <div><strong>Branch:</strong> ${escapeHtml(branchLabel)}</div>
                    <div><strong>Table:</strong> ${escapeHtml(table || 'Assigned Table')}</div>
                    <div><strong>Arrival:</strong> ${escapeHtml(arrivalDateTime || 'Scheduled')}</div>
                    <div><strong>Order:</strong> ${escapeHtml(orderSummary || 'Table Reservation')}</div>
                    <div><strong>Payment Method:</strong> ${escapeHtml(paymentMethod || 'Online / Verified')}</div>
                    ${discRowHtml}
                    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 17px; color: #1b5e20;">
                        <strong>Total Paid:</strong> ₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <p style="font-size: 12px; color: #64748b; text-align: center;">Thank you for dining with <strong>Roland's Steakhouse</strong>!</p>
            </div>
        </div>
    `;

    // If custom HTML was sent without a QR image, append the QR proof block automatically
    if (html && !String(html).includes('api.qrserver.com') && resCode !== 'N/A') {
        finalHtml += `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 12px auto; text-align: center; background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 16px;">
                <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 8px;">Official Payment Proof QR (${escapeHtml(resCode)})</div>
                <img src="${qrUrl}" alt="Payment Proof QR" width="170" height="170" style="border: 1px solid #bbf7d0; border-radius: 10px; padding: 6px; background: #ffffff; display: inline-block;" />
                <div style="font-size: 11.5px; margin-top: 6px;"><a href="${receiptVerifyUrl}" style="color: #15803d; font-weight: bold;">View Full Digital Receipt</a></div>
            </div>
        `;
    }

    try {
        const result = await sendRestaurantEmail({
            to: email,
            subject: finalSubject,
            html: finalHtml
        });
        if (!result.sent) {
            return res.status(200).json({ success: true, emailSent: false, warning: result.warning || 'Email not configured.' });
        }
        res.status(200).json({ success: true, emailSent: true, via: result.via });
    } catch (err) {
        console.log('[DEV MODE] Receipt email skipped:', err.message);
        res.status(200).json({ success: true, emailSent: false, warning: err.message || 'Email not configured' });
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
                    payment_method_types: ['qrph', 'gcash', 'paymaya', 'card', 'dob'],
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
            const mailRes = await sendRestaurantEmail({
                to: email,
                subject: "Your Roland's Steakhouse Verification Code",
                html: `<h2>Welcome to Roland's!</h2><p>Your verification code is: <strong style="font-size:24px; color:#1b5e20;">${code}</strong></p><p>This code expires in 10 minutes.</p>`
            });
            if (!mailRes.sent) {
                return res.json({ success: true, warning: mailRes.warning || 'Email not configured.' });
            }
            res.json({ success: true });
        } catch (error) {
            console.log(`[DEV MODE] Email failed to send. The code for ${email} is: ${code} (${error.message})`);
            res.json({ success: true, warning: error.message || 'Email delivery failed.' });
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
            const mailRes = await sendRestaurantEmail({
                to: email,
                subject: "Password Reset Code - Roland's Steakhouse",
                html: `<h2>Password Reset</h2><p>Your password reset code is: <strong style="font-size:24px; color:#1b5e20;">${code}</strong></p><p>This code expires in 10 minutes.</p>`
            });
            if (!mailRes.sent) {
                return res.json({ success: true, warning: mailRes.warning || 'Email not configured.' });
            }
            res.json({ success: true });
        } catch (error) {
            console.log(`[DEV MODE] Email failed to send. The reset code for ${email} is: ${code} (${error.message})`);
            res.json({ success: true, warning: error.message || 'Email delivery failed.' });
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
        memoryCache.staffList.time = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).send("Database error"); }
});

/* UPDATE STAFF PASSWORD */
app.put('/api/staff/:username/password', async (req, res) => {
    const { passwordHash } = req.body;
    try {
        await db.query('UPDATE staff_credentials SET password_hash = ? WHERE username = ?', [passwordHash, req.params.username]);
        memoryCache.staffList.time = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).send("Database error"); }
});

/* UPDATE STAFF ASSIGNED BRANCH */
app.put('/api/staff/:username/branch', async (req, res) => {
    const { branch } = req.body;
    try {
        await db.query('UPDATE staff_credentials SET assigned_branch = ? WHERE username = ?', [branch || 'General Santos City', req.params.username]);
        memoryCache.staffList.time = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* CREATE NEW STAFF ACCOUNT */
app.post('/api/staff', async (req, res) => {
    const { username, passwordHash, branch } = req.body;
    try {
        await db.query(
            "INSERT INTO staff_credentials (username, password_hash, role, assigned_branch) VALUES (?, ?, 'Staff', ?)",
            [username, passwordHash, branch || 'General Santos City']
        );
        memoryCache.staffList.time = 0;
        res.json({ success: true });
    } catch (err) {
        console.error("Create Staff Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/* GET STAFF ACCOUNTS (RAM Cached for 60s) */
app.get('/api/staff', async (req, res) => {
    try {
        if (memoryCache.staffList.data && (Date.now() - memoryCache.staffList.time < 60000)) {
            return res.json(memoryCache.staffList.data);
        }
        const [rows] = await db.query("SELECT username, password_hash, role, last_active, COALESCE(assigned_branch, 'General Santos City') AS branch FROM staff_credentials");
        memoryCache.staffList.data = rows;
        memoryCache.staffList.time = Date.now();
        res.json(rows);
    } catch (err) {
        if (memoryCache.staffList.data) return res.json(memoryCache.staffList.data);
        res.status(500).send("Database error");
    }
});

/* REAL CLOUD ONLINE STATUS TRACKER (Updates RAM immediately, writes to DB max once per 2 mins) */
app.post('/api/staff/heartbeat', async (req, res) => {
    try {
        const uname = req.body.username;
        if (uname) {
            const now = Date.now();
            if (Array.isArray(memoryCache.staffList.data)) {
                const u = memoryCache.staffList.data.find(s => s.username === uname);
                if (u) u.last_active = now;
            }
            // Only write heartbeat to MySQL once every 2 minutes to save connections
            global.__lastStaffDbBeat = global.__lastStaffDbBeat || {};
            if (!global.__lastStaffDbBeat[uname] || (now - global.__lastStaffDbBeat[uname] > 120000)) {
                global.__lastStaffDbBeat[uname] = now;
                await db.query('UPDATE staff_credentials SET last_active = ? WHERE username = ?', [now, uname]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.json({ success: true });
    }
});

/* ── ANTI-DDOS RAM CACHES ── */
let cachedReservations = null;
let resCacheTime = 0;

app.get('/reservations', async (req, res) => {
    try {
        const reqBranch = (req.query.branch || '').trim();
        if (!cachedReservations || (Date.now() - resCacheTime >= 5000)) {
            // Auto-complete active/seated reservations in MySQL ONLY after 3 hours past their reservation_time
            await db.query(`
                UPDATE reservation_log 
                SET status = 'Completed', kds_status = 'served' 
                WHERE status IN ('Approved', 'Seated', 'Walk-in') 
                  AND reservation_time < DATE_SUB(NOW(), INTERVAL 3 HOUR)
            `).catch(() => {});

            const [rows] = await queryWithRetry(`
                SELECT r.reservation_id, c.name, c.email, c.phone,
                       DATE_FORMAT(r.reservation_time, '%Y-%m-%d') AS ph_date,
                       DATE_FORMAT(r.reservation_time, '%H:%i') AS ph_time,
                       r.reservation_time, r.table_number, r.status, r.booked_by,
                       r.reservation_type, r.payment_amount, r.foods, r.kds_status, r.branch,
                       r.payment_status, r.refund_amount, r.refund_method, r.refund_ref, r.refunded_at,
                       r.discount_type, r.discount_amount, r.voucher_code
                FROM reservation_log r
                JOIN customer_credentials c ON r.customer_id = c.customer_id
            `);

            cachedReservations = rows.map(r => {
                const d = new Date(r.reservation_time);
                const isStaff = r.booked_by === 'staff';
                const isPos = r.booked_by === 'pos';
                const isVip = String(r.reservation_type || '').toLowerCase() === 'vip' || Number(r.table_number) === 99;
                const prefix = isPos ? 'POS-' : (isStaff ? 'WI-' : (isVip ? 'VIP-' : 'RES-'));
                let rawFoods = [];
                try { rawFoods = r.foods ? JSON.parse(r.foods) : []; } catch(e) {}
                let parsedFoods = [];
                let extractedNote = '';
                if (Array.isArray(rawFoods)) {
                    rawFoods.forEach(item => {
                        const str = String(item || '').trim();
                        const m = str.match(/^\[\[ORDER_NOTE:\s*([\s\S]*?)\]\]$/i);
                        if (m) {
                            if (m[1] && m[1].trim()) extractedNote = m[1].trim();
                        } else if (str) {
                            parsedFoods.push(item);
                        }
                    });
                }

                const tableLabel = (Number(r.table_number) === 99 || isVip) ? 'VIP Room' : `Table ${r.table_number}`;
                let displayCustomerName = r.name || 'Guest';
                if (isPos && (!r.name || /^(walk-in guest|walk-in|pos customer|guest)$/i.test(String(r.name).trim()))) {
                    displayCustomerName = `Dine-In Customer (${tableLabel})`;
                }

                const isRefunded = r.payment_status === 'refunded' || parseFloat(r.refund_amount) > 0;
                const cleanEmail = (r.email && !/@(temp\.com|rolands\.local)$/i.test(String(r.email).trim())) ? String(r.email).trim() : '';

                return {
                    reservationNumber: `${prefix}${r.reservation_id}`,
                    customerName: displayCustomerName,
                    email: cleanEmail,
                    phone: r.phone || '',
                    arrivalDate: r.ph_date || d.toLocaleDateString('en-CA'),
                    arrivalTime: r.ph_time || d.toTimeString().substring(0, 5),
                    bookedTable: tableLabel,
                    status: r.status,
                    bookedBy: r.booked_by,
                    reservationType: isVip ? 'vip' : (r.reservation_type || 'standard'),
                    paymentAmount: parseFloat(r.payment_amount) || 0,
                    paymentStatus: isRefunded ? 'refunded' : (r.payment_status || 'unpaid'),
                    refundStatus: isRefunded ? 'refunded' : '',
                    refundAmount: parseFloat(r.refund_amount) || 0,
                    refundMethod: r.refund_method || '',
                    refundRef: r.refund_ref || '',
                    refundedAt: r.refunded_at || null,
                    discountType: r.discount_type || 'none',
                    discountAmount: parseFloat(r.discount_amount) || 0,
                    voucherCode: r.voucher_code || '',
                    foods: parsedFoods,
                    beefNote: extractedNote,
                    notes: extractedNote,
                    kdsStatus: r.kds_status || 'pending',
                    branch: r.branch || 'General Santos City'
                };
            });
            resCacheTime = Date.now();
        }

        if (reqBranch && reqBranch !== 'ALL') {
            return res.json(cachedReservations.filter(r => (r.branch || 'General Santos City') === reqBranch));
        }
        res.json(cachedReservations);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/reserve', async (req, res) => {
    const { name, email, date, time, table, status, reservationType, paymentAmount, foods, beefNote, notes, kitchenTiming, branch, discountType, discountAmount, voucherCode, paymentProof, discountProofImage, paymentRef, bookedBy: reqBookedBy, isWalkin: reqIsWalkin } = req.body;
    const finalBranch = (branch || req.query.branch || 'General Santos City').trim();
    try {
        const cleanName = (name || 'Guest').trim();
        const cleanEmail = (email || '').trim();

        let customers = [];
        if (cleanEmail && !cleanEmail.includes('@temp.com')) {
            [customers] = await db.query('SELECT customer_id, name, password_hash FROM customer_credentials WHERE email = ? LIMIT 1', [cleanEmail]);
            if (customers.length > 0 && cleanName && customers[0].name !== cleanName && customers[0].password_hash === 'guest') {
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

        const isVipBooking = /vip/i.test(String(table || '')) || String(reservationType || '').toLowerCase() === 'vip';
        const tableInt = isVipBooking ? 99 : (parseInt(String(table).replace(/[^0-9]/g, '')) || 1);
        const finalResType = isVipBooking ? 'vip' : (reservationType || 'standard');

        const safeDate = (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : new Date().toISOString().split('T')[0];
        const safeTime = (time && /^\d{2}:\d{2}/.test(time)) ? time.substring(0, 5) : '12:00';
        const reservationTime = `${safeDate} ${safeTime}:00`;

        const isWalkin = String(reqBookedBy || '').toLowerCase() === 'staff' || reqIsWalkin === true || cleanEmail.includes('walkin-');
        const isPos = !isWalkin && (String(reqBookedBy || '').toLowerCase() === 'pos' || cleanEmail.includes('pos-'));
        const bookedBy = isWalkin ? 'staff' : (isPos ? 'pos' : 'online');
        let finalBeefNote = String(beefNote || notes || '').trim();
        if (kitchenTiming && !/KITCHEN_TIMING/i.test(finalBeefNote)) {
            finalBeefNote = finalBeefNote ? `${finalBeefNote} | [[KITCHEN_TIMING: ${kitchenTiming}]]` : `[[KITCHEN_TIMING: ${kitchenTiming}]]`;
        }
        const foodsArr = Array.isArray(foods) ? [...foods] : (foods ? [foods] : []);
        const cleanFoodsArr = foodsArr.filter(f => !/^\[\[ORDER_NOTE:/i.test(String(f || '').trim()));
        if (finalBeefNote) cleanFoodsArr.push(`[[ORDER_NOTE: ${finalBeefNote}]]`);
        const foodsJson = JSON.stringify(cleanFoodsArr);

        const finalDiscType = String(discountType || 'none').toLowerCase().trim();
        const finalDiscAmt = Math.max(0, Number(discountAmount) || 0);
        const finalVoucher = String(voucherCode || '').trim();

        const [result] = await db.query(
            'INSERT INTO reservation_log (customer_id, table_number, reservation_time, status, booked_by, reservation_type, payment_amount, foods, branch, discount_type, discount_amount, voucher_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [customerId, tableInt, reservationTime, status || 'Pending', bookedBy, finalResType, Number(paymentAmount) || 0, foodsJson, finalBranch, finalDiscType, finalDiscAmt, finalVoucher]
        );

        // Save uploaded payment screenshot & discount ID/voucher photo in cloud memory for cross-device Proof Viewer
        if (paymentProof || discountProofImage || paymentRef) {
            try {
                const prefix = isPos ? 'POS-' : (isWalkin ? 'WI-' : (isVipBooking ? 'VIP-' : 'RES-'));
                const fullResNum = `${prefix}${result.insertId}`;
                const proofPayload = {
                    paymentProof: paymentProof || '',
                    discountProofImage: discountProofImage || '',
                    paymentRef: paymentRef || '',
                    updatedAt: Date.now()
                };
                // Store per-order key so large base64 IDs/receipts never bloat or overflow a shared row
                await setSystemMemoryKey(`orderProof_${fullResNum}`, proofPayload);
            } catch (e) {
                console.error('Failed to save orderProof:', e);
            }
        }

        cachedReservations = null;
        res.json({ success: true, reservationId: result.insertId, branch: finalBranch, discountType: finalDiscType, discountAmount: finalDiscAmt, voucherCode: finalVoucher }); 
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

// 👉 HELPER: Converts Website ISO Timestamp (or current time) into exact Philippine Time (UTC+8) for MySQL!
function toPhilippineTimeSQL(isoOrDate) {
    const baseDate = isoOrDate ? new Date(isoOrDate) : new Date();
    const validDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    // Shift UTC milliseconds by +8 hours (28,800,000 ms) so MySQL stores exact PH local clock time
    const phTime = new Date(validDate.getTime() + (8 * 60 * 60 * 1000));
    return phTime.toISOString().slice(0, 19).replace('T', ' ');
}

// Official Unit & Metadata Lookup Table (Guarantees 100% accurate units in MySQL)
const MASTER_INGREDIENT_META = {
    'ING-BEEF-TENDERLOIN': { category: 'Meat', minThreshold: 2500, unit: 'g' },
    'ING-BEEF-RIBEYE':     { category: 'Meat', minThreshold: 3000, unit: 'g' },
    'ING-BEEF-TBONE':      { category: 'Meat', minThreshold: 3000, unit: 'g' },
    'ING-BEEF-SIRLOIN':    { category: 'Meat', minThreshold: 2500, unit: 'g' },
    'ING-BEEF-PATTY':      { category: 'Meat', minThreshold: 20,   unit: 'pcs' },
    'ING-CHICKEN-WHOLE':   { category: 'Poultry', minThreshold: 10, unit: 'pcs' },
    'ING-FISH-TANIGUE':    { category: 'Seafood', minThreshold: 2000, unit: 'g' },
    'ING-FISH-BANGUS':     { category: 'Seafood', minThreshold: 10, unit: 'pcs' },
    'ING-SALT-PEPPER':     { category: 'Produce', minThreshold: 500, unit: 'g' },
    'ING-MARGARINE':       { category: 'Dairy', minThreshold: 1000, unit: 'g' },
    'ING-OYSTER-SAUCE':    { category: 'Sauces & Liquids', minThreshold: 1500, unit: 'ml' },
    'ING-KETCHUP':         { category: 'Sauces & Liquids', minThreshold: 1000, unit: 'g' },
    'ING-BUTTER':          { category: 'Dairy', minThreshold: 800, unit: 'g' },
    'ING-TOYO':            { category: 'Sauces & Liquids', minThreshold: 1500, unit: 'ml' },
    'ING-KALAMANSI':       { category: 'Produce', minThreshold: 800, unit: 'ml' },
    'ING-BURGER-BUN':      { category: 'Bakery', minThreshold: 25, unit: 'pcs' },
    'ING-BREAD-GARLIC':    { category: 'Bakery', minThreshold: 20, unit: 'pcs' },
    'ING-POTATO':          { category: 'Produce', minThreshold: 5000, unit: 'g' },
    'ING-RICE':            { category: 'Grains', minThreshold: 8000, unit: 'g' },
    'ING-MUSHROOM-SAUCE':  { category: 'Sauces & Liquids', minThreshold: 1500, unit: 'ml' },
    'ING-CHICKEN-SOUP-BASE':{ category: 'Sauces & Liquids', minThreshold: 1000, unit: 'ml' },
    'ING-GARLIC':          { category: 'Produce', minThreshold: 500, unit: 'g' },
    'ING-WINE-CARLO-RED':  { category: 'Beverages', minThreshold: 6, unit: 'pcs' },
    'ING-WINE-CARLO-WHITE':{ category: 'Beverages', minThreshold: 6, unit: 'pcs' },
    'ING-WINE-PEGOES':     { category: 'Beverages', minThreshold: 5, unit: 'pcs' },
    'ING-MANGO-JUICE':     { category: 'Beverages', minThreshold: 2000, unit: 'ml' },
    'ING-PINEAPPLE-JUICE': { category: 'Beverages', minThreshold: 2000, unit: 'ml' },
    'ING-ICED-TEA':        { category: 'Beverages', minThreshold: 3000, unit: 'ml' },
    'ING-JUICE-FOUR-SEASONS': { category: 'Beverages', minThreshold: 2000, unit: 'ml' },
    'ING-JUICE-PINEORANGE':{ category: 'Beverages', minThreshold: 2000, unit: 'ml' },
    'ING-JUICE-CUCUMBER':  { category: 'Beverages', minThreshold: 1500, unit: 'ml' },
    'ING-JUICE-BLUE-LEMONADE': { category: 'Beverages', minThreshold: 1500, unit: 'ml' },
    'ING-JUICE-CALAMANSI': { category: 'Beverages', minThreshold: 1200, unit: 'ml' },
    'ING-COKE-CAN':        { category: 'Beverages', minThreshold: 20, unit: 'pcs' },
    'ING-SPRITE-CAN':      { category: 'Beverages', minThreshold: 20, unit: 'pcs' },
    'ING-BEER-PILSEN':     { category: 'Beverages', minThreshold: 24, unit: 'pcs' },
    'ING-BEER-LIGHT':      { category: 'Beverages', minThreshold: 24, unit: 'pcs' },
    'ING-WATER-BOTTLE':    { category: 'Beverages', minThreshold: 30, unit: 'pcs' },
    'ING-TEA-BAGS':        { category: 'Beverages', minThreshold: 20, unit: 'pcs' },
    'ING-COFFEE-BEANS':    { category: 'Beverages', minThreshold: 1000, unit: 'g' },
    'ING-MILK-CREAM':      { category: 'Dairy', minThreshold: 1000, unit: 'ml' }
};

// Auto-repair existing master_inventory units & categories once on server startup
setTimeout(async () => {
    try {
        await db.query("ALTER TABLE master_inventory ADD COLUMN unit_of_measurement VARCHAR(20) DEFAULT 'g'").catch(()=>{});
        for (const [id, meta] of Object.entries(MASTER_INGREDIENT_META)) {
            await db.query(
                "UPDATE master_inventory SET category = ?, min_threshold = ?, unit_of_measurement = ? WHERE item_id = ? AND (unit_of_measurement = 'g' OR category = 'General' OR min_threshold <= 10)",
                [meta.category, meta.minThreshold, meta.unit, id]
            ).catch(()=>{});
        }
    } catch (e) {}
}, 2000);

function scopedInvItemId(id, req) {
    const branch = (req.query.branch || (req.body && req.body.branch) || global.__activeReqBranch || 'General Santos City').trim();
    if (!branch || branch === 'General Santos City' || branch === 'ALL') return { dbId: id, branch: 'General Santos City' };
    const prefix = branch.replace(/\s+/g, '_').toUpperCase() + '__';
    return { dbId: String(id).startsWith(prefix) ? id : `${prefix}${id}`, branch, prefix };
}

app.get('/api/inventory/raw', async (req, res) => {
    try {
        const { branch, prefix } = scopedInvItemId('', req);
        const [rows] = await queryWithRetry('SELECT * FROM master_inventory WHERE branch_location = ?', [branch]);
        const result = rows.map(r => {
            const cleanId = prefix && String(r.item_id).startsWith(prefix) ? r.item_id.slice(prefix.length) : r.item_id;
            const meta = MASTER_INGREDIENT_META[cleanId] || {};
            return {
                id: cleanId,
                name: r.item_name,
                category: (r.category && r.category !== 'General') ? r.category : (meta.category || 'General'),
                stock: parseFloat(r.current_stock) || 0,
                minThreshold: parseFloat(r.min_threshold) > 10 ? parseFloat(r.min_threshold) : (meta.minThreshold || 10),
                unit: meta.unit || r.unit_of_measurement || 'g',
                branch: r.branch_location || branch
            };
        });
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* DELETE RAW INGREDIENT ROUTE */
app.delete('/api/inventory/raw/:id', async (req, res) => {
    try {
        const rawId = decodeURIComponent(req.params.id || '');
        const { dbId } = scopedInvItemId(rawId, req);
        await db.query('DELETE FROM master_inventory WHERE item_id = ? OR item_id = ?', [dbId, rawId]);
        cachedInventory = null;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/restock', async (req, res) => {
    const { id, name, category, addAmount, minThreshold, unit, timestamp } = req.body;
    try {
        const { dbId, branch } = scopedInvItemId(id, req);
        const meta = MASTER_INGREDIENT_META[id] || {};
        const finalUnit = unit || meta.unit || 'g';
        const finalCat = (category && category !== 'General') ? category : (meta.category || 'General');
        const finalThresh = minThreshold || meta.minThreshold || 100;
        const phNow = toPhilippineTimeSQL(timestamp);

        const [current] = await db.query('SELECT current_stock FROM master_inventory WHERE item_id = ? LIMIT 1', [dbId]);
        const prevStock = current.length > 0 ? parseFloat(current[0].current_stock) : 0;
        const newStock = prevStock + Number(addAmount || 0);

        if (current.length > 0) {
            await db.query(
                'UPDATE master_inventory SET current_stock = ?, category = ?, min_threshold = ?, unit_of_measurement = ?, last_updated = ? WHERE item_id = ?',
                [newStock, finalCat, finalThresh, finalUnit, phNow, dbId]
            );
        } else {
            await db.query(
                'INSERT INTO master_inventory (item_id, item_name, category, current_stock, min_threshold, unit_of_measurement, branch_location, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [dbId, name, finalCat, newStock, finalThresh, finalUnit, branch, phNow]
            );
        }

        await db.query(
            'INSERT INTO raw_ingredients_change_log (ingredient_name, previous_quantity, new_quantity, unit_of_measurement, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [`[${branch}] ${name}`, prevStock, newStock, finalUnit, 1, phNow]
        );
        cachedInventory = null; 
        res.json({ success: true, newStock: newStock });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/deduct-raw', async (req, res) => {
    const { items, operator, timestamp } = req.body;
    try {
        const staffId = parseInt(operator) || 1;
        const phNow = toPhilippineTimeSQL(timestamp);
        for (let i of (items || [])) {
            const { dbId, branch } = scopedInvItemId(i.id, req);
            const meta = MASTER_INGREDIENT_META[i.id] || {};
            const finalUnit = i.unit || meta.unit || 'g';
            const [current] = await db.query('SELECT current_stock FROM master_inventory WHERE item_id = ? LIMIT 1', [dbId]);
            const prevStock = current.length > 0 ? parseFloat(current[0].current_stock) : 0;
            const newStock = Math.max(0, prevStock - Number(i.deductQty || 0));

            if (current.length > 0) {
                await db.query('UPDATE master_inventory SET current_stock = ?, unit_of_measurement = ?, last_updated = ? WHERE item_id = ?', [newStock, finalUnit, phNow, dbId]);
            }
            
            await db.query(
                'INSERT INTO raw_ingredients_change_log (ingredient_name, previous_quantity, new_quantity, unit_of_measurement, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [`[${branch}] ${i.name}`, prevStock, newStock, finalUnit, staffId, phNow]
            );
        }
        cachedInventory = null; 
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/sync-movement', async (req, res) => {
    const movements = Array.isArray(req.body.movements) ? req.body.movements : [req.body];
    try {
        for (const m of movements) {
            const { ingredientId, ingredientName, category, minThreshold, changeQty, newStock, unit, operator, timestamp } = m;
            if (!ingredientId) continue;

            const { dbId, branch } = scopedInvItemId(ingredientId, req);
            const meta = MASTER_INGREDIENT_META[ingredientId] || {};
            const finalUnit = meta.unit || unit || 'g';
            const finalCat = (category && category !== 'General') ? category : (meta.category || 'General');
            const finalThresh = (minThreshold && minThreshold > 10) ? minThreshold : (meta.minThreshold || 100);
            const phNow = toPhilippineTimeSQL(timestamp);

            const [current] = await db.query(
                'SELECT item_id, current_stock FROM master_inventory WHERE item_id = ? LIMIT 1',
                [dbId]
            );
            let prevStock = 0;
            const safeNewStock = Math.max(0, parseFloat(newStock) || 0);

            if (current.length > 0) {
                prevStock = parseFloat(current[0].current_stock) || 0;
                await db.query(
                    `UPDATE master_inventory 
                     SET current_stock = ?, 
                         item_name = COALESCE(?, item_name),
                         category = ?,
                         min_threshold = ?,
                         unit_of_measurement = ?,
                         branch_location = ?,
                         last_updated = ?
                     WHERE item_id = ?`,
                    [safeNewStock, ingredientName || null, finalCat, finalThresh, finalUnit, branch, phNow, current[0].item_id]
                );
            } else {
                prevStock = Math.max(0, safeNewStock - (parseFloat(changeQty) || 0));
                await db.query(
                    'INSERT INTO master_inventory (item_id, item_name, category, current_stock, min_threshold, unit_of_measurement, branch_location, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [dbId, ingredientName || ingredientId, finalCat, safeNewStock, finalThresh, finalUnit, branch, phNow]
                );
            }

            const staffId = parseInt(operator) || 1;
            if (Math.abs(safeNewStock - prevStock) > 0.001 || Number(changeQty) !== 0) {
                await db.query(
                    'INSERT INTO raw_ingredients_change_log (ingredient_name, previous_quantity, new_quantity, unit_of_measurement, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [`[${branch}] ${ingredientName || ingredientId}`, prevStock, safeNewStock, finalUnit, staffId, phNow]
                );
            }
        }

        cachedInventory = null; 
        res.json({ success: true });
    } catch (err) {
        console.error('sync-movement error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/* 👉 AUDIT LOG CLOUD SYNC — read the shared movement log back to every device */
app.get('/api/inventory/audit-log', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('inventoryAuditLog', []);
        res.json(Array.isArray(data) ? data : []);
    } catch (err) {
        res.json(memoryCache.inventoryAuditLog ? (memoryCache.inventoryAuditLog.data || []) : []);
    }
});

app.post('/api/inventory/audit-log', async (req, res) => {
    try {
        const incoming = Array.isArray(req.body) ? req.body : (req.body.logs || []);
        if (incoming.length === 0) return res.json({ success: true, count: 0 });

        let existing = await getSystemMemoryKey('inventoryAuditLog', []);
        if (!Array.isArray(existing)) existing = [];

        const byId = {};
        existing.forEach(l => { if (l && l.id) byId[l.id] = l; });
        incoming.forEach(l => { if (l && l.id) byId[l.id] = l; });

        // Newest first, capped so the row stays small
        const merged = Object.values(byId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 500);

        await setSystemMemoryKey('inventoryAuditLog', merged);
        res.json({ success: true, count: merged.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* 👉 LOG MENU PORTION REDUCTIONS TO menu_stock_change_log WITH EXACT PH TIMESTAMP */
app.post('/api/inventory/log-menu-stock', async (req, res) => {
    const { changes, updatedBy, timestamp } = req.body;
    try {
        const staffId = parseInt(updatedBy) || 1;
        const phNow = toPhilippineTimeSQL(timestamp);
        if (Array.isArray(changes)) {
            for (const c of changes) {
                if (c && c.itemName && c.previousStock !== c.newStock) {
                    await db.query(
                        'INSERT INTO menu_stock_change_log (item_name, previous_stock, new_stock, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)',
                        [c.itemName, parseInt(c.previousStock) || 0, parseInt(c.newStock) || 0, staffId, toPhilippineTimeSQL(c.timestamp || timestamp)]
                    );
                }
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reservations/update-status', async (req, res) => {
    const { id, status } = req.body;
    try {
        const numericId = String(id).replace(/[^0-9]/g, '');
        if (numericId) {
            const lower = String(status || '').toLowerCase().trim();
            // 👉 FIX: If an order is Completed, Cancelled, or Rejected, automatically close its Kitchen ticket too!
            if (lower === 'completed') {
                await db.query("UPDATE reservation_log SET status = ?, kds_status = 'served' WHERE reservation_id = ?", [status, numericId]);
            } else if (lower === 'cancelled' || lower === 'rejected') {
                await db.query("UPDATE reservation_log SET status = ?, kds_status = 'cancelled' WHERE reservation_id = ?", [status, numericId]);
            } else {
                await db.query('UPDATE reservation_log SET status = ? WHERE reservation_id = ?', [status, numericId]);
            }
        }
        cachedReservations = null;
        resCacheTime = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reservations/refund', async (req, res) => {
    const { id, refundAmount, refundMethod, refundRef, operator, email } = req.body;
    try {
        const numericId = String(id).replace(/[^0-9]/g, '');
        if (numericId) {
            await db.query(
                `UPDATE reservation_log
                 SET payment_status = 'refunded',
                     refund_amount = ?,
                     refund_method = ?,
                     refund_ref = ?,
                     refunded_by = ?,
                     refunded_at = NOW()
                 WHERE reservation_id = ?`,
                [refundAmount || 0, refundMethod || '', refundRef || '', operator || 'Admin', numericId]
            ).catch(async () => {
                await db.query(
                    `UPDATE reservation_log
                     SET payment_status = 'refunded',
                         refund_amount = ?,
                         refund_method = ?,
                         refund_ref = ?,
                         refunded_at = NOW()
                     WHERE reservation_id = ?`,
                    [refundAmount || 0, refundMethod || '', refundRef || '', numericId]
                );
            });
            if (email && String(email).includes('@')) {
                await db.query(
                    `UPDATE customer_credentials c
                     JOIN reservation_log r ON r.customer_id = c.customer_id
                     SET c.email = ?
                     WHERE r.reservation_id = ?`,
                    [String(email).trim(), numericId]
                ).catch(() => {});
            }
        }
        cachedReservations = null;
        resCacheTime = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


/* 👉 KITCHEN AND FLOOR PLAN SYNC ROUTES */
app.post('/api/reservations/update-kds', async (req, res) => {
    const { id, kdsStatus } = req.body;
    try {
        const numericId = String(id).replace(/[^0-9]/g, '');
        if (numericId) {
            if (kdsStatus === 'cancelled') {
                await db.query("UPDATE reservation_log SET kds_status = 'cancelled', status = 'Cancelled' WHERE reservation_id = ?", [numericId]);
            } else {
                await db.query('UPDATE reservation_log SET kds_status = ? WHERE reservation_id = ?', [kdsStatus, numericId]);
            }
        }
        cachedReservations = null;
        resCacheTime = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

function scopedMemKey(baseKey, req) {
    const branch = (req.query.branch || (req.body && req.body.branch) || 'General Santos City').trim();
    if (!branch || branch === 'General Santos City' || branch === 'ALL') return baseKey;
    return `${baseKey}__${branch.replace(/\s+/g, '_')}`;
}

function resolveBranchMemKey(key, req) {
    const reqBranch = req ? (req.query?.branch || (req.body && !Array.isArray(req.body) ? req.body.branch : '') || '') : '';
    const branch = String(reqBranch || global.__activeReqBranch || 'General Santos City').trim();
    const branchScopedKeys = ['tableOverrides', 'floorPlanConfig', 'liveChats', 'inventoryItems', 'rawIngredients', 'inventoryAuditLog', 'activePromos', 'phHolidayConfig', 'vouchers'];
    if (branchScopedKeys.includes(key) && branch !== 'General Santos City' && branch !== 'ALL') {
        return `${key}__${branch.replace(/\s+/g, '_')}`;
    }
    return key;
}

const crypto = require('crypto');

function computeFastHash(obj) {
    try {
        const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
        return crypto.createHash('md5').update(str).digest('hex');
    } catch (e) { return String(Date.now()); }
}

async function getSystemMemoryKey(key, fallbackVal, req) {
    const actualKey = resolveBranchMemKey(key, req);
    if (!memoryCache[actualKey]) memoryCache[actualKey] = { data: null, hash: '', time: 0 };
    const entry = memoryCache[actualKey];
    if (entry && entry.data !== null && (Date.now() - entry.time < 60000)) {
        return entry.data;
    }
    const [rows] = await queryWithRetry("SELECT mem_val FROM system_memory WHERE mem_key = ?", [actualKey]);
    let val = fallbackVal;
    if (rows.length && rows[0].mem_val) {
        val = typeof rows[0].mem_val === 'string' ? JSON.parse(rows[0].mem_val) : rows[0].mem_val;
    }
    entry.data = val;
    entry.hash = computeFastHash(val);
    entry.time = Date.now();
    return val;
}

async function setSystemMemoryKey(key, val, req) {
    const actualKey = resolveBranchMemKey(key, req);
    const jsonStr = JSON.stringify(val);
    memoryCache[actualKey] = { data: val, hash: computeFastHash(jsonStr), time: Date.now() };
    await queryWithRetry(
        "INSERT INTO system_memory (mem_key, mem_val) VALUES (?, ?) ON DUPLICATE KEY UPDATE mem_val = ?",
        [actualKey, jsonStr, jsonStr]
    );
}

app.get('/api/memory/table-overrides', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('tableOverrides', {}, req);
        res.json(data || {});
    } catch (err) {
        res.json({});
    }
});

app.post('/api/memory/table-overrides', async (req, res) => {
    try {
        const payload = { ...(req.body || {}) };
        delete payload.branch;
        await setSystemMemoryKey('tableOverrides', payload, req);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* CLOUD FLOOR PLAN DESCRIPTIONS & PHOTOS SYNC (PER BRANCH) */
app.get('/api/memory/floor-plan-config', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('floorPlanConfig', [], req);
        res.json(Array.isArray(data) ? data : []);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/memory/floor-plan-config', async (req, res) => {
    try {
        const config = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.config) ? req.body.config : []);
        await setSystemMemoryKey('floorPlanConfig', config, req);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memory/live-chats', async (req, res) => {
    try {
        const payload = { ...(req.body || {}) };
        delete payload.branch;
        await setSystemMemoryKey('liveChats', payload, req);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* DELETE ONE CHAT SESSION (PER BRANCH) */
app.post('/api/memory/live-chats/delete', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

        let chats = await getSystemMemoryKey('liveChats', {}, req);
        if (!chats || typeof chats !== 'object') chats = {};
        delete chats[sessionId];

        await setSystemMemoryKey('liveChats', chats, req);
        res.json({ success: true, remaining: Object.keys(chats).length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/memory/live-chats', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('liveChats', {}, req);
        res.json(data || {});
    } catch (err) {
        res.json({});
    }
});

app.post('/api/memory/live-chats/message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message required' });

        const reqBranch = (req.query.branch || req.body.branch || 'General Santos City').trim();
        message.branch = reqBranch;

        const allChats = await getSystemMemoryKey('liveChats', {}, req);
        if (!allChats[sessionId]) allChats[sessionId] = [];
        allChats[sessionId].push(message);

        await setSystemMemoryKey('liveChats', allChats, req);
        res.json({ success: true, allChats });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* DELETE ALL RECORDS ROUTE */
app.delete('/api/reservations/all', async (req, res) => {
    try {
        await db.query('DELETE FROM reservation_log');
        await db.query('ALTER TABLE reservation_log AUTO_INCREMENT = 1'); 
        cachedReservations = null;
        resCacheTime = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 🔄 RESET RESERVATION NUMBERS BACK TO #1 (RENUMBER EXISTING OR RESET COUNTER) */
app.post('/api/reservations/reset-counter', async (req, res) => {
    try {
        const mode = (req.body && req.body.mode) || 'renumber';
        if (mode === 'wipe') {
            await db.query('DELETE FROM reservation_log');
            await db.query('ALTER TABLE reservation_log AUTO_INCREMENT = 1');
        } else {
            // Re-sequence existing reservations starting at #1 (or reset to 1 if empty)
            const [rows] = await db.query('SELECT reservation_id FROM reservation_log ORDER BY reservation_id ASC');
            if (rows.length === 0) {
                await db.query('ALTER TABLE reservation_log AUTO_INCREMENT = 1');
            } else {
                // Temporarily shift IDs up to avoid primary key collisions, then assign 1..N
                await db.query('UPDATE reservation_log SET reservation_id = reservation_id + 1000000 ORDER BY reservation_id DESC');
                const [shifted] = await db.query('SELECT reservation_id FROM reservation_log ORDER BY reservation_id ASC');
                let nextId = 1;
                for (const row of shifted) {
                    await db.query('UPDATE reservation_log SET reservation_id = ? WHERE reservation_id = ?', [nextId, row.reservation_id]);
                    nextId++;
                }
                await db.query(`ALTER TABLE reservation_log AUTO_INCREMENT = ${nextId}`);
            }
        }
        cachedReservations = null;
        resCacheTime = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* DELETE SINGLE RECORD ROUTE */
app.delete('/api/reservations/:id', async (req, res) => {
    try {
        const numericId = String(req.params.id || '').replace(/[^0-9]/g, '');
        if (numericId) {
            await db.query('DELETE FROM reservation_log WHERE reservation_id = ?', [numericId]);
            const [cntRows] = await db.query('SELECT COUNT(*) AS cnt FROM reservation_log');
            if (cntRows && cntRows[0] && Number(cntRows[0].cnt) === 0) {
                await db.query('ALTER TABLE reservation_log AUTO_INCREMENT = 1');
            }
        }
        cachedReservations = null;
        resCacheTime = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* UPDATE ENTIRE ORDER DETAILS */
app.post('/api/reservations/update-order', async (req, res) => {
    const { id, customerName, bookedTable, arrivalDate, arrivalTime, paymentAmount, foods, beefNote, notes, status, kdsStatus } = req.body;
    try {
        const numericId = String(id).replace(/[^0-9]/g, '');
        const foodsArr = Array.isArray(foods) ? [...foods] : (foods ? [foods] : []);
        const cleanFoodsArr = foodsArr.filter(f => !/^\[\[ORDER_NOTE:/i.test(String(f || '').trim()));
        const finalNote = String(beefNote || notes || '').trim();
        if (finalNote) cleanFoodsArr.push(`[[ORDER_NOTE: ${finalNote}]]`);
        const foodsJson = JSON.stringify(cleanFoodsArr);
        if (numericId) {
            if (customerName && String(customerName).trim() !== '') {
                const [rows] = await db.query('SELECT customer_id FROM reservation_log WHERE reservation_id = ?', [numericId]);
                if (rows.length > 0 && rows[0].customer_id) {
                    await db.query('UPDATE customer_credentials SET name = ? WHERE customer_id = ?', [String(customerName).trim(), rows[0].customer_id]);
                }
            }

            const tableInt = bookedTable ? (/vip/i.test(String(bookedTable)) ? 99 : (parseInt(String(bookedTable).replace(/[^0-9]/g, '')) || null)) : null;
            let resTime = null;
            if (arrivalDate && /^\d{4}-\d{2}-\d{2}$/.test(arrivalDate)) {
                const safeTime = (arrivalTime && /^\d{2}:\d{2}/.test(arrivalTime)) ? arrivalTime.substring(0, 5) : '12:00';
                resTime = `${arrivalDate} ${safeTime}:00`;
            }

            await db.query(
                `UPDATE reservation_log 
                 SET payment_amount = ?, 
                     foods = ?, 
                     table_number = COALESCE(?, table_number),
                     reservation_time = COALESCE(?, reservation_time),
                     status = COALESCE(?, status), 
                     kds_status = COALESCE(?, kds_status) 
                 WHERE reservation_id = ?`, 
                [Number(paymentAmount) || 0, foodsJson, tableInt, resTime, status || null, kdsStatus || null, numericId]
            );
        }
        cachedReservations = null;
        resCacheTime = 0;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* CLOUD MENU & PRODUCT PHOTO SYNC ROUTES */
app.get('/api/memory/inventory-items', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('inventoryItems', [], req);
        res.json(Array.isArray(data) ? data : []);
    } catch (err) {
        res.json(memoryCache.inventoryItems?.data || []);
    }
});

app.post('/api/memory/inventory-items', async (req, res) => {
    try {
        const items = Array.isArray(req.body) ? req.body : (req.body.items || []);
        await setSystemMemoryKey('inventoryItems', items, req);
        res.json({ success: true, count: items.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memory/inventory-items/item', async (req, res) => {
    try {
        const { item, deleteId } = req.body;
        let items = await getSystemMemoryKey('inventoryItems', [], req);
        if (!Array.isArray(items)) items = [];

        if (deleteId) {
            items = items.filter(i => i && i.id !== deleteId);
        } else if (item && item.id) {
            const idx = items.findIndex(i => i && i.id === item.id);
            if (idx > -1) items[idx] = { ...items[idx], ...item };
            else items.push(item);
        }

        await setSystemMemoryKey('inventoryItems', items, req);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 👉 PER-BRANCH PHILIPPINE HOLIDAYS & CLOSURES — independent per branch */
app.get('/api/memory/holidays', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('phHolidayConfig', null, req);
        res.json(data || null);
    } catch (err) {
        res.json(null);
    }
});

app.post('/api/memory/holidays', async (req, res) => {
    try {
        const list = Array.isArray(req.body) ? req.body : (req.body.list || []);
        if (list.length === 0) return res.json({ success: true, count: 0 });
        await setSystemMemoryKey('phHolidayConfig', list, req);
        res.json({ success: true, count: list.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 🏬 MULTI-BRANCH LIST — shared across all devices */
app.get('/api/memory/branches', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('branches', []);
        res.json(Array.isArray(data) ? data : []);
    } catch (err) { res.json([]); }
});

app.post('/api/memory/branches', async (req, res) => {
    try {
        const list = Array.isArray(req.body) ? req.body : (req.body.list || []);
        await setSystemMemoryKey('branches', list);
        res.json({ success: true, count: list.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 🔒 PER-BRANCH POS SWITCH PINS — shared across all devices */
app.get('/api/memory/pos-branch-pins', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('posBranchPins', {
            'General Santos City': '1111',
            'Koronadal City': '2222'
        });
        res.json((data && typeof data === 'object') ? data : {});
    } catch (err) {
        res.json({ 'General Santos City': '1111', 'Koronadal City': '2222' });
    }
});

app.post('/api/memory/pos-branch-pins', async (req, res) => {
    try {
        const pins = (req.body && typeof req.body === 'object') ? req.body : {};
        await setSystemMemoryKey('posBranchPins', pins);
        res.json({ success: true, pins });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 🧾 RAW INGREDIENTS SYNC */
app.get('/api/memory/raw-ingredients', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('rawIngredients', []);
        res.json(Array.isArray(data) ? data : []);
    } catch (err) { res.json([]); }
});

app.post('/api/memory/raw-ingredients', async (req, res) => {
    try {
        const list = Array.isArray(req.body) ? req.body : (req.body.items || []);
        await setSystemMemoryKey('rawIngredients', list);
        res.json({ success: true, count: list.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 📢 PROMOTIONS & ADS CLOUD SYNC (SHARED ACROSS ALL DEVICES) */
app.get('/api/memory/promos', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('activePromos', [], req);
        res.json(Array.isArray(data) ? data : []);
    } catch (err) { res.json([]); }
});

app.post('/api/memory/promos', async (req, res) => {
    try {
        const list = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.promos) ? req.body.promos : []);
        await setSystemMemoryKey('activePromos', list, req);
        res.json({ success: true, count: list.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 🎟️ MODIFIABLE VOUCHERS & ELIGIBILITY RULES SYNC (PER BRANCH) */
app.get('/api/memory/vouchers', async (req, res) => {
    try {
        const data = await getSystemMemoryKey('vouchers', null, req);
        res.json(Array.isArray(data) ? data : null);
    } catch (err) { res.json(null); }
});

app.post('/api/memory/vouchers', async (req, res) => {
    try {
        const list = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.vouchers) ? req.body.vouchers : []);
        await setSystemMemoryKey('vouchers', list, req);
        res.json({ success: true, count: list.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* 🧾 CROSS-DEVICE PAYMENT & DISCOUNT ID PROOF SYNC */
app.get('/api/memory/order-proofs', async (req, res) => {
    try {
        const resNum = (req.query.res || '').trim();
        if (resNum) {
            const perOrder = await getSystemMemoryKey(`orderProof_${resNum}`, null);
            if (perOrder && typeof perOrder === 'object') {
                return res.json(perOrder);
            }
            const legacyMap = await getSystemMemoryKey('orderProofs', {});
            if (legacyMap && typeof legacyMap === 'object' && legacyMap[resNum]) {
                return res.json(legacyMap[resNum]);
            }
            return res.json(null);
        }
        const data = await getSystemMemoryKey('orderProofs', {});
        res.json((data && typeof data === 'object' && !Array.isArray(data)) ? data : {});
    } catch (err) { res.json({}); }
});

app.post('/api/memory/order-proofs', async (req, res) => {
    try {
        const { reservationNumber, paymentProof, discountProofImage, paymentRef } = req.body || {};
        if (!reservationNumber) return res.json({ success: false });
        const key = `orderProof_${String(reservationNumber).trim()}`;
        let existing = await getSystemMemoryKey(key, null);
        if (!existing || typeof existing !== 'object') {
            const legacyMap = await getSystemMemoryKey('orderProofs', {});
            existing = (legacyMap && typeof legacyMap === 'object' && legacyMap[reservationNumber]) || {};
        }
        await setSystemMemoryKey(key, {
            paymentProof: paymentProof !== undefined ? paymentProof : (existing.paymentProof || ''),
            discountProofImage: discountProofImage !== undefined ? discountProofImage : (existing.discountProofImage || ''),
            paymentRef: paymentRef !== undefined ? paymentRef : (existing.paymentRef || ''),
            updatedAt: Date.now()
        });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Serve static HTML, CSS, JS, and images automatically on Render / Railway / Koyeb / Localhost
const path = require('path');
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Roland's Server running on port ${PORT}`));
}

module.exports = app;
