// Файл: static/Scripts/drag_drop.js
window.isDragging = false;

/**
 * Проверяет, не находится ли potentialParentId в поддереве draggedTaskId,
 * чтобы не допустить перенос задачи в свою же подзадачу.
 */
function isDescendantInDom(draggedTaskId, potentialParentId) {
  const $root = $(`li.task[data-task-id='${draggedTaskId}']`);
  if (!$root.length) return false;
  const $descendants = $root.find('li.task');
  const $filtered = $descendants.filter(`[data-task-id='${potentialParentId}']`);
  return $filtered.length > 0;
}

document.addEventListener("DOMContentLoaded", function() {

  // 1) Инициализируем jQuery UI Draggable для звёздочки: .priority-star.draggable-task
  $('.priority-star.draggable-task').draggable({
    revert: true,
    cursor: 'move',
    appendTo: 'body',

    // В helper мы клонируем звёздочку и добавляем к ней текст задачи
    helper: function() {
      let $clone = $(this).clone();

      // Ищем ссылку с классом .fc-draggable в том же .droppable-area
      let $taskLink = $(this).closest('.droppable-area').find('a.fc-draggable');
      if ($taskLink.length) {
        // Получаем текст задачи (или парсим data-event при желании)
        let text = $taskLink.text().trim();
        // Дополняем HTML клона: изначально там "★", добавим пробел и текст
        $clone.html($clone.html() + ' ' + text);
      }

      // Стили для «призрака»
      $clone.css({
        'position': 'absolute',
        'z-index': '9999',
        'background-color': 'rgba(246,218,145,0.8)',
        'border': '1px solid #ccc',
        'padding': '5px',
        'color': '#000'
      });
      return $clone;
    },

    start: function() {
      window.isDragging = true;
      // (При желании можно скрывать тултип)
      // $('.tooltip').hide();

      // Становится «прозрачным» по тексту
      $(this).css('color', 'transparent');

      // Сохраняем старый parent_id для дальнейшего сравнения
      let oldParentId = $(this).data('parent-id');
      $(this).data('oldParentId', oldParentId);
    },

    stop: function() {
      window.isDragging = false;
      // Возвращаем исходный цвет текста звёздочки
      $(this).css('color', '');
    }
  });

  // 2) Инициализируем jQuery UI droppable для .droppable-area (дерево)
  $('.droppable-area').droppable({
    accept: '.draggable-task',
    hoverClass: 'drop-hover',

    over: function(event, ui) {
      let draggedTaskId = ui.draggable.data('task-id');
      let oldParentId   = ui.draggable.data('oldParentId');
      let newParentId   = $(this).data('task-id');
      let descendantCheck = isDescendantInDom(draggedTaskId, newParentId);

      if (draggedTaskId === newParentId || oldParentId === newParentId || descendantCheck) {
        $(this).css('background', 'pink');
      } else {
        $(this).css('background', 'lightgreen');
      }
    },

    out: function() {
      $(this).css('background', '');
    },

    drop: function(event, ui) {
      $(this).css('background', '');
      let draggedTaskId = ui.draggable.data('task-id');
      let oldParentId   = ui.draggable.data('oldParentId');
      let newParentId   = $(this).data('task-id');

      // Проверки: нельзя переносить в саму себя, в того же родителя, в свою подзадачу
      if (draggedTaskId === newParentId) return;
      if (oldParentId === newParentId) return;
      if (isDescendantInDom(draggedTaskId, newParentId)) return;

      // Запрос на сервер для обновления parent_id
      fetch(`/move_task/${draggedTaskId}?new_parent=${newParentId}`, {
        method: "POST"
      })
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") {
          location.reload();
        }
      })
      .catch(err => console.error("Ошибка при переносе задачи:", err));
    }
  });
});
