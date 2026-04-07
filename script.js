const input = document.getElementById("input");
const output = document.getElementById("output");

// Convertir en tiempo real
input.addEventListener("input", () => {
  output.innerHTML = marked.parse(input.value);
});

// Copiar resultado
function copyOutput() {
  navigator.clipboard.writeText(output.innerHTML);
  alert("HTML copiado!");
}