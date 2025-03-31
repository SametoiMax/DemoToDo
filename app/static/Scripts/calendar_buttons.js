document.addEventListener('DOMContentLoaded', function() {
    function updateButtonText() {
    const todayButton = document.querySelector('.fc-today-button');
    const monthButton = document.querySelector('.fc-dayGridMonth-button');
    const weekButton = document.querySelector('.fc-timeGridWeek-button');
    const dayButton = document.querySelector('.fc-timeGridDay-button');
    const listButton = document.querySelector('.fc-listWeek-button');
    const prevButton = document.querySelector('.fc-prev-button');
    const nextButton = document.querySelector('.fc-next-button');

    if (todayButton) {
      todayButton.innerHTML = "Сегодня"; // Изменяем текст кнопки
      todayButton.title = "Сегодня";
    }

    if (monthButton) {
      monthButton.innerHTML = "Месяц"; // Изменяем текст кнопки
      monthButton.title = "Месяц";
    }

    if (weekButton) {
      weekButton.innerHTML = "Неделя"; // Изменяем текст кнопки
      weekButton.title = "Неделя";
    }

    if (dayButton) {
      dayButton.innerHTML = "День"; // Изменяем текст кнопки
      dayButton.title = "День";
    }

    if (listButton) {
      listButton.innerHTML = "Список"; // Изменяем текст кнопки
      listButton.title = "Список";
    }

    if (prevButton) {
      prevButton.title = "Предыдущая неделя"; // Задаем новый текст для кнопки
    }

    if (nextButton) {
      nextButton.title = "Следующая неделя"; // Задаем новый текст для кнопки
    }
  }

  // Экспортируем функцию для использования в других модулях
  window.updateButtonText = updateButtonText;
});
