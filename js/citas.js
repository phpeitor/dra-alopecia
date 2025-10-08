    
    const yearSpan = document.getElementById("now_year");
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = currentYear;
    const container = document.getElementById('grid');

    const hot = new Handsontable(container, {
      data: [],
      rowHeaders: true,
      colHeaders: [
        'ID','Nombre','Email','DNI/CEX','Teléfono','Nacimiento','Dirección','Mensaje',
        'Fecha Cita','Precio','Fecha Registro','Profesional','Status','Sede','Tipo'
      ],
      columns: [
        { data: 'id', readOnly: true, width: 60 },
        { data: 'nombre', readOnly: true, width: 160 },
        { data: 'email', readOnly: true, width: 220 },
        { data: 'dni', width: 100 },
        { data: 'telefono', width: 120 },
        { data: 'fecha_nacimiento', width: 120 },
        { data: 'direccion', width: 200 },
        { data: 'mensaje', width: 260 },
        { data: 'fecha_cita', width: 150 },
        { data: 'precio', width: 80, type: 'numeric', numericFormat: { pattern: '0.00' } },
        { data: 'fecha_registro', width: 150 },
        { data: 'profesional', width: 180 },
        { data: 'status', width: 120, renderer: statusRenderer },
        { data: 'sede', width: 110 },
        { data: 'tipo', width: 110 }
      ],
      licenseKey: 'non-commercial-and-evaluation',
      stretchH: 'all',
      height: 'auto',
      manualColumnResize: true,
      filters: true,
      dropdownMenu: true,
      contextMenu: ['copy','copy_with_column_headers','-----------','column_left','column_right','remove_row'],
    });

    function statusRenderer(instance, td, row, col, prop, value, cellProperties) {
      const v = (value || '').toString().toUpperCase();
      td.innerHTML = `<span class="status-pill st-${v}">${v || ''}</span>`;
      td.style.textAlign = 'center';
      td.style.verticalAlign = 'middle';
      return td;
    }

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
        const escaped = `"${s.replace(/"/g, '""')}"`;
        return escaped;
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