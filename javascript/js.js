// Configura Firebase normalmente
const firebaseConfig = {
  apiKey: "AIzaSyD2Cgg1Dv9gZzQIT12yslAXBVpGIeTcRAs",
  authDomain: "orsai-ceea6.firebaseapp.com",
  projectId: "orsai-ceea6",
  storageBucket: "orsai-ceea6.firebasestorage.app",
  messagingSenderId: "991901318376",
  appId: "1:991901318376:web:c3270551f137d26c7d5d5d",
  measurementId: "G-HZTV1Q1BBW",
};

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Aquí puedes hacer consultas a Firestore

// Variable global para la fecha seleccionada
let fechaHoy = new Date();

// Función para formatear la fecha como "DD/MM/YYYY"
function formatearFechaMostrar(fecha) {
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// Función para formatear la fecha como "YYYY-MM-DD" (formato de Firestore)
function formatearFechaFirestore(fecha) {
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${anio}-${mes}-${dia}`;
}

// Función para obtener ligas desde Firestore y cargarlas en el acordeón correspondiente
async function cargarLigas() {
  const ligasRef = db.collection("ligas");

  try {
    const snapshot = await ligasRef.get();
    snapshot.forEach((doc) => {
      const liga = doc.data();
      const country = liga.country.toLowerCase(); // Convertimos a minúsculas para coincidir con el ID
      const container = document.getElementById(`${country}Ligas`);

      if (container) {
        const ligaID = doc.id;
        const ligaChecked = obtenerEstadoCheckbox(`liga-${ligaID}`); // Recuperamos el estado desde la cookie
        const li = document.createElement("li");
        li.classList = `list-group-item liga-item d-flex align-items-center`;
        li.innerHTML = `
                  <input
                      type="checkbox"
                      class="btn-check"
                      id="liga-${ligaID}"
                      autocomplete="off"
                      ${ligaChecked ? "checked" : ""}
                  />
                  <label class="col-1 btn btn-outline-success d-flex justify-content-center align-items-center ms-1" for="liga-${ligaID}" id="label-${ligaID}">${
          ligaChecked ? "✅" : "❌"
        }</label>
                  <img class="col-1 escudos" src="${liga.logo}" alt="${
          liga.name
        }" width="30">
                  <span class="col-10 ligas" data-id="${ligaID}">${
          liga.name
        }</span>
                  `;
        container.appendChild(li);
      }
    });

    // Agregar eventos a los checkboxes para cambiar el icono ✅ / ❌ y controlar la visibilidad del acordeón
    document.querySelectorAll(".btn-check").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const ligaID = checkbox.id.split("-")[1];
        const label = document.getElementById(`label-${ligaID}`);
        label.textContent = checkbox.checked ? "✅" : "❌";

        // Guardar el estado del checkbox en la cookie
        guardarEstadoCheckbox(ligaID, checkbox.checked);

        // Obtener todas las ligas seleccionadas
        const ligasSeleccionadas = obtenerLigasSeleccionadas();

        // Si no hay ligas seleccionadas, limpiar el contenedor y mostrar un mensaje
        if (ligasSeleccionadas.length === 0) {
          const contenedorAcordeon =
            document.getElementById("acordeonesPartidos");
          contenedorAcordeon.innerHTML = ""; // Limpiar el contenedor
          const mensaje = document.createElement("div");
          mensaje.classList.add("alert", "alert-info", "text-center");
          mensaje.textContent = "No hay ligas seleccionadas.";
          contenedorAcordeon.appendChild(mensaje);
          return;
        }

        // Cargar partidos de todas las ligas seleccionadas
        cargarPartidos(formatearFechaFirestore(fechaHoy), ligasSeleccionadas);
      });
    });

    // Inicializar la visibilidad de los acordeones según el estado de los checkboxes
    const ligasSeleccionadas = obtenerLigasSeleccionadas();
    if (ligasSeleccionadas.length > 0) {
      cargarPartidos(formatearFechaFirestore(fechaHoy), ligasSeleccionadas);
    } else {
      // Si no hay ligas seleccionadas, mostrar un mensaje
      const contenedorAcordeon = document.getElementById("acordeonesPartidos");
      contenedorAcordeon.innerHTML = ""; // Limpiar el contenedor
      const mensaje = document.createElement("div");
      mensaje.classList.add("alert", "alert-info", "text-center");
      mensaje.textContent = "No hay ligas seleccionadas.";
      contenedorAcordeon.appendChild(mensaje);
    }
  } catch (error) {
    console.error("Error obteniendo ligas: ", error);
  }
}

// Función para obtener las ligas seleccionadas desde las cookies
function obtenerLigasSeleccionadas() {
  const estadoActual = obtenerCookie("checkboxEstadoLigas");
  if (estadoActual) {
    const estadoJSON = JSON.parse(estadoActual);
    return Object.keys(estadoJSON).filter((ligaID) => estadoJSON[ligaID]);
  }
  return [];
}

// URL del proxy en Vercel
const PROXY_URL = "https://vercel-proxy-woad-one.vercel.app/api/proxy";

// Función para obtener los resultados en vivo desde el proxy
const obtenerResultadosEnVivo = async () => {
  try {
    const response = await fetch(PROXY_URL);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Datos recibidos:", data);

    if (data && data.matches) {
      actualizarResultadosEnVivo(data.matches);
    } else {
      console.log("No se encontraron partidos en vivo.");
    }
  } catch (error) {
    console.error("Error al obtener los resultados en vivo:", error);
  }
};

// Función para actualizar los resultados en la interfaz de usuario
function actualizarResultadosEnVivo(partidosEnVivo) {
  console.log("Partidos en vivo:", partidosEnVivo);

  // Selecciona el contenedor donde se mostrarán los partidos
  const contenedorPartidos = document.getElementById("partidos-en-vivo");

  // Limpia el contenedor antes de agregar nuevos datos
  contenedorPartidos.innerHTML = "";

  // Itera sobre los partidos y crea elementos HTML para mostrarlos
  partidosEnVivo.forEach((partido) => {
    const partidoElement = document.createElement("div");
    partidoElement.className = "partido";

    partidoElement.innerHTML = `
      <h3>${partido.homeTeam.name} vs ${partido.awayTeam.name}</h3>
      <p>Marcador: ${partido.score.fullTime.homeTeam} - ${partido.score.fullTime.awayTeam}</p>
      <p>Competencia: ${partido.competition.name}</p>
    `;

    contenedorPartidos.appendChild(partidoElement);
  });
}

// Llama a la función para obtener los resultados en vivo cuando la página cargue
document.addEventListener("DOMContentLoaded", obtenerResultadosEnVivo);

/*
// Función para obtener los resultados en vivo de la API Football
const obtenerResultadosEnVivo = async () => {
  try {
    const response = await fetch(
      "https://api.football-data.org/v4/matches?status=LIVE",
      {
        headers: {
          "X-Auth-Token": "337c2d400a2ed27f1a044ef413096497",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Datos recibidos:", data);

    if (data && data.matches) {
      actualizarResultadosEnVivo(data.matches);
    } else {
      console.log("No se encontraron partidos en vivo.");
    }
  } catch (error) {
    console.error("Error al obtener los resultados en vivo:", error);
  }
};

// Función para actualizar los resultados en la interfaz de usuario
function actualizarResultadosEnVivo(partidosEnVivo) {
  console.log("Partidos en vivo:", partidosEnVivo); // Verifica los datos recibidos
  partidosEnVivo.forEach((partido) => {
    const partidoElement = document.querySelector(
      `.partido[data-id="${partido.id}-${partido.competition.id}"]`
    );
    if (partidoElement) {
      const golesLocal = partidoElement.querySelector("#golesLocal");
      const golesVisitantes = partidoElement.querySelector("#golesVisitantes");

      if (golesLocal && golesVisitantes) {
        golesLocal.textContent = partido.score.fullTime.homeTeam;
        golesVisitantes.textContent = partido.score.fullTime.awayTeam;
      }
    }
  });
}

// Llama a la función para obtener los resultados en vivo
obtenerResultadosEnVivo();
*/

// Función para cargar los partidos desde Firestore y mostrarlos en acordeones
async function cargarPartidos(
  fechaFormateadaFirestore,
  ligasSeleccionadas = []
) {
  try {
    const partidosRef = db
      .collection("Partidos")
      .doc(fechaFormateadaFirestore)
      .collection("partidos");
    const partidosSnapshot = await partidosRef.get();

    const contenedorAcordeon = document.getElementById("acordeonesPartidos");
    contenedorAcordeon.innerHTML = ""; // Limpiamos antes de agregar nuevos datos

    if (partidosSnapshot.empty) {
      console.log("No hay partidos para esta fecha.");
      // Mostrar mensaje en la interfaz
      const mensaje = document.createElement("div");
      mensaje.classList.add("alert", "alert-info", "text-center");
      mensaje.textContent = "No hay partidos para esta fecha.";
      contenedorAcordeon.appendChild(mensaje);
      return;
    }

    let ligasInfo = {}; // Almacena la info de las ligas para evitar consultas repetidas
    let partidosPorLiga = {}; // Agrupa partidos por liga

    for (let partidoDoc of partidosSnapshot.docs) {
      let partido = partidoDoc.data();
      let partidoLigaID = String(partido.leagueId);

      // Si se especifican ligas seleccionadas, solo cargamos partidos de esas ligas
      if (
        ligasSeleccionadas.length > 0 &&
        !ligasSeleccionadas.includes(partidoLigaID)
      ) {
        continue;
      }

      // Validamos que sea un string válido
      if (!partidoLigaID || partidoLigaID.trim() === "") {
        console.warn(`leagueId inválido para el partido:`, partido);
        continue; // Si es inválido, pasamos al siguiente partido
      }

      // Si la liga aún no está en ligasInfo, la buscamos en Firestore
      if (!ligasInfo[partidoLigaID]) {
        const ligaDoc = await db
          .collection("ligas")
          .doc(partidoLigaID.toString())
          .get();
        if (ligaDoc.exists) {
          ligasInfo[partidoLigaID] = ligaDoc.data();
        } else {
          console.warn(
            `No se encontró información para la liga con ID: ${partidoLigaID}`
          );
          continue;
        }
      }

      // Si la liga no está en partidosPorLiga, la inicializamos
      if (!partidosPorLiga[partidoLigaID]) {
        partidosPorLiga[partidoLigaID] = [];
      }

      // Agregamos el partido a la liga correspondiente
      partidosPorLiga[partidoLigaID].push(partido);
    }

    // Insertamos los acordeones con los partidos dentro
    for (const ligaID of Object.keys(partidosPorLiga)) {
      let liga = ligasInfo[ligaID];
      let acordeon = document.getElementById(`acordeon-liga-${ligaID}`);

      // Si el acordeón ya existe, no lo volvemos a crear
      if (!acordeon) {
        let divAcordeon = document.createElement("div");
        divAcordeon.classList.add("accordion", "my-3");
        divAcordeon.id = `acordeon-liga-${ligaID}`;

        divAcordeon.innerHTML = `
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#liga-${ligaID}" aria-expanded="true" aria-controls="liga-${ligaID}">
                <img src="${liga.logo}" alt="${liga.name}" class="escudos" onerror="this.src='./media/placeholder.png'" />
                ${liga.name}
              </button>
            </h2>
            <div id="liga-${ligaID}" class="accordion-collapse collapse show" data-bs-parent="#acordeon-liga-${ligaID}">
              <div class="accordion-body">
                <ul class="list-group list-group-flush" id="partidos-${ligaID}"></ul>
              </div>
            </div>
          </div>`;

        contenedorAcordeon.appendChild(divAcordeon);
        acordeon = divAcordeon;
      }

      // Insertamos los partidos dentro del acordeón de la liga correspondiente
      let partidosHTML = "";
      for (const partido of partidosPorLiga[ligaID]) {
        let horario = new Date(partido.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        partidosHTML += `
          <li class="list-group-item d-flex flex-row">
            <div class="col-1 d-flex justify-content-center align-items-center">
              <img src="./media/espn.png" alt="" class="escudos">${horario}
            </div>
            <div class="col-11 d-flex flex-column align-items-center justify-content-center">
              <div class="partido col-12 d-flex align-items-center justify-content-center" data-id="${partido.id}-${ligaID}">
                <div class="col-5 d-flex flex-row align-items-center">
                  <div class="col-10 d-flex justify-content-end"><div>${partido.home.name}</div></div>
                  <div class="col-2 d-flex justify-content-center"><img src="${partido.home.logo}" alt="" class="escudos" onerror="this.src='./media/placeholder.png'"/></div>
                </div>
                <div class="col-2 d-flex justify-content-center">
                  <p class="mx-auto my-auto" id="golesLocal">-</p>
                  <p class="my-auto">-</p>
                  <p class="mx-auto my-auto" id="golesVisitantes">-</p>
                </div>
                <div class="col-5 d-flex flex-row align-items-center">
                  <div class="col-2 d-flex justify-content-center"><img src="${partido.away.logo}" alt="" class="escudos col-2" onerror="this.src='./media/placeholder.png'"/></div>
                  <div class="col-10 d-flex justify-content-start"><div>${partido.away.name}</div></div>
                </div>
              </div>
              <div class="cuotas col-11">
               <div class="col-12 d-flex flex-row align-items-center justify-content-center" id="cuotas-${partido.id}"></div>
              </div>
            </div>
          </li>`;
      }

      document.getElementById(`partidos-${ligaID}`).innerHTML = partidosHTML;
    }

    // Obtener y actualizar los resultados en vivo cada 60 segundos
    setInterval(async () => {
      const partidosEnVivo = await obtenerResultadosEnVivo();
      actualizarResultadosEnVivo(partidosEnVivo);
    }, 30000); // 30000 ms = 60 segundos
  } catch (error) {
    console.error("Error al cargar los partidos:", error);
  }
}

// Función para cargar cuotas
async function cargarCuotas(fixtureId, bookmakerId) {
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "337c2d400a2ed27f1a044ef413096497", // Reemplaza con tu clave de API
      "x-rapidapi-host": "v3.football.api-sports.io",
    },
  };

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`,
      options
    );
    const data = await response.json();
    console.log("Datos de la API:", data); // Depuración

    if (data.response && data.response.length > 0) {
      const partido = data.response[0];

      // Buscar la casa de apuestas específica por su ID
      const casaDeApuestas = partido.bookmakers.find(
        (bookmaker) => bookmaker.id === bookmakerId
      );

      if (casaDeApuestas) {
        // Buscar la apuesta "Match Winner" por su ID
        const matchWinner = casaDeApuestas.bets.find((bet) => bet.id === 1);

        if (matchWinner) {
          // Extraer las cuotas para Home, Draw y Away
          const cuotas = matchWinner.values.map((value) => ({
            resultado: value.value,
            cuota: value.odd,
          }));

          return cuotas; // Retornar las cuotas
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar las cuotas:", error);
  }
  return null; // Si no hay cuotas, retornar null
}

// Función para actualizar las cuotas de todos los partidos
async function actualizarCuotas(bookmakerId, casaNombre) {
  const partidos = document.querySelectorAll("[data-id]");

  for (const partido of partidos) {
    const fixtureId = partido.getAttribute("data-id").split("-")[0];
    const cuotasDiv = document.getElementById(`cuotas-${fixtureId}`);

    if (cuotasDiv) {
      const cuotas = await cargarCuotas(fixtureId, bookmakerId);
      console.log("Cuotas cargadas:", cuotas); // Depuración

      if (cuotas && cuotas.length > 0) {
        cuotasDiv.innerHTML = `
          <div class="col-4 m-0 p-0 d-flex align-items-center justify-content-end" data-casa="${casaNombre}">
            <p class="p-0 m-0 cuota" data-value="${
              cuotas.find((c) => c.resultado === "Home").cuota
            }" data-id="${fixtureId}">
              1. ${cuotas.find((c) => c.resultado === "Home").cuota}
            </p>
          </div>
          <div class="col-4 m-0 p-0 d-flex align-items-center justify-content-center" data-casa="${casaNombre}">
            <p class="p-0 m-0 cuota" data-value="${
              cuotas.find((c) => c.resultado === "Draw").cuota
            }" data-id="${fixtureId}">
              X. ${cuotas.find((c) => c.resultado === "Draw").cuota}
            </p>
          </div>
          <div class="col-4 m-0 p-0 d-flex align-items-center justify-content-start" data-casa="${casaNombre}">
            <p class="p-0 m-0 cuota" data-value="${
              cuotas.find((c) => c.resultado === "Away").cuota
            }" data-id="${fixtureId}">
              2. ${cuotas.find((c) => c.resultado === "Away").cuota}
            </p>
          </div>
           `;

        // Mostrar las cuotas después de cargarlas
        cuotasDiv.style.display = "block"; // Asegurar que las cuotas sean visibles
      } else {
        cuotasDiv.innerHTML =
          "<p class='p-0 m-0'>No hay cuotas disponibles con esta casa de apuestas.</p>";
        cuotasDiv.style.display = "block"; // Mostrar el mensaje si no hay cuotas
      }
    }
  }
}

// Capturar la selección del dropdown
document.querySelectorAll(".dropdown-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault(); // Evitar que el enlace recargue la página

    const bookmakerId = item.getAttribute("data-value"); // Obtener el valor de la casa de apuestas
    const casaNombre = item.getAttribute("data-casa"); // Obtener el nombre de la casa de apuestas

    // Actualizar el texto del botón del dropdown
    document.getElementById(
      "dropdownMenuButton"
    ).textContent = `Mostrar cuotas de: ${item.textContent}`;

    // Actualizar las cuotas de todos los partidos
    actualizarCuotas(parseInt(bookmakerId), casaNombre);
  });
});

// Mostrar u ocultar cuotas y ajustar altura de los <li>
document.querySelectorAll(".botonMostrarCuotas").forEach((boton) => {
  boton.addEventListener("click", function (event) {
    event.preventDefault(); // Evitar que el enlace navegue a otra página

    let casaSeleccionada = this.getAttribute("data-casa"); // Obtener el nombre de la casa de apuestas

    let listaItems = document.querySelectorAll("section .accordion-body li"); // <li> dentro del .accordion-body

    // Mostrar solo las cuotas de la casa seleccionada
    let cuotasVisibles = document.querySelectorAll(
      `.cuotas[data-casa="${casaSeleccionada}"]`
    );
    cuotasVisibles.forEach((cuota) => {
      let contenedorPadre = cuota.closest("div"); // Obtener el contenedor <div> padre
      if (contenedorPadre) {
        contenedorPadre.style.display = "block"; // Mostrar el <div> padre
      }
    });

    // Ajustar altura de los <li>
    let algunaVisible = cuotasVisibles.length > 0;
    listaItems.forEach((li) => {
      li.style.height = algunaVisible ? "6vh" : "6vh";
    });
  });
});

// Llamamos a las funciones para cargar las ligas y los partidos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  // Mostrar la fecha actual al cargar la página
  document.getElementById("fecha").textContent =
    formatearFechaMostrar(fechaHoy);
});

// Funciones para manejar cookies
function guardarEstadoCheckbox(ligaID, estado) {
  let estadoActual = obtenerCookie("checkboxEstadoLigas");
  let estadoJSON = estadoActual ? JSON.parse(estadoActual) : {};

  estadoJSON[ligaID] = estado; // Guardamos el estado del checkbox con el ID limpio
  establecerCookie("checkboxEstadoLigas", JSON.stringify(estadoJSON), 30); // Guardamos la cookie por 30 días
}

function obtenerEstadoCheckbox(checkboxID) {
  let estadoActual = obtenerCookie("checkboxEstadoLigas");
  if (estadoActual) {
    let estadoJSON = JSON.parse(estadoActual);
    let ligaID = checkboxID.replace("liga-", ""); // Quitamos el prefijo
    return estadoJSON[ligaID] || false; // Si no existe, retorna false
  }
  return false; // Si no hay cookies, por defecto no está marcado
}

function obtenerCookie(nombre) {
  const nombreCookie = nombre + "=";
  const decodificado = decodeURIComponent(document.cookie);
  const cookies = decodificado.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nombreCookie) === 0) {
      return cookie.substring(nombreCookie.length, cookie.length);
    }
  }
  return "";
}

function establecerCookie(nombre, valor, diasExpiracion) {
  let fecha = new Date();
  fecha.setTime(fecha.getTime() + diasExpiracion * 24 * 60 * 60 * 1000); // Tiempo en días
  let expiracion = "expires=" + fecha.toUTCString();
  document.cookie = nombre + "=" + valor + ";" + expiracion + ";path=/";
}

// Función para cambiar la fecha a mañana
document
  .getElementById("partidosMañana")
  .addEventListener("click", async () => {
    // Sumar un día
    fechaHoy.setDate(fechaHoy.getDate() + 1);

    // Actualizar la fecha mostrada
    document.getElementById("fecha").textContent =
      formatearFechaMostrar(fechaHoy);

    // Cargar partidos de las ligas seleccionadas para la nueva fecha
    const ligasSeleccionadas = obtenerLigasSeleccionadas();
    if (ligasSeleccionadas.length > 0) {
      await cargarPartidos(
        formatearFechaFirestore(fechaHoy),
        ligasSeleccionadas
      );
    } else {
      // Si no hay ligas seleccionadas, limpiar el contenedor y mostrar un mensaje
      const contenedorAcordeon = document.getElementById("acordeonesPartidos");
      contenedorAcordeon.innerHTML = ""; // Limpiar el contenedor
      const mensaje = document.createElement("div");
      mensaje.classList.add("alert", "alert-info", "text-center");
      mensaje.textContent = "No hay ligas seleccionadas.";
      contenedorAcordeon.appendChild(mensaje);
    }
  });

// Función para cambiar la fecha a ayer
document.getElementById("partidosAyer").addEventListener("click", async () => {
  // Restar un día
  fechaHoy.setDate(fechaHoy.getDate() - 1);

  // Actualizar la fecha mostrada
  document.getElementById("fecha").textContent =
    formatearFechaMostrar(fechaHoy);

  // Cargar partidos de las ligas seleccionadas para la nueva fecha
  const ligasSeleccionadas = obtenerLigasSeleccionadas();
  if (ligasSeleccionadas.length > 0) {
    await cargarPartidos(formatearFechaFirestore(fechaHoy), ligasSeleccionadas);
  } else {
    // Si no hay ligas seleccionadas, limpiar el contenedor y mostrar un mensaje
    const contenedorAcordeon = document.getElementById("acordeonesPartidos");
    contenedorAcordeon.innerHTML = ""; // Limpiar el contenedor
    const mensaje = document.createElement("div");
    mensaje.classList.add("alert", "alert-info", "text-center");
    mensaje.textContent = "No hay ligas seleccionadas.";
    contenedorAcordeon.appendChild(mensaje);
  }
});

// Llamamos a las funciones para cargar las ligas y los partidos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  // Mostrar la fecha actual al cargar la página
  document.getElementById("fecha").textContent =
    formatearFechaMostrar(fechaHoy);

  // Cargar ligas y partidos
  cargarLigas();
});

// CALCULADORA DE CUOTAS

document.addEventListener("DOMContentLoaded", function () {
  let montoInput = document.getElementById("monto");
  let resultadoDiv = document.getElementById("resultado");
  let gananciaSpan = document.getElementById("ganancia");
  let combinadaSpan = document.getElementById("combinada");
  let reiniciarBtn = document.getElementById("reiniciar");
  let ventanaResultados = document.querySelector(".ventanaResultados");

  let cuotasSeleccionadas = new Map();

  if (ventanaResultados) ventanaResultados.style.display = "none";

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("cuota")) {
      let grupoId = event.target.dataset.id;
      let cuotaValor = parseFloat(event.target.dataset.value);

      if (isNaN(cuotaValor) || cuotaValor <= 0) {
        console.error("Cuota inválida:", event.target.dataset.value);
        return;
      }

      // Si la cuota ya está seleccionada, la deseleccionamos
      if (event.target.classList.contains("seleccionado")) {
        event.target.classList.remove("seleccionado");
        cuotasSeleccionadas.delete(grupoId);
      } else {
        // Deseleccionar cualquier otra cuota del mismo evento
        document.querySelectorAll(`[data-id="${grupoId}"]`).forEach((el) => {
          el.classList.remove("seleccionado");
        });

        // Seleccionar la nueva cuota
        event.target.classList.add("seleccionado");
        cuotasSeleccionadas.set(grupoId, cuotaValor);
      }

      // Actualizar resultados
      actualizarCuotaCombinada();
      calcularGanancia();

      // Mostrar/ocultar la ventana de resultados
      ventanaResultados.style.display =
        cuotasSeleccionadas.size > 0 ? "block" : "none";
    }
  });

  montoInput.addEventListener("input", calcularGanancia);

  function actualizarCuotaCombinada() {
    let cuotaCombinada = [...cuotasSeleccionadas.values()]
      .reduce((acc, val) => acc * val, 1)
      .toFixed(2);
    combinadaSpan.textContent =
      cuotasSeleccionadas.size > 0 ? cuotaCombinada : "0.00";
  }

  function calcularGanancia() {
    let monto = parseFloat(montoInput.value);
    let cuotaCombinada = parseFloat(combinadaSpan.textContent);

    if (monto > 0 && cuotaCombinada > 0) {
      let ganancia = (monto * cuotaCombinada).toFixed(2);
      gananciaSpan.textContent = ganancia;
      resultadoDiv.style.display = "block";
    } else {
      gananciaSpan.textContent = "0.00";
      resultadoDiv.style.display = "none";
    }
  }

  reiniciarBtn.addEventListener("click", function () {
    cuotasSeleccionadas.clear();
    montoInput.value = "";
    combinadaSpan.textContent = "0.00";
    gananciaSpan.textContent = "0.00";
    resultadoDiv.style.display = "none";
    document
      .querySelectorAll(".cuota")
      .forEach((el) => el.classList.remove("seleccionado"));
    ventanaResultados.style.display = "none";
  });
});

/*

//CREAR DINÁMICAMENTE PÁGINAS DE PARTIDOS
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (event) => {
    const partido = event.target.closest(".partido"); // Verifica si el clic fue en un .partido o dentro de él
    if (partido) {
      const partidoId = partido.getAttribute("data-id");
      if (partidoId) {
        window.location.href = `./pages/partido.html?id=${partidoId}`;
      }
    }
  });
});

//CREAR DINÁMICAMENTE PÁGINAS DE LIGAS
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (event) => {
    const partido = event.target.closest(".ligas"); // Verifica si el clic fue en un .ligas o dentro de él
    if (partido) {
      const ligaId = partido.getAttribute("data-id");
      if (ligaId) {
        window.location.href = `./pages/liga.html?id=${ligaId}`;
      }
    }
  });
});

*/
