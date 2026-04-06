/**
 * migrate.js — Migrates data.js into MongoDB
 * Run: node migrate.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

// Import data.js by evaluating it
const fs = require('fs');
const dataContent = fs.readFileSync('./data.js', 'utf-8');

// Extract the array from the file
var recursos;
try {
    // Remove the const/var/let declaration and trailing semicolons
    const cleaned = dataContent
        .replace(/^[\s\S]*?(const|var|let)\s+recursos\s*=\s*/, '')
        .replace(/;\s*$/, '');
    recursos = JSON.parse(
        cleaned
            .replace(/\/\/.*$/gm, '')          // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
            .replace(/,\s*([}\]])/g, '$1')     // Remove trailing commas
            .replace(/(\w+)\s*:/g, '"$1":')    // Quote keys
            .replace(/'/g, '"')                // Single to double quotes
    );
} catch (parseErr) {
    // Fallback: replace const/let with var so eval exposes it
    console.log('⚠️  JSON parse failed, using eval fallback...');
    try {
        const fixedContent = dataContent.replace(/^(const|let)\s+/gm, 'var ');
        eval(fixedContent);
        // recursos should now be available via var
    } catch (evalErr) {
        console.error('❌ No se pudo parsear data.js:', evalErr.message);
        process.exit(1);
    }
}

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Clear existing
        const existingCount = await Game.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Eliminando ${existingCount} juegos existentes...`);
            await Game.deleteMany({});
        }

        const games = recursos.filter(r => r.tipo === 'juego');
        console.log(`📦 Migrando ${games.length} juegos...`);

        let success = 0;
        let errors = 0;

        for (const g of games) {
            try {
                const gameDoc = new Game({
                    gameId: g.id,
                    nombre: g.nombre,
                    tipo: g.tipo,
                    descripcion: g.descripcion,
                    requisitos: g.requisitos || '',
                    downloads: g.downloads || 0,
                    rating: g.rating || '⭐⭐⭐☆☆',
                    comments: g.comments || [],
                    links: {
                        direct: g.links?.direct || '',
                        mediafire: g.links?.mediafire || ''
                    },
                    imagen: g.imagen || '',
                    password: g.password || '123',
                    extra: g.extra || undefined,
                    advertencia: g.advertencia || undefined,
                    note: g.note || undefined,
                    published: true
                });

                await gameDoc.save();
                success++;
                if (success % 20 === 0) console.log(`  ✓ ${success} juegos migrados...`);
            } catch (err) {
                errors++;
                console.error(`  ✗ Error migrando "${g.nombre}" (id:${g.id}):`, err.message);
            }
        }

        console.log('\n==============================');
        console.log(`✅ Migración completada!`);
        console.log(`   Exitosos: ${success}`);
        console.log(`   Errores: ${errors}`);
        console.log(`   Total en DB: ${await Game.countDocuments()}`);
        console.log('==============================\n');

    } catch (err) {
        console.error('❌ Error de migración:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
        process.exit(0);
    }
}

migrate();
