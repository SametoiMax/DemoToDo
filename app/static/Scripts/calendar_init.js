document.addEventListener('DOMContentLoaded', function() {
  let containerEl = document.querySelector('.left-pane ul');
  if (containerEl) {
    new FullCalendar.Draggable(containerEl, {
      itemSelector: '.fc-draggable',
      dragStart: function() {
        window.isDragging = true;
        let tooltip = document.querySelector(".tooltip");
        if (tooltip) tooltip.style.display = "none";
      },
      dragEnd: function() {
        window.isDragging = false;
      },
      eventData: function(eventEl) {
        let eventData = eventEl.getAttribute('data-event');
        try {
          return JSON.parse(eventData);
        } catch (e) {
          return { title: eventEl.innerText.trim() };
        }
      }
    });
  }

  let calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    locale: 'ru',  // Устанавливаем язык календаря на русский
    nowIndicator: true,
    droppable: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: '/calendar_events',
    editable: true,
    eventDurationEditable: true,
    firstDay: 1,
    weekends: true,
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    eventClick: window.CalendarActions.eventClickHandler,
    dateClick: window.CalendarActions.dateClickHandler,

    eventDidMount: function(info) {
        addEventAttributesAndClasses(info.el, info.event.extendedProps);
},

    // При изменении вида календаря, обновляем текст кнопок
    viewDidMount: function() {
      window.updateButtonText(); // Обновляем текст кнопок при каждом рендере
    },

    // При смене вида календаря, также обновляем текст кнопок
    datesSet: function() {
      window.updateButtonText(); // Обновляем текст кнопок после изменения даты
    }
  });

  calendar.render();
  window.calendar = calendar;

  // Connect external drop handler
  if (window.calendar) {
    window.calendar.on('eventReceive', function(info) {
      info.event.remove(); // prevent duplicates
    });

    window.calendar.on('drop', function(info) {
      externalDropHandler(info); // handle external drop
    });
    // Подключаем обработчики событий для перетаскивания и изменения размера в календаре
    window.calendar.on('eventDrop', eventDropHandler);
    window.calendar.on('eventResize', eventResizeHandler);
  }

});

function addEventAttributesAndClasses(eventElement, eventData) {

    // Добавление класса для статуса задачи
    if (eventData.status === "completed") {
        eventElement.classList.add("completed-task");
    }

    if (eventData.current === "current") {
        eventElement.classList.add("current-task");
    }

    // Добавляем звёздочку к времени события, если приоритет не 1
    if (eventData.priority !== 1) {  // Проверка на приоритет, не равный 1
        const timeElement = eventElement.querySelector('.fc-event-time');
        if (timeElement) {
            const star = document.createElement("span");
            star.innerHTML = "★";
            star.classList.add("task_priority-star");
            star.setAttribute("data-priority", eventData.priority);  // Устанавливаем атрибут с приоритетом
            timeElement.prepend(star);  // Вставляем звёздочку перед временем
        }
    }

    // Добавляем атрибуты
    eventElement.setAttribute("data-event-id", eventData.id);

    // Добавляем taskId, если он есть
    if (eventData.taskId) {
        eventElement.setAttribute("data-task-id", eventData.taskId);
    }
}