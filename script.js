const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');

// Eventos de subida
dropzone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFile(e.target.files[0]);

async function handleFile(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        // Aquí empieza la extracción (simplificada para texto)
        let fullText = "";
        for(let i=1; i<=pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            // Lógica para detectar filas (basada en coordenadas Y)
            processTextToTable(content.items);
        }
    };
    reader.readAsArrayBuffer(file);
}

function processTextToTable(items) {
    // Aquí implementaremos el algoritmo de agrupación por filas
    // Por ahora, mostraremos un mensaje de éxito
    document.getElementById('controls').classList.remove('hidden');
    document.getElementById('resultContainer').classList.remove('hidden');
    console.log("Datos extraídos:", items);
}

function copyTable() {
    const table = document.getElementById('dataTable');
    // Lógica para copiar al portapapeles en formato TSV (Excel)
    alert("¡Listo para pegar en Excel!");
}
