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

});