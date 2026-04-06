const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

// GET /api/games — List all published games (for the frontend)
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const filter = { published: true };

        if (search) {
            filter.$text = { $search: search };
        }

        const games = await Game.find(filter)
            .sort({ gameId: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Game.countDocuments(filter);

        res.json({
            games,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('GET /api/games error:', err);
        res.status(500).json({ error: 'Error al obtener juegos.' });
    }
});

// GET /api/games/:id — Single game by gameId
router.get('/:id', async (req, res) => {
    try {
        const game = await Game.findOne({ gameId: parseInt(req.params.id) }).lean();
        if (!game) return res.status(404).json({ error: 'Juego no encontrado.' });
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el juego.' });
    }
});

// ==========================================
// ADMIN ROUTES (Auth required)
// ==========================================

// GET /api/games/admin/all — List ALL games including unpublished
router.get('/admin/all', auth, async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } }
            ];
        }

        const games = await Game.find(filter)
            .sort({ gameId: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Game.countDocuments(filter);

        res.json({
            games,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener juegos (admin).' });
    }
});

// POST /api/games — Create a new game
router.post('/', auth, async (req, res) => {
    try {
        // Auto increment gameId
        const lastGame = await Game.findOne().sort({ gameId: -1 }).lean();
        const newId = lastGame ? lastGame.gameId + 1 : 1;

        const gameData = {
            gameId: newId,
            nombre: req.body.nombre,
            tipo: req.body.tipo || 'juego',
            descripcion: req.body.descripcion,
            requisitos: req.body.requisitos || '',
            downloads: req.body.downloads || 0,
            rating: req.body.rating || '⭐⭐⭐☆☆',
            comments: req.body.comments || [],
            links: {
                direct: req.body.links?.direct || '',
                mediafire: req.body.links?.mediafire || ''
            },
            imagen: req.body.imagen || '',
            password: req.body.password || '123',
            published: req.body.published !== undefined ? req.body.published : true
        };

        // Optional extras
        if (req.body.extra) {
            gameData.extra = req.body.extra;
        }
        if (req.body.advertencia) gameData.advertencia = req.body.advertencia;
        if (req.body.note) gameData.note = req.body.note;

        const game = new Game(gameData);
        await game.save();

        res.status(201).json({ success: true, game });
    } catch (err) {
        console.error('POST /api/games error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Ya existe un juego con ese ID.' });
        }
        res.status(500).json({ error: 'Error al crear el juego.' });
    }
});

// PUT /api/games/:id — Update a game
router.put('/:id', auth, async (req, res) => {
    try {
        const update = { ...req.body, updatedAt: Date.now() };
        
        const game = await Game.findOneAndUpdate(
            { gameId: parseInt(req.params.id) },
            update,
            { new: true, runValidators: true }
        );

        if (!game) return res.status(404).json({ error: 'Juego no encontrado.' });

        res.json({ success: true, game });
    } catch (err) {
        console.error('PUT /api/games error:', err);
        res.status(500).json({ error: 'Error al actualizar el juego.' });
    }
});

// DELETE /api/games/:id — Delete a game
router.delete('/:id', auth, async (req, res) => {
    try {
        const game = await Game.findOneAndDelete({ gameId: parseInt(req.params.id) });
        if (!game) return res.status(404).json({ error: 'Juego no encontrado.' });
        res.json({ success: true, message: `Juego "${game.nombre}" eliminado.` });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el juego.' });
    }
});

module.exports = router;
