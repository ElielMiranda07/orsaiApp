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

// Configura API-FOOTBALL
const API_KEY = "337c2d400a2ed27f1a044ef413096497";

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Obtener ID de la URL
const params = new URLSearchParams(window.location.search);
const ids = params.get("id"); // Viene en formato "partidoID-ligaID"

// Asegurar que hay un ID en la URL
if (ids) {
  const [partidoId, ligaId] = ids.split("-"); // Separar los dos valores

  console.log(
    "Obteniendo partido con referencia:",
    `ligas/${ligaId}/partidos/${partidoId}`
  );

  // Construir la referencia correcta en Firestore
  const partidoRef = db.doc(`ligas/${ligaId}/partidos/${partidoId}`);

  partidoRef
    .get()
    .then((docSnap) => {
      if (docSnap.exists) {
        const partido = docSnap.data();
        console.log("Datos del partido:", partido);

        // Extraer datos anidados
        let horario = new Date(partido.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        let equipoHome = partido.home.name;
        let escudoHome = partido.home.logo;
        let equipoHomeId = partido.home.id;
        let equipoAway = partido.away.name;
        let escudoAway = partido.away.logo;
        let equipoAwayId = partido.away.id;

        // Insertar detalles del partido
        document.getElementById("detallesPartido").innerHTML = `
          <div class="col-5 d-flex flex-column justify-content-center align-items-center">
            <img src="${escudoHome}" width="60">
            <h2 class="text-center equipo" data-id="${ligaId}-${equipoHomeId}">${equipoHome}</h2>
          </div>
          <div class="col-2 d-flex flex-column text-center">
            <p><strong>${new Date(
              partido.date
            ).toLocaleDateString()}</strong></p>
            <p><strong>${horario}</strong></p>
          </div>
          <div class="col-5 d-flex flex-column justify-content-center align-items-center">
            <img src="${escudoAway}" width="60">
            <h2 class="text-center equipo" data-id="${ligaId}-${equipoAwayId}">${equipoAway}</h2>
          </div>`;

        let widgetContainer = document.getElementById("widgetPartido");

        console.log(document.getElementById("widgetPartido"));

        widgetContainer.innerHTML = `
            <div id="wg-api-football-game"
              data-host="v3.football.api-sports.io"
              data-key="${API_KEY}"
              data-id="1252626"
              data-theme=""
              data-refresh="60"
              data-show-errors="true"
              data-show-logos="true"
              class="widgetPartido">
            </div>`;

        // Agregar el script dinámicamente después de insertar el widget
        let script = document.createElement("script");
        script.src = "https://widgets.api-sports.io/2.0.3/widgets.js";
        script.type = "module";
        document.body.appendChild(script);
      } else {
        document.getElementById("detallesPartido").innerHTML =
          "<p>Partido no encontrado.</p>";
      }
    })
    .catch((error) => {
      console.error("Error obteniendo partido:", error);
      document.getElementById("detallesPartido").innerHTML =
        "<p>Error al obtener los datos del partido.</p>";
    });
} else {
  document.getElementById("detallesPartido").innerHTML =
    "<p>ID de partido no válido.</p>";
}

console.log("ID obtenido de la URL:", ids);

//CREAR DINÁMICAMENTE PÁGINAS DE EQUIPOS
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (event) => {
    const equipo = event.target.closest(".equipo"); // Verifica si el clic fue en un .equipo o dentro de él
    if (equipo) {
      const equipoId = equipo.getAttribute("data-id");
      if (equipoId) {
        window.location.href = `./equipo.html?id=${equipoId}`;
      }
    }
  });
});
