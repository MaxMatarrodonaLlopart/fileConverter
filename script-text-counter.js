const inputText = document.getElementById('inputText');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const lastSavedSpan = document.getElementById('lastSaved');

const charCountSpan = document.getElementById('charCount');
const charNoSpaceSpan = document.getElementById('charNoSpace');
const wordCountSpan = document.getElementById('wordCount');
const lineCountSpan = document.getElementById('lineCount');
const sentenceCountSpan = document.getElementById('sentenceCount');
const letterCountSpan = document.getElementById('letterCount');
const digitCountSpan = document.getElementById('digitCount');
const spaceCountSpan = document.getElementById('spaceCount');
const readingTimeSpan = document.getElementById('readingTime');

let saveTimeout;
let currentTheme = localStorage.getItem('theme') || 'dark';

function updateStats() {
    const text = inputText.value;
    
    const charCount = text.length;
    const charNoSpace = text.replace(/\s/g, '').length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lineCount = text ? text.split('\n').length : 0;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const letterCount = (text.match(/[A-Za-záéíóúüñ]/g) || []).length;
    const digitCount = (text.match(/[0-9]/g) || []).length;
    const spaceCount = (text.match(/\s/g) || []).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    charCountSpan.textContent = charCount.toLocaleString();
    charNoSpaceSpan.textContent = `(sin espacios: ${charNoSpace.toLocaleString()})`;
    wordCountSpan.textContent = wordCount.toLocaleString();
    lineCountSpan.textContent = lineCount.toLocaleString();
    sentenceCountSpan.textContent = sentenceCount.toLocaleString();
    letterCountSpan.textContent = letterCount.toLocaleString();
    digitCountSpan.textContent = digitCount.toLocaleString();
    spaceCountSpan.textContent = spaceCount.toLocaleString();
    readingTimeSpan.textContent = readingTime;
}

function saveToLocalStorage() {
    const content = inputText.value;
    localStorage.setItem('text_counter_content', content);
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSavedSpan.textContent = timeString;
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('text_counter_content');
    if (saved) {
        inputText.value = saved;
    } else {
        inputText.value = `Texto de ejemplo para probar el contador.

Esta herramienta es muy util para:
- Escritores que necesitan cumplir con limites de caracteres
- Desarrolladores que analizan logs o datos
- Social media managers creando posts optimizados
- Estudiantes preparando ensayos o trabajos

Caracteristicas principales:
* Cuenta caracteres totales y sin espacios
* Cuenta palabras exactas
* Analiza lineas y oraciones
* Diferencia entre letras y digitos
* Calcula tiempo estimado de lectura

¡Pruébala con tu propio texto!`;
    }
    
    updateStats();
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.style.background = isError ? '#ef4444' : '#10b981';
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

async function copyText() {
    const text = inputText.value;
    
    if (!text) {
        showToast('No hay texto para copiar', true);
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        showToast('Texto copiado');
    } catch (error) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Texto copiado');
    }
}

function clearEditor() {
    if (confirm('Borrar todo el texto?')) {
        inputText.value = '';
        localStorage.removeItem('text_counter_content');
        updateStats();
        showToast('Texto limpiado');
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

inputText.addEventListener('input', () => {
    updateStats();
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveToLocalStorage();
    }, 500);
});

copyBtn.addEventListener('click', copyText);
clearBtn.addEventListener('click', clearEditor);
themeToggle.addEventListener('click', toggleTheme);

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
        copyText();
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearEditor();
    }
});

window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
});

function init() {
    applyTheme();
    loadFromLocalStorage();
    highlightActiveLink();
    inputText.focus();
}

init();