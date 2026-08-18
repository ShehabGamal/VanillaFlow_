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

function updateElements() {
    let listArr = getItems();
    displayPanel.innerHTML = ""; // clear before re-render to avoid duplicates

    listArr.forEach((item) => {
        let division = document.createElement("div");
        division.classList.add("task");
        if (item.completed) division.classList.add("completed");

        let innerDiv = document.createElement("div");
        let heading = document.createElement("h2");
        heading.innerHTML = item.text;
        innerDiv.appendChild(heading);

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

        division.appendChild(innerDiv);
        division.appendChild(completeBtn);
        division.appendChild(delBtn);
        displayPanel.appendChild(division);
    });
}

updateElements();