document.addEventListener('DOMContentLoaded', function() {

  // Функция для обновления события на сервере
  async function updateEventOnServer(info) {
    let startStr = info.event.start ? info.event.start.toISOString() : null;
    let endStr = info.event.end ? info.event.end.toISOString() : startStr;
    let allDay = info.event.allDay;

    try {
      let resp = await fetch(`/update_calendar_event/${info.event.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          start_date: startStr,
          end_date: endStr,
          all_day: allDay ? 'true' : 'false'
        })
      });
      if (!resp.ok) return false;
      let data = await resp.json();
      return !data.error;
    } catch (err) {
      return false;
    }
  }

  // Обработчик для перетаскивания события
  async function eventDropHandler(info) {
    let event = info.event;
    // Обновляем событие на сервере
    let ok = await updateEventOnServer(info);
    if (!ok) {
      info.revert(); // Если обновление не удалось, откатываем изменения
    } else {
      // При успешном обновлении сохраняем изменения
      console.log("Event drop saved successfully to the server.");
    }
  }

  // Обработчик для изменения размера события
  async function eventResizeHandler(info) {
    let event = info.event;
    // Обновляем событие на сервере
    let ok = await updateEventOnServer(info);
    if (!ok) {
      info.revert(); // Если обновление не удалось, откатываем изменения
    } else {
      // При успешном обновлении сохраняем изменения
      console.log("Event resize saved successfully to the server.");
    }
  }

 function externalDropHandler(info) {
    let taskData = info.draggedEl.getAttribute('data-event');
    let eventData;
    try {
        eventData = JSON.parse(taskData);
    } catch (e) {
        return; // Если не удается распарсить данные, прекращаем обработку
    }
    let taskId = eventData.id;
    if (!taskId) return; // Если нет идентификатора задачи, прекращаем обработку

    let isAllDay = info.allDay ? '1' : '0';
    let startDateStr = info.dateStr;
    let endDateStr = info.allDay ? info.dateStr : new Date(info.date.getTime() + 60 * 60 * 1000).toISOString();

    // Сохраняем событие в базе через /add_date/
    fetch(`/add_date/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            start_date: startDateStr,
            end_date: endDateStr,
            all_day: isAllDay
        })
    })
    .then(resp => resp.json())
        .then(data => {
            if (!data.error) {

                // Массив для классов, которые нужно добавить
                let classList = [];

                // Добавление класса для статуса задачи
                if (data.status === "completed") {
                    classList.push("completed-task");
                }

                if (data.current === "current") {
                    classList.push("current-task");
                }
                // Используем полученные данные для добавления события в календарь
                window.calendar.addEvent({
                    id: data.id,
                title: data.title,
                start: info.date,
                end: info.allDay ? null : new Date(info.date.getTime() + 60 * 60 * 1000),
                allDay: info.allDay,
                classNames: classList,  // Добавляем статус
                extendedProps: {
                    "data-event-id": data.id,
                    "data-task-id": data.taskId,
                    "priority": data.priority
                }
            });
        }
    })
    .catch(err => {
        console.error("Error in external drop fetch:", err);
    });
}



  // Экспортируем обработчики для обновления событий
  window.CalendarDrag = {
    eventDropHandler,
    eventResizeHandler
  };

  // Обработчик для внешнего переноса события
  window.externalDropHandler = externalDropHandler;
  window.eventDropHandler = eventDropHandler;
  window.eventResizeHandler = eventResizeHandler;

});
