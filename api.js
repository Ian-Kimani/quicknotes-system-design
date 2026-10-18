const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const statusElement = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = type;
}

function setButtonDisabled(button, disabled) {
  button.disabled = disabled;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response;
}

function renderEmptyState() {
  notesList.textContent = "";
  const emptyItem = document.createElement("li");
  emptyItem.className = "empty-state";
  emptyItem.textContent = "No notes found.";
  notesList.append(emptyItem);
}

function renderNote(note, prepend = false) {
  const item = document.createElement("li");
  item.className = "note";
  item.dataset.noteId = note.id;

  const content = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = note.title || "Untitled note";
  const body = document.createElement("p");
  body.textContent = note.body || "";
  content.append(title, body);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteNote(note.id, item));

  item.append(content, deleteButton);
  if (prepend) {
    notesList.prepend(item);
  } else {
    notesList.append(item);
  }
}

function renderNotes(notes) {
  notesList.textContent = "";
  if (notes.length === 0) {
    renderEmptyState();
    return;
  }
  notes.forEach((note) => renderNote(note));
}

async function loadNotes() {
  setButtonDisabled(loadButton, true);
  setStatus("Loading notes...", "loading");
  try {
    const response = await request(`${API_URL}?_limit=10`);
    const notes = await response.json();
    renderNotes(notes);
    setStatus(
      notes.length === 0
        ? "No notes were returned by the server."
        : `Loaded ${notes.length} notes from the server.`,
      notes.length === 0 ? "empty" : "success",
    );
  } catch (error) {
    renderEmptyState();
    setStatus("Unable to load notes. Please try again.", "error");
  } finally {
    setButtonDisabled(loadButton, false);
  }
}

async function createNote(title, body) {
  setButtonDisabled(submitButton, true);
  setStatus("Creating note...", "loading");
  try {
    const response = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    const note = await response.json();
    renderNote(note, true);
    setStatus(`Note created (status ${response.status}, id ${note.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus("Unable to create note. Please check your details and try again.", "error");
  } finally {
    setButtonDisabled(submitButton, false);
  }
}

async function deleteNote(noteId, noteElement) {
  const deleteButton = noteElement.querySelector(".delete-btn");
  setButtonDisabled(deleteButton, true);
  setStatus("Deleting note...", "loading");
  try {
    const response = await request(`${API_URL}/${encodeURIComponent(noteId)}`, {
      method: "DELETE",
    });
    noteElement.remove();
    if (notesList.children.length === 0) {
      renderEmptyState();
    }
    // JSONPlaceholder simulates DELETE and does not persist client-created notes.
    setStatus(`Note deleted (status ${response.status}).`, "success");
  } catch (error) {
    setButtonDisabled(deleteButton, false);
    setStatus("Unable to delete note. Please try again.", "error");
  } finally {
    if (document.body.contains(deleteButton)) {
      setButtonDisabled(deleteButton, false);
    }
  }
}

loadButton.addEventListener("click", loadNotes);

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title) {
    setStatus("A title is required.", "error");
    titleInput.focus();
    return;
  }
  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }
  createNote(title, body);
});
