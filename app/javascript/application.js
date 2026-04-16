// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails

// Module scripts are deferred by default, so the DOM is already parsed when this runs.
// No need for DOMContentLoaded — using it with modules can cause a race where the
// event fires before the module executes, leaving the listener unregistered.
document.addEventListener("dblclick", (event) => {
  const titleSpan = event.target.closest(".todo-title");
  if (!titleSpan || titleSpan.dataset.editing) return;

  const todoUrl = titleSpan.dataset.todoUrl;
  const originalText = titleSpan.textContent.trim();

  titleSpan.dataset.editing = "true";

  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  input.className = "todo-inline-edit";

  const hiddenText = document.createElement("span");
  hiddenText.textContent = originalText;
  hiddenText.style.display = "none";
  hiddenText.className = "todo-original-text";

  titleSpan.textContent = "";
  titleSpan.appendChild(hiddenText);
  titleSpan.appendChild(input);
  input.focus();
  input.select();

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  function save() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== originalText) {
      fetch(todoUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          "Accept": "application/json"
        },
        body: JSON.stringify({ todo: { title: newTitle } })
      }).then(() => {
        window.location.reload();
      });
    } else {
      cancel();
    }
  }

  function cancel() {
    delete titleSpan.dataset.editing;
    titleSpan.textContent = originalText;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  });

  input.addEventListener("blur", () => {
    if (titleSpan.dataset.editing) {
      save();
    }
  });
});
