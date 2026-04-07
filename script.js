const input = document.getElementById("input");
const output = document.getElementById("output");

// Configurar marked (seguridad básica)
marked.setOptions({
  breaks: true
});

// Cargar contenido guardado o ejemplo
const saved = localStorage.getItem("markdown");

input.value = saved || `# Bienvenido 👋

Empieza a escribir Markdown aquí...

## Ejemplo
- Lista
- Lista

**Texto en negrita**
`;

updateOutput();

// Convertir en tiempo real
input.addEventListener("input", () => {
  localStorage.setItem("markdown", input.value);
  updateOutput();
});

function updateOutput() {
  output.innerHTML = marked.parse(input.value);
}

// Copiar HTML
function copyOutput() {
  navigator.clipboard.writeText(output.innerHTML);
}

// Limpiar
function clearInput() {
  input.value = "";
  localStorage.removeItem("markdown");
  updateOutput();
}