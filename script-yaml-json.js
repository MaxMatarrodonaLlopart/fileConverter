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
const propCountSpan = document.getElementById('propCount');
const lastSavedSpan = document.getElementById('lastSaved');
const modeBtns = document.querySelectorAll('.mode-btn');

let saveTimeout;
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentMode = localStorage.getItem('yamlMode') || 'yaml-to-json';

// ========== FUNCIONES DE CONVERSION ==========

function yamlToJSON(yamlText) {
    try {
        if (!yamlText.trim()) return '';
        
        const result = {};
        const lines = yamlText.split('\n');
        let currentObj = result;
        let stack = [result];
        let indentStack = [-1];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.trim() === '' || line.trim().startsWith('#')) continue;
            
            const indent = line.search(/\S/);
            const content = line.trim();
            
            if (content.includes(':')) {
                const colonIndex = content.indexOf(':');
                let key = content.substring(0, colonIndex).trim();
                let value = content.substring(colonIndex + 1).trim();
                
                while (indent <= indentStack[indentStack.length - 1]) {
                    stack.pop();
                    indentStack.pop();
                    currentObj = stack[stack.length - 1];
                }
                
                if (value === '') {
                    currentObj[key] = {};
                    stack.push(currentObj[key]);
                    indentStack.push(indent);
                    currentObj = currentObj[key];
                } else {
                    if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (value === 'null') value = null;
                    else if (!isNaN(value) && value !== '') value = parseFloat(value);
                    else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                    
                    currentObj[key] = value;
                }
            } else if (content.startsWith('- ')) {
                const value = content.substring(2);
                let arrayValue = value;
                if (arrayValue === 'true') arrayValue = true;
                else if (arrayValue === 'false') arrayValue = false;
                else if (arrayValue === 'null') arrayValue = null;
                else if (!isNaN(arrayValue) && arrayValue !== '') arrayValue = parseFloat(arrayValue);
                
                if (Array.isArray(currentObj)) {
                    currentObj.push(arrayValue);
                } else {
                    const lastKey = Object.keys(currentObj).pop();
                    if (!Array.isArray(currentObj[lastKey])) {
                        currentObj[lastKey] = [];
                    }
                    currentObj[lastKey].push(arrayValue);
                }
            }
        }
        
        return JSON.stringify(result, null, 2);
    } catch (error) {
        return 'Error: ' + error.message;
    }
}

function jsonToYAML(jsonText) {
    try {
        if (!jsonText.trim()) return '';
        
        let data;
        try {
            data = JSON.parse(jsonText);
        } catch(e) {
            throw new Error('JSON invalido: ' + e.message);
        }
        
        function stringifyYAML(obj, indent = 0) {
            const spaces = '  '.repeat(indent);
            const result = [];
            
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    if (typeof item === 'object' && item !== null) {
                        result.push(spaces + '-');
                        const nested = stringifyYAML(item, indent + 1);
                        result.push(nested.split('\n').map(line => spaces + '  ' + line).join('\n'));
                    } else {
                        result.push(spaces + '- ' + formatYAMLValue(item));
                    }
                }
            } else if (typeof obj === 'object' && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'object' && value !== null) {
                        result.push(spaces + key + ':');
                        const nested = stringifyYAML(value, indent + 1);
                        result.push(nested.split('\n').map(line => spaces + '  ' + line).join('\n'));
                    } else {
                        result.push(spaces + key + ': ' + formatYAMLValue(value));
                    }
                }
            } else {
                result.push(spaces + formatYAMLValue(obj));
            }
            
            return result.join('\n');
        }
        
        function formatYAMLValue(value) {
            if (value === null) return 'null';
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            if (typeof value === 'number') return value.toString();
            if (typeof value === 'string') {
                if (value.includes(':') || value.includes('#') || value.includes('\n')) {
                    return '"' + value.replace(/"/g, '\\"') + '"';
                }
                return value;
            }
            return String(value);
        }
        
        return stringifyYAML(data);
    } catch (error) {
        return 'Error: ' + error.message;
    }
}

function updatePreview() {
    const input = inputText.value;
    
    try {
        if (currentMode === 'yaml-to-json') {
            const json = yamlToJSON(input);
            outputPreview.textContent = json;
            updatePropCount(json);
        } else {
            const yaml = jsonToYAML(input);
            outputPreview.textContent = yaml;
            updatePropCount(yaml);
        }
    } catch (error) {
        outputPreview.textContent = 'Error: ' + error.message;
    }
}

function updatePropCount(content) {
    if (!content || content.startsWith('Error')) {
        propCountSpan.textContent = '0';
        return;
    }
    
    if (currentMode === 'yaml-to-json') {
        try {
            const parsed = JSON.parse(content);
            const count = Object.keys(parsed).length;
            propCountSpan.textContent = count;
        } catch {
            propCountSpan.textContent = '0';
        }
    } else {
        const lines = content.split('\n');
        const propLines = lines.filter(line => line.includes(':') && !line.trim().startsWith('#'));
        propCountSpan.textContent = propLines.length;
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
    localStorage.setItem(`${currentMode}_yaml_content`, content);
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSavedSpan.textContent = timeString;
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem(`${currentMode}_yaml_content`);
    
    if (saved && saved.trim()) {
        inputText.value = saved;
    } else {
        if (currentMode === 'yaml-to-json') {
            inputText.value = `# Configuracion de usuario
nombre: Ana Garcia
edad: 30
email: ana@ejemplo.com
activo: true
hobbies:
  - lectura
  - programacion
  - musica
direccion:
  calle: Av. Principal 123
  ciudad: Madrid
  codigo_postal: 28001
skills:
  backend:
    - Python
    - Node.js
  frontend:
    - React
    - Vue`;
        } else {
            inputText.value = `{
  "nombre": "Ana Garcia",
  "edad": 30,
  "email": "ana@ejemplo.com",
  "activo": true,
  "hobbies": ["lectura", "programacion", "musica"],
  "direccion": {
    "calle": "Av. Principal 123",
    "ciudad": "Madrid",
    "codigo_postal": 28001
  },
  "skills": {
    "backend": ["Python", "Node.js"],
    "frontend": ["React", "Vue"]
  }
}`;
        }
    }
    
    updatePreview();
    updateStats();
}

function switchMode(mode) {
    currentMode = mode;
    localStorage.setItem('yamlMode', mode);
    
    modeBtns.forEach(btn => {
        const btnMode = btn.getAttribute('data-mode');
        if (btnMode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (mode === 'yaml-to-json') {
        inputLabel.textContent = 'Editor YAML';
        outputLabel.textContent = 'Preview JSON';
    } else {
        inputLabel.textContent = 'Editor JSON';
        outputLabel.textContent = 'Preview YAML';
    }
    
    loadFromLocalStorage();
    showToast(`Modo cambiado a ${mode === 'yaml-to-json' ? 'YAML → JSON' : 'JSON → YAML'}`);
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
    
    if (contentToCopy.startsWith('Error')) {
        showToast('No hay contenido valido para copiar', true);
        return;
    }
    
    try {
        await navigator.clipboard.writeText(contentToCopy);
        showToast(`¡${currentMode === 'yaml-to-json' ? 'JSON' : 'YAML'} copiado!`);
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
        localStorage.removeItem(`${currentMode}_yaml_content`);
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
    highlightActiveLink();
    inputText.focus();
}

init();