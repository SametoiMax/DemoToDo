// Скрипт: Установка текущей задачи
// Отправляет запрос на сервер для установки текущей задачи

function setCurrentTask(taskId) {
    fetch(`/set_current/${taskId}`, { method: 'GET' })
        .then(response => {
            if (response.ok) {
                location.reload(); // Перезагружаем страницу для обновления состояния
            } else {
                response.text().then(text => alert("Ошибка: " + text));
            }
        })
        .catch(error => alert("Ошибка запроса: " + error));
}
