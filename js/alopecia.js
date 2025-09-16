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

    // ====== SLOTS DOM REFS (MOVER ARRIBA ANTES DE USAR) ======
    const pickerRoot   = document.querySelector('.availability-picker');
    const slotsWrapper = pickerRoot.querySelector('.available-slots-wrapper');
    const slotsLoading = pickerRoot.querySelector('.available-slots-loading');
    const slotsMsgBox  = pickerRoot.querySelector('.available-slots-message');
    const slotsMsgSpan = slotsMsgBox?.querySelector('.span-link');

    const HHMM = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

    function getSelectedDateStr() {
        const checked = header.querySelector('input[name="availability-date"]:checked');
        return checked ? checked.value : null;
    }

    function getSelectedProfesional() {
        const opt = selectProfesional?.options[selectProfesional.selectedIndex];
        if (!opt || !opt.value) return null;
        return opt.text;
    }

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

    // ====== RENDER SLOTS (por el end y con data-v-6cad2bde) ======
    async function renderSlots() {
        if (!slotsWrapper) return; // guard por si el DOM cambia

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

        slotsLoading.style.display = 'block';
        try {
            const data = programacionData || (await (await fetch('./js/programacion.json', { cache: 'no-store' })).json());
            if (!programacionData) programacionData = data;

            const events = (data.events || []).filter(e =>
                e && e.profesional === prof &&
                typeof e.start === 'string' && typeof e.end === 'string' &&
                e.start.slice(0,10) === dateStr
            );

            const STEP_MIN = 45, MILLI = 60000;
            const slotsSet = new Set();

            for (const ev of events) {
                const start = new Date(ev.start);
                const end   = new Date(ev.end);
                // construir por el END (incluye end)
                for (let tEnd = new Date(end); tEnd > start; tEnd = new Date(tEnd.getTime() - STEP_MIN * MILLI)) {
                slotsSet.add(HHMM(tEnd));
                }
            }

            const slots = [...slotsSet].sort();
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

            slotsWrapper.querySelectorAll('.available-slots').forEach(slot => {
                slot.addEventListener('click', () => {
                    const selectedDate = document.querySelector('.available-dates.selected-date');
                    const selectedDateInput = document.querySelector('.available-dates.selected-date input[name="availability-date"]');
                    const dateValue = selectedDateInput ? selectedDateInput.value : '';
                    const dayLabel = selectedDate?.querySelector('h3')?.innerText || ''; 
                    const timeInput = slot.querySelector('input[name="availability-slot"]');
                    const timeValue = timeInput ? timeInput.value : '';

                    const fecCitaSpan = document.getElementById('fec_cita');
                    if (fecCitaSpan) {
                        fecCitaSpan.innerHTML = `
                            <img src="./img/icon-calendar.svg" width="30px" height="26px" style="padding:0 5px;">
                            ${dayLabel} ${dateValue} ${timeValue}
                        `;
                    }

                    modal.showModal();
                });
            });

        } catch (e) {
            console.error(e);
            slotsMsgBox.style.display = 'block';
            if (slotsMsgSpan) slotsMsgSpan.textContent = 'No se pudo cargar la disponibilidad.';
        } finally {
            slotsLoading.style.display = 'none';
        }
    }

    // Eventos de navegación y selección de día
    left.addEventListener('click', () => { offset = Math.max(0, offset - 3); render(); });
    right.addEventListener('click', () => { offset += 3; render(); });
    header.addEventListener('click', (e) => {
        const card = e.target.closest('.available-dates');
        if (!card) return;
        cards.forEach(c => { c.classList.remove('selected-date'); c.querySelector('input').checked = false; });
        card.classList.add('selected-date');
        card.querySelector('input').checked = true;
        renderSlots();
        
    });

    // Buscar (si ya añadiste el handler, esto puede quedarse igual)
    const form = document.getElementById('health-workers-search-form');
    const dateInput = document.getElementById('date');

    function daysDiffUTC(dateStr) {
        const [Y,M,D] = dateStr.split('-').map(Number);
        const baseUTC = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
        const dUTC = Date.UTC(Y, M-1, D);
        return Math.floor((dUTC - baseUTC) / 86400000);
    }
    function gotoDate(dateStr) {
        if (!dateStr) return;
        let d = daysDiffUTC(dateStr);
        if (d < 0) d = 0;
        offset = Math.floor(d / 3) * 3;
        render();
        const target = cards.find(c => c.querySelector('input[type="radio"]').value === dateStr);
        if (target) {
        cards.forEach(c => { c.classList.remove('selected-date'); c.querySelector('input').checked = false; });
        target.classList.add('selected-date');
        target.querySelector('input').checked = true;
        renderSlots();
        }
    }
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dateStr = dateInput.value;
        if (dateStr) gotoDate(dateStr);
        else renderSlots();
    });

    // Pintado inicial
    render();

    // === Sincronizar select appointment_type con tabs ===
    const appointmentType = document.getElementById('appointment_type');

    appointmentType.addEventListener('change', () => {
        const value = appointmentType.value; // virtual | presencial | domiciliaria | ''

        // limpiar tabs
        tabLabels.forEach(l => l.classList.remove('current'));

        if (value === 'virtual') {
            // marcar tab Virtual
            const virtualTab = [...tabLabels].find(l => l.textContent.toLowerCase().includes('virtual'));
            if (virtualTab) {
            virtualTab.classList.add('current');
            }
            precioEl.textContent = 'S/. 100.00';
            direccionDiv.style.setProperty('display', 'none', 'important');

        } else if (value === 'presencial') {
            // marcar tab Presencial
            const presTab = [...tabLabels].find(l => l.textContent.toLowerCase().includes('presencial'));
            if (presTab) {
            presTab.classList.add('current');
            }
            precioEl.textContent = 'S/. 150.00';
            direccionDiv.style.setProperty('display', 'flex', 'important');

        } else {
            // para domiciliaria u otros (opcional)
            precioEl.textContent = 'S/. 150.00';
            direccionDiv.style.setProperty('display', 'flex', 'important');
        }
    });

    const text = "Alopecia Corp.";
    const span = document.getElementById("typed");
    let i = 0;
    let deleting = false;

    function typeLoop() {
        if (!deleting) {
        // Escribiendo
        if (i < text.length) {
            span.textContent += text.charAt(i);
            i++;
            setTimeout(typeLoop, 100); // velocidad de escritura
        } else {
            // Espera 8 segundos antes de borrar
            setTimeout(() => {
            deleting = true;
            typeLoop();
            }, 8000);
        }
        } else {
        // Borrando
        if (i > 0) {
            span.textContent = text.substring(0, i - 1);
            i--;
            setTimeout(typeLoop, 80); // velocidad de borrado
        } else {
            deleting = false;
            setTimeout(typeLoop, 500); // pequeña pausa antes de volver a escribir
        }
        }
    }

    typeLoop();

    const modal = document.getElementById("date-event");

    document.querySelector("#date-event .btn-outline-primary").addEventListener("click", () => {
        modal.close();
    });

    const dniInput = document.getElementById("dni");
    const nombreInput = document.getElementById("nombre");
    let controller = null; // para cancelar fetchs previos

    dniInput.addEventListener("keyup", async (e) => {
        const dni = e.target.value.trim();

        if (dni.length < 8) {
        if (controller) {
            try { controller.abort(); } catch (_) {}
            controller = null;
        }
        nombreInput.value = "";
        return;
        }

        // Solo consultar cuando tenga exactamente 8 caracteres
        if (dni.length === 8) {
        // cancelar cualquier petición previa
        if (controller) {
            try { controller.abort(); } catch (_) {}
        }
        controller = new AbortController();
        const signal = controller.signal;

        const url = `https://hablemos-de-endocrino-centro.medlink.la/api/clinic-histories/public/status?health_worker_id=698&document_type_id=1&document_number=${encodeURIComponent(dni)}`;

        try {
            const resp = await fetch(url, { signal });
            controller = null; // ya no hay petición pendiente

            if (!resp.ok) throw new Error(`Error ${resp.status}`);

            const data = await resp.json();
            const fp = data?.found_patient;

            if (fp && (fp.name || fp.last_name)) {
            // concatenar y limpiar espacios repetidos
            const fullName = [fp.name, fp.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
            nombreInput.value = fullName;
            } else {
            nombreInput.value = "";
            }
        } catch (err) {
            // Si fue abortada, no hacemos nada
            if (err.name === 'AbortError') return;
            console.error('Error al consultar DNI:', err);
            nombreInput.value = "";
        }
        }
    });

});

