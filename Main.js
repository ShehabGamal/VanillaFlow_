let displayPanel = document.querySelector(".tasks");
let frmHandle = document.querySelector(".form");
let textInp = document.querySelector(".input");
let categoryInp = document.querySelector(".category-input");
let categoryList = document.querySelector("#category-list");
let dateInp = document.querySelector(".date-input");

let filterBar = document.createElement("div");
filterBar.classList.add("filter-bar");
displayPanel.parentNode.insertBefore(filterBar, displayPanel);

let progressContainer = document.createElement("div");
progressContainer.classList.add("progress-container");
let progressLabel = document.createElement("div");
progressLabel.classList.add("progress-label");
let progressTrack = document.createElement("div");
progressTrack.classList.add("progress-track");
let progressFill = document.createElement("div");
progressFill.classList.add("progress-fill");
progressTrack.appendChild(progressFill);
progressContainer.appendChild(progressLabel);
progressContainer.appendChild(progressTrack);
displayPanel.parentNode.insertBefore(progressContainer, filterBar);

let activeFilter = "All"; // "All" or a specific category name

function getItems() {
    return JSON.parse(window.localStorage.getItem("items")) || [];
}

function saveItems(items) {
    window.localStorage.setItem("items", JSON.stringify(items));
}

// Deterministic color per category name, no manual color picking needed.
function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 50%)`;
}

// Updates the "X of Y done" label and the animated fill bar.
// Fill color shifts red -> green as percent climbs (hue 0 to 120), so the
// bar communicates progress even before you read the number.
function renderProgress(items) {
    let total = items.length;
    let done = items.filter((i) => i.completed).length;
    let percent = total === 0 ? 0 : Math.round((done / total) * 100);

    progressLabel.innerHTML = total === 0 ? "No tasks yet" : `${done} of ${total} done`;
    progressFill.style.width = percent + "%";
    progressFill.style.backgroundColor = `hsl(${percent * 1.2}, 65%, 50%)`;

    progressContainer.classList.toggle("complete", total > 0 && percent === 100);
}

function getCategories(items) {
    return [...new Set(items.map((i) => i.category || "Uncategorized"))];
}

// Returns "overdue" | "today" | "upcoming" | "none".
// Completed tasks are never flagged overdue - the deadline no longer matters.
function getDueStatus(dueDate, completed) {
    if (!dueDate || completed) return "none";

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let due = new Date(dueDate + "T00:00:00"); // avoid UTC/local timezone drift

    if (due < today) return "overdue";
    if (due.getTime() === today.getTime()) return "today";
    return "upcoming";
}

function formatDueDate(dueDate) {
    let due = new Date(dueDate + "T00:00:00");
    return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Pills above the list: "All" plus one per category in use, auto-colored.
function renderFilterBar(items) {
    filterBar.innerHTML = "";
    let categories = getCategories(items);

    if (categories.length === 0) return; // nothing to filter yet

    let allPill = document.createElement("button");
    allPill.type = "button";
    allPill.classList.add("filter-pill");
    if (activeFilter === "All") allPill.classList.add("active");
    allPill.innerHTML = "All";
    allPill.addEventListener("click", () => {
        activeFilter = "All";
        updateElements();
    });
    filterBar.appendChild(allPill);

    categories.forEach((cat) => {
        let pill = document.createElement("button");
        pill.type = "button";
        pill.classList.add("filter-pill");
        pill.style.setProperty("--pill-color", hashColor(cat));
        if (cat === activeFilter) pill.classList.add("active");
        pill.innerHTML = cat;
        pill.addEventListener("click", () => {
            activeFilter = cat === activeFilter ? "All" : cat;
            updateElements();
        });
        filterBar.appendChild(pill);
    });
}

// Keeps the category datalist (autocomplete) in sync with categories in use.
function updateCategoryDatalist(items) {
    categoryList.innerHTML = "";
    getCategories(items).forEach((cat) => {
        if (cat === "Uncategorized") return;
        let option = document.createElement("option");
        option.value = cat;
        categoryList.appendChild(option);
    });
}

frmHandle.onsubmit = function (e) {
    e.preventDefault();
    if (textInp.value.trim() === "") return;

    let listArr = getItems();
    let todoObj = {
        id: Date.now(),
        text: textInp.value.trim(),
        completed: false,
        category: categoryInp.value.trim(), // empty string = Uncategorized
        dueDate: dateInp.value, // empty string = no due date
    };
    listArr.push(todoObj);
    saveItems(listArr);

    textInp.value = "";
    categoryInp.value = "";
    dateInp.value = "";
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
    updateCategoryDatalist(listArr);
    renderProgress(listArr);
    renderFilterBar(listArr);
    displayPanel.innerHTML = ""; // clear before re-render to avoid duplicates

    listArr.forEach((item, index) => {
        let category = item.category || "Uncategorized";

        let division = document.createElement("div");
        division.classList.add("task");
        if (item.completed) division.classList.add("completed");
        division.dataset.id = item.id;
        division.draggable = true;
        division.style.setProperty("--task-accent", hashColor(category));

        let dueStatus = getDueStatus(item.dueDate, item.completed);
        if (dueStatus === "overdue") division.classList.add("overdue");

        // Spotlight effect: dim non-matching tasks in place instead of hiding them
        if (activeFilter !== "All") {
            division.classList.add(
                category === activeFilter ? "spotlight-active" : "spotlight-dim"
            );
        }

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

        let badge = document.createElement("span");
        badge.classList.add("category-badge");
        badge.style.setProperty("--badge-color", hashColor(category));
        badge.innerHTML = category;
        innerDiv.appendChild(badge);

        if (item.dueDate) {
            let dueBadge = document.createElement("span");
            dueBadge.classList.add("due-badge", `due-${dueStatus}`);
            let label = dueStatus === "overdue" ? "Overdue: " : dueStatus === "today" ? "Due today" : "Due ";
            dueBadge.innerHTML = dueStatus === "today" ? label : label + formatDueDate(item.dueDate);
            innerDiv.appendChild(dueBadge);
        }

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