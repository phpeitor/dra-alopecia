document.addEventListener('DOMContentLoaded', async () => {
    const selectProfesional = document.getElementById('profesional');

    function resetSelect() {
        selectProfesional.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Profesional';
        selectProfesional.appendChild(opt);
    }

    try {
        const resp = await fetch('./js/programacion.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error('No se pudo cargar programacion.json');
        const data = await resp.json();

        const set = new Set();
        (data.events || []).forEach(e => {
        if (e && typeof e.profesional === 'string' && e.profesional.trim() !== '') {
            set.add(e.profesional.trim());
        }
        });

        resetSelect();
        [...set].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
        .forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            selectProfesional.appendChild(option);
        });

    } catch (err) {
        console.error(err);
        resetSelect();
        const errorOpt = document.createElement('option');
        errorOpt.disabled = true;
        errorOpt.textContent = 'No se pudo cargar la lista';
        selectProfesional.appendChild(errorOpt);
    }

    const docName = document.querySelector('.doc-name');
    const docSpeciality = document.querySelector('.doc-speciality');
    const profileImg = document.querySelector('.profile-doctor');

    const imagenesProfesionales = {
        "Dra. Adela Vargas": "./img/02.jpg",
        "Dra. María Belén Peña": "./img/01.jpg",
        "Dra. María Cristina Latorre": "./img/03.jpg"
    };
    
    selectProfesional.addEventListener('change', () => {
        const selectedText = selectProfesional.options[selectProfesional.selectedIndex].text;

        if (selectedText && selectedText !== 'Profesional') {
            docName.textContent = selectedText;
            docSpeciality.textContent = 'Alopecia';

            if (imagenesProfesionales[selectedText]) {
                profileImg.src = imagenesProfesionales[selectedText];
            } else {
                profileImg.src = "./img/01.jpg"; 
            }
        } else {
            docName.textContent = '';
            docSpeciality.textContent = '';
            profileImg.src = "./img/01.jpg";
        }
    });

    const tabLabels = document.querySelectorAll('.simple-tabs-header-link');
    const precioEl = document.getElementById('precio');
    const direccionDiv = document.getElementById('direccionDiv');

    tabLabels.forEach(label => {
        label.addEventListener('click', () => {
        tabLabels.forEach(l => l.classList.remove('current'));
        label.classList.add('current');

        const texto = label.textContent.trim().toLowerCase();

        if (texto.includes('virtual')) {
            precioEl.textContent = 'S/. 100.00';
            direccionDiv.style.setProperty('display', 'none', 'important');
        } else {
            precioEl.textContent = 'S/. 150.00';
            direccionDiv.style.setProperty('display', 'flex', 'important'); 
        }
        });
    });

    const header = document.querySelector('header[data-v-6cad2bde]');
    const left  = header.querySelector('.arrow-left');
    const right = header.querySelector('.arrow-right');
    const cards = [...header.querySelectorAll('.available-dates')];

    const base = new Date(); base.setHours(0,0,0,0);
    let offset = 0; 
    const fmtFecha = new Intl.DateTimeFormat('es-PE', { day:'numeric', month:'long' });
    const fmtDia   = new Intl.DateTimeFormat('es-PE', { weekday:'long' });

    const iso = d => {
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${dd}`;
    };

    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    function render() {
        cards.forEach((card, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + offset + i);

        const h3 = card.querySelector('h3');
        const h4 = card.querySelector('h4');
        const input = card.querySelector('input[type="radio"]');

        const rel = offset + i;
        h3.textContent = rel === 0 ? 'Hoy' : (rel === 1 ? 'Mañana' : cap(fmtDia.format(d)));
        h4.textContent = cap(fmtFecha.format(d));
        input.value = iso(d);
        });

        cards.forEach(c => c.classList.remove('selected-date'));
        cards[0].classList.add('selected-date');
        cards.forEach(c => c.querySelector('input').checked = false);
        cards[0].querySelector('input').checked = true;
    }

    left.addEventListener('click', () => {
        offset = Math.max(0, offset - 3); 
        render();
    });

    right.addEventListener('click', () => {
        offset += 3;
        render();
    });

    header.addEventListener('click', (e) => {
        const card = e.target.closest('.available-dates');
        if (!card) return;
        cards.forEach(c => c.classList.remove('selected-date'));
        card.classList.add('selected-date');
        cards.forEach(c => c.querySelector('input').checked = false);
        card.querySelector('input').checked = true;
    });

    render();

});