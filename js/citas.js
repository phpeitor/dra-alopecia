    
    const yearSpan = document.getElementById("now_year");
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = currentYear;
    const container = document.getElementById('grid');

    function statusRenderer(instance, td, row, col, prop, value, cellProperties) {
        const v = (value || '').toString().toUpperCase();
        td.innerHTML = `<span class="status-pill st-${v}">${v || ''}</span>`;
        td.style.textAlign = 'center';
        td.style.verticalAlign = 'middle';
        return td;
    }

    function actionsRenderer(instance, td, row) {
        const rowData = instance.getSourceDataAtRow(row) || {};
        const id = rowData.id;
        const status = (rowData.status || '').toString().toUpperCase();
        const disabled = status !== 'PENDIENTE';

        td.className = 'actions-cell';
        td.innerHTML = `
            <a href="#" class="action-link action-confirm" title="Confirmar"
            data-id="${id}" data-action="confirm" aria-disabled="${disabled ? 'true':'false'}">✔️</a>
            <a href="#" class="action-link action-cancel"  title="Anular"
            data-id="${id}" data-action="cancel"  aria-disabled="${disabled ? 'true':'false'}">❌</a>
        `;
        return td;
    }

    container.addEventListener('click', async (e) => {
        const a = e.target.closest('.action-link');
        if (!a) return;
        e.preventDefault();
        e.stopPropagation();

        if (a.getAttribute('aria-disabled') === 'true') return;

        const id = parseInt(a.dataset.id, 10);
        const action = a.dataset.action; 
        if (!id || !action) return;

        const oldText = a.textContent;
        a.textContent = '…';
        a.setAttribute('aria-disabled','true');

        try {
            const ok = await callUpdate(id, action);
            if (!ok) {
            alert('No se pudo actualizar. ¿La cita sigue en PENDIENTE?');
            } else {
            const visualRow = hot.toVisualRow(hot.toPhysicalRow(hot.getSelectedLast()?.[0] ?? 0));
            const rowIndex = hot.getSourceData().findIndex(r => Number(r.id) === id);
            if (rowIndex >= 0) {
                hot.setDataAtRowProp(rowIndex, 'status', action === 'confirm' ? 'CONFIRMADO' : 'ANULADO');
                hot.render(); 
            }
            }
        } catch (err) {
            console.error(err);
            alert('Error de red al actualizar.');
        } finally {
            a.textContent = oldText;
        }
    });

    async function callUpdate(id, action) {
        const fd = new FormData();
        fd.append('id', id);
        fd.append('action', action); 
        const res = await fetch('php/cita_update.php', { method: 'POST', body: fd });
        if (!res.ok) return false;
        const j = await res.json();
        return !!j.success;
    }

    const colWidths = [
        60,   
        160,  
        220,  
        100,  
        120, 
        120,  
        200,  
        260,  
        150,  
        80,   
        150,  
        180,  
        120,  
        110,  
        110, 
        72    
    ];

    const hot = new Handsontable(container, {
        data: [],
        rowHeaders: true,
        colHeaders: [
            'ID','Nombre','Email','DNI/CEX','Teléfono','Nacimiento','Dirección','Mensaje',
            'Fecha Cita','Precio','Fecha Registro','Profesional','Status','Sede','Tipo','Opciones'
        ],
        columns: [
            { data: 'id', readOnly: true },
            { data: 'nombre', readOnly: true },
            { data: 'email', readOnly: true },
            { data: 'dni' },
            { data: 'telefono' },
            { data: 'fecha_nacimiento' },
            { data: 'direccion' },
            { data: 'mensaje' },
            { data: 'fecha_cita' },
            { data: 'precio', type: 'numeric', numericFormat: { pattern: '0.00' } },
            { data: 'fecha_registro' },
            { data: 'profesional' },
            { data: 'status', renderer: statusRenderer },
            { data: 'sede' },
            { data: 'tipo' },
            { data: null, renderer: actionsRenderer, readOnly: true }
        ],
        colWidths,               
        autoColumnSize: false,   
        stretchH: 'none',
        preventOverflow: 'horizontal', 
        manualColumnResize: true,
        filters: true,
        dropdownMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
    });

    async function loadData() {
        const params = new URLSearchParams();
        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        const sede = document.getElementById('sede').value;
        const tipo = document.getElementById('tipo').value;
        const status = document.getElementById('status').value;
        const profesional = document.getElementById('profesional').value;

        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (sede) params.set('sede', sede);
        if (tipo) params.set('tipo', tipo);
        if (status) params.set('status', status);
        if (profesional) params.set('profesional', profesional);
        params.set('limit', '1000');

        const res = await fetch(`php/cita_table.php?${params.toString()}`, { cache: 'no-store' });
        const json = await res.json();
        if (!json.success) {
            alert(json.message || 'No se pudieron cargar las citas');
            return;
        }
        hot.loadData(json.data || []);
    }

    document.getElementById('btn-load').addEventListener('click', loadData);

    document.getElementById('btn-export').addEventListener('click', () => {
        const data = hot.getData();
        const headers = hot.getColHeader();
        const rows = [headers, ...data];
        const csv = rows.map(r => r.map(val => {
            const s = (val === null || val === undefined) ? '' : String(val);
            return `"${s.replace(/"/g, '""')}"`;
        }).join(',')).join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
        a.download = `citas-${ts}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    (function setDefaultDates(){
        const today = new Date();
        const fromDt = new Date(today); fromDt.setDate(today.getDate());
        const toDt   = new Date(today); toDt.setDate(today.getDate() + 15);
        const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        document.getElementById('from').value = fmt(fromDt);
        document.getElementById('to').value   = fmt(toDt);
    })();
    loadData();