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
const id = params.get("id");

// Asegurar que hay un ID en la URL
if (id) {
  const ligaId = id;

  console.log("Obteniendo equipos de la liga con ID:", ligaId);

  // Referencia a la subcolección "equipos" dentro del documento de la liga
  db.collection("ligas")
    .doc(ligaId)
    .collection("equipos")
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        let contenidoHTML = "";

        querySnapshot.forEach((doc) => {
          const equipo = doc.data();
          console.log("Equipo encontrado:", equipo);

          // Extraer datos
          let id = doc.id;
          let equipoLogo = equipo.logo;
          let escudoName = equipo.name;

          // Agregar cada equipo a la lista
          contenidoHTML += `
            <div class="col-12 d-flex flex-column justify-content-center">
              <div class="d-flex justify-content-center align-items-center">
                <img src="${equipoLogo}" width="30">
              </div>
              <div class="text-center">
                <h2><strong class="equipo" data-id="${ligaId}-${id}">${escudoName}</strong></h2>
              </div>
            </div>`;
        });

        // Insertar en el HTML
        document.getElementById("detallesEquipos").innerHTML = contenidoHTML;

        let widgetContainer = document.getElementById("widgetLiga");

        console.log(document.getElementById("widgetPartido"));

        widgetContainer.innerHTML = `
            <div id="wg-api-football-standings"
                data-host="v3.football.api-sports.io"
                data-key="${API_KEY}"
                data-league="${ligaId}"
                data-season="2025"
                data-show-errors="true"
                data-show-logos="true"
                class="wg_loader">
            </div>`;

        // Agregar el script dinámicamente después de insertar el widget
        let script = document.createElement("script");
        script.src = "https://widgets.api-sports.io/2.0.3/widgets.js";
        script.type = "module";
        document.body.appendChild(script);
      } else {
        document.getElementById("detallesEquipos").innerHTML =
          "<p>No hay equipos para esta liga.</p>";
      }
    })
    .catch((error) => {
      console.error("Error obteniendo equipos:", error);
      document.getElementById("detallesEquipos").innerHTML =
        "<p>Error al obtener los equipos.</p>";
    });
} else {
  document.getElementById("detallesEquipos").innerHTML =
    "<p>ID de liga no válido.</p>";
}

console.log("ID obtenido de la URL:", id);

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
