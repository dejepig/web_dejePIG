document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-button');
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const messageEl = document.getElementById('form-message');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        messageEl.textContent = '';
        messageEl.className = 'mt-4 text-sm text-center';
        submitSpinner.classList.remove('hidden');
        submitText.textContent = 'Odesílám…';
        submitBtn.disabled = true;

        // Funkce pro zpracování úspěchu
        const handleSuccess = () => {
            form.reset();
            messageEl.textContent = 'Děkujeme! Ozveme se co nejdříve.';
            messageEl.className = 'mt-4 text-sm text-center text-emerald-600';
            setTimeout(() => {
                closeModal('contact-modal');
                messageEl.textContent = '';
                messageEl.className = 'mt-4 text-sm text-center';
            }, 2500);
            submitSpinner.classList.add('hidden');
            submitText.textContent = 'Odeslat zprávu';
            submitBtn.disabled = false;
        };

        // Funkce pro zpracování chyby
        const handleError = (error, details = '') => {
            console.error('Contact form submission failed:', error, details);
            let errorMessage = 'Zkuste to prosím znovu.';
            if (error && error.message) {
                errorMessage = error.message;
            } else if (details) {
                errorMessage = details;
            }
            messageEl.textContent = `Odeslání se nezdařilo. ${errorMessage}`;
            messageEl.className = 'mt-4 text-sm text-center text-red-600';
            submitSpinner.classList.add('hidden');
            submitText.textContent = 'Odeslat zprávu';
            submitBtn.disabled = false;
        };

        // Získáme data z formuláře
        const formData = new FormData(form);

        try {
            // Odešleme přes fetch API
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Zkontrolujeme, zda je odpověď JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Pokud není JSON, zkusíme text
                const text = await response.text();
                console.log('Formspree response (text):', text);
                
                if (response.ok || response.status === 200 || response.status === 302) {
                    // Formspree někdy vrací redirect nebo HTML, což znamená úspěch
                    handleSuccess();
                    return;
                } else {
                    handleError(new Error('Neočekávaná odpověď ze serveru.'), `Status: ${response.status}`);
                    return;
                }
            }

            const data = await response.json();
            console.log('Formspree response:', data);

            if (response.ok) {
                // Úspěšné odeslání
                handleSuccess();
            } else {
                // Chyba od Formspree
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.message || err).join(', ');
                    handleError(new Error(errorMessages));
                } else if (data.error) {
                    handleError(new Error(data.error));
                } else {
                    handleError(new Error('Formulář se nepodařilo odeslat.'), `Status: ${response.status}`);
                }
            }
        } catch (error) {
            // Síťová chyba nebo jiná chyba
            console.error('Contact form submission error:', error);
            
            // Pokud je to síťová chyba, zkusíme klasické odeslání jako fallback
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                console.log('Fetch failed, trying classic form submission...');
                // Vytvoříme dočasný formulář pro klasické odeslání
                const tempForm = document.createElement('form');
                tempForm.method = 'POST';
                tempForm.action = form.action;
                tempForm.style.display = 'none';
                
                // Zkopírujeme všechna pole
                for (let [key, value] of formData.entries()) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    tempForm.appendChild(input);
                }
                
                document.body.appendChild(tempForm);
                
                // Odešleme klasicky
                tempForm.submit();
                
                // Zobrazíme úspěch (klasické odeslání přesměruje na Formspree stránku)
                handleSuccess();
                
                // Odstraníme dočasný formulář po chvíli
                setTimeout(() => {
                    document.body.removeChild(tempForm);
                }, 1000);
            } else {
                handleError(error);
            }
        }
    });
});
// Uchovává aktuální zobrazenou sekci
let currentActiveSection = 'home';
let currentActiveSubsection = null;
let currentActiveSubSubsection = null;

// Proměnné pro galerii
let currentGalleryImages = [];
let currentGalleryIndex = 0;

const AVAILABLE_SECTIONS = ['home', 'prehistory', 'antiquity', 'medieval', 'earlymodern', 'modernhistory'];

// Slovník pro názvy (již není potřeba pro drobečky, ale může se hodit)
const BREADCRUMB_NAMES = {
    'home': 'Domů', 'prehistory': 'Pravěk', 'antiquity': 'Starověk', 'medieval': 'Středověk', 'earlymodern': 'Novověk', 'modernhistory': 'Moderní dějiny',
    '19thcentury': '19. století', 'modern': '20. století', '21stcentury': '21. století',
    '911': '9/11', 'quarter': 'Jsme ve čtvrtině',
    'mesopotamia': 'Mezopotámie', 'egypt': 'Egypt', 'rim': 'Řím', 'greece': 'Řecko', 'renaissance': 'Renesance', 'boulevard': 'Bulvár', 'habsburg': 'Nástup Habsburků', 'newworld': 'Nový svět',
    'sumerove': 'Sumerové', 'babylon': 'Babylon', 'punskevalky': 'Punské války', 'kartago': 'Kartágo'
};

// --- FUNKCE PRO UI ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('modal-visible');
    modal.classList.remove('modal-hidden');

    if (modalId.endsWith('-password-modal')) {
        const focusPasswordInput = () => {
            if (!modal.classList.contains('modal-visible')) return;
            const passwordInput = modal.querySelector('input[id$="-password-input"]');
            if (passwordInput) {
                passwordInput.focus({ preventScroll: true });
                passwordInput.select();
            }
        };

        requestAnimationFrame(() => {
            focusPasswordInput();
            setTimeout(focusPasswordInput, 150);
        });
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('modal-visible');
    document.getElementById(modalId).classList.add('modal-hidden');
}

function showContent(sectionId, subsectionId = null, subsubsectionId = null, updateUrl = true) {
    if (!AVAILABLE_SECTIONS.includes(sectionId)) sectionId = 'home';
    document.querySelectorAll('main[id$="-section"], section[id$="-section"]').forEach(el => el.classList.add('hidden'));
    const targetSectionContainer = document.getElementById(`${sectionId}-section`);
    
    if (targetSectionContainer) {
        targetSectionContainer.classList.remove('hidden'); // Show L1 (antiquity-section)
        
        // Hide all L2 wrappers
        targetSectionContainer.querySelectorAll(':scope > div[id$="-view"], :scope > div[id$="-section"]').forEach(view => view.classList.add('hidden'));
        
        if (subsubsectionId) {
            // Zobrazuje L3 obsah (např. 'punskevalky')
            const parentView = document.getElementById(`${sectionId}-${subsectionId}-section`); // 'antiquity-rim-section'
            if (parentView) {
                parentView.classList.remove('hidden'); // Zobrazí L2 wrapper ('antiquity-rim-section')
                // Skryje *uvnitř* L2 wrapperu všechny L3 kontejnery
                parentView.querySelectorAll(':scope > div[id$="-view"], :scope > div[id$="-section"]').forEach(view => view.classList.add('hidden'));
            }
            
            const view = document.getElementById(`${sectionId}-${subsectionId}-${subsubsectionId}-section`); // 'antiquity-rim-punskevalky-section'
            if(view) view.classList.remove('hidden'); // Zobrazí L3 obsah
        
        } else if (subsectionId) {
            // Zobrazuje L2 obsah (např. 'rim' nebo 'egypt')
            const subsectionView = document.getElementById(`${sectionId}-${subsectionId}-section`); // např. 'antiquity-rim-section'
            const subsectionTiles = document.getElementById(`${sectionId}-${subsectionId}-tiles-view`); // např. 'antiquity-rim-tiles-view'
            
            if (subsectionTiles) { 
                // Toto je L2 sekce, která MÁ L3 dlaždice (např. 'rim', 'mesopotamia')
                 subsectionTiles.closest('div[id$="-section"]').classList.remove('hidden'); // Zobrazí L2 wrapper ('antiquity-rim-section')
                 
                 // Uvnitř L2 wrapperu skryj VŠECHNY L3 obsahy a zobraz JEN L3 dlaždice
                 subsectionTiles.closest('div[id$="-section"]').querySelectorAll(':scope > div[id$="-view"], :scope > div[id$="-section"]').forEach(view => view.classList.add('hidden'));
                 subsectionTiles.classList.remove('hidden'); // Zobrazí L3 dlaždice ('antiquity-rim-tiles-view')

            } else if (subsectionView) {
                // Toto je L2 sekce bez L3 dlaždic (např. 'egypt')
                subsectionView.classList.remove('hidden'); // Zobrazí L2 obsah ('antiquity-egypt-section')
            }
        } else {
            // Zobrazuje L1 obsah (hlavní dlaždice sekce, např. 'antiquity-tiles-view')
            const view = document.getElementById(`${sectionId}-tiles-view`) || targetSectionContainer.querySelector(':scope > div:not(nav)');
             if(view) view.classList.remove('hidden');
        }
    } else if (sectionId === 'home') {
        document.getElementById('home-section').classList.remove('hidden');
    }
    
    // --- Drobečková navigace byla odstraněna ---
    
    currentActiveSection = sectionId;
    currentActiveSubsection = subsectionId;
    currentActiveSubSubsection = subsubsectionId;
    
    if (updateUrl) {
        let hash = `#${sectionId}`;
        if (subsectionId) hash += `/${subsectionId}`;
        if (subsubsectionId) hash += `/${subsubsectionId}`;
        history.pushState({ section: sectionId, subsection: subsectionId, subsubsection: subsubsectionId }, '', hash);
    }
}

function showSection(sectionId) { showContent(sectionId, null, null, true); }

function showSubsection(sectionId, subsectionId) { 
    // Původní kód pro zobrazení podsekce (nyní bez "chytrého" přeskakování)
    showContent(sectionId, subsectionId, null, true); 
}

function showSubSubsection(sectionId, subsectionId, subsubsectionId) { showContent(sectionId, subsectionId, subsubsectionId, true); }

window.onpopstate = (event) => {
    const state = event.state || {};
    const hash = window.location.hash.substring(1);
    const parts = hash.split('/');
    showContent(state.section || parts[0] || 'home', state.subsection || parts[1] || null, state.subsubsection || parts[2] || null, false);
};

function initializePageState() {
    const hash = window.location.hash.substring(1);
    const parts = hash.split('/');
    const initialSection = parts[0] || 'home';
    const initialSubsection = parts[1] || null;
    const initialSubSubsection = parts[2] || null;
    history.replaceState({ section: initialSection, subsection: initialSubsection, subsubsection: initialSubSubsection }, '', window.location.hash || '#home');
    showContent(initialSection, initialSubsection, initialSubSubsection, false);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('sidebar-open');
    document.getElementById('overlay').classList.toggle('overlay-visible');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('sidebar-open');
    document.getElementById('overlay').classList.remove('overlay-visible');
}

function toggleLockMenu() {
    const menu = document.getElementById('lock-dropdown-menu');
    const button = document.getElementById('lock-nav-button');
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
        // Zajistit, že všechna submenu jsou skrytá při otevření menu
        document.querySelectorAll('.lock-dropdown-item-with-submenu').forEach(item => {
            item.classList.remove('active');
        });
    } else {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
        // Zavřít všechna submenu při zavření menu
        document.querySelectorAll('.lock-dropdown-item-with-submenu').forEach(item => {
            item.classList.remove('active');
        });
    }
}

function closeLockMenu() {
    const menu = document.getElementById('lock-dropdown-menu');
    const button = document.getElementById('lock-nav-button');
    menu.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');
    // Odstranit aktivní stav ze všech submenu
    document.querySelectorAll('.lock-dropdown-item-with-submenu').forEach(item => {
        item.classList.remove('active');
    });
}

function toggleSumerLockMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('sumer-lock-dropdown-menu');
    const button = document.getElementById('sumer-lock-button');
    if (!menu || !button) return;
    
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
    } else {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    }
}

function closeSumerLockMenu() {
    const menu = document.getElementById('sumer-lock-dropdown-menu');
    const button = document.getElementById('sumer-lock-button');
    if (menu) menu.classList.add('hidden');
    if (button) button.setAttribute('aria-expanded', 'false');
}

function toggleEgyptLockMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('egypt-lock-dropdown-menu');
    const button = document.getElementById('egypt-lock-button');
    if (!menu || !button) return;
    
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
    } else {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    }
}

function closeEgyptLockMenu() {
    const menu = document.getElementById('egypt-lock-dropdown-menu');
    const button = document.getElementById('egypt-lock-button');
    if (menu) menu.classList.add('hidden');
    if (button) button.setAttribute('aria-expanded', 'false');
}

function toggleRozpadRiseLockMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('rozpad-rise-lock-dropdown-menu');
    const button = document.getElementById('rozpad-rise-lock-button');
    if (!menu || !button) return;
    
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
    } else {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    }
}

function closeRozpadRiseLockMenu() {
    const menu = document.getElementById('rozpad-rise-lock-dropdown-menu');
    const button = document.getElementById('rozpad-rise-lock-button');
    if (menu) menu.classList.add('hidden');
    if (button) button.setAttribute('aria-expanded', 'false');
}

function togglePrincipalityLockMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('principality-lock-dropdown-menu');
    const button = document.getElementById('principality-lock-button');
    if (!menu || !button) return;
    
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
    } else {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    }
}

function closePrincipalityLockMenu() {
    const menu = document.getElementById('principality-lock-dropdown-menu');
    const button = document.getElementById('principality-lock-button');
    if (menu) menu.classList.add('hidden');
    if (button) button.setAttribute('aria-expanded', 'false');
}

function toggleKingdomLockMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('kingdom-lock-dropdown-menu');
    const button = document.getElementById('kingdom-lock-button');
    if (!menu || !button) return;
    
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
    } else {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    }
}

function closeKingdomLockMenu() {
    const menu = document.getElementById('kingdom-lock-dropdown-menu');
    const button = document.getElementById('kingdom-lock-button');
    if (menu) menu.classList.add('hidden');
    if (button) button.setAttribute('aria-expanded', 'false');
}

function toggleSubmenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    
    // Najít kliknutý odkaz
    let clickedLink;
    if (event && event.target) {
        clickedLink = event.target.closest('a.lock-dropdown-item[data-has-submenu="true"]');
    }
    
    if (!clickedLink) return;
    
    // Najít rodičovský div s třídou lock-dropdown-item-with-submenu
    const submenuItem = clickedLink.parentElement;
    
    if (submenuItem && submenuItem.classList.contains('lock-dropdown-item-with-submenu')) {
        // Zavřít ostatní submenu na stejné úrovni (sourozenci)
        const parent = submenuItem.parentElement;
        if (parent) {
            parent.querySelectorAll('.lock-dropdown-item-with-submenu').forEach(item => {
                if (item !== submenuItem) {
                    item.classList.remove('active');
                    // Odstranit inline styly z ostatních submenu, aby se správně zavřely
                    const otherSubmenu = item.querySelector('.lock-submenu');
                    if (otherSubmenu) {
                        otherSubmenu.style.display = '';
                        otherSubmenu.style.maxHeight = '';
                        otherSubmenu.style.opacity = '';
                        otherSubmenu.style.visibility = '';
                        otherSubmenu.style.pointerEvents = '';
                    }
                }
            });
        }
        
        // Přepnout aktuální submenu - na mobilu zůstane otevřené
        const isActive = submenuItem.classList.contains('active');
        if (isActive) {
            submenuItem.classList.remove('active');
            // Odstranit inline styly, aby se submenu správně zavřelo
            const submenu = submenuItem.querySelector('.lock-submenu');
            if (submenu) {
                submenu.style.display = '';
                submenu.style.maxHeight = '';
                submenu.style.opacity = '';
                submenu.style.visibility = '';
                submenu.style.pointerEvents = '';
            }
        } else {
            submenuItem.classList.add('active');
            
            // Zajistit, že submenu zůstane otevřené i po ukončení touch eventu
            // Toto je důležité pro mobilní zařízení
            setTimeout(() => {
                if (submenuItem.classList.contains('active')) {
                    const submenu = submenuItem.querySelector('.lock-submenu');
                    if (submenu) {
                        submenu.style.display = 'flex';
                        submenu.style.maxHeight = '500px';
                        submenu.style.opacity = '1';
                        submenu.style.visibility = 'visible';
                        submenu.style.pointerEvents = 'auto';
                    }
                }
            }, 50);
        }
    }
}

function togglePasswordVisibility(inputId, checkboxId) {
    const input = document.getElementById(inputId);
    const checkbox = document.getElementById(checkboxId);
    if (checkbox.checked) {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// Funkce pro přehrání zvuku při úspěšném zadání hesla
function playSuccessSound() {
    const audio = new Audio('https://dejepig.wz.cz/sounds/YES.mp3');
    audio.play().catch(error => {
        // Pokud se zvuk nepodaří přehrát (např. kvůli autoplay policy), ignorujeme chybu
        console.log('Zvuk se nepodařilo přehrát:', error);
    });
}

// Funkce pro přehrání zvuku při špatném zadání hesla
function playErrorSound() {
    const audio = new Audio('https://dejepig.wz.cz/sounds/NO.mp3');
    audio.play().catch(error => {
        // Pokud se zvuk nepodaří přehrát (např. kvůli autoplay policy), ignorujeme chybu
        console.log('Zvuk se nepodařilo přehrát:', error);
    });
}

// Funkce pro normalizaci textu - odstranění diakritiky a převedení na malá písmena
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Odstranění diakritických znaků
}

function checkPassword(inputId) {
    const input = document.getElementById(inputId);
    const password = input.value.trim();
    
    // Různá hesla pro různé sekce
    let correctPassword;
    if (inputId === 'mesopotamia-password-input') {
        correctPassword = '812iiíl1';
    } else if (inputId === 'pyramid-password-input') {
        correctPassword = 'ds234';
    } else if (inputId === 'egypt-password-input') {
        correctPassword = '12smrkaccm';
    } else if (inputId === 'pad-rima-password-input') {
        correctPassword = '476brnoxmk';
    } else {
        correctPassword = '0303'; // Výchozí heslo pro ostatní sekce
    }
    
    // Najít modální okno podle inputId
    const modalIdMap = {
        'mesopotamia-password-input': 'mesopotamia-password-modal',
        'sumer-password-input': 'sumer-password-modal',
        'pyramid-password-input': 'pyramid-password-modal',
        'egypt-password-input': 'egypt-password-modal',
        'greece-password-input': 'greece-password-modal',
        'pad-rima-password-input': 'pad-rima-password-modal',
        'first-premyslids-password-input': 'first-premyslids-password-modal',
        'first-czech-kings-password-input': 'first-czech-kings-password-modal',
        'last-premyslids-1-password-input': 'last-premyslids-1-password-modal',
        'husite-wars-password-input': 'husite-wars-password-modal',
        'jan-palach-password-input': 'jan-palach-password-modal',
        '1968-password-input': '1968-password-modal',
        'velvet-revolution-personality-password-input': 'velvet-revolution-personality-password-modal',
        'quarter-21st-century-password-input': 'quarter-21st-century-password-modal'
    };
    const passwordModalId = modalIdMap[inputId];
    
    // Porovnání normalizovaných verzí (bez diakritiky a case-insensitive)
    const normalizedPassword = normalizeText(password);
    const normalizedCorrectPassword = normalizeText(correctPassword);
    
    if (normalizedPassword === normalizedCorrectPassword) {
        // Přehrát zvuk při úspěšném zadání hesla
        playSuccessSound();
        
        // Správné heslo - zavřít modální okno s heslem a zobrazit zprávu o úspěchu
        if (passwordModalId) {
            closeModal(passwordModalId);
        }
        // Pro Mezopotámii použít speciální modální okno
        if (inputId === 'mesopotamia-password-input') {
            openModal('mesopotamia-success-modal');
        } else if (inputId === 'pyramid-password-input') {
            openModal('pyramid-success-modal');
        } else if (inputId === 'egypt-password-input') {
            openModal('egypt-success-modal');
        } else if (inputId === 'pad-rima-password-input') {
            // Zobrazit sekci Pád Říma
            showContent('antiquity', 'pad-rima', null, true);
            openModal('password-success-modal');
        } else {
            openModal('password-success-modal');
        }
        input.value = ''; // Vymazat pole
    } else {
        // Špatné heslo
        // Přehrát zvuk při špatném zadání hesla
        playErrorSound();
        openModal('password-error-modal');
        input.value = ''; // Vymazat pole
    }
}

// Zachování zpětné kompatibility
function checkMesopotamiaPassword() {
    checkPassword('mesopotamia-password-input');
}

function openImageZoom(element) {
    const modal = document.getElementById('image-zoom-modal');
    const image = document.getElementById('zoomed-image');
    const sourceWrapper = document.getElementById('zoomed-image-source-wrapper'); // Toto je nyní <a> tag
    const sourceTextElement = document.getElementById('zoomed-image-source-text');
    
    let imageUrl, altText, sourceData, sourceUrl; // Přidáno sourceUrl

    // Pro tlačítka (Egypt)
    if (typeof element === 'object' && !element.src && element.getAttribute('data-src')) {
        imageUrl = element.getAttribute('data-src');
        altText = element.getAttribute('data-alt');
        sourceData = element.getAttribute('data-source'); 
        sourceUrl = element.getAttribute('data-source-url'); // NOVÉ
        
        // Není v galerii
        currentGalleryImages = [];
        document.getElementById('gallery-prev').style.display = 'none';
        document.getElementById('gallery-next').style.display = 'none';
    } 
    // Pro obrázky v galerii
    else if (element && element.src) {
        imageUrl = element.src;
        altText = element.alt;
        sourceData = element.getAttribute('data-source');
        sourceUrl = element.getAttribute('data-source-url'); // NOVÉ
        
        // Logika pro galerii
        currentGalleryImages = [];
        const gallery = element.closest('[data-gallery-id]');
        if (gallery) {
            const images = gallery.querySelectorAll('img');
            images.forEach((img, index) => {
                currentGalleryImages.push({
                    src: img.src,
                    alt: img.alt,
                    source: img.getAttribute('data-source'),
                    sourceUrl: img.getAttribute('data-source-url') // NOVÉ
                });
                if (img.src === imageUrl) {
                    currentGalleryIndex = index;
                }
            });
            document.getElementById('gallery-prev').style.display = 'flex';
            document.getElementById('gallery-next').style.display = 'flex';
        } else {
            document.getElementById('gallery-prev').style.display = 'none';
            document.getElementById('gallery-next').style.display = 'none';
        }
    }

    image.src = imageUrl;
    image.alt = altText;

    // NOVÁ LOGIKA pro zdrojový odkaz - plynulé zobrazení z ikonky
    if (sourceData && sourceData !== "null") {
        // Nejdřív nastavíme text, ale element zůstane skrytý
        sourceTextElement.textContent = sourceData;
        
        // Nastavíme URL
        if (sourceUrl && sourceUrl !== "null") {
            sourceWrapper.href = sourceUrl;
        } else {
            sourceWrapper.href = '#';
        }
        
        // Použijeme requestAnimationFrame pro plynulé zobrazení
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Nejdřív zobrazíme ikonku ve sbaleném stavu
                sourceWrapper.classList.remove('hidden');
                sourceWrapper.classList.add('showing');
                sourceWrapper.style.pointerEvents = 'auto';
                
                // Po malé chvíli odstraníme třídu "showing", aby se rámeček mohl normálně chovat
                setTimeout(() => {
                    sourceWrapper.classList.remove('showing');
                }, 50);
            });
        });
    } else {
        sourceWrapper.classList.add('hidden');
        sourceWrapper.href = '#';
        sourceWrapper.style.pointerEvents = 'none';
    }

    modal.classList.remove('modal-hidden');
    modal.style.opacity = '1';
}

function closeImageZoom(event) {
    const modal = document.getElementById('image-zoom-modal');
    if (event.target.id === 'image-zoom-modal' || event.target.closest('button[aria-label="Zavřít zvětšený obrázek"]')) {
        const sourceWrapper = document.getElementById('zoomed-image-source-wrapper');
        // Nejdřív skryjeme rámeček s informací
        sourceWrapper.classList.add('hidden');
        
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('modal-hidden');
            document.getElementById('zoomed-image').src = ''; 
            document.getElementById('zoomed-image-source-text').textContent = '';
            // Vyčistit galerii
            currentGalleryImages = [];
            currentGalleryIndex = 0;
        }, 300);
    }
}

function navigateGallery(direction) {
    if (currentGalleryImages.length === 0) return;

    currentGalleryIndex += direction;

    if (currentGalleryIndex < 0) {
        currentGalleryIndex = currentGalleryImages.length - 1;
    } else if (currentGalleryIndex >= currentGalleryImages.length) {
        currentGalleryIndex = 0;
    }

    const newImage = currentGalleryImages[currentGalleryIndex];
    const imageElement = document.getElementById('zoomed-image');
    const sourceWrapper = document.getElementById('zoomed-image-source-wrapper'); // Toto je <a>
    const sourceTextElement = document.getElementById('zoomed-image-source-text');

    imageElement.src = newImage.src;
    imageElement.alt = newImage.alt;

    // UPRAVENÁ LOGIKA - plynulé zobrazení z ikonky
    if (newImage.source && newImage.source !== "null") {
        sourceTextElement.textContent = newImage.source;
        
        if (newImage.sourceUrl && newImage.sourceUrl !== "null") {
            sourceWrapper.href = newImage.sourceUrl;
        } else {
            sourceWrapper.href = '#';
        }
        
        // Použijeme requestAnimationFrame pro plynulé zobrazení
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Nejdřív zobrazíme ikonku ve sbaleném stavu
                sourceWrapper.classList.remove('hidden');
                sourceWrapper.classList.add('showing');
                sourceWrapper.style.pointerEvents = 'auto';
                
                // Po malé chvíli odstraníme třídu "showing", aby se rámeček mohl normálně chovat
                setTimeout(() => {
                    sourceWrapper.classList.remove('showing');
                }, 50);
            });
        });
    } else {
        sourceWrapper.classList.add('hidden');
        sourceWrapper.href = '#';
        sourceWrapper.style.pointerEvents = 'none';
    }
}

// Funkce pro rozbalení/sbalení textu
function expandText(button) {
    const wrapper = button.closest('.expandable-text-wrapper');
    wrapper.querySelector('.expandable-text').classList.add('expanded');
    button.style.display = 'none';
    wrapper.querySelector('.sbalit-button').style.display = 'block';
}

function collapseText(button) {
    const wrapper = button.closest('.expandable-text-wrapper');
    const textElement = wrapper.querySelector('.expandable-text');
    textElement.classList.remove('expanded');
    button.style.display = 'none';
    wrapper.querySelector('.expand-button').style.display = 'block';
    
    // Plynule odscrolluje nahoru na začátek karty
    wrapper.closest('.p-6').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Nová funkce pro posouvání galerie náhledů
function scrollGallery(button, direction) {
    const galleryWrapper = button.parentElement;
    const gallery = galleryWrapper.querySelector('.overflow-x-auto');
    const firstItem = gallery.querySelector('.image-mat-wrapper');
    if (!firstItem) return;
    
    const itemWidth = firstItem.offsetWidth;
    const gap = parseInt(window.getComputedStyle(gallery).gap) || 16; // 1rem = 16px
    const scrollAmount = (itemWidth + gap) * direction;
    
    gallery.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

// NOVÁ FUNKCE: Načtení YouTube videa
function loadVideo(element, videoId) {
    const wrapper = element.parentElement; // Cílí na div se stylem
    wrapper.innerHTML = `
        <iframe class="absolute top-0 left-0 w-full h-full" 
                src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
        </iframe>
    `;
}

// Event delegation pro submenu položky - přidáme hned po načtení DOM
function setupSubmenuListeners() {
    const lockMenu = document.getElementById('lock-dropdown-menu');
    if (lockMenu) {
        let touchStartTime = 0;
        let touchStartTarget = null;
        let lastTouchTime = 0;
        let ignoreNextClick = false;
        
        const handleSubmenuTouch = (event) => {
            const clickedLink = event.target.closest('a.lock-dropdown-item[data-has-submenu="true"]');
            if (clickedLink) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                touchStartTime = Date.now();
                touchStartTarget = clickedLink;
                lastTouchTime = Date.now();
                ignoreNextClick = true;
                
                toggleSubmenu(event);
                
                // Zrušit ignoreNextClick po 400ms (aby se click event neaktivoval)
                setTimeout(() => {
                    ignoreNextClick = false;
                }, 400);
                
                return false;
            }
        };
        
        const handleSubmenuClick = (event) => {
            // Na mobilu ignorovat click event, pokud byl před chvílí touchstart
            if (ignoreNextClick || (Date.now() - lastTouchTime < 400)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }
            
            const clickedLink = event.target.closest('a.lock-dropdown-item[data-has-submenu="true"]');
            if (clickedLink) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                toggleSubmenu(event);
                return false;
            }
        };
        
        // Na mobilu použijeme touchstart, na desktopu click
        lockMenu.addEventListener('touchstart', handleSubmenuTouch, { passive: false, capture: true });
        lockMenu.addEventListener('click', handleSubmenuClick, true);
        
        // Touchend použijeme jen pro prevenci defaultního chování
        lockMenu.addEventListener('touchend', (event) => {
            const clickedLink = event.target.closest('a.lock-dropdown-item[data-has-submenu="true"]');
            if (clickedLink && touchStartTarget === clickedLink) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, { passive: false, capture: true });
    }
}

// Přidáme listener hned, jak je DOM připraven
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSubmenuListeners);
} else {
    setupSubmenuListeners();
}

window.onload = () => {
    initializePageState();
    
    let lastScrollTop = 0;
    const navbar = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        let st = window.pageYOffset || document.documentElement.scrollTop;
        navbar.classList.toggle('nav-hidden', st > lastScrollTop && st > 100);
        lastScrollTop = st <= 0 ? 0 : st;
    }, false);
    
    // Zavření modálních oken při stisknutí Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            // Najdeme všechna viditelná modální okna
            const visibleModals = document.querySelectorAll('.modal-overlay.modal-visible');
            visibleModals.forEach(modal => {
                const modalId = modal.id;
                if (modalId) {
                    closeModal(modalId);
                }
            });
            
            // Zavření image-zoom-modal, pokud je otevřený
            const imageZoomModal = document.getElementById('image-zoom-modal');
            if (imageZoomModal && !imageZoomModal.classList.contains('modal-hidden')) {
                closeImageZoom({ target: { id: 'image-zoom-modal' } });
            }
        }
    });
    
    // Zavření menu zámků při kliknutí mimo něj
    document.addEventListener('click', (event) => {
        const lockButton = document.getElementById('lock-nav-button');
        const lockMenu = document.getElementById('lock-dropdown-menu');
        if (lockMenu && lockButton && !lockButton.contains(event.target) && !lockMenu.contains(event.target)) {
            closeLockMenu();
        }
        
        // Zavření Sumer lock menu při kliknutí mimo něj
        const sumerLockButton = document.getElementById('sumer-lock-button');
        const sumerLockMenu = document.getElementById('sumer-lock-dropdown-menu');
        if (sumerLockMenu && sumerLockButton && !sumerLockButton.contains(event.target) && !sumerLockMenu.contains(event.target)) {
            closeSumerLockMenu();
        }
        
        // Zavření Egypt lock menu při kliknutí mimo něj
        const egyptLockButton = document.getElementById('egypt-lock-button');
        const egyptLockMenu = document.getElementById('egypt-lock-dropdown-menu');
        if (egyptLockMenu && egyptLockButton && !egyptLockButton.contains(event.target) && !egyptLockMenu.contains(event.target)) {
            closeEgyptLockMenu();
        }
        
        // Zavření Rozpad říše lock menu při kliknutí mimo něj
        const rozpadRiseLockButton = document.getElementById('rozpad-rise-lock-button');
        const rozpadRiseLockMenu = document.getElementById('rozpad-rise-lock-dropdown-menu');
        if (rozpadRiseLockMenu && rozpadRiseLockButton && !rozpadRiseLockButton.contains(event.target) && !rozpadRiseLockMenu.contains(event.target)) {
            closeRozpadRiseLockMenu();
        }
        
        // Zavření Principality lock menu při kliknutí mimo něj
        const principalityLockButton = document.getElementById('principality-lock-button');
        const principalityLockMenu = document.getElementById('principality-lock-dropdown-menu');
        if (principalityLockMenu && principalityLockButton && !principalityLockButton.contains(event.target) && !principalityLockMenu.contains(event.target)) {
            closePrincipalityLockMenu();
        }
        
        // Zavření Kingdom lock menu při kliknutí mimo něj
        const kingdomLockButton = document.getElementById('kingdom-lock-button');
        const kingdomLockMenu = document.getElementById('kingdom-lock-dropdown-menu');
        if (kingdomLockMenu && kingdomLockButton && !kingdomLockButton.contains(event.target) && !kingdomLockMenu.contains(event.target)) {
            closeKingdomLockMenu();
        }
    });
    
    document.querySelectorAll('.newspaper-container').forEach(article => {
        const colorVar = article.getAttribute('data-color');
        const rgbVar = article.getAttribute('data-rgb');
        if (colorVar) article.style.setProperty('--article-color', colorVar.startsWith('--') ? `var(${colorVar})` : colorVar);
        if (rgbVar) article.style.setProperty('--article-color-rgb', rgbVar);
        article.classList.add('border-color-dynamic');
        article.querySelector('.main-article-title-dynamic').classList.add('main-article-title-dynamic');
        article.addEventListener('click', (e) => {
            // zabranit zoomu pokud se klika na tlacitko
            if (!e.target.closest('button')) {
                article.classList.toggle('is-zoomed');
            }
        });
    });
    
};