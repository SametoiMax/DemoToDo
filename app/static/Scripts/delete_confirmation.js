document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".delete-task-btn").forEach(button => {
    button.addEventListener("click", function () {
      let taskId = this.getAttribute("data-task-id");
      Swal.fire({
        title: "Вы уверены?",
        text: "Вы хотите удалить эту задачу?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Да, удалить!",
        cancelButtonText: "Отмена"
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = `/delete/${taskId}`;
        }
      });
    });
  });
});
