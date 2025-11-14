const fs = require("fs");
const path = require("path");

const pedagogicalFile = path.join(__dirname, "..", "data", "pedagogico_estrutura_dados.json");

function loadModel() {
  const raw = fs.readFileSync(pedagogicalFile, "utf8");
  return JSON.parse(raw);
}

// -----------------------------------------------------------
// Resolver dependências diretas + transitivas
// -----------------------------------------------------------
function resolveAllDependencies(depMap, id, resolved = new Set()) {
  if (!depMap[id]) return resolved;

  for (const d of depMap[id]) {
    if (!resolved.has(d)) {
      resolved.add(d);
      resolveAllDependencies(depMap, d, resolved);  
    }
  }
  return resolved;
}

// -----------------------------------------------------------
// Próxima aula a ser recomendada
// -----------------------------------------------------------
function getNextPedagogicalLesson(studentProgress) {
  const model = loadModel();
  const depArr = model.dependencias;

  // Transformar lista ["1",[], "2",["1"]] em mapa
  const depMap = {};
  for (let i = 0; i < depArr.length - 1; i += 2) {
    depMap[depArr[i]] = depArr[i + 1];
  }

  // Lista plana de todas as aulas
  const allLessons = Object.keys(depMap).map(x => String(x));

  // Aulas vistas
  const seen = new Set(
    (studentProgress?.lessons || [])
      .filter(l => l.status === "visto")
      .map(l => l.lesson_id)
  );

  // Para cada aula, verificar se todas dependências foram vistas
  for (const lessonId of allLessons) {
    if (seen.has(lessonId)) continue; // já vista

    const transitiveDeps = resolveAllDependencies(depMap, lessonId);
    const allDepsSeen = [...transitiveDeps].every(d => seen.has(d));

    if (allDepsSeen) {
      return {
        next_lesson: lessonId,
        pending_dependencies: [...transitiveDeps].filter(d => !seen.has(d)),
        message: `Próxima aula sugerida: ${lessonId}`
      };
    }
  }

  // Se chegar aqui, viu tudo
  return {
    next_lesson: null,
    pending_dependencies: [],
    message: "Parabéns! Você já concluiu todas as aulas."
  };
}

function getActivityInfo(activityId) {
  const model = loadModel();

  // procura atividade
  const activity = model.atividades.find(a => a.id == activityId);

  if (!activity) {
    return null;
  }

  // procura dependências no modelo
  const depArr = model.dependencias;
  let dependencies = [];

  for (let i = 0; i < depArr.length - 1; i += 2) {
    const id = depArr[i];
    const deps = depArr[i + 1];

    if (String(id) === String(activityId)) {
      dependencies = deps;
      break;
    }
  }

  // escolhe contexto aleatório
  let randomContext = null;
  if (activity.contexto && activity.contexto.length > 0) {
    const idx = Math.floor(Math.random() * activity.contexto.length);
    randomContext = activity.contexto[idx];
  }

  return {
    id: activity.id,
    codigo: activity.codigo,
    titulo: activity.titulo,
    contexto_aleatorio: randomContext,
    todos_contextos: activity.contexto,
    dependencias: dependencies
  };
}

module.exports = {
  getNextPedagogicalLesson,
  getActivityInfo,
  resolveAllDependencies
};

