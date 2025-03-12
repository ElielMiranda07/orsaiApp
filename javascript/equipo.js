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

// Obtener ID de la URL
const params = new URLSearchParams(window.location.search);
const ids = params.get("id");

// Asegurar que hay un ID en la URL
if (ids) {
  const [ligaId, equipoId] = ids.split("-"); // Separar los dos valores

  console.log(
    "Obteniendo equipo con referencia:",
    `ligas/${ligaId}/equipos/${equipoId}`
  );

  // Construir la referencia correcta en Firestore
  const equipoRef = db.doc(`ligas/${ligaId}/equipos/${equipoId}`);

  equipoRef
    .get()
    .then((docSnap) => {
      if (docSnap.exists) {
        const equipo = docSnap.data();
        console.log("Datos del equipo:", equipo);

        // Extraer datos anidados
        let equipoNombre = equipo.name;
        let equipoLogo = equipo.logo;

        // Insertar detalles del partido
        document.getElementById("detallesEquipo").innerHTML = `
            <div class="col-5 d-flex flex-column justify-content-center align-items-center">
              <img src="${equipoLogo}" width="60">
              <h2 class="text-center">${equipoNombre}</h2>
            </div>`;
      } else {
        document.getElementById("detallesEquipo").innerHTML =
          "<p>Equipo no encontrado.</p>";
      }
    })
    .catch((error) => {
      console.error("Error obteniendo equipo:", error);
      document.getElementById("detallesEquipo").innerHTML =
        "<p>Error al obtener los datos del equipo.</p>";
    });
} else {
  document.getElementById("detallesEquipo").innerHTML =
    "<p>ID de equipo no válido.</p>";
}

console.log("ID obtenido de la URL:", ids);
