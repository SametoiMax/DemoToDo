document.addEventListener('DOMContentLoaded', function() {
  window.selectedCalendarEvent = null;

  function unhighlightEvent(info) {
    if (info) {
      let eventEl = info.el;  // Используем info.el, если оно существует
      if (eventEl) {
        eventEl.classList.remove('selected');  // Убираем класс выделения
      }
    }
  }

  function selectEvent(info) {
    if (window.selectedCalendarEvent && window.selectedCalendarEvent !== info) {
      unhighlightEvent(window.selectedCalendarEvent);
    }
    window.selectedCalendarEvent = info;

    let eventEl = info.el;
    if (eventEl) {
      eventEl.classList.add('selected');  // Добавляем класс выделения
    }
  }

  function eventClickHandler(info) {
    selectEvent(info);  // Передаем объект info
  }

  function dateClickHandler(info) {
    if (window.selectedCalendarEvent) {
      unhighlightEvent(window.selectedCalendarEvent);
      window.selectedCalendarEvent = null;
    }
  }

  async function deleteEventOnServer(info) {
    try {
      let resp = await fetch(`/delete_calendar_event/${info.event.id}`, { method: "POST" });
      if (!resp.ok) return false;
      let data = await resp.json();
      if (data.error) return false;
      return true;
    } catch (err) {
      return false;
    }
  }

  document.addEventListener("keydown", async function(e) {
    if (e.key === "Delete" && window.selectedCalendarEvent) {
      let info = window.selectedCalendarEvent;
      let title = info.event.title || "Без названия";

      // Используем SweetAlert для подтверждения удаления
      Swal.fire({
        title: `Вы уверены, что хотите удалить "${title}"?`,
        text: "Эта операция не может быть отменена.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Да, удалить!",
        cancelButtonText: "Отмена"
      }).then(async (result) => {
        if (result.isConfirmed) {
          let ok = await deleteEventOnServer(info);
          if (ok) {
            info.event.remove();  // Удаляем событие
            window.selectedCalendarEvent = null;
          } else {
            Swal.fire('Ошибка!', 'Произошла ошибка при удалении события.', 'error');
          }
        }
      });
    }
  });

  // Экспортируем обработчики для использования в других модулях
  window.CalendarActions = {
    eventClickHandler,
    dateClickHandler
  };
});
