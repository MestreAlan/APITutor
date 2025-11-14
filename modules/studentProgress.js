const fs = require('fs');
const path = require('path');

const progressFile = path.join(__dirname, '..', 'data', 'progress.json');

function loadProgress() {
  if (!fs.existsSync(progressFile)) {
    return { students: [] };
  }
  const raw = fs.readFileSync(progressFile, 'utf8');
  return JSON.parse(raw);
}

function saveProgress(data) {
  fs.writeFileSync(progressFile, JSON.stringify(data, null, 2), 'utf8');
}

function getStudentProgress(studentId, courseId) {
  const data = loadProgress();
  let student = data.students.find(
    s => s.student_id === studentId && s.course_id === courseId
  );

  if (!student) {
    // Se não existe, cria um registro em branco
    student = {
      student_id: studentId,
      name: null,
      course_id: courseId,
      lessons: [],
      last_access: new Date().toISOString()
    };
    data.students.push(student);
    saveProgress(data);
  } else {
    student.last_access = new Date().toISOString();
    saveProgress(data);
  }

  return student;
}

function updateLessonStatus(studentId, courseId, lessonId, status) {
  const data = loadProgress();
  let student = data.students.find(
    s => s.student_id === studentId && s.course_id === courseId
  );

  if (!student) {
    student = {
      student_id: studentId,
      name: null,
      course_id: courseId,
      lessons: [],
      last_access: new Date().toISOString()
    };
    data.students.push(student);
  }

  const existing = student.lessons.find(l => l.lesson_id === lessonId);
  if (existing) {
    existing.status = status;
  } else {
    student.lessons.push({ lesson_id: lessonId, status: status });
  }

  student.last_access = new Date().toISOString();
  saveProgress(data);
  return student;
}

function registerStudent(studentId, name) {
  const data = loadProgress();
  let student = data.students.find(s => s.student_id === studentId);

  if (!student) {
    student = {
      student_id: studentId,
      name: name,
      course_id: null,
      lessons: [],
      last_access: new Date().toISOString()
    };
    data.students.push(student);
  } else {
    student.name = name;
    student.last_access = new Date().toISOString();
  }

  saveProgress(data);
  return student;
}

module.exports = {
  getStudentProgress,
  updateLessonStatus,
  registerStudent
};
