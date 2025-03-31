document.addEventListener("DOMContentLoaded", function () {

    // Создаем элемент для тултипа
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    document.body.appendChild(tooltip);

    // Назначаем обработчики для элементов с классом .tooltip-trigger
    document.querySelectorAll(".tooltip-trigger").forEach(trigger => {

        trigger.addEventListener("mouseenter", function (e) {
            // Если сейчас идет перетаскивание, не показываем тултип
            if (window.isDragging) {
                tooltip.style.display = "none";
                return;
            }

            // Получаем текст тултипа из data-tooltip родительского <li>
            const li = this.closest("li");
            if (!li) {
                return;
            }
            const tooltipText = li.getAttribute("data-tooltip");

            if (tooltipText) {
                tooltip.innerHTML = tooltipText;
                tooltip.style.display = "block";
            }
        });

        trigger.addEventListener("mousemove", function (e) {
            if (!window.isDragging) {
                tooltip.style.top = (e.clientY + 10) + "px";
                tooltip.style.left = (e.clientX + 10) + "px";
            }
        });

        trigger.addEventListener("mouseleave", function () {
            tooltip.style.display = "none";
        });
    });
});
