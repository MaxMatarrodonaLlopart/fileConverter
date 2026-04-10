// Configuración de marked
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
});

// Elementos del DOM
const markdownInput = document.getElementById('markdownInput');
const htmlPreview = document.getElementById('htmlPreview');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const charCountSpan = document.getElementById('charCount');
const wordCountSpan = document.getElementById('wordCount');
const lineCountSpan = document.getElementById('lineCount');
const lastSavedSpan = document.getElementById('lastSaved');

// Estado
let saveTimeout;
let currentTheme = localStorage.getItem('theme') || 'dark';

// ========== FUNCIONES PRINCIPALES ==========

// Actualizar preview
function updatePreview() {
    const markdown = markdownInput.value;
    try {
        const html = marked.parse(markdown);
        htmlPreview.innerHTML = html;
    } catch (error) {
        console.error('Error parsing markdown:', error);
        htmlPreview.innerHTML = '<p style="color: red;">Error al procesar Markdown</p>';
    }
}

// Actualizar estadísticas
function updateStats() {
    const text = markdownInput.value;
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lineCount = text ? text.split('\n').length : 0;
    
    charCountSpan.textContent = charCount.toLocaleString();
    wordCountSpan.textContent = wordCount.toLocaleString();
    lineCountSpan.textContent = lineCount.toLocaleString();
}

// Guardar en localStorage
function saveToLocalStorage() {
    const content = markdownInput.value;
    localStorage.setItem('markdown_content', content);
    
    // Actualizar timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSavedSpan.textContent = timeString;
}

// Cargar de localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('markdown_content');
    if (saved) {
        markdownInput.value = saved;
    } else {
        // Texto de ejemplo
        markdownInput.value = `# Bienvenido a TextTools

## Convierte Markdown a HTML en tiempo real

### Características principales:

- **Preview instantáneo** - Mientras escribes
- **Auto-guardado** - Tu contenido se guarda automáticamente
- **Estadísticas** - Caracteres, palabras y líneas
- **100% privado** - Todo se procesa en tu navegador

### Ejemplo de código:

\`\`\`javascript
function saludar(nombre) {
    console.log(\`¡Hola, \${nombre}!\`);
}

saludar('Mundo');
\`\`\`

### Listas y más:

1. Fácil de usar
2. Rápido y ligero
3. Completamente gratis

> **Tip**: Prueba a escribir diferentes elementos Markdown y observa cómo se actualiza la vista previa al instante.

---

¡Empieza a crear contenido increíble!`;
    }
    
    updatePreview();
    updateStats();
}

// Mostrar notificación
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.style.background = isError ? '#ef4444' : '#10b981';
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// ========== EVENT HANDLERS ==========

// Copiar HTML
async function copyHTML() {
    const html = htmlPreview.innerHTML;
    try {
        await navigator.clipboard.writeText(html);
        showToast('¡HTML copiado al portapapeles! ✓');
    } catch (error) {
        console.error('Error al copiar:', error);
        showToast('Error al copiar. Intenta de nuevo.', true);
        
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = html;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('¡HTML copiado (método alternativo)! ✓');
    }
}

// Limpiar editor
function clearEditor() {
    if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
        markdownInput.value = '';
        localStorage.removeItem('markdown_content');
        updatePreview();
        updateStats();
        showToast('Editor limpiado');
    }
}

// Cambiar tema
function applyTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }
    themeToggle.setAttribute('aria-label', `Cambiar a ${currentTheme === 'dark' ? 'claro' : 'oscuro'}`);
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    showToast(`Tema cambiado a ${currentTheme === 'dark' ? 'oscuro' : 'claro'}`);
}

// ========== EVENT LISTENERS ==========

// Input con debounce para mejor rendimiento
markdownInput.addEventListener('input', () => {
    updatePreview();
    updateStats();
    
    // Debounce para guardar (cada 500ms)
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveToLocalStorage();
    }, 500);
});

// Botón copiar
copyBtn.addEventListener('click', copyHTML);

// Botón limpiar
clearBtn.addEventListener('click', clearEditor);

// Botón tema (preparado)
themeToggle.addEventListener('click', toggleTheme);

// Feedback button
document.getElementById('feedbackBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('📧 Envía tu feedback a: feedback@textools.dev');
});

// GitHub button
document.getElementById('githubBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://github.com/tu-usuario/textools', '_blank');
    showToast('¡Gracias por apoyar el proyecto! ⭐');
});

// Atajo de teclado: Ctrl+Shift+C para copiar
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyHTML();
    }
    
    // Ctrl+Shift+X para limpiar
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearEditor();
    }
});

// Guardar antes de cerrar
window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
});

// ========== INICIALIZACIÓN ==========
function init() {
    loadFromLocalStorage();
    applyTheme();
    markdownInput.focus();
}

// Iniciar app
init();

