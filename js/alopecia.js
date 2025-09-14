document.addEventListener('DOMContentLoaded', async () => {
    const selectProfesional = document.getElementById('profesional');
    const today = new Date().toISOString().split('T')[0];
    const inputDate = document.getElementById('date');
    inputDate.value = today;
    inputDate.min = today;

    // ====== NUEVO: caché para usar programacion.json luego ======
    let programacionData = null;

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
        programacionData = data; // <-- guardamos para usar en slots

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
                profileImg.src = "./img/woman.jpg"; 
            }
        } else {
            docName.textContent = '';
            docSpeciality.textContent = '';
            profileImg.src = "./img/woman.jpg";
        }

        // NUEVO: cuando cambie el profesional, recalcula slots
        renderSlots();
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

    // ====== FECHAS (3 en 3) ======
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

        // NUEVO: al cambiar página de fechas, recalcula slots
        renderSlots();
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

        // NUEVO: al seleccionar un día, recalcula slots
        renderSlots();
    });

    render();

    // ====== SLOTS (45 min) ======
    const pickerRoot   = document.querySelector('.availability-picker');
    const slotsWrapper = pickerRoot.querySelector('.available-slots-wrapper');
    const slotsLoading = pickerRoot.querySelector('.available-slots-loading');
    const slotsMsgBox  = pickerRoot.querySelector('.available-slots-message');
    const slotsMsgSpan = slotsMsgBox?.querySelector('.span-link');

    const HHMM = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

    function getSelectedDateStr() {
      const checked = header.querySelector('input[name="availability-date"]:checked');
      return checked ? checked.value : null; // YYYY-MM-DD
    }
    function getSelectedProfesional() {
      const opt = selectProfesional?.options[selectProfesional.selectedIndex];
      if (!opt || !opt.value) return null;
      return opt.text;
    }

    async function renderSlots() {
        // limpiar
        slotsWrapper.innerHTML = '';
        slotsMsgBox.style.display = 'none';

        const prof = getSelectedProfesional();
        const dateStr = getSelectedDateStr();

        if (!prof || !dateStr) {
            if (!prof) {
            slotsMsgBox.style.display = 'block';
            if (slotsMsgSpan) slotsMsgSpan.textContent = 'Selecciona un profesional para ver horarios.';
            }
            return;
        }

        // Mostrar spinner
        slotsLoading.style.display = 'block';
        try {
            const data = programacionData || (await (await fetch('./js/programacion.json', { cache: 'no-store' })).json());

            // Filtra bloques del profesional y del día exacto
            const events = (data.events || []).filter(e =>
            e && e.profesional === prof &&
            typeof e.start === 'string' && typeof e.end === 'string' &&
            e.start.slice(0,10) === dateStr
            );

            const STEP_MIN = 45;
            const MILLI = 60000;
            const slotsSet = new Set();

            // Helper HH:MM
            const HHMM = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

            for (const ev of events) {
            const start = new Date(ev.start);
            const end   = new Date(ev.end);

            // Construcción por el END:
            // incluir end y luego retroceder de 45 en 45 hasta que el siguiente sea <= start
            for (let tEnd = new Date(end); tEnd > start; tEnd = new Date(tEnd.getTime() - STEP_MIN * MILLI)) {
                slotsSet.add(HHMM(tEnd));
            }
            }

            const slots = [...slotsSet].sort((a, b) => a.localeCompare(b)); // ascendente
            if (!slots.length) {
            slotsMsgBox.style.display = 'block';
            if (slotsMsgSpan) slotsMsgSpan.textContent = 'No hay horarios disponibles para este día.';
            return;
            }

            const frag = document.createDocumentFragment();
            slots.forEach(hhmm => {
            const label = document.createElement('label');
            label.className = 'available-slots';
            label.setAttribute('data-v-6cad2bde', '');

            const span = document.createElement('span');
            span.setAttribute('data-v-6cad2bde', '');
            span.textContent = hhmm;

            const input = document.createElement('input');
            input.setAttribute('data-v-6cad2bde', '');
            input.type = 'radio';
            input.name = 'availability-slot';
            input.value = hhmm;

            label.appendChild(span);
            label.appendChild(input);
            frag.appendChild(label);
            });
            slotsWrapper.appendChild(frag);

        } catch (e) {
            console.error(e);
            slotsMsgBox.style.display = 'block';
            if (slotsMsgSpan) slotsMsgSpan.textContent = 'No se pudo cargar la disponibilidad.';
        } finally {
            slotsLoading.style.display = 'none';
        }
    }

    // Primera pintada de slots (por si ya hay profesional seleccionado)
    renderSlots();
});

