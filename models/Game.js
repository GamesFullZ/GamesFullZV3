const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameId: { type: Number, unique: true, required: true },
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, default: 'juego' },
    descripcion: { type: String, required: true },
    requisitos: { type: String, default: '' },
    downloads: { type: Number, default: 0 },
    rating: { type: String, default: '⭐⭐⭐☆☆' },
    comments: [{ type: String }],
    links: {
        direct: { type: String, default: '' },
        mediafire: { type: String, default: '' }
    },
    imagen: { type: String, default: '' },
    password: { type: String, default: '123' },
    // Optional extras
    extra: {
        vocesLatinas: { type: String },
        onlineFix: { type: String },
        updates: { type: String },
        updateVersion: { type: String }
    },
    advertencia: { type: String },
    note: { type: String },
    // CMS Metadata
    published: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

gameSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

gameSchema.index({ nombre: 'text', descripcion: 'text' });

module.exports = mongoose.model('Game', gameSchema);
