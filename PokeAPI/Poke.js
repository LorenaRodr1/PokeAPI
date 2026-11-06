const API = "https://pokeapi.co/api/v2";
const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";//del github
const TYPES = {
  normal: ["Normal", "#8a8d7a"], fire: ["Fuego", "#e8662b"], water: ["Agua", "#3f7fd9"],
  electric: ["Electrico", "#d9a406"], grass: ["Planta", "#4a9d3f"], ice: ["Hielo", "#4fb5c4"],
  fighting: ["Lucha", "#b0332c"], poison: ["Veneno", "#8e44ad"], ground: ["Tierra", "#b8893d"],
  flying: ["Volador", "#6f86d6"], psychic: ["Psiquico", "#e0457b"], bug: ["Bicho", "#8a9a1c"],
  rock: ["Roca", "#9c8a45"], ghost: ["Fantasma", "#5b4a94"], dragon: ["Dragon", "#5a3fd1"],
  dark: ["Siniestro", "#4d3d38"], steel: ["Acero", "#6b8497"], fairy: ["Hada", "#d86bb5"] //traduccion y color
};
const out = document.getElementById("out");
const input = document.getElementById("q");
const idOf = url => url.match(/\/(\d+)\/?$/)[1];//La API devuelve la url de la especie y de la cadena de evolucion, y de ahi se extrae el id del pokemon
const pretty = s => s.replace(/-/g, " ");//cambia los guiones por espacios para mostrar el nombre bonito
const get = async url => { const r = await fetch(url); if (!r.ok) throw 0; return r.json(); };//hace la peticion a la API y devuelve el json, si no es ok lanza un error


function find(nodo, name) {//busca en la cadena de evolucion el pokemon con el nombre dado
  if (nodo.species.name === name) return nodo;
  for (const n of nodo.evolves_to) { const h = find(n, name); if (h) return h; }
}
function card(s) {//se hace una lista para mostrar la evo y prevo, si no tiene muestra un mensaje que no tiene
  const id = idOf(s.url);
  return `<button class="evo" data-id="${id}"><img src="${BASE}${id}.png" alt=""><b>${pretty(s.name)}</b><span>#${id.padStart(3, "0")}</span></button>`;
}
const list = (items, empty) => items.length ? `<div class="row">${items.map(card).join("")}</div>` : `<p class="none">${empty}</p>`;

async function show(raw) {//Limpia el input
  const q = raw.trim().toLowerCase().replace(/^#/, "").replace(/[.'’]/g, "").replace(/\s+/g, "-");
  if (!q) return;
  out.innerHTML = `<div class="msg">Buscando....</div>`;
  try {
    const p = await get(`${API}/pokemon/${q}`);//muestra al img, numero y tipo
    const s = await get(p.species.url);//obtiene la información de la especie
    const chain = await get(s.evolution_chain.url);//obtiene la cadena de evolucion
    const last = lang => [...s.flavor_text_entries].reverse().find(e => e.language.name === lang);//busca la descripcion en el lenguaje
    const entry = last("es") || last("en");//si no hay descripcion en español busca en ingles
    const text = entry ? entry.flavor_text.replace(/[\f\n\r]+/g, " ") : "Sin descripción.";//si no hay descripcion muestra "sin descripcion"
    const esName = (s.names.find(n => n.language.name === "es") || {}).name;//busca el nombre en español
    const names = p.types.map(t => t.type.name);
    const accent = (TYPES[names[0]] || [0, "#d8392b"])[1];//si no hay tipo asigna un color rojo
    const node = find(chain.chain, s.name);//busca el nodo de la cadena de evolucion que corresponde al pokemon
    const next = node ? node.evolves_to.map(n => n.species) : [];
    const prev = s.evolves_from_species ? [s.evolves_from_species] : [];
    const types = names.map(t => { const [l, c] = TYPES[t] || [t, "#888"]; return `<span class="type" style="background:${c}">${l}</span>`; }).join("");//muestra los tipos del pokemon con su color
    out.innerHTML = `
      <article class="card" style="--accent:${accent}">//tiene la tarjeta, le asigna un color y lo guarda
        <div class="hero">
          <span class="num">#${String(p.id).padStart(3, "0")}</span>//muestra el numero del pokemon con 3 digitos
          <div class="disc"><img src="${BASE}other/official-artwork/${p.id}.png" alt="${p.name}"></div>//muestra la imagen del pokemon
        </div>
        <div class="body">
          <h2>${pretty(p.name)}</h2>
          ${esName && esName.toLowerCase() !== p.name ? `<p class="es">En español: ${esName}</p>` : ""}//si el nombre en español es diferente al nombre en ingles lo muestra
          <div class="types">${types}</div>
          <p class="desc">${text}</p>//muestra la descripcion del pokemon
          <section class="evos"><h3>Prevolución</h3>${list(prev, "No tiene prevolución.")}</section>//muestra la prevolucion del pokemon, si no tiene muestra un mensaje que no tiene
          <section class="evos"><h3>Evolución</h3>${list(next, "No evoluciona.")}</section>//muestra la evolucion del pokemon, si no tiene muestra un mensaje que no tiene
        </div>
      </article>`;
  } catch {
    out.innerHTML = `<div class="msg">No encontré “${raw.trim()}”. Revisa el número o escribe el nombre en inglés.</div>`;//si no encuentra el pokemon muestra un mensaje de error
  }
}

document.getElementById("f").addEventListener("submit", e => { e.preventDefault(); show(input.value); });
out.addEventListener("click", e => {
  const b = e.target.closest(".evo");
  if (b) { input.value = b.dataset.id; show(b.dataset.id); window.scrollTo({ top: 0, behavior: "smooth" }); }
});//si se hace click en la prevolucion o evolucion del pokemon, muestra la informacion del pokemon correspondiente y hace scroll hacia arriba


get(`${API}/pokemon?limit=1500`).then(d => {
  document.getElementById("names").innerHTML = d.results.map(r => `<option value="${r.name}">`).join("");
}).catch(() => {});//obtiene los nombres de los pokemon y los muestra en el input para autocompletar