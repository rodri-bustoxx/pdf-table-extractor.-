const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');

// Variable global para mantener los datos de las filas actuales
let currentRowsData = [];

dropzone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
};

async function handleFile(file) {
    document.getElementById('dropzoneText').innerText = "Procesando " + file.name + "...";
    const reader = new FileReader();
    
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let allRows = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageRows = extractRows(content.items);
            allRows = allRows.concat(pageRows);
        }
        
        currentRowsData = allRows; // Guardamos los datos para poder filtrarlos después
        renderTable(allRows);
    };
    reader.readAsArrayBuffer(file);
}

function extractRows(items) {
    const rows = {};
    items.forEach(item => {
        const y = Math.round(item.transform[5] / 5) * 5; 
        if (!rows[y]) rows[y] = [];
        rows[y].push(item);
    });

    return Object.keys(rows)
        .sort((a, b) => b - a)
        .map(y => {
            return rows[y].sort((a, b) => a.transform[4] - b.transform[4])
                          .map(item => item.str.trim())
                          .filter(str => str !== "");
        })
        .filter(row => row.length > 0);
}

function renderTable(data) {
    const head = document.getElementById('tableHead');
    const body = document.getElementById('tableBody');
    
    // Configurar encabezado con columna de selección
    head.innerHTML = `
        <tr class="bg-slate-100">
            <th class="p-2 border text-center w-12">Sel.</th>
            <th colspan="100%" class="p-2 border text-sm text-slate-500 italic">Contenido de la fila</th>
        </tr>`;
    
    body.innerHTML = "";
    
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors";
        
        // Columna del Checkbox
        const tdCheck = document.createElement('td');
        tdCheck.className = "border p-2 text-center";
        tdCheck.innerHTML = `<input type="checkbox" class="row-selector w-5 h-5 cursor-pointer" data-index="${index}">`;
        tr.appendChild(tdCheck);

        // Columnas de Datos
        row.forEach(cell => {
            const td = document.createElement('td');
            td.innerText = cell;
            td.className = "border p-2";
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });

    document.getElementById('controls').classList.remove('hidden');
    document.getElementById('resultContainer').classList.remove('hidden');
    document.getElementById('dropzoneText').innerText = "¡PDF Procesado! Selecciona las filas que desees.";
}

function copyTable() {
    const selectedCheckboxes = document.querySelectorAll('.row-selector:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert("Por favor, selecciona primero las filas que quieres copiar usando los cuadraditos de la izquierda.");
        return;
    }

    let text = "";
    selectedCheckboxes.forEach(cb => {
        const index = cb.getAttribute('data-index');
        const rowData = currentRowsData[index];
        text += rowData.join("\t") + "\n"; // Formato TSV compatible con Excel
    });

    navigator.clipboard.writeText(text).then(() => {
        alert(`Se han copiado ${selectedCheckboxes.length} filas al portapapeles.`);
    });
}

function clearAll() {
    if(confirm("¿Estás seguro de que quieres limpiar todo?")) {
        location.reload();
    }
}
