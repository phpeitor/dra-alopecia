document.addEventListener('DOMContentLoaded', async () => {
    const selectProfesional = document.getElementById('profesional');
    const selectSede = document.getElementById('sede');
    const today = new Date().toISOString().split('T')[0];
    const inputDate = document.getElementById('date');
    inputDate.value = today;
    inputDate.min = today;
    const yearSpan = document.getElementById("now_year");
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = currentYear;
    const fechaNacInput = document.getElementById("fecha_nac");

    if (fechaNacInput) {
        const today = new Date();
        today.setFullYear(today.getFullYear() - 18); 
        const maxDate = today.toISOString().split("T")[0]; 

        fechaNacInput.setAttribute("max", maxDate);
    }

    let renderSlotsToken = 0;
    let programacionData = null;

    function resetSelectProfesional() {
        selectProfesional.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Profesional';
        selectProfesional.appendChild(opt);
    }

    function getSelectedSede() {
        const opt = selectSede?.options[selectSede.selectedIndex];
        if (!opt || !opt.value) return null;
        return opt.value;
    }

    try {
        const resp = await fetch('./js/programacion.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error('No se pudo cargar programacion.json');
        const data = await resp.json();
        programacionData = data; // <-- guardamos para usar en slots

        const sedes = [...new Set((data.events || [])
            .map(e => e?.sede)
            .filter(Boolean))].sort((a,b)=> a.localeCompare(b,'es',{sensitivity:'base'}));

        selectSede.innerHTML = '<option value="">Sede</option>';
        sedes.forEach(s => {
            const o = document.createElement('option');
            o.value = s; o.textContent = s;
            selectSede.appendChild(o);
        });

        // 2.2) función para llenar PROFESIONALES según sede elegida
        function fillProfesionalesPorSede(sedeSel) {
            const pros = new Set();
            (data.events || []).forEach(e => {
            if (!e || !e.profesional || !e.sede) return;
            if (!sedeSel || e.sede === sedeSel) pros.add(e.profesional.trim());
            });
            resetSelectProfesional();
            [...pros].sort((a,b)=> a.localeCompare(b,'es',{sensitivity:'base'}))
            .forEach(nombre => {
                const option = document.createElement('option');
                option.value = nombre;
                option.textContent = nombre;
                selectProfesional.appendChild(option);
            });
        }

        // inicial: sin sede aún → lista completa
        fillProfesionalesPorSede(null);

        // al cambiar sede: filtra profesionales y recalcula slots
        selectSede.addEventListener('change', () => {
            const sedeSel = getSelectedSede();
            fillProfesionalesPorSede(sedeSel);

            // limpiar datos del card cuando cambia la sede
            docName.textContent = '';
            docSpeciality.textContent = '';
            profileImg.src = "./img/woman.jpg";

            // (opcional) actualizar dirección por sede
            const direccionPorSede = {
                "Lima": "Av. José Pardo 513 Of. 701 - Miraflores",
                "Arequipa": "Av. Cayma 404 - Arequipa"
            };
            const pDir = direccionDiv.querySelector('p');
            if (pDir) pDir.textContent = direccionPorSede[sedeSel] || "Dirección por definir";

            renderSlots();
        });

    } catch (err) {
        console.error(err);
        resetSelectProfesional();
        const errorOpt = document.createElement('option');
        errorOpt.disabled = true;
        errorOpt.textContent = 'No se pudo cargar la lista';
        selectProfesional.appendChild(errorOpt);
    }

    const docName = document.querySelector('.doc-name');
    const docSpeciality = document.querySelector('.doc-speciality');

    const perfiles = {
        "Dra. Adela Vargas": {
            photo: "./img/02.jpg",
            ig: "https://www.instagram.com/dermadela/"
        },
        "Dra. María Belén Peña": {
            photo: "./img/01.jpg",
            ig: "https://www.instagram.com/dra.alopecia/"
        },
        "Dra. María Cristina Latorre": {
            photo: "./img/03.jpg",
            ig: "https://www.instagram.com/dra.mariacristinalatorre/"
        },
        "Dra. Mirella Paredes Lira": {
            photo: "./img/04.jpg",
            ig: "https://www.instagram.com/dramirellaplira/"
        }
    };

    const profileImg = document.querySelector('.profile-doctor');
    const perfilLink = document.querySelector('.text-turquoise'); 

    function pintarPerfil(nombre) {
        const p = perfiles[nombre] || {};
        profileImg.src = p.photo || "./img/woman.jpg";
        if (perfilLink) {
            if (p.ig) {
                perfilLink.href = p.ig;
                perfilLink.target = "_blank";
                perfilLink.rel = "noopener noreferrer nofollow";
                perfilLink.style.pointerEvents = "auto";
            } else {
                perfilLink.removeAttribute('href');
                perfilLink.style.pointerEvents = "none";
            }
        }
    }
    
    selectProfesional.addEventListener('change', () => {
        const selectedName = (selectProfesional.value || '').trim();

        if (selectedName) {
            // pinta nombre/especialidad
            docName.textContent = selectedName;
            docSpeciality.textContent = 'Alopecia';

            // foto + link a Instagram según 'perfiles'
            pintarPerfil(selectedName);
        } else {
            // placeholder "Profesional"
            docName.textContent = '';
            docSpeciality.textContent = '';
            profileImg.src = "./img/woman.jpg";
            if (perfilLink) {
            perfilLink.removeAttribute('href');
            perfilLink.style.pointerEvents = "none";
            }
        }

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

    async function fetchBookedTimes(dateStr, prof) {
        const q = new URLSearchParams({ date: dateStr, profesional: prof, sede: sede || '' });
        const res = await fetch(`php/reserva.php?${q.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return Array.isArray(json.booked) ? json.booked.map(s => s.trim()) : [];
    }

    // ====== RENDER SLOTS (por el end y con data-v-6cad2bde) ======
    async function renderSlots() {
        if (!slotsWrapper) return; 

        const myToken = ++renderSlotsToken;
        // limpiar
        slotsWrapper.innerHTML = '';
        slotsMsgBox.style.display = 'none';
        slotsLoading.style.display = 'block';

        const sede = getSelectedSede();
        const prof = getSelectedProfesional();
        const dateStr = getSelectedDateStr();

        if (!sede || !prof || !dateStr) {
            slotsMsgBox.style.display = 'block';
            if (slotsMsgSpan) slotsMsgSpan.textContent = 'Selecciona una sede y un profesional para ver horarios.';
            slotsLoading.style.display = 'none';
            return;
        }

        try {
            const data = programacionData || (await (await fetch('./js/programacion.json', { cache: 'no-store' })).json());
            if (!programacionData) programacionData = data;

            const events = (data.events || []).filter(e =>
                e && e.profesional === prof &&
                e.sede === sede &&
                typeof e.start === 'string' && typeof e.end === 'string' &&
                e.start.slice(0,10) === dateStr
            );

            const STEP_MIN = 45, MILLI = 60000;
            const slotsSet = new Set();
            for (const ev of events) {
                const start = new Date(ev.start);
                const end   = new Date(ev.end);
                for (let tEnd = new Date(end); tEnd > start; tEnd = new Date(tEnd.getTime() - STEP_MIN * MILLI)) {
                    const hhmm = `${String(tEnd.getHours()).padStart(2,'0')}:${String(tEnd.getMinutes()).padStart(2,'0')}`;
                    slotsSet.add(hhmm);
                }
            }

            // 2) horarios reservados reales
            const q = new URLSearchParams({ date: dateStr, profesional: prof });
            const r = await fetch(`php/reserva.php?${q.toString()}`, { cache: 'no-store' });
            const j = r.ok ? await r.json() : { booked: [] };
            const booked = await fetchBookedTimes(dateStr, prof, sede);
            const bookedSet = new Set((booked || []).map(s => s.trim()));

            // 3) resta y ordena
            const slotsDisponibles = [...slotsSet].filter(h => !bookedSet.has(h)).sort();

            // si esta corrida ya quedó vieja, no pintes
            if (myToken !== renderSlotsToken) return;

            // pintar (reemplazando contenido por si otro render pintó antes)
            slotsWrapper.innerHTML = '';
            if (!slotsDisponibles.length) {
                slotsMsgBox.style.display = 'block';
                if (slotsMsgSpan) slotsMsgSpan.textContent = 'No hay horarios disponibles para este día.';
                return;
            }

            const frag = document.createDocumentFragment();
            slotsDisponibles.forEach(hhmm => {
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

            // listeners de click
            slotsWrapper.querySelectorAll('.available-slots').forEach(slot => {
                slot.addEventListener('click', () => {
                    const selectedDate = document.querySelector('.available-dates.selected-date');
                    const selectedDateInput = selectedDate?.querySelector('input[name="availability-date"]');
                    const dateValue = selectedDateInput ? selectedDateInput.value : '';
                    const dayLabel = selectedDate?.querySelector('h3')?.innerText || '';
                    const timeValue = slot.querySelector('input[name="availability-slot"]')?.value || '';

                    const fecCitaSpan = document.getElementById('fec_cita');
                    if (fecCitaSpan) {
                        fecCitaSpan.innerHTML = `
                            <img src="./img/icon-calendar.svg" width="30" height="26" style="padding:0 5px;">
                            ${dayLabel} ${dateValue} ${timeValue}
                        `;
                    }

                    const precioElement = document.getElementById('precio');
                    const pago_citaSpan = document.getElementById('pago_cita');
                    if (pago_citaSpan) {
                        pago_citaSpan.innerHTML = `
                            <img src="./img/payment.svg" width="30" height="26" style="padding:0 5px;">
                            ${(precioElement?.innerText || '').trim()}
                        `;
                    }

                    const selectTipo = document.getElementById('appointment_type');
                    const tipo_citaSpan = document.getElementById('tipo_cita');
                    const dir_citaSpan = document.getElementById('dir_cita');
                    const direccionDiv = document.getElementById('direccionDiv');
                    const direccionTexto = direccionDiv?.querySelector('p')?.textContent || '';

                    function capitalize(text) {
                        return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '';
                    }

                    function actualizarVista() {
                        const value = selectTipo.value;

                        if (tipo_citaSpan) {
                            tipo_citaSpan.innerHTML = `
                            <img src="./img/icon-arrow-bottom.svg" width="30" height="26" style="padding:0 5px;">
                            ${capitalize(value)}
                            `;
                        }

                        if (dir_citaSpan) {
                            if (value === 'presencial') {
                                dir_citaSpan.innerHTML = `
                                    <img src="./img/icon-gps.svg" width="30" height="26" style="padding:0 5px;">
                                    ${direccionTexto}
                                `;
                            } else {
                                dir_citaSpan.innerHTML = ''; 
                            }
                        }
                    }

                    actualizarVista();
                    selectTipo.addEventListener('change', actualizarVista);
                    modal.showModal();
                });
            });

        } catch (e) {
            // si quedó viejo, ignora el error visual
            if (myToken !== renderSlotsToken) return;
            console.error(e);
            slotsMsgBox.style.display = 'block';
            if (slotsMsgSpan) slotsMsgSpan.textContent = 'No se pudo cargar la disponibilidad.';
        } finally {
            // solo la última corrida debe ocultar el loading
            if (myToken === renderSlotsToken) {
            slotsLoading.style.display = 'none';
            }
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

    const appointmentType = document.getElementById('appointment_type');

    function normalizeTypeFromText(txt) {
        const t = (txt || '').toLowerCase();
        if (t.includes('virtual')) return 'virtual';
        return 'presencial';
    }

    function applyAppointmentType(value, { emitChange = false } = {}) {
        const val = (value || '').toLowerCase(); // siempre en minúsculas: 'virtual' | 'presencial'

        // Tabs: limpiar y marcar
        tabLabels.forEach(l => l.classList.remove('current'));
        const selectedTab = [...tabLabels].find(l =>
            l.textContent.toLowerCase().includes(val)
        );
        if (selectedTab) selectedTab.classList.add('current');

        // Precio + dirección
        if (val === 'virtual') {
            precioEl.textContent = 'S/. 100.00';
            direccionDiv.style.setProperty('display', 'none', 'important');
        } else {
            precioEl.textContent = 'S/. 150.00';
            direccionDiv.style.setProperty('display', 'flex', 'important');
        }

        // Select: actualizar si difiere
        if ((appointmentType.value || '').toLowerCase() !== val) {
            appointmentType.value = val;
            if (emitChange) {
                appointmentType.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    appointmentType.addEventListener('change', () => {
        applyAppointmentType(appointmentType.value);
    });

    tabLabels.forEach(label => {
        label.addEventListener('click', () => {
            const value = normalizeTypeFromText(label.textContent);
            applyAppointmentType(value);
        });
    });

    applyAppointmentType(appointmentType.value || 'presencial');

    const text = "Alopecia Corp.";
    const span = document.getElementById("typed");
    let i = 0;
    let deleting = false;

    function typeLoop() {
        if (!deleting) {
        if (i < text.length) {
            span.textContent += text.charAt(i);
            i++;
            setTimeout(typeLoop, 100); // velocidad de escritura
        } else {
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
            setTimeout(typeLoop, 80); 
        } else {
            deleting = false;
            setTimeout(typeLoop, 500); 
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


    const form_cita= document.getElementById('submit-schedule');
    form_cita.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form_cita);
        formData.append("sede", getSelectedSede() || '');
        formData.append("fec_cita", document.getElementById("fec_cita").innerText.trim());
        formData.append("precio", document.getElementById("pago_cita").innerText.trim());
        formData.append("doctor", document.getElementById("doc-name").innerText.trim());
        formData.append("tipo", document.getElementById("appointment_type").value || '');

        fetch("php/guardar.php", {
            method: "POST",
            body: formData
        })
        .then(res => res.text()) // 👈 primero texto
        .then(text => {
            console.log("Respuesta cruda del servidor:", text);
            try {
                const data = JSON.parse(text); // intentar parsear
                alert(data.message);

                if (data.success) {
                    form_cita.reset();
                    document.getElementById("date-event").close();

                    const dateStr = document.getElementById("date").value;
                    if (dateStr) gotoDate(dateStr);
                    else renderSlots();
                }
            } catch (err) {
                console.error("No es JSON válido:", err);
            }
        })
        .catch(err => console.error("Error de red:", err));

    });


});

