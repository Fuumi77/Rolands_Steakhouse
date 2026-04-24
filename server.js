require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Serve all HTML, CSS, JS, images from the project root
app.use(express.static(__dirname));

// Initialize Supabase (Pulls from your .env file or Vercel Environment Variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('⚠️  Supabase credentials missing — DB features disabled, but PayMongo will still work.');
}


/* LOGIN */
app.post('/login', async (req, res) => {
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
app.post('/signup', async (req, res) => {
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

/* FORGOT PASSWORD - USPEEDO INTEGRATION */
const tempCodes = {}; // In-memory storage for codes: { email: { code, expires } }

app.post('/api/auth/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    try {
        // 1. Verify user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, error: "No account found with this email." });
        }

        // 2. Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        tempCodes[email] = {
            code: code,
            expires: Date.now() + (10 * 60 * 1000) // 10 minutes
        };

        // 3. Send via uSpeedo
        const accessKeyId = process.env.USPEEDO_ACCESSKEY_ID;
        const secretKey   = process.env.USPEEDO_ACCESSKEY_SECRET;
        const senderEmail = process.env.USPEEDO_SENDER_EMAIL || 'rolands@gensan.com';

        if (!accessKeyId || !secretKey) {
            console.error("uSpeedo keys missing in .env");
            return res.status(500).json({ success: false, error: "Email service not configured." });
        }

        const auth = Buffer.from(`${accessKeyId}:${secretKey}`).toString('base64');
        
        console.log(`✉️ Sending verification code ${code} to ${email} via uSpeedo...`);

        const usRes = await fetch('https://api.uspeedo.com/v1/emails/send', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                From: senderEmail,
                To: email,
                Subject: "Password Reset Code - Roland's Steak House",
                Content: `Your verification code is: ${code}. It will expire in 10 minutes.`
            })
        });

        const usData = await usRes.json();
        
        if (usRes.ok && usData.RetCode === 0) {
            res.json({ success: true });
        } else {
            console.error("uSpeedo Error:", usData);
            // Fallback for local testing: allow code in console if API fails
            res.json({ success: true, note: "API failed but simulated for prototype", code: code });
        }

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
            // Fetch using the database's lowercase names
            .select('id, name, arrivaldate, arrivaltime, tableno');

        if (error) throw error;

        // Map columns back to camelCase for the frontend UI
        const mappedData = data.map(r => ({
            reservationNumber: r.id,
            customerName: r.name,
            arrivalDate: r.arrivaldate,
            arrivalTime: r.arrivaltime,
            bookedTable: r.tableno,
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
    const { name, date, time, table } = req.body;

    try {
        const { error } = await supabase
            .from('reservations')
            .insert([{ 
                // Insert using the database's lowercase names
                name: name, 
                arrivaldate: date, 
                arrivaltime: time, 
                tableno: table 
            }]);

        if (error) throw error;
        res.json({ success: true });

    } catch (err) {
        console.error("Supabase Save Error:", err);
        res.status(500).send("Error saving to database");
    }
});

/* DELETE RESERVATION */
app.delete('/reserve', async (req, res) => {
    const { name, date, table } = req.query; 

    try {
        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('name', name)
            .eq('arrivaldate', date)
            .eq('tableno', table);

        if (error) throw error;
        res.json({ success: true });

    } catch (err) {
        console.error("Supabase Delete Error:", err);
        res.status(500).send("Error deleting from database");
    }
});

/* CREATE PAYMONGO CHECKOUT SESSION (Card-only, no QR) */
app.post('/api/paymongo/checkout', async (req, res) => {
    const { amount, description, customerName } = req.body;

    const mode     = (process.env.PAYMONGO_MODE || 'test').toLowerCase();
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
        res.json({ checkout_url: checkoutUrl });

    } catch (err) {
        console.error('PayMongo error:', err);
        res.status(500).json({ error: 'Could not reach PayMongo.' });
    }
});

// Run locally if testing on your laptop
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log("Server running locally on port 3000"));
}

// Export for Vercel deployment
module.exports = app;
