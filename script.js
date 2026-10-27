
const STORAGE_KEY = "kanban-board-tasks";

const columns = ["todo", "doing", "done"];
const labels = {
  todo: "To-Do",
  doing: "Doing",
  done: "Done"
};

const board = document.querySelector(".board");
const dialog = document.getElementById("taskDialog");
const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("taskTitle");
const descriptionInput = document.getElementById("taskDescription");
const statusInput = document.getElementById("taskStatus");

let tasks = loadTasks();
let draggedTaskId = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!Array.isArray(saved)) return [];

    return saved.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.description === "string" &&
      columns.includes(task.status)
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    alert("Could not save tasks. Check your browser storage.");
  }
}

function renderBoard() {
  columns.forEach(status => {
    const list = document.getElementById(status);
    list.replaceChildren();

    const columnTasks = tasks.filter(task => task.status === status);

    const count = list.closest(".column").querySelector(".count");
    count.textContent = columnTasks.length;

    if (columnTasks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "Drop tasks here or add a new task";
      list.appendChild(empty);
    }

    columnTasks.forEach(task => {
      list.appendChild(createTaskCard(task));
    });
  });
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.id = task.id;

  const title = document.createElement("h3");
  title.textContent = task.title;

  card.appendChild(title);

  if (task.description) {
    const description = document.createElement("p");
    description.textContent = task.description;
    card.appendChild(description);
  }

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const badge = document.createElement("span");
  badge.className = "status-label";
  badge.textContent = labels[task.status];

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

  deleteButton.addEventListener("click", () => {
    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    renderBoard();
  });

  footer.append(badge, deleteButton);
  card.appendChild(footer);

  card.addEventListener("dragstart", event => {
    draggedTaskId = task.id;
    event.dataTransfer.setData("text/plain", task.id);
    event.dataTransfer.effectAllowed = "move";
    card.style.opacity = "0.5";
  });

  card.addEventListener("dragend", () => {
    draggedTaskId = null;
    card.style.opacity = "1";

    document.querySelectorAll(".task-list").forEach(list => {
      list.classList.remove("drag-over");
    });
  });

  return card;
}

// Configure drag-and-drop for all three columns.
document.querySelectorAll(".task-list").forEach(list => {
  list.addEventListener("dragover", event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    list.classList.add("drag-over");
  });

  list.addEventListener("dragleave", event => {
    if (!list.contains(event.relatedTarget)) {
      list.classList.remove("drag-over");
    }
  });

  list.addEventListener("drop", event => {
    event.preventDefault();
    list.classList.remove("drag-over");

    const taskId =
      event.dataTransfer.getData("text/plain") || draggedTaskId;

    const newStatus = list.id;

    if (!columns.includes(newStatus) || !taskId) return;

    const task = tasks.find(item => item.id === taskId);

    if (!task || task.status === newStatus) return;

    task.status = newStatus;
    saveTasks();
    renderBoard();
  });
});

// Open the add-task dialog.
document.getElementById("addTaskBtn").addEventListener("click", () => {
  taskForm.reset();
  statusInput.value = "todo";
  dialog.showModal();
  titleInput.focus();
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  dialog.close();
});

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const status = statusInput.value;

  if (!title || !columns.includes(status)) return;

  tasks.push({
    id: crypto.randomUUID(),
    title,
    description,
    status
  });

  saveTasks();
  renderBoard();
  dialog.close();
});

// Display the board, including previously saved tasks.
renderBoard();
