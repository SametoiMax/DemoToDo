
document.addEventListener("DOMContentLoaded", function() {
  const select = document.getElementById("parent_id");
  if (!select) return;

  function updateSelectedOption() {
    // 1. Всем опциям возвращаем original-text
    const allOptions = select.querySelectorAll("option");
    allOptions.forEach(option => {
      if (option.dataset.originalText) {
        // Восстанавливаем исходный HTML с префиксами
        option.innerHTML = option.dataset.originalText;
      }
    });

    // 2. У выбранной опции убираем префикс, подставляя clean-text
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.dataset.cleanText) {
      selectedOption.textContent = selectedOption.dataset.cleanText;
    }
  }

  // Запускаем один раз при загрузке
  updateSelectedOption();

  // И снова при смене выбора
  select.addEventListener("change", updateSelectedOption);
});