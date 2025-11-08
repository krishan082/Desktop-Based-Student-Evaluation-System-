/* app.js
 Student Evaluation System (frontend-only)
 Data stored in localStorage under key: "students_v1"
*/

// ---------- Utilities ----------
const STORAGE_KEY = "students_v1";

function getStudents() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveStudents(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function uid() {
  return "id_" + Math.random().toString(36).slice(2, 9);
}

// Percentage & grade calculation (digit-by-digit mindful)
function calculatePercentageAndGrade(marks) {
  // marks: array of numbers
  // total = sum(marks)
  let total = 0;
  for (let i = 0; i < marks.length; i++) {
    const m = Number(marks[i]) || 0;
    total += m;
  }
  const maxTotal = marks.length * 100;
  // percentage decimal computed carefully
  const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 10000) / 100 : 0;
  // grade boundaries
  let grade;
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B+";
  else if (percentage >= 60) grade = "B";
  else if (percentage >= 50) grade = "C";
  else grade = "F";
  return { percentage, grade };
}

// ---------- DOM Elements ----------
const studentForm = document.getElementById("studentForm");
const rollInput = document.getElementById("roll");
const nameInput = document.getElementById("name");
const classInput = document.getElementById("className");
const sInputs = [1,2,3,4,5].map(n => document.getElementById("s"+n));
const studentsTableBody = document.querySelector("#studentsTable tbody");
const rankingList = document.getElementById("rankingList");
const searchInput = document.getElementById("searchInput");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const formTitle = document.getElementById("formTitle");
const resetBtn = document.getElementById("resetBtn");

// state: editing id or null
let editingId = null;

// ---------- CRUD ----------
function addStudent(obj) {
  const list = getStudents();
  list.push(obj);
  saveStudents(list);
}

function updateStudent(id, patch) {
  const list = getStudents().map(s => s.id === id ? {...s,...patch} : s);
  saveStudents(list);
}

function deleteStudent(id) {
  const list = getStudents().filter(s => s.id !== id);
  saveStudents(list);
}

// ---------- Rendering ----------
function renderTable(filterText = "") {
  const list = getStudents();
  const filtered = list.filter(s => {
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
  });
  studentsTableBody.innerHTML = "";
  filtered.forEach((s, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${escapeHtml(s.roll)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.className || '')}</td>
      <td>${s.s1}</td>
      <td>${s.s2}</td>
      <td>${s.s3}</td>
      <td>${s.s4}</td>
      <td>${s.s5}</td>
      <td>${s.percentage}</td>
      <td>${s.grade}</td>
      <td class="actions">
        <button class="edit" data-id="${s.id}">Edit</button>
        <button class="del" data-id="${s.id}">Delete</button>
      </td>
    `;
    studentsTableBody.appendChild(tr);
  });

  // action listeners
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.dataset.id;
      startEdit(id);
    });
  });
  document.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.dataset.id;
      if (confirm("Delete this student?")) {
        deleteStudent(id);
        renderTable(searchInput.value);
        renderRanking();
      }
    });
  });
}

function renderRanking() {
  const list = getStudents().slice().sort((a,b) => b.percentage - a.percentage);
  rankingList.innerHTML = "";
  list.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.name} (${s.roll}) — ${s.percentage}% — ${s.grade}`;
    rankingList.appendChild(li);
  });
}

// ---------- Form actions ----------
studentForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const roll = rollInput.value.trim();
  const name = nameInput.value.trim();
  const className = classInput.value.trim();
  const marks = sInputs.map(i => Number(i.value) || 0);

  // calculate percentage & grade
  const { percentage, grade } = calculatePercentageAndGrade(marks);

  if (!roll || !name) {
    alert("Roll and Name are required.");
    return;
  }

  if (editingId) {
    // update existing
    updateStudent(editingId, {
      roll, name, className,
      s1: marks[0], s2: marks[1], s3: marks[2], s4: marks[3], s5: marks[4],
      percentage, grade
    });
    editingId = null;
    formTitle.textContent = "Add Student";
    document.getElementById("saveBtn").textContent = "Save Student";
  } else {
    // ensure roll uniqueness
    const existing = getStudents().some(s => s.roll.toLowerCase() === roll.toLowerCase());
    if (existing) {
      if (!confirm("A student with this roll already exists. Add another with same roll?")) {
        return;
      }
    }
    const student = {
      id: uid(),
      roll, name, className,
      s1: marks[0], s2: marks[1], s3: marks[2], s4: marks[3], s5: marks[4],
      percentage, grade,
      createdAt: new Date().toISOString()
    };
    addStudent(student);
  }

  studentForm.reset();
  // restore defaults for marks
  sInputs.forEach(i => i.value = 0);

  renderTable(searchInput.value);
  renderRanking();
});

resetBtn.addEventListener("click", () => {
  studentForm.reset();
  sInputs.forEach(i => i.value = 0);
  editingId = null;
  formTitle.textContent = "Add Student";
  document.getElementById("saveBtn").textContent = "Save Student";
});

function startEdit(id) {
  const s = getStudents().find(x => x.id === id);
  if (!s) return;
  editingId = id;
  formTitle.textContent = "Edit Student";
  document.getElementById("saveBtn").textContent = "Update Student";

  rollInput.value = s.roll;
  nameInput.value = s.name;
  classInput.value = s.className || "";
  sInputs[0].value = s.s1 || 0;
  sInputs[1].value = s.s2 || 0;
  sInputs[2].value = s.s3 || 0;
  sInputs[3].value = s.s4 || 0;
  sInputs[4].value = s.s5 || 0;

  // scroll to form (helpful on small screens)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Search ----------
searchInput.addEventListener("input", (e) => {
  renderTable(e.target.value);
});

// ---------- CSV Export ----------
exportCsvBtn.addEventListener("click", () => {
  const list = getStudents();
  if (!list.length) { alert("No student data to export."); return; }
  const header = ["Roll","Name","Class","S1","S2","S3","S4","S5","Percentage","Grade"];
  const rows = list.map(s => [s.roll, s.name, s.className, s.s1, s.s2, s.s3, s.s4, s.s5, s.percentage, s.grade]);
  const csv = [header, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
  a.download = `students_${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ---------- Clear all ----------
clearAllBtn.addEventListener("click", () => {
  if (confirm("This will clear ALL stored student data in your browser. Continue?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
    renderRanking();
  }
});

// ---------- Helpers ----------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function csvEscape(cell) {
  if (cell === null || cell === undefined) cell = "";
  const s = String(cell);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g,'""')}"`;
  }
  return s;
}

// ---------- Boot ----------
(function init(){
  // seed sample if none present (optional - remove if undesired)
  if (!localStorage.getItem(STORAGE_KEY)) {
    const sample = [
      { id: uid(), roll: "R001", name: "Alice Rao", className: "10A", s1:85,s2:92,s3:78,s4:88,s5:90, ...calculatePercentageAndGrade([85,92,78,88,90]), createdAt:new Date().toISOString() },
      { id: uid(), roll: "R002", name: "Bikram Singh", className: "10A", s1:72,s2:65,s3:70,s4:68,s5:74, ...calculatePercentageAndGrade([72,65,70,68,74]), createdAt:new Date().toISOString() }
    ];
    saveStudents(sample);
  }
  renderTable();
  renderRanking();
})();
