const fs = require('fs');
const path = require('path');

function getCourse(courseId) {
  // Aqui estou assumindo um arquivo por curso
  // ex: data/curso_edb-01.json
  const filePath = path.join(__dirname, '..', 'data', 'curso_' + courseId + '.json');

  if (!fs.existsSync(filePath)) {
    throw new Error('Curso não encontrado: ' + courseId);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

module.exports = {
  getCourse
};
