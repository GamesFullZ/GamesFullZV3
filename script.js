// script.js V5 — Premium Static Engine (Red / Dark Edition)
document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const gallery = document.getElementById('gallery');
    const filterBtns = document.querySelectorAll('.cat-btn');
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');
    const pContainer = document.getElementById('pageNumbersContainer');
    const btnPrev = document.getElementById('prevPage');
    const btnNext = document.getElementById('nextPage');
    
    // Modal Elements
    const modal = document.getElementById('gameModal');
    const modalInner = modal.querySelector('.modal-panel');
    const backdrop = modal.querySelector('.modal-backdrop');

    // 2. Data Validation
    if (typeof recursos === 'undefined' || !Array.isArray(recursos)) {
        gallery.innerHTML = '<div class="empty-gallery">Error Crítico: data.js no encontrado.</div>';
        return;
    }
    
    // State
    let activeData = recursos.filter(g => g.tipo === 'juego');
    const perPage = 12;
    let currPage = 1;

    // Advanced Category Mapping
    const catKeywords = {
        accion: ['acción', 'action', 'shooter', 'fps', 'combate', 'guerra', 'cod', 'call of duty'],
        aventura: ['aventura', 'adventure', 'mundo abierto', 'open world', 'historia', 'exploración'],
        terror: ['terror', 'horror', 'zombi', 'miedo', 'fnaf', 'resident evil', 'bendy', 'quarry'],
        rpg: ['rpg', 'rol', 'souls', 'elden ring', 'deltarune', 'undertale', 'cyberpunk'],
        supervivencia: ['supervivencia', 'survival', 'craft', 'forest'],
        lucha: ['lucha', 'pelea', 'fighter', 'mortal kombat', 'naruto'],
        carreras: ['carrera', 'racing', 'forza', 'motor', 'auto', 'blur']
    };

    function determineCat(g) {
        const txt = (g.nombre + " " + g.descripcion).toLowerCase();
        for (const [cat, words] of Object.entries(catKeywords)) {
            if (words.some(w => txt.includes(w))) return cat;
        }
        return 'accion'; // Default
    }
    
    // 3. Scroll Reveal Observer
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.15 });

    // 4. Core Engine 
    function runEngine() {
        const term = searchInput.value.toLowerCase().trim();
        const activeBtn = document.querySelector('.cat-btn.active');
        const cat = activeBtn ? activeBtn.dataset.filter : 'todos';
        const sort = sortSelect.value;
        
        activeData = recursos.filter(g => {
            if (g.tipo !== 'juego') return false;
            const matchesTerm = !term || g.nombre.toLowerCase().includes(term) || g.descripcion.toLowerCase().includes(term);
            const matchesCat = (cat === 'todos') ? true : determineCat(g) === cat;
            return matchesTerm && matchesCat;
        });

        // Sorting Logic
        if (sort === 'name-asc') {
            activeData.sort((a,b) => a.nombre.localeCompare(b.nombre));
        } else if (sort === 'downloads') {
            activeData.sort((a,b) => (b.downloads || 0) - (a.downloads || 0));
        } else {
            activeData.sort((a,b) => (b.id || 0) - (a.id || 0)); 
        }

        currPage = 1;
        renderGallery();
        renderPagination();
    }

    function renderGallery() {
        gallery.innerHTML = '';
        if (activeData.length === 0) {
            gallery.innerHTML = '<div class="empty-gallery">No se encontraron juegos en esta galaxia.</div>';
            return;
        }

        const start = (currPage - 1) * perPage;
        const slice = activeData.slice(start, start + perPage);
        const frag = document.createDocumentFragment();

        slice.forEach(g => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.dataset.id = g.id;
            
            card.innerHTML = `
                <img src="${g.imagen}" alt="${g.nombre}" class="game-cover" loading="lazy">
                <div class="game-overlay">
                    <h3 class="game-title">${g.nombre}</h3>
                    <div class="game-meta">
                        <span><i class="fas fa-star"></i> ${g.rating ? g.rating.length : '4'}</span>
                        <span><i class="fas fa-download"></i> ${(g.downloads || 0).toLocaleString()}</span>
                    </div>
                </div>
            `;
            
            revealObserver.observe(card);
            frag.appendChild(card);
        });

        gallery.appendChild(frag);
    }

    function renderPagination() {
        const tPages = Math.ceil(activeData.length / perPage);
        btnPrev.disabled = (currPage === 1);
        btnNext.disabled = (tPages === 0 || currPage === tPages);
        
        pContainer.innerHTML = '';
        if(tPages <= 1) return;

        let start = Math.max(1, currPage - 2);
        let end = Math.min(tPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);

        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.className = `page-num ${i === currPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => { 
                currPage = i; 
                renderGallery(); 
                renderPagination(); 
                window.scrollTo({ top: gallery.offsetTop - 100, behavior: 'smooth' });
            };
            pContainer.appendChild(btn);
        }
    }

    // 5. Modal Logic
    function openModal(id) {
        const game = recursos.find(g => g.id == id);
        if(!game) return;

        const extrasHtml = game.extra ? `
            <div class="extra-zone slide-stagger st-4">
                ${game.extra.vocesLatinas ? `<a href="${game.extra.vocesLatinas}" target="_blank" class="dl-btn-extra"><i class="fas fa-microphone-alt"></i> Voces LATAM</a>` : ''}
                ${game.extra.onlineFix ? `<a href="${game.extra.onlineFix}" target="_blank" class="dl-btn-extra"><i class="fas fa-globe"></i> Fix Online</a>` : ''}
            </div>
        ` : '';

        modalInner.innerHTML = `
            <button class="modal-close" id="closeDetail"><i class="fas fa-times"></i></button>
            <div class="modal-hero">
                <img src="${game.imagen}" alt="${game.nombre}">
                <div class="modal-hero-gradient"></div>
            </div>
            <div class="modal-content">
                <h2 class="modal-title slide-stagger st-1">${game.nombre}</h2>
                
                <div class="modal-badges slide-stagger st-1">
                    <div class="sys-badge"><i class="fas fa-star"></i> ${game.rating || '⭐⭐⭐⭐⭐'}</div>
                    <div class="sys-badge"><i class="fas fa-download"></i> ${(game.downloads||0).toLocaleString()} DLs</div>
                    <div class="sys-badge"><i class="fas fa-gamepad"></i> ${determineCat(game).toUpperCase()}</div>
                </div>
                
                <p class="modal-desc slide-stagger st-2">${game.descripcion}</p>
                
                <div class="req-box slide-stagger st-2">
                    <strong>REQUISITOS DEL SISTEMA:</strong><br>
                    ${game.requisitos || "Información de hardware no disponible para este título."}
                </div>
                
                <div class="download-zone slide-stagger st-3">
                    <h4>DESCARGA SEGURA</h4>
                    <div class="download-buttons">
                        <a href="${game.links?.mediafire || '#'}" target="_blank" class="master-dl-btn mediafire">
                            <i class="fas fa-cloud-download-alt"></i> MEDIAFIRE
                        </a>
                        <a href="${game.links?.direct || '#'}" target="_blank" class="master-dl-btn gofile">
                            <i class="fas fa-hdd"></i> GOFILE
                        </a>
                    </div>
                </div>
                
                ${extrasHtml}
            </div>
        `;

        document.getElementById('closeDetail').onclick = closeModal;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden'; 
    }

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = ''; 
    }

    // 6. Event Bindings
    filterBtns.forEach(btn => btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        runEngine();
    }));

    sortSelect.addEventListener('change', runEngine);
    
    let searchDebounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(runEngine, 300);
    });

    btnPrev.addEventListener('click', () => { if(currPage > 1) { currPage--; renderGallery(); renderPagination(); }});
    btnNext.addEventListener('click', () => { if(currPage < Math.ceil(activeData.length/perPage)) { currPage++; renderGallery(); renderPagination(); }});

    gallery.addEventListener('click', (e) => {
        const card = e.target.closest('.game-card');
        if (card) openModal(card.dataset.id);
    });

    backdrop.onclick = closeModal;
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });

    // Initial Boot
    runEngine();
});

