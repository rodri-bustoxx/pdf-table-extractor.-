const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');

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
        
        renderTable(allRows);
    };
    reader.readAsArrayBuffer(file);
}

function extractRows(items) {
    // Agrupamos items por su posición Y (con un margen de error de 5px)
    const rows = {};
    items.forEach(item => {
        const y = Math.round(item.transform[5] / 5) * 5; // Tolerancia de alineación
        if (!rows[y]) rows[y] = [];
        rows[y].push(item);
    });

    // Ordenamos las filas de arriba hacia abajo (Y descendente) y los items de izquierda a derecha (X ascendente)
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
    const body = document.getElementById('tableBody');
    body.innerHTML = "";
    
    data.forEach(row => {
        const tr = document.createElement('tr');
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
    document.getElementById('dropzoneText').innerText = "¡PDF Procesado!";
}

function copyTable() {
    const table = document.getElementById('dataTable');
    let text = "";
    for (let row of table.rows) {
        let rowData = [];
        for (let cell of row.cells) rowData.push(cell.innerText);
        text += rowData.join("\t") + "\n";
    }
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles. Ya puedes pegarlo en Excel.");
}

function clearAll() {
    location.reload();
}
