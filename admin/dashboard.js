// dashboard.js — GamesFullZ Admin CMS Logic
(async function() {
    const API = '/api/games';
    const token = localStorage.getItem('gfz_token');

    // Auth check
    try {
        const res = await fetch('/api/auth/verify', { credentials: 'include' });
        const data = await res.json();
        if (!data.valid) throw new Error();
    } catch {
        window.location.href = '/admin/';
        return;
    }

    const headers = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    // DOM
    const tableBody = document.getElementById('gamesTableBody');
    const gameCount = document.getElementById('gameCount');
    const adminSearch = document.getElementById('adminSearch');
    const tablePagination = document.getElementById('tablePagination');
    const gameForm = document.getElementById('gameForm');
    const formTitle = document.getElementById('formTitle');
    const editIdField = document.getElementById('editId');
    const viewTitle = document.getElementById('viewTitle');
    const confirmModal = document.getElementById('confirmModal');
    const confirmText = document.getElementById('confirmText');
    const confirmDelete = document.getElementById('confirmDelete');
    const confirmCancel = document.getElementById('confirmCancel');
    const previewStrip = document.getElementById('previewStrip');

    let allGames = [];
    let currentPage = 1;
    let deleteTarget = null;

    // ========= NAVIGATION =========
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const view = item.dataset.view;
            document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

            if (view === 'games') {
                document.getElementById('viewGames').classList.add('active');
                viewTitle.textContent = 'Game Catalog';
                loadGames();
            } else if (view === 'add') {
                document.getElementById('viewAdd').classList.add('active');
                viewTitle.textContent = 'Add Game';
                resetForm();
            } else if (view === 'stats') {
                document.getElementById('viewStats').classList.add('active');
                viewTitle.textContent = 'Statistics';
                loadStats();
            }
        });
    });

    // ========= LOAD GAMES =========
    async function loadGames(search = '') {
        try {
            const url = `${API}/admin/all?limit=200${search ? '&search=' + encodeURIComponent(search) : ''}`;
            const res = await fetch(url, { headers: headers(), credentials: 'include' });
            const data = await res.json();
            allGames = data.games || [];
            gameCount.textContent = `${allGames.length} games`;
            renderTable();
        } catch (err) {
            console.error('Load error:', err);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--muted);">Error loading games. Check server connection.</td></tr>';
        }
    }

    function renderTable() {
        const perPage = 15;
        const totalPages = Math.ceil(allGames.length / perPage);
        const start = (currentPage - 1) * perPage;
        const slice = allGames.slice(start, start + perPage);

        tableBody.innerHTML = slice.map(g => `
            <tr>
                <td><span class="table-id">#${g.gameId}</span></td>
                <td><img src="/${g.imagen}" class="table-cover" alt="${g.nombre}" onerror="this.style.display='none'"></td>
                <td><span class="table-name">${g.nombre}</span></td>
                <td>${(g.downloads || 0).toLocaleString()}</td>
                <td>${g.rating || '—'}</td>
                <td><span class="badge ${g.published ? 'published' : 'draft'}">${g.published ? 'Live' : 'Draft'}</span></td>
                <td>
                    <button class="action-btn edit" onclick="editGame(${g.gameId})" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="action-btn delete" onclick="deleteGame(${g.gameId}, '${g.nombre.replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        // Pagination
        tablePagination.innerHTML = '';
        if (totalPages > 1) {
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = `pg-btn ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.onclick = () => { currentPage = i; renderTable(); };
                tablePagination.appendChild(btn);
            }
        }
    }

    // ========= SEARCH =========
    let searchTimeout;
    adminSearch.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadGames(adminSearch.value.trim());
        }, 300);
    });

    // ========= EDIT GAME =========
    window.editGame = async function(id) {
        const game = allGames.find(g => g.gameId === id);
        if (!game) return;

        // Switch to form view
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('[data-view="add"]').classList.add('active');
        document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('viewAdd').classList.add('active');
        viewTitle.textContent = 'Edit Game';
        formTitle.innerHTML = `<i class="fas fa-edit"></i> Edit: ${game.nombre}`;

        editIdField.value = game.gameId;
        document.getElementById('fNombre').value = game.nombre;
        document.getElementById('fDesc').value = game.descripcion;
        document.getElementById('fImagen').value = game.imagen;
        document.getElementById('fRating').value = game.rating || '⭐⭐⭐☆☆';
        document.getElementById('fReqs').value = (game.requisitos || '').replace(/<br>/g, '\n');
        document.getElementById('fLinkDirect').value = game.links?.direct || '';
        document.getElementById('fLinkMf').value = game.links?.mediafire || '';
        document.getElementById('fDownloads').value = game.downloads || 0;
        document.getElementById('fPassword').value = game.password || '123';
        document.getElementById('fPublished').value = game.published ? 'true' : 'false';
        document.getElementById('fExtraVoces').value = game.extra?.vocesLatinas || '';
        document.getElementById('fExtraOnline').value = game.extra?.onlineFix || '';
        document.getElementById('fAdvertencia').value = game.advertencia || '';
    };

    // ========= DELETE GAME =========
    window.deleteGame = function(id, name) {
        deleteTarget = id;
        confirmText.textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
        confirmModal.classList.add('show');
    };

    confirmCancel.addEventListener('click', () => {
        confirmModal.classList.remove('show');
        deleteTarget = null;
    });

    confirmDelete.addEventListener('click', async () => {
        if (!deleteTarget) return;
        try {
            await fetch(`${API}/${deleteTarget}`, { method: 'DELETE', headers: headers(), credentials: 'include' });
            confirmModal.classList.remove('show');
            deleteTarget = null;
            loadGames();
        } catch (err) {
            alert('Error deleting game');
        }
    });

    // ========= SAVE (CREATE / UPDATE) =========
    gameForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isEdit = !!editIdField.value;
        const body = {
            nombre: document.getElementById('fNombre').value.trim(),
            descripcion: document.getElementById('fDesc').value.trim(),
            imagen: document.getElementById('fImagen').value.trim(),
            rating: document.getElementById('fRating').value,
            requisitos: document.getElementById('fReqs').value.trim().replace(/\n/g, '<br>'),
            downloads: parseInt(document.getElementById('fDownloads').value) || 0,
            password: document.getElementById('fPassword').value || '123',
            published: document.getElementById('fPublished').value === 'true',
            links: {
                direct: document.getElementById('fLinkDirect').value.trim(),
                mediafire: document.getElementById('fLinkMf').value.trim()
            }
        };

        // Extras
        const voces = document.getElementById('fExtraVoces').value.trim();
        const online = document.getElementById('fExtraOnline').value.trim();
        if (voces || online) {
            body.extra = {};
            if (voces) body.extra.vocesLatinas = voces;
            if (online) body.extra.onlineFix = online;
        }

        const adv = document.getElementById('fAdvertencia').value.trim();
        if (adv) body.advertencia = adv;

        try {
            const url = isEdit ? `${API}/${editIdField.value}` : API;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method, headers: headers(), credentials: 'include',
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                alert(`✅ Game ${isEdit ? 'updated' : 'created'} successfully!`);
                resetForm();
                // Switch to games list
                document.querySelector('[data-view="games"]').click();
            } else {
                alert(`❌ Error: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert('❌ Server connection error.');
        }
    });

    // ========= PREVIEW =========
    document.getElementById('btnPreview').addEventListener('click', () => {
        const name = document.getElementById('fNombre').value || 'Untitled';
        const desc = document.getElementById('fDesc').value || 'No description';
        const img = document.getElementById('fImagen').value || '';

        document.getElementById('previewName').textContent = name;
        document.getElementById('previewDesc').textContent = desc;
        document.getElementById('previewImg').src = img.startsWith('http') ? img : '/' + img;
        previewStrip.classList.toggle('show');
    });

    // ========= CANCEL EDIT =========
    document.getElementById('btnCancelEdit').addEventListener('click', () => {
        resetForm();
        document.querySelector('[data-view="games"]').click();
    });

    function resetForm() {
        gameForm.reset();
        editIdField.value = '';
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Game';
        previewStrip.classList.remove('show');
        document.getElementById('fPublished').value = 'true';
        document.getElementById('fRating').value = '⭐⭐⭐☆☆';
        document.getElementById('fPassword').value = '123';
    }

    // ========= STATS =========
    async function loadStats() {
        try {
            const res = await fetch(`${API}/admin/all?limit=500`, { headers: headers(), credentials: 'include' });
            const data = await res.json();
            const games = data.games || [];

            document.getElementById('statTotal').textContent = games.length;
            document.getElementById('statPublished').textContent = games.filter(g => g.published).length;
            document.getElementById('statDrafts').textContent = games.filter(g => !g.published).length;
            document.getElementById('statDownloads').textContent = games.reduce((sum, g) => sum + (g.downloads || 0), 0).toLocaleString();
        } catch {
            console.error('Stats load error');
        }
    }

    // ========= LOGOUT =========
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        localStorage.removeItem('gfz_token');
        window.location.href = '/admin/';
    });

    // Boot
    loadGames();
})();
