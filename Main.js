let displayPanel = document.querySelector(".tasks");
let frmHandle = document.querySelector(".form");
let textInp = document.querySelector(".input");

function getItems() {
    return JSON.parse(window.localStorage.getItem("items")) || [];
}

function saveItems(items) {
    window.localStorage.setItem("items", JSON.stringify(items));
}

frmHandle.onsubmit = function (e) {
    e.preventDefault();
    if (textInp.value.trim() === "") return;

    let listArr = getItems();
    let todoObj = { id: Date.now(), text: textInp.value.trim(), completed: false };
    listArr.push(todoObj);
    saveItems(listArr);

    textInp.value = "";
    updateElements();
};

// ---- Editing helper ----

function saveTaskText(id, newText) {
    let trimmed = newText.trim();
    if (trimmed === "") return; // ignore empty edits, keep original text

    let items = getItems();
    let target = items.find((e) => e.id === id);
    if (target) target.text = trimmed;
    saveItems(items);
    updateElements();
}

// Swaps the <h2> for a text <input> pre-filled with the current text.
// Enter or blur saves, Escape cancels (no change written).
function enterEditMode(item, innerDiv, heading) {
    let editInput = document.createElement("input");
    editInput.type = "text";
    editInput.classList.add("edit-input");
    editInput.value = item.text;

    let cancelled = false;

    editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            editInput.blur(); // triggers save via blur handler below
        } else if (e.key === "Escape") {
            cancelled = true;
            editInput.blur(); // triggers revert via blur handler below
        }
    });

    editInput.addEventListener("blur", () => {
        if (cancelled) {
            updateElements(); // revert to the original text, discard changes
        } else {
            saveTaskText(item.id, editInput.value);
        }
    });

    innerDiv.replaceChild(editInput, heading);
    editInput.focus();
    editInput.select();
}

// ---- Reordering helpers ----

function moveItem(id, direction) {
    // direction: -1 = up, 1 = down
    let items = getItems();
    let index = items.findIndex((e) => e.id === id);
    let newIndex = index + direction;
    if (index === -1 || newIndex < 0 || newIndex >= items.length) return;

    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    saveItems(items);
    updateElements();
}

// Figures out which task element the dragged card should land before,
// based on the vertical midpoint of each sibling. Classic drag-reorder pattern.
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".task:not(.dragging)")];

    return draggableElements.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        },
        { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
}

// After a drop, read the DOM order back and persist it to localStorage.
function persistOrderFromDOM() {
    let items = getItems();
    let orderedIds = [...displayPanel.querySelectorAll(".task")].map((el) =>
        Number(el.dataset.id)
    );
    let reordered = orderedIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean);
    saveItems(reordered);
}

displayPanel.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = displayPanel.querySelector(".dragging");
    if (!dragging) return;

    const afterElement = getDragAfterElement(displayPanel, e.clientY);
    if (afterElement == null) {
        displayPanel.appendChild(dragging);
    } else {
        displayPanel.insertBefore(dragging, afterElement);
    }
});

function updateElements() {
    let listArr = getItems();
    displayPanel.innerHTML = ""; // clear before re-render to avoid duplicates

    listArr.forEach((item, index) => {
        let division = document.createElement("div");
        division.classList.add("task");
        if (item.completed) division.classList.add("completed");
        division.dataset.id = item.id;
        division.draggable = true;

        // Drag handle + up/down buttons (drag for desktop, buttons for touch/keyboard)
        let reorderControls = document.createElement("div");
        reorderControls.classList.add("reorder-controls");
        reorderControls.title = "Drag to reorder";

        let upBtn = document.createElement("button");
        upBtn.innerHTML = "&#9650;"; // ▲
        upBtn.type = "button";
        upBtn.classList.add("move-btn", "move-up");
        upBtn.title = "Move up";
        upBtn.disabled = index === 0;
        upBtn.addEventListener("click", () => moveItem(item.id, -1));

        let downBtn = document.createElement("button");
        downBtn.innerHTML = "&#9660;"; // ▼
        downBtn.type = "button";
        downBtn.classList.add("move-btn", "move-down");
        downBtn.title = "Move down";
        downBtn.disabled = index === listArr.length - 1;
        downBtn.addEventListener("click", () => moveItem(item.id, 1));

        reorderControls.appendChild(upBtn);
        reorderControls.appendChild(downBtn);

        let innerDiv = document.createElement("div");
        let heading = document.createElement("h2");
        heading.innerHTML = item.text;
        heading.title = "Double-click to edit";
        heading.addEventListener("dblclick", () => {
            enterEditMode(item, innerDiv, heading);
        });
        innerDiv.appendChild(heading);

        let editBtn = document.createElement("button");
        editBtn.innerHTML = "&#9998;"; // pencil
        editBtn.type = "button";
        editBtn.classList.add("edit-btn");
        editBtn.title = "Edit task";
        editBtn.addEventListener("click", () => {
            enterEditMode(item, innerDiv, heading);
        });

        let completeBtn = document.createElement("button");
        completeBtn.innerHTML = item.completed ? "&#8635;" : "&#10003;";
        completeBtn.type = "button";
        completeBtn.classList.add("complete-btn");
        completeBtn.title = item.completed ? "Mark as not done" : "Mark as complete";
        completeBtn.addEventListener("click", () => {
            let items = getItems();
            let target = items.find((e) => e.id === item.id);
            if (target) target.completed = !target.completed;
            saveItems(items);
            updateElements();
        });

        let delBtn = document.createElement("button");
        delBtn.innerHTML = "X";
        delBtn.type = "button";
        delBtn.classList.add("delete");
        delBtn.title = "Delete task";
        delBtn.addEventListener("click", () => {
            let items = getItems().filter((e) => e.id !== item.id);
            saveItems(items);
            updateElements();
        });

        division.addEventListener("dragstart", () => {
            division.classList.add("dragging");
        });
        division.addEventListener("dragend", () => {
            division.classList.remove("dragging");
            persistOrderFromDOM();
            updateElements(); // refresh disabled states on up/down buttons
        });

        division.appendChild(reorderControls);
        division.appendChild(innerDiv);
        division.appendChild(editBtn);
        division.appendChild(completeBtn);
        division.appendChild(delBtn);
        displayPanel.appendChild(division);
    });
}

updateElements();