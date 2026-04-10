// Elementos del DOM
const inputText = document.getElementById('inputText');
const outputPreview = document.getElementById('outputPreview');
const inputLabel = document.getElementById('inputLabel');
const outputLabel = document.getElementById('outputLabel');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const charCountSpan = document.getElementById('charCount');
const lineCountSpan = document.getElementById('lineCount');
const rowCountSpan = document.getElementById('rowCount');
const lastSavedSpan = document.getElementById('lastSaved');
const modeBtns = document.querySelectorAll('.mode-btn');

// Estado
let saveTimeout;
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentMode = localStorage.getItem('jsonMode') || 'json-to-csv';

// ========== FUNCIONES DE CONVERSION ==========

function jsonToCSV(jsonText) {
    try {
        if (!jsonText.trim()) return '';
        
        let data;
        try {
            data = JSON.parse(jsonText);
        } catch(e) {
            throw new Error('JSON invalido: ' + e.message);
        }
        
        if (!Array.isArray(data)) {
            throw new Error('Se requiere un array de objetos');
        }
        
        if (data.length === 0) {
            return '';
        }
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        csvRows.push(headers.join(','));
        
        for (const row of data) {
            const values = headers.map(header => {
                let value = row[header];
                if (value === undefined || value === null) {
                    value = '';
                }
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                return stringValue;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    } catch (error) {
        return 'Error: ' + error.message;
    }
}

function csvToJSON(csvText) {
    try {
        if (!csvText.trim()) return '';
        
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV debe tener al menos una fila de encabezados y una fila de datos');
        }
        
        const headers = parseCSVLine(lines[0]);
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = parseCSVLine(lines[i]);
            const row = {};
            
            for (let j = 0; j < headers.length; j++) {
                let value = values[j] || '';
                
                if (value.match(/^-?\d+$/)) {
                    value = parseInt(value, 10);
                } else if (value.match(/^-?\d+\.\d+$/)) {
                    value = parseFloat(value);
                } else if (value.toLowerCase() === 'true') {
                    value = true;
                } else if (value.toLowerCase() === 'false') {
                    value = false;
                } else if (value === 'null') {
                    value = null;
                }
                
                row[headers[j]] = value;
            }
            result.push(row);
        }
        
        return JSON.stringify(result, null, 2);
    } catch (error) {
        return 'Error: ' + error.message;
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i+1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

function updatePreview() {
    const input = inputText.value;
    
    try {
        if (currentMode === 'json-to-csv') {
            const csv = jsonToCSV(input);
            outputPreview.textContent = csv;
            updateRowCount(csv);
        } else {
            const json = csvToJSON(input);
            outputPreview.textContent = json;
            updateRowCount(json);
        }
    } catch (error) {
        outputPreview.textContent = 'Error: ' + error.message;
    }
}

function updateRowCount(content) {
    if (currentMode === 'json-to-csv') {
        if (!content || content.startsWith('Error')) {
            rowCountSpan.textContent = '0';
            return;
        }
        const lines = content.split('\n');
        const dataRows = Math.max(0, lines.length - 1);
        rowCountSpan.textContent = dataRows;
    } else {
        if (!content || content.startsWith('Error')) {
            rowCountSpan.textContent = '0';
            return;
        }
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                rowCountSpan.textContent = parsed.length;
            } else {
                rowCountSpan.textContent = '1';
            }
        } catch {
            rowCountSpan.textContent = '0';
        }
    }
}

function updateStats() {
    const text = inputText.value;
    const charCount = text.length;
    const lineCount = text ? text.split('\n').length : 0;
    
    charCountSpan.textContent = charCount.toLocaleString();
    lineCountSpan.textContent = lineCount.toLocaleString();
}

function saveToLocalStorage() {
    const content = inputText.value;
    localStorage.setItem(`${currentMode}_json_content`, content);
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSavedSpan.textContent = timeString;
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem(`${currentMode}_json_content`);
    
    if (saved && saved.trim()) {
        inputText.value = saved;
    } else {
        if (currentMode === 'json-to-csv') {
            inputText.value = `[
  {
    "nombre": "Ana Garcia",
    "email": "ana@ejemplo.com",
    "edad": 30,
    "activo": true
  },
  {
    "nombre": "Luis Martinez",
    "email": "luis@ejemplo.com",
    "edad": 25,
    "activo": false
  },
  {
    "nombre": "Carmen Lopez",
    "email": "carmen@ejemplo.com",
    "edad": 35,
    "activo": true
  }
]`;
        } else {
            inputText.value = `nombre,email,edad,activo
Ana Garcia,ana@ejemplo.com,30,true
Luis Martinez,luis@ejemplo.com,25,false
Carmen Lopez,carmen@ejemplo.com,35,true`;
        }
    }
    
    updatePreview();
    updateStats();
}

function switchMode(mode) {
    currentMode = mode;
    localStorage.setItem('jsonMode', mode);
    
    modeBtns.forEach(btn => {
        const btnMode = btn.getAttribute('data-mode');
        if (btnMode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (mode === 'json-to-csv') {
        inputLabel.textContent = 'Editor JSON';
        outputLabel.textContent = 'Preview CSV';
    } else {
        inputLabel.textContent = 'Editor CSV';
        outputLabel.textContent = 'Preview JSON';
    }
    
    loadFromLocalStorage();
    showToast(`Modo cambiado a ${mode === 'json-to-csv' ? 'JSON → CSV' : 'CSV → JSON'}`);
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.style.background = isError ? '#ef4444' : '#10b981';
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

async function copyOutput() {
    let contentToCopy = outputPreview.textContent;
    
    if (contentToCopy === 'Error: JSON invalido' || contentToCopy.startsWith('Error')) {
        showToast('No hay contenido valido para copiar', true);
        return;
    }
    
    try {
        await navigator.clipboard.writeText(contentToCopy);
        showToast(`¡${currentMode === 'json-to-csv' ? 'CSV' : 'JSON'} copiado!`);
    } catch (error) {
        const textarea = document.createElement('textarea');
        textarea.value = contentToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copiado');
    }
}

function clearEditor() {
    if (confirm('Borrar todo el contenido?')) {
        inputText.value = '';
        localStorage.removeItem(`${currentMode}_json_content`);
        updatePreview();
        updateStats();
        showToast('Editor limpiado');
    }
}

function applyTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    showToast(`Tema ${currentTheme === 'dark' ? 'oscuro' : 'claro'}`);
}

// ========== EVENT LISTENERS ==========

inputText.addEventListener('input', () => {
    updatePreview();
    updateStats();
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveToLocalStorage();
    }, 500);
});

copyBtn.addEventListener('click', copyOutput);
clearBtn.addEventListener('click', clearEditor);
themeToggle.addEventListener('click', toggleTheme);

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        switchMode(mode);
    });
});

document.getElementById('feedbackBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Envia tu feedback a: feedback@textools.dev');
});

document.getElementById('githubBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://github.com/tuusuario/textools', '_blank');
    showToast('Gracias por apoyar el proyecto');
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyOutput();
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearEditor();
    }
});

window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
});

// ========== INICIALIZACION ==========
function init() {
    applyTheme();
    switchMode(currentMode);
    inputText.focus();
}

init();

// Resaltar link activo en navbar
function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Llamar a la funcion al cargar
highlightActiveLink();