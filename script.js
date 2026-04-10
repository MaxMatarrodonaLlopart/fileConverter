// Configuración de marked
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
});

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
const wordCountSpan = document.getElementById('wordCount');
const lineCountSpan = document.getElementById('lineCount');
const lastSavedSpan = document.getElementById('lastSaved');
const modeBtns = document.querySelectorAll('.mode-btn');

// Estado
let saveTimeout;
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentMode = localStorage.getItem('converterMode') || 'md-to-html'; // 'md-to-html' or 'html-to-md'

// ========== FUNCIONES DE CONVERSIÓN ==========

// Función simple para convertir HTML a Markdown
function htmlToMarkdown(html) {
    if (!html.trim()) return '';
    
    let text = html;
    
    // Reemplazar encabezados
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    
    // Reemplazar negrita y cursiva
    text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Reemplazar enlaces
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Reemplazar código inline
    text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Reemplazar bloques de código
    text = text.replace(/<pre><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
    
    // Reemplazar listas
    text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    });
    text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let i = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${i++}. $1\n`);
    });
    
    // Reemplazar párrafos
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Reemplazar saltos de línea
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<hr\s*\/?>/gi, '---\n\n');
    
    // Reemplazar blockquotes
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
        return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
    });
    
    // Limpiar etiquetas HTML restantes
    text = text.replace(/<[^>]*>/g, '');
    
    // Limpiar espacios en blanco extra
    text = text.replace(/[ \t]+$/gm, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
}

// Actualizar preview según el modo actual
function updatePreview() {
    const input = inputText.value;
    
    try {
        if (currentMode === 'md-to-html') {
            const html = marked.parse(input);
            outputPreview.innerHTML = html;
        } else {
            const markdown = htmlToMarkdown(input);
            outputPreview.textContent = markdown;
            // Aplicar formato de código al preview en modo HTML->Markdown
            outputPreview.style.fontFamily = 'Monaco, "Courier New", monospace';
            outputPreview.style.fontSize = '0.875rem';
            outputPreview.style.whiteSpace = 'pre-wrap';
        }
    } catch (error) {
        console.error('Error en conversión:', error);
        outputPreview.innerHTML = '<p style="color: red;">Error al procesar el contenido</p>';
    }
}

// Actualizar estadísticas
function updateStats() {
    const text = inputText.value;
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lineCount = text ? text.split('\n').length : 0;
    
    charCountSpan.textContent = charCount.toLocaleString();
    wordCountSpan.textContent = wordCount.toLocaleString();
    lineCountSpan.textContent = lineCount.toLocaleString();
}

// Guardar en localStorage
function saveToLocalStorage() {
    const content = inputText.value;
    localStorage.setItem(`${currentMode}_content`, content);
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSavedSpan.textContent = timeString;
}

// Cargar de localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem(`${currentMode}_content`);
    
    if (saved && saved.trim()) {
        inputText.value = saved;
    } else {
        // Texto de ejemplo según el modo
        if (currentMode === 'md-to-html') {
            inputText.value = `# Bienvenido a TextTools

## Convierte Markdown a HTML en tiempo real

### Características principales:

- **Preview instantáneo** - Mientras escribes
- **Auto-guardado** - Tu contenido se guarda automáticamente
- **Modo dual** - Convierte Markdown → HTML o HTML → Markdown
- **100% privado** - Todo se procesa en tu navegador

### Ejemplo de código:

\`\`\`javascript
function saludar(nombre) {
    console.log(\`¡Hola, \${nombre}!\`);
}

saludar('Mundo');
\`\`\`

---

¡Empieza a crear contenido increíble!`;
        } else {
            inputText.value = `<h1>Bienvenido a TextTools</h1>

<h2>Convierte HTML a Markdown</h2>

<p>Pega tu HTML aquí y se convertirá automáticamente a Markdown.</p>

<h3>Características principales:</h3>

<ul>
<li><strong>Conversión bidireccional</strong> - HTML ↔ Markdown</li>
<li><strong>Auto-guardado</strong> - Tu contenido se guarda automáticamente</li>
<li><strong>100% privado</strong> - Todo en tu navegador</li>
</ul>

<pre><code>// Ejemplo de código
function convertirHTML(texto) {
    return texto.toUpperCase();
}
</code></pre>

<p><a href="https://thetextools.vercel.app">Visita TextTools</a> para más herramientas.</p>`;
        }
    }
    
    updatePreview();
    updateStats();
}

// Cambiar modo de conversión
function switchMode(mode) {
    currentMode = mode;
    localStorage.setItem('converterMode', mode);
    
    // Actualizar UI de botones
    modeBtns.forEach(btn => {
        const btnMode = btn.getAttribute('data-mode');
        if (btnMode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Actualizar etiquetas
    if (mode === 'md-to-html') {
        inputLabel.textContent = 'Editor Markdown';
        outputLabel.textContent = 'Preview HTML';
        outputPreview.style.fontFamily = '';
        outputPreview.style.whiteSpace = '';
    } else {
        inputLabel.textContent = 'Editor HTML';
        outputLabel.textContent = 'Preview Markdown';
        outputPreview.style.fontFamily = 'Monaco, "Courier New", monospace';
        outputPreview.style.fontSize = '0.875rem';
        outputPreview.style.whiteSpace = 'pre-wrap';
    }
    
    // Recargar contenido guardado para este modo
    loadFromLocalStorage();
    showToast(`Modo cambiado a ${mode === 'md-to-html' ? 'Markdown → HTML' : 'HTML → Markdown'}`);
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

// Copiar contenido (HTML o Markdown según modo)
async function copyOutput() {
    let contentToCopy;
    
    if (currentMode === 'md-to-html') {
        contentToCopy = outputPreview.innerHTML;
    } else {
        contentToCopy = outputPreview.textContent;
    }
    
    try {
        await navigator.clipboard.writeText(contentToCopy);
        showToast(`¡${currentMode === 'md-to-html' ? 'HTML' : 'Markdown'} copiado! ✓`);
    } catch (error) {
        console.error('Error al copiar:', error);
        showToast('Error al copiar. Intenta de nuevo.', true);
        
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = contentToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('¡Copiado! ✓');
    }
}

// Limpiar editor
function clearEditor() {
    if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
        inputText.value = '';
        localStorage.removeItem(`${currentMode}_content`);
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
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    showToast(`Tema cambiado a ${currentTheme === 'dark' ? 'oscuro' : 'claro'}`);
}

// ========== EVENT LISTENERS ==========

// Input con debounce
inputText.addEventListener('input', () => {
    updatePreview();
    updateStats();
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveToLocalStorage();
    }, 500);
});

// Botón copiar
copyBtn.addEventListener('click', copyOutput);

// Botón limpiar
clearBtn.addEventListener('click', clearEditor);

// Botón tema
themeToggle.addEventListener('click', toggleTheme);

// Botones de modo
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        switchMode(mode);
    });
});

// Feedback button
document.getElementById('feedbackBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Envía tu feedback a: macs@buttondown.email');
});

// GitHub button
document.getElementById('githubBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://github.com/tuusuario/textools', '_blank');
    showToast('¡Gracias por apoyar el proyecto!');
});

// Atajos de teclado
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyOutput();
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearEditor();
    }
    
    // Ctrl+Shift+M para cambiar a Markdown→HTML
    if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        switchMode('md-to-html');
    }
    
    // Ctrl+Shift+H para cambiar a HTML→Markdown
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        switchMode('html-to-md');
    }
});

// Guardar antes de cerrar
window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
});

// ========== INICIALIZACIÓN ==========
function init() {
    applyTheme();
    switchMode(currentMode);
    highlightActiveLink();
    inputText.focus();
}

// Iniciar app
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

// Llamar a la funcion al cargar en init()
highlightActiveLink();