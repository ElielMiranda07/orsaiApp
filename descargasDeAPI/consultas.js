//Consultas a la API

//LIGAS

//EQUIPOS

//PARTIDOS

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

// Configura API-FOOTBALL
const API_KEY = "337c2d400a2ed27f1a044ef413096497";

// Aquí puedes hacer consultas a Firestore

// GUARDAR PARTIDOS LOS PRÓXIMOS DÍAS
const leagues = [
  {
    country: "Uruguay",
    leagueName: "Copa Uruguay",
    leagueId: 930,
  },
  {
    country: "Uruguay",
    leagueName: "Primera División - Apertura",
    leagueId: 268,
  },
  {
    country: "Uruguay",
    leagueName: "Primera División - Clausura",
    leagueId: 270,
  },
  {
    country: "Uruguay",
    leagueName: "Segunda División",
    leagueId: 269,
  },
];

// 🔹 Función para obtener la fecha actual en formato YYYY-MM-DD
function getCurrentDate(offsetDays = -1) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays); // Sumar días para obtener fechas futuras
  return date.toISOString().split("T")[0]; // Formato: "YYYY-MM-DD"
}

// 🔹 Función para obtener partidos de una liga en un rango de fechas
async function fetchMatches(leagueId, fromDate, toDate) {
  const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2024&from=${fromDate}&to=${toDate}`;
  const myHeaders = new Headers({
    "x-apisports-key": API_KEY, // Asegúrate de definir API_KEY correctamente
  });

  try {
    const response = await fetch(url, { method: "GET", headers: myHeaders });
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error al obtener partidos:", error);
    return [];
  }
}

// 🔹 Función para guardar los partidos en Firestore con la nueva estructura
async function saveLeagueMatches() {
  const fromDate = getCurrentDate(); // Hoy
  const toDate = getCurrentDate(10); // 10 días hacia adelante

  for (const league of leagues) {
    try {
      console.log(
        `📅 Obteniendo partidos de ${league.leagueName} del ${fromDate} al ${toDate}...`
      );

      // ⚽ Obtener partidos en el rango de fechas
      const matchesData = await fetchMatches(league.leagueId, fromDate, toDate);
      if (matchesData.length === 0) {
        console.warn(
          `⚠️ No se encontraron partidos para ${league.leagueName} en los próximos 10 días.`
        );
        continue;
      }

      for (const match of matchesData) {
        const matchDate = match.fixture.date.split("T")[0]; // Extrae solo la fecha "YYYY-MM-DD"

        await db
          .collection("Partidos")
          .doc(matchDate) // Documento con la fecha como ID
          .collection("partidos") // Subcolección "partidos"
          .doc(String(match.fixture.id)) // Documento con el ID del partido
          .set({
            id: match.fixture.id,
            date: match.fixture.date,
            status: match.fixture.status.short,
            leagueId: league.leagueId,
            home: {
              id: match.teams.home.id,
              name: match.teams.home.name,
              logo: match.teams.home.logo,
            },
            away: {
              id: match.teams.away.id,
              name: match.teams.away.name,
              logo: match.teams.away.logo,
            },
          });
      }

      console.log(
        `✅ Partidos de ${league.leagueName} guardados correctamente en Firestore.`
      );
    } catch (error) {
      console.error(
        `❌ Error al guardar partidos de ${league.leagueName}:`,
        error
      );
    }
  }
}

// 🔹 Ejecutar la función al presionar el botón
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("cargarPartidos")
    .addEventListener("click", saveLeagueMatches);
});

// GUARDAR DATOS DE LAS LIGAS Y SUS EQUIPOS

// Función para obtener y guardar ligas y equipos en Firestore

async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`https://v3.football.api-sports.io/${endpoint}`);
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-apisports-key": API_KEY,
      },
    });

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error(`❌ Error al obtener datos de la API (${endpoint}):`, error);
    return null;
  }
}

// 🔹 Función para obtener equipos de una liga
async function fetchTeams(leagueId) {
  return await fetchAPI("teams", { league: leagueId, season: 2024 });
}

// 🔹 Función para obtener y guardar ligas y equipos en Firestore
async function saveSelectedLeagues(leagueIds) {
  for (const leagueId of leagueIds) {
    try {
      console.log(`🔍 Obteniendo datos de la liga con ID: ${leagueId}...`);

      // 🏆 Obtener datos de la liga desde la API
      const leagueData = await fetchAPI("leagues", { id: leagueId });
      if (!leagueData || leagueData.length === 0) {
        console.warn(
          `⚠️ No se encontraron datos para la liga con ID: ${leagueId}.`
        );
        continue;
      }
      const leagueInfo = leagueData[0].league;

      console.log("📢 Datos recibidos de la API:", leagueInfo);

      // 📌 Guardar la información de la liga en Firestore
      await db
        .collection("ligas")
        .doc(String(leagueId))
        .set({
          id: leagueInfo.id || "Desconocido",
          name: leagueInfo.name || "Nombre no disponible",
          country: leagueInfo.country || "País no disponible",
          logo: leagueInfo.logo || "",
        });

      console.log(
        `✅ Datos de la liga ${leagueInfo.name} guardados correctamente.`
      );

      // 🏟 Obtener equipos de la liga desde la API
      const teamsData = await fetchTeams(leagueId);
      if (!teamsData || teamsData.length === 0) {
        console.warn(
          `⚠️ No se encontraron equipos para la liga con ID: ${leagueId}.`
        );
        continue;
      }

      for (const team of teamsData) {
        await db
          .collection("ligas")
          .doc(String(leagueId))
          .collection("equipos")
          .doc(String(team.team.id))
          .set({
            id: team.team.id,
            name: team.team.name,
            logo: team.team.logo,
          });
      }

      console.log(
        `✅ Equipos de la liga ${leagueInfo.name} guardados correctamente.`
      );
    } catch (error) {
      console.error(
        `❌ Error al guardar datos de la liga con ID: ${leagueId}:`,
        error
      );
    }
  }
}

// 🔹 Configurar botón para ejecutar la función
document.addEventListener("DOMContentLoaded", function () {
  const selectedLeagues = [268, 269, 270, 930]; // IDs de ligas a traer
  document
    .getElementById("cargarLigasYEquipos")
    .addEventListener("click", function () {
      saveSelectedLeagues(selectedLeagues);
    });
});
