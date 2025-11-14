const express = require('express');
const courseDomain = require('./modules/courseDomain');
const studentProgress = require('./modules/studentProgress');
const pedagogical = require('./modules/pedagogicalEngine');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================================
// GET - Dados do curso + progresso + sugestão
// ===============================================
app.get('/api/course/:courseId/student/:studentId', (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.params.studentId;

  try {
    console.log("== DEBUG ==");
    console.log("courseId:", courseId);
    console.log("studentId:", studentId);

    const courseData = courseDomain.getCourse(courseId);
    console.log("courseData carregado");

    const progressData = studentProgress.getStudentProgress(studentId, courseId);
    console.log("progressData carregado");

    const suggestion = pedagogical.getNextRecommendedLesson(courseId, progressData);
    console.log("suggestion gerada");

    return res.json({
      course_data: courseData,
      progress_data: progressData,
      pedagogical_suggestion: suggestion
    });

  } catch (err) {
    console.error("ERRO:", err);
    res.status(500).json({ error: "Erro ao carregar dados" });
  }
});

// ===============================================
// POST - Atualizar progresso do aluno
// ===============================================
app.post('/api/course/:courseId/student/:studentId/progress', (req, res) => {
  console.log("BODY RECEBIDO:", req.body);
  const courseId = req.params.courseId;
  const studentId = req.params.studentId;

  const lessonId = req.body.lesson_id;
  const status = req.body.status || 'visto';

  if (!lessonId) {
    return res.status(400).json({ error: "lesson_id é obrigatório" });
  }

  try {
    const updated = studentProgress.updateLessonStatus(
      studentId,
      courseId,
      lessonId,
      status
    );

    return res.json({
      success: true,
      progress_data: updated
    });

  } catch (err) {
    console.error("Erro ao salvar progresso:", err);
    res.status(500).json({ error: "Erro ao salvar progresso" });
  }
});

// ===============================================
// POST - Registrar aluno
// ===============================================
app.post('/api/student', (req, res) => {
  const studentId = req.body.student_id;
  const name = req.body.name;

  try {
    const data = studentProgress.registerStudent(studentId, name);
    res.json({ success: true, student: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar aluno' });
  }
});

// ===============================================
// GET - Todas as aulas vistas
// ===============================================
app.get('/api/course/:courseId/student/:studentId/lessons/viewed', (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.params.studentId;

  try {
    const progress = studentProgress.getStudentProgress(studentId, courseId);

    const viewedLessons = progress.lessons
      .filter(l => l.status === "visto")
      .map(l => l.lesson_id);

    return res.json({
      student_id: studentId,
      course_id: courseId,
      viewed_count: viewedLessons.length,
      viewed_lessons: viewedLessons
    });

  } catch (err) {
    console.error("Erro ao listar aulas vistas:", err);
    res.status(500).json({ error: "Erro ao listar aulas vistas" });
  }
});

// ===============================================
// GET - Próxima aula pedagógica
// ===============================================
app.get('/api/pedagogico/:courseId/student/:studentId/next', (req, res) => {
  const courseId = req.params.courseId;
  const studentId = req.params.studentId;

  try {
    const progress = studentProgress.getStudentProgress(studentId, courseId);
    const result = pedagogical.getNextPedagogicalLesson(progress);

    return res.json({
      student_id: studentId,
      course_id: courseId,
      ...result
    });

  } catch (err) {
    console.error("Erro ao obter próxima aula:", err);
    return res.status(500).json({ error: "Erro ao obter próxima aula" });
  }
});

// ===============================================
// GET - Retorna título + contexto de uma atividade
// ===============================================
app.get('/api/pedagogico/atividade/:atividadeId', (req, res) => {
  const atividadeId = req.params.atividadeId;

  try {
    const info = pedagogical.getActivityInfo(atividadeId);

    if (!info) {
      return res.status(404).json({ error: "Atividade não encontrada" });
    }

    return res.json(info);

  } catch (err) {
    console.error("Erro ao obter atividade:", err);
    return res.status(500).json({ error: "Erro ao obter atividade" });
  }
});
  

// ===============================================
// Servidor
// ===============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
