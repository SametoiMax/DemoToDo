// Скрипт управления выполненными задачами
function toggleCompletedTasks(button) {
    let subtasksList = button.closest("ul");
    let hiddenTasks = subtasksList.querySelectorAll(".hidden-task");

    let isExpanded = button.dataset.expanded === "true";
    console.log(`toggleCompletedTasks: button dataset.expanded = ${button.dataset.expanded}, isExpanded = ${isExpanded}`);

    // Перебираем все скрытые задачи и меняем их видимость
    hiddenTasks.forEach(task => {
        task.style.display = isExpanded ? "none" : "list-item";
        console.log(`toggleCompletedTasks: task display set to ${task.style.display}`);
    });

    // Обновляем текст и состояние кнопки

    button.textContent = isExpanded ? "еще..." : "скрыть";
    button.dataset.expanded = isExpanded ? "false" : "true";
}

// Функция для скрытия/показа блоков с подзадачами, которые имеют класс "completed-subtasks"
function toggleAllCompletedTasks() {
    const completedSubtasks = document.querySelectorAll(".completed-subtasks");  // Все блоки с выполненными подзадачами
    const toggleButton = document.getElementById("toggle-completed-tasks");  // Кнопка скрытия/показа

    let isVisible = toggleButton.dataset.expanded === "true";  // Проверка текущего состояния кнопки
    console.log(`toggleAllCompletedTasks: button dataset.expanded = ${toggleButton.dataset.expanded}, isVisible = ${isVisible}`);

document.addEventListener("DOMContentLoaded", function() {
    const toggleButton = document.getElementById("toggle-completed-tasks");
    let completedSubtasks = document.querySelectorAll(".completed-subtasks");

    if (toggleButton) {
        restoreToggleButtonState();
        toggleAllCompletedTasks();

        toggleButton.addEventListener("click", function(event) {
            event.preventDefault();
            let isVisible = toggleButton.dataset.expanded === "true";
            updateToggleButtonState(toggleButton, isVisible);
            completedSubtasks.forEach(subtask => {
                subtask.style.display = isVisible ? "none" : "";
            });
        });
    } else {
        console.error("Кнопка с ID 'toggle-completed-tasks' не найдена!");
    }
});
    completedSubtasks.forEach(subtask => {
        subtask.style.display = isVisible ? "none" : "";  // Показываем или скрываем блок
        console.log(`toggleAllCompletedTasks: subtask display set to ${subtask.style.display}`);
    });
}

// Функция для обновления текста и состояния кнопки
function updateToggleButtonState(button, isExpanded) {
    button.textContent = isExpanded ? "👁️" : "👁";  // Иконка для показа/скрытия
    button.dataset.expanded = isExpanded ? "false" : "true";  // Меняем состояние кнопки
    console.log(`updateToggleButtonState: button text set to ${button.textContent}, button dataset.expanded = ${button.dataset.expanded}`);

    // Сохраняем состояние кнопки в localStorage
    localStorage.setItem("completedTasksVisible", button.dataset.expanded);
    console.log(`toggleAllCompletedTasks: Сохранение expanded = ${button.dataset.expanded}`);
}

// Функция для восстановления состояния кнопки и текста из localStorage
function restoreToggleButtonState() {
    const toggleButton = document.getElementById("toggle-completed-tasks");

    // Читаем состояние кнопки из localStorage
    const savedState = localStorage.getItem("completedTasksVisible");
    console.log(`restoreToggleButtonState: Восстановление savedState = ${savedState}`);

    // Если состояние существует в localStorage, восстанавливаем его
    if (savedState) {
        const isExpanded = savedState === "true";  // Конвертируем строку "true" или "false" в булево значение
        toggleButton.textContent = isExpanded ? "👁" : "👁️";
        toggleButton.dataset.expanded = isExpanded ? "true" : "false"; // Восстанавливаем состояние кнопки
        console.log(`restoreToggleButtonState: button text set to ${toggleButton.textContent}, button dataset.expanded = ${toggleButton.dataset.expanded}`);
    }
}

// При загрузке страницы восстанавливаем состояние кнопки и видимость блоков
document.addEventListener("DOMContentLoaded", function() {
    // Восстанавливаем состояние кнопки
    restoreToggleButtonState();

    // Восстанавливаем видимость блоков только после восстановления состояния кнопки
    toggleAllCompletedTasks();
});

// Вешаем обработчик на кнопку для скрытия/показа всех выполненных задач
document.getElementById("toggle-completed-tasks").addEventListener("click", function(event) {
    event.preventDefault();

    const toggleButton = document.getElementById("toggle-completed-tasks");
    let isVisible = toggleButton.dataset.expanded === "true";  // Проверка текущего состояния кнопки
    console.log(`toggleAllCompletedTasks: button dataset.expanded = ${toggleButton.dataset.expanded}, isVisible = ${isVisible}`);

    // Обновляем состояние кнопки и сохраняем в localStorage
    updateToggleButtonState(toggleButton, isVisible);

    // Обновляем видимость всех выполненных задач
    toggleAllCompletedTasks();
});
