// script.js V4 — Master UI Logic (Galaxy & Glass)
document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const gallery = document.getElementById('gallery');
    const filterBtns = document.querySelectorAll('.cat-btn');
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');
    const pContainer = document.getElementById('pageNumbersContainer');
    const btnPrev = document.getElementById('prevPage');
    const btnNext = document.getElementById('nextPage');
    
    // Modal Structure (Re-initialized each click)
    const modal = document.getElementById('gameModal');
    const modalInner = modal.querySelector('.modal-panel');
    const backdrop = modal.querySelector('.modal-backdrop');

    // 2. Data & State
    if (typeof recursos === 'undefined' || !Array.isArray(recursos)) {
        gallery.innerHTML = '<h3 class="empty-gallery">Fatal Error: data.js is missing.</h3>';
        return;
    }
    
    let activeData = recursos.filter(g => g.tipo === 'juego');
    const perPage = 12;
    let currPage = 1;

    const catKeywords = {
        accion: ['acción', 'shooter', 'fps', 'hack and slash', 'combate', 'guerra'],
        aventura: ['aventura', 'mundo abierto', 'historia', 'exploración'],
        terror: ['terror', 'horror', 'zombi', 'silent hill', 'miedo', 'fnaf'],
        rpg: ['rpg', 'rol', 'souls', 'elden ring'],
        supervivencia: ['supervivencia', 'survival', 'craft'],
        lucha: ['lucha', 'pelea', 'mortal kombat', 'capcom', 'fighter'],
        carreras: ['carrera', 'racing', 'forza', 'auto']
    };

    function determineCat(g) {
        const txt = (g.nombre + " " + g.descripcion).toLowerCase();
        for (const [cat, words] of Object.entries(catKeywords)) {
            if (words.some(w => txt.includes(w))) return cat;
        }
        return 'accion'; // Default
    }
    
    // 3. Scroll Reveal Observer
    const revealOptions = { root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.1 };
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target); 
            }
        });
    }, revealOptions);

    document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

    // 4. Core Render 
    function runEngine() {
        const term = searchInput.value.toLowerCase().trim();
        const cat = document.querySelector('.cat-btn.active').dataset.filter;
        const sort = sortSelect.value;
        
        activeData = recursos.filter(g => {
            if (g.tipo !== 'juego') return false;
            const mTerm = !term || g.nombre.toLowerCase().includes(term) || g.descripcion.toLowerCase().includes(term);
            const mCat = (cat === 'todos') ? true : determineCat(g) === cat;
            return mTerm && mCat;
        });

        if (sort === 'name-asc') activeData.sort((a,b) => a.nombre.localeCompare(b.nombre));
        else if (sort === 'downloads') activeData.sort((a,b) => (b.downloads||0) - (a.downloads||0));
        else activeData.sort((a,b) => (b.id||0) - (a.id||0)); 

        currPage = 1;
        renderGallery();
        renderPagination();
    }

    function renderGallery() {
        gallery.innerHTML = '';
        if (activeData.length === 0) {
            gallery.innerHTML = '<div class="empty-gallery">Zero matches found in the Galaxy.</div>';
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
                <img src="${g.imagen}" alt="${g.nombre}" class="game-cover" loading="lazy" decoding="async">
                <div class="game-overlay">
                    <h3 class="game-title">${g.nombre}</h3>
                    <div class="game-meta">
                        <span>⭐ ${g.rating || '4.0'}</span>
                        <span><i class="fas fa-download"></i> ${g.downloads || 0}</span>
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
            btn.onclick = () => { currPage = i; renderGallery(); renderPagination(); document.getElementById('gallery').scrollIntoView({behavior:'smooth', block:'start'});};
            pContainer.appendChild(btn);
        }
    }

    // 5. MASTER MODAL LOGIC + STAGGERED HTML INJECTION
    function openModal(id) {
        const game = recursos.find(g => g.id == id);
        if(!game) return;

        const extrasHtml = game.extra ? `
            <div class="extra-zone slide-stagger st-4">
                ${game.extra.vocesLatinas ? `<a href="${game.extra.vocesLatinas}" target="_blank" class="dl-btn-extra"><i class="fas fa-microphone-alt"></i> LATAM Audio</a>` : ''}
                ${game.extra.onlineFix ? `<a href="${game.extra.onlineFix}" target="_blank" class="dl-btn-extra"><i class="fas fa-globe"></i> Online Fix</a>` : ''}
            </div>
        ` : '';

        // Construir panel interior dinámico para forzar re-animación (staggering)
        modalInner.innerHTML = `
            <button class="modal-close" id="closeDetailsBtn"><i class="fas fa-times"></i></button>
            <div class="modal-hero">
                <img src="${game.imagen}" alt="${game.nombre}">
                <div class="modal-hero-gradient"></div>
            </div>
            <div class="modal-content">
                <h2 class="modal-title slide-stagger st-1">${game.nombre}</h2>
                
                <div class="modal-badges slide-stagger st-1">
                    <div class="sys-badge"><i class="fas fa-star cl-star"></i> ${game.rating || '4.0'} / 5</div>
                    <div class="sys-badge"><i class="fas fa-download cl-cyan"></i> ${(game.downloads||0).toLocaleString()} DLs</div>
                    <div class="sys-badge"><i class="fas fa-gamepad cl-purple"></i> ${determineCat(game).toUpperCase()}</div>
                </div>
                
                <p class="modal-desc slide-stagger st-2">${game.descripcion}</p>
                
                <div class="req-box slide-stagger st-2"><strong>SYSTEM REQ:</strong> ${game.requisitos || "Specs unavailable."}</div>
                
                <div class="download-zone slide-stagger st-3">
                    <h4>Select Secure Server</h4>
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

        // Re-attach close event listener to the freshly injected button
        document.getElementById('closeDetailsBtn').addEventListener('click', closeModal);

        // Show Modal and Block Body Scroll
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden'; 
    }

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = ''; 
    }

    // 6. Events Binding
    filterBtns.forEach(btn => btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        runEngine();
    }));

    sortSelect.addEventListener('change', runEngine);
    
    let tOut;
    searchInput.addEventListener('input', () => {
        clearTimeout(tOut);
        tOut = setTimeout(runEngine, 300);
    });

    btnPrev.addEventListener('click', () => { if(currPage > 1) { currPage--; renderGallery(); renderPagination(); }});
    btnNext.addEventListener('click', () => { if(currPage < Math.ceil(activeData.length/perPage)) { currPage++; renderGallery(); renderPagination(); }});

    gallery.addEventListener('click', (e) => {
        const card = e.target.closest('.game-card');
        if (card) openModal(card.dataset.id);
    });

    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

    // Boot
    runEngine();
});
