const submitNewTask = (element) => {
  const $form = $(element);

  $.post('/tasks', $form.serialize())
    .then(() => {
      $form[0].reset();
      closeEditor($('.editor'));
    })
    .fail((err) => {
      console.log(err.message);
    });
};

const completeStatusAnimation = function() {
  $(".complete-status").click(() => {
    $(".complete-status").fadeOut(250, function() {
      if ($(this).attr("src") === "images/not-completed.png") {
        $(this).attr("src", "images/completed.png");
        $(this).removeClass("not-completed");
        $(this).addClass("completed");
      } else {
        $(this).attr("src", "images/not-completed.png");
        $(this).removeClass("completed");
        $(this).addClass("not-completed");
      }
    }).fadeIn(250);
  });
};

const escape = function(str) {
  let div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

const createTaskElement = (task) => {
  let completeStatus;
  let iconSrc;
  if (task.complete === true) {
    completeStatus = "completed";
    iconSrc = "images/completed.png";
  } else {
    completeStatus = "not-completed";
    iconSrc = "images/not-completed.png";
  }
  const $task = $(`
  <li id="task_id_${task.id}">
    <div class="task-content">
                  <img src="${iconSrc}" alt="" class="complete-status ${completeStatus}">
                <i class="fa-solid fa-video category-icon"></i>
                <span>${escape(task.task_name)}</span>
                <span class="edit-delete-section">
                  <span class="due-date">Due Jan 9 2023</span>
                  <span class="edit-delete"><button data-modal-target="#old-task-editor"><i class="fa-solid fa-pen-to-square"></i></button></span>
                  <span class="edit-delete"><button><i class="fa-sharp fa-solid fa-trash"></i></button></span>
                </span>
    </div>
  </li>
  `);
  return $task;
};

const renderTasks = function(tasks) {
  for (let task of tasks) {
    const $task = createTaskElement(task);
    $('#tasks-ul').prepend($task);
  }
};

const loadTasks = function() {
  $.ajax({
    url: "/tasks",
    method: "GET"
  })
    .then((tasks) => {
      renderTasks(tasks.tasks);
    })
    .catch((error) => {
      console.log(error);
    });
};
