// tasks_collapse.js
// Единый скрипт для управления сворачиванием задач (локальное хранение, кнопка "Развернуть всё/Свернуть всё")
// и фильтрации выпадающего списка родительских задач.

document.addEventListener("DOMContentLoaded", function () {
    const storageKey = "collapsedTasks";
    let collapsedTasks = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Получаем ссылку на глобальную кнопку (если есть)
    const toggleAllBtn = document.getElementById("toggle-all");

    // Функция для извлечения числового taskId (убираем нецифровые символы)
    function sanitizeTaskId(taskId) {
        return taskId ? taskId.replace(/\D/g, "") : null;
    }

    // Скрывает/показывает опции в <select id="parent_id">, основываясь на collapsedTasks
    function hideCollapsedOptions() {
        let select = document.getElementById("parent_id");
        if (!select) return;

        let optionMap = {};
        let childMap = {};
        let hiddenTasks = new Set(collapsedTasks.map(sanitizeTaskId));

        // Собираем структуры для определения иерархии
        Array.from(select.options).forEach(option => {
            let taskId = sanitizeTaskId(option.value);
            let parentId = option.dataset.parentId || "ROOT";

            optionMap[taskId] = option;

            if (!childMap[parentId]) {
                childMap[parentId] = [];
            }
            childMap[parentId].push(taskId);
        });

        let finalHiddenTasks = new Set();

        // Рекурсивно скрываем потомков свёрнутых задач
        function hideChildren(taskId) {
            if (childMap[taskId]) {
                childMap[taskId].forEach(childId => {
                    finalHiddenTasks.add(childId);
                    hideChildren(childId);
                });
            }
        }

        hiddenTasks.forEach(taskId => hideChildren(taskId));

        // Пробегаем по всем <option> и скрываем/показываем
        Array.from(select.options).forEach(option => {
            let taskId = sanitizeTaskId(option.value);
            if (finalHiddenTasks.has(taskId)) {
                option.style.display = "none";
            } else {
                option.style.display = "block";
            }
        });
    }

    // Применяем текущее состояние collapsedTasks ко всем задачам
    function applyCollapsedState() {
        document.querySelectorAll(".toggle-subtasks").forEach(btn => {
            let taskId = sanitizeTaskId(btn.dataset.taskId);
            if (!taskId) return;

            let taskItem = btn.closest("li");
            let isCollapsed = collapsedTasks.includes(taskId);

            if (isCollapsed) {
                taskItem.classList.add("collapsed");
                btn.textContent = "▼"; // Свёрнуто
            } else {
                taskItem.classList.remove("collapsed");
                btn.textContent = "▲"; // Развёрнуто
            }
        });

        // После изменения DOM обновляем выпадающий список
        hideCollapsedOptions();
    }

    // Сворачивает/разворачивает конкретную ветку
    function toggleTaskCollapse(taskId, taskItem, btn) {
        if (!taskId) return;

        let isNowCollapsed = !taskItem.classList.contains("collapsed");
        taskItem.classList.toggle("collapsed");

        if (isNowCollapsed) {
            // Свернули
            collapsedTasks.push(taskId);
            btn.textContent = "▼";
        } else {
            // Развернули
            collapsedTasks = collapsedTasks.filter(id => id !== taskId);
            btn.textContent = "▲";
        }

        localStorage.setItem(storageKey, JSON.stringify(collapsedTasks));

        // Обновляем список после изменения
        hideCollapsedOptions();
    }

    // Глобальная функция "Развернуть всё / Свернуть всё"
    function toggleAllTasks(expandAll) {
        document.querySelectorAll(".toggle-subtasks").forEach(btn => {
            let taskItem = btn.closest("li");
            let taskId = btn.dataset.taskId;

            if (expandAll) {
                // Разворачиваем
                taskItem.classList.remove("collapsed");
                // Очищаем collapsedTasks
                collapsedTasks = [];
            } else {
                // Сворачиваем
                taskItem.classList.add("collapsed");
                if (!collapsedTasks.includes(taskId)) {
                    collapsedTasks.push(taskId);
                }
            }
        });

        // Сохраняем новое состояние
        localStorage.setItem(storageKey, JSON.stringify(collapsedTasks));

        // Обновляем текст кнопки (если надо)
        if (toggleAllBtn) {
            toggleAllBtn.innerHTML = expandAll ? "▲" : "▼";
        }

        // И вызываем фильтрацию выпадающего списка
        hideCollapsedOptions();
    }

    // Вешаем обработчики на все кнопки .toggle-subtasks
    document.querySelectorAll(".toggle-subtasks").forEach(btn => {
        btn.addEventListener("click", function (event) {
            let taskItem = btn.closest("li");
            let taskId = sanitizeTaskId(btn.dataset.taskId);

            if (!taskId) {
                console.error("❌ Ошибка: taskId отсутствует!", btn.dataset);
                return;
            }

            toggleTaskCollapse(taskId, taskItem, btn);
            event.stopPropagation();
        });
    });

    // Если есть глобальная кнопка "toggle-all", инициализируем
    if (toggleAllBtn) {
        // При загрузке страницы ставим символ кнопки
        toggleAllBtn.innerHTML = (collapsedTasks.length > 0) ? "▼" : "▲";

        // Клик по кнопке
        toggleAllBtn.addEventListener("click", function (event) {
            event.preventDefault();
            let anyCollapsed = (collapsedTasks.length > 0);
            toggleAllTasks(anyCollapsed);
        });
    }

    // При загрузке страницы применяем текущее состояние
    applyCollapsedState();
});
