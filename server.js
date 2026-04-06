require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for now
    crossOriginEmbedderPolicy: false
}));

// Rate limiting — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter rate-limit for auth (5 attempts per 15min)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Demasiados intentos de login. Espera 15 minutos.' }
});

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://gamesfullz.onrender.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8888'],
    credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// STATIC FILES — Serve the frontend
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Images', express.static(path.join(__dirname, 'Images')));

// Admin panel static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/games', apiLimiter, gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        timestamp: new Date().toISOString(),
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// SPA Fallback — serve index.html for non-API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// DATABASE CONNECTION & SERVER START
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB conectado exitosamente');
        app.listen(PORT, () => {
            console.log(`🚀 GamesFullZ Server corriendo en http://localhost:${PORT}`);
            console.log(`🔧 Admin Panel: http://localhost:${PORT}/admin`);
            console.log(`📡 API: http://localhost:${PORT}/api/games`);
        });
    })
    .catch(err => {
        console.error('❌ Error conectando a MongoDB:', err.message);
        console.log('ℹ️  Asegúrate de que MongoDB esté corriendo o la URI sea correcta.');
        process.exit(1);
    });

module.exports = app;
