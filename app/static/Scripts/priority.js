document.addEventListener("click", function (event) {
    // Проверяем, кликнули ли на элемент с классом .priority-star
    if (event.target.classList.contains("priority-star")) {
        const star = event.target;
        const taskId = star.dataset.taskId;
        let currentPriority = parseInt(star.dataset.priority) || 1;

        // Циклически меняем приоритет: 1 -> 2 -> 3 -> 1
        let newPriority = currentPriority < 3 ? currentPriority + 1 : 1;

        // Отправляем запрос на сервер (AJAX)
        fetch(`/set_priority/${taskId}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ priority: newPriority })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Сервер вернул ошибку при обновлении приоритета.");
            }
            // Обновляем data-priority в элементе
            star.dataset.priority = newPriority;

             // Обновляем звёздочку в календаре
            updateCalendarEventPriority(Number(taskId), newPriority);

        })
        .catch(error => {
            console.error("Ошибка при обновлении приоритета:", error);
        });
    }
});

function updateCalendarEventPriority(taskId, newPriority) {
    // Получаем все события календаря
    const calendarEvents = window.calendar.getEvents();

    // Ищем события с нужным taskId
    const eventsToUpdate = calendarEvents.filter(event => event.extendedProps.taskId === taskId);

    // Перебираем все такие события
    eventsToUpdate.forEach(event => {
        // Находим элемент события по data-event-id
        const eventElement = document.querySelector(`[data-event-id="${event._def.publicId}"]`);

        if (eventElement) {
            // Находим элемент времени для этого события
            const timeElement = eventElement.querySelector('.fc-event-time');

            if (timeElement) {
                // Удаляем старую звёздочку, если есть
                const existingStar = timeElement.querySelector('.task_priority-star');
                if (existingStar) {
                    existingStar.remove();
                }

                // Добавляем новую звёздочку в зависимости от приоритета
                if (newPriority !== 1) { // Добавляем звёздочку, если приоритет не 1
                    const star = document.createElement("span");
                    star.innerHTML = "★";
                    star.classList.add("task_priority-star");
                    star.setAttribute("data-priority", newPriority); // Устанавливаем атрибут с приоритетом
                    timeElement.prepend(star); // Вставляем новую звёздочку перед временем
                }
            }
        }
    });
}


