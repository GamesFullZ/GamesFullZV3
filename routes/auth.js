const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
        }

        // Compare against env variables
        const validUser = username === process.env.ADMIN_USER;
        // Hash the stored password on-the-fly for comparison
        const storedHash = await bcrypt.hash(process.env.ADMIN_PASS, 10);
        const validPass = await bcrypt.compare(password, storedHash);

        if (!validUser || !validPass) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const token = jwt.sign(
            { user: username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Set secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        res.json({ success: true, message: 'Login exitoso.', token });
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Sesión cerrada.' });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false });

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true });
    } catch {
        res.status(403).json({ valid: false });
    }
});

module.exports = router;
