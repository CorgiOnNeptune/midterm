/* global determineCategory callAPIByCategory */

let openEditorButtons = document.querySelectorAll('[data-modal-target]');
let closeEditorButton = $('.close-btn');
let overlay = $('#overlay');

const escape = function (str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

const openEditor = function (editor) {
  if (!editor) return;
  editor.classList.add('active');
  overlay.addClass('active');
  $('#loading-animation').hide();
  $(editor).find('form').css('visibility', 'visible');
};

const closeEditor = function (editor) {
  if (!editor) return;
  editor.removeClass('active');
  overlay.removeClass('active');
};

const addEditorEvents = function () {
  openEditorButtons = document.querySelectorAll('[data-modal-target]');
  closeEditorButton = $('.close-btn');
  overlay = $('#overlay');

  openEditorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const editor = document.querySelector(button.dataset.modalTarget);
      openEditor(editor);
    });
  });

  closeEditorButton.on('click', () => {
    const editor = $('.editor');
    closeEditor(editor);
  });
};

/**
 * Takes in a date string "YYYY-MM-DD" converts it to 'Month DD, YYYY'
 * @param {string} date
 */
const formatDate = (date) => {
  if (!date) return;

  const dateArr = date.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  let month = dateArr[1];

  months.forEach((val, index) => {
    if (index + 1 === Number(month)) {
      month = months[index];
    }
  });

  return `${month} ${dateArr[2]}, ${dateArr[0]}`;
};

const setDefaultDate = function () {
  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month < 10) {
    month = '0' + month;
  }
  if (day < 10) {
    day = '0' + day;
  }

  const today = year + '-' + month + '-' + day;
  $('#due_date').attr('value', today);
};

const convertDate = function (date) {
  let newDate = '';
  let month;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  for (let i in months) {
    if (date.slice(0, 3) === months[i]) {
      month = Number(i) + 1;
    }
  }
  if (month < 10) {
    month = '0' + month;
  }
  newDate += `${date.slice(8)}-${month}-${date.slice(4, 6)}`;
  return newDate;
};

const setDefaultValue = function () {
  $('.edit-button').click(function () {
    const li = $(this).closest('li');
    const taskTitle = li.find('.task-title').text();
    const dueDate = li.find('.due-date').text().slice(4);
    const icon = li.find('.category-icon');
    let category = 'others';
    if (icon.hasClass('fa-video')) {
      category = 'films';
    }
    if (icon.hasClass('fa-book-open')) {
      category = 'books';
    }
    if (icon.hasClass('fa-utensils')) {
      category = 'restaurants';
    }
    if (icon.hasClass('fa-cart-shopping')) {
      category = 'products';
    }

    $('#old-task-editor').find('#task_name').text(taskTitle);
    $('#old-task-editor')
      .find('option')
      .each(function () {
        if ($(this).attr('selected') === 'selected') {
          $(this).removeAttr('selected');
        }
        if ($(this).attr('value') === category) {
          $(this).attr('selected', 'selected');
        }
      });
    $('#old-task-editor').find('#due_date').attr('value', convertDate(dueDate));
  });
};

const completeStatusAnimation = function () {
  $('.complete-status').click(function () {
    $(this)
      .fadeOut(180, function () {
        let taskId;
        let status;
        if ($(this).attr('src') === 'images/not-completed.png') {
          $(this).attr('src', 'images/completed.png');
          $(this).removeClass('not-completed');
          $(this).addClass('completed');
          taskId = $(this).closest('li').attr('id').slice(8);
          status = true;
        } else {
          $(this).attr('src', 'images/not-completed.png');
          $(this).removeClass('completed');
          $(this).addClass('not-completed');
          taskId = $(this).closest('li').attr('id').slice(8);
          status = false;
        }
        $.ajax({
          url: `/tasks/${taskId}/status`,
          method: 'POST',
          data: { id: taskId, status: status },
        })
          .then(() => {
            console.log(`Complete status changed: ${taskId}: ${status}`);
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .fadeIn(180);
  });
};

/**
 * Takes in film object to return JustWatch URL
 * @param {{}} film
 */
const getJustWatchURL = (film) => {
  const regex = /[^A-Za-z0-9 \w]/g;
  const filmTitle = film.title.replace(regex, '');
  const titleArr = filmTitle.split(' ');
  const urlTitle = titleArr.join('-');
  let type = $('#shovie-type').text().toLowerCase();
  if (type === 'series') {
    type = 'tv-show';
  }
  return `https://www.justwatch.com/ca/${type}/${urlTitle}`;
};

const renderDetails = function (category) {
  if (
    !category ||
    category === 'films' ||
    category === 'completed' ||
    category === 'incomplete'
  ) {
    const url = `/tasks/films`;
    $.ajax({
      url: url,
      method: 'GET',
    })
      .then((data) => {
        const tasks = data.tasks;
        tasks.forEach((task) => {
          const id = `task_id_${task.task_id}`;
          const taskElement = $(`#${id}`);
          if (!taskElement[0]) {
            return;
          }
          if (!task.title) {
            taskElement.find('.details').remove();
            taskElement.find('.collapse-btn').remove();
            return;
          }
          taskElement.find('.title').text(task.title);
          taskElement.find('#poster').attr('src', `${task.poster}`);
          taskElement.find('.description').text(task.plot);

          if (task.director !== 'N/A') {
            taskElement.find('.director-name').text(task.director);
          } else {
            taskElement.find('.director-title').text('Writers');
            const writers = task.writer.replaceAll(',', ' ·');
            taskElement.find('.director-name').text(writers);
          }

          taskElement.find('.description').text(task.plot);

          const actors = task.actors.replaceAll(',', ' ·');
          taskElement.find('.cast-names').text(actors);

          if (task.genre !== 'N/A') {
            const genres = task.genre.split(', ');
            genres.forEach((genre) => {
              taskElement.find('.genres').append(`
              <span class="genre">${genre}</span>
              `);
            });
          }
          const type = task.type.charAt(0).toUpperCase() + task.type.slice(1);
          taskElement.find('.genres').prepend(`
              <span class="genre" id="shovie-type">${type}</span>
              `);

          const ratings = task.ratings;
          const imdbRating = ratings[0].slice(0, 3);
          taskElement.find('#imdb').text(imdbRating);
          if (ratings.length === 3) {
            const mcRating = ratings[2].slice(0, 2);
            taskElement.find('#rt').text(ratings[1]);
            taskElement.find('#meta').text(mcRating);
          } else {
            taskElement.find('#rt').text(task.tmdb_rating);
            taskElement.find('#svg3390').remove();
            taskElement.find('.RT-rating').append(
              $(`
              <svg id="tmdb-logo"
              xmlns=http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 190.24 81.52"><defs><style>.cls-1{fill:url(#linear-gradient);}</style><linearGradient id="linear-gradient" y1="40.76" x2="190.24" y2="40.76" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#90cea1"/><stop offset="0.56" stop-color="#3cbec9"/><stop offset="1" stop-color="#00b3e5"/></linearGradient></defs><title>Asset 2</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M105.67,36.06h66.9A17.67,17.67,0,0,0,190.24,18.4h0A17.67,17.67,0,0,0,172.57.73h-66.9A17.67,17.67,0,0,0,88,18.4h0A17.67,17.67,0,0,0,105.67,36.06Zm-88,45h76.9A17.67,17.67,0,0,0,112.24,63.4h0A17.67,17.67,0,0,0,94.57,45.73H17.67A17.67,17.67,0,0,0,0,63.4H0A17.67,17.67,0,0,0,17.67,81.06ZM10.41,35.42h7.8V6.92h10.1V0H.31v6.9h10.1Zm28.1,0h7.8V8.25h.1l9,27.15h6l9.3-27.15h.1V35.4h7.8V0H66.76l-8.2,23.1h-.1L50.31,0H38.51ZM152.43,55.67a15.07,15.07,0,0,0-4.52-5.52,18.57,18.57,0,0,0-6.68-3.08,33.54,33.54,0,0,0-8.07-1h-11.7v35.4h12.75a24.58,24.58,0,0,0,7.55-1.15A19.34,19.34,0,0,0,148.11,77a16.27,16.27,0,0,0,4.37-5.5,16.91,16.91,0,0,0,1.63-7.58A18.5,18.5,0,0,0,152.43,55.67ZM145,68.6A8.8,8.8,0,0,1,142.36,72a10.7,10.7,0,0,1-4,1.82,21.57,21.57,0,0,1-5,.55h-4.05v-21h4.6a17,17,0,0,1,4.67.63,11.66,11.66,0,0,1,3.88,1.87A9.14,9.14,0,0,1,145,59a9.87,9.87,0,0,1,1,4.52A11.89,11.89,0,0,1,145,68.6Zm44.63-.13a8,8,0,0,0-1.58-2.62A8.38,8.38,0,0,0,185.63,64a10.31,10.31,0,0,0-3.17-1v-.1a9.22,9.22,0,0,0,4.42-2.82,7.43,7.43,0,0,0,1.68-5,8.42,8.42,0,0,0-1.15-4.65,8.09,8.09,0,0,0-3-2.72,12.56,12.56,0,0,0-4.18-1.3,32.84,32.84,0,0,0-4.62-.33h-13.2v35.4h14.5a22.41,22.41,0,0,0,4.72-.5,13.53,13.53,0,0,0,4.28-1.65,9.42,9.42,0,0,0,3.1-3,8.52,8.52,0,0,0,1.2-4.68A9.39,9.39,0,0,0,189.66,68.47ZM170.21,52.72h5.3a10,10,0,0,1,1.85.18,6.18,6.18,0,0,1,1.7.57,3.39,3.39,0,0,1,1.22,1.13,3.22,3.22,0,0,1,.48,1.82,3.63,3.63,0,0,1-.43,1.8,3.4,3.4,0,0,1-1.12,1.2,4.92,4.92,0,0,1-1.58.65,7.51,7.51,0,0,1-1.77.2h-5.65Zm11.72,20a3.9,3.9,0,0,1-1.22,1.3,4.64,4.64,0,0,1-1.68.7,8.18,8.18,0,0,1-1.82.2h-7v-8h5.9a15.35,15.35,0,0,1,2,.15,8.47,8.47,0,0,1,2.05.55,4,4,0,0,1,1.57,1.18,3.11,3.11,0,0,1,.63,2A3.71,3.71,0,0,1,181.93,72.72Z"/></g></g></svg>
              `)
            );
            taskElement.find('.MC-rating').remove();
            taskElement.find('svg').css('margin-top', '8%');
            taskElement.find('.rating-numbers').css('margin-top', '6%');
            taskElement.find('#rt').css('margin-top', '3.5%');
          }

          taskElement
            .find('#just-watch-link')
            .attr('href', `${getJustWatchURL(task)}`);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
};

const renderTasks = function (tasks) {
  for (let task of tasks) {
    const $task = createTaskElement(task);
    $('#tasks-ul').prepend($task);
  }
};

const loadTasks = function (category) {
  let url = '/tasks';
  if (category) {
    url += `/${category}`;
  }
  $.ajax({
    url: url,
    method: 'GET',
  })
    .then((tasks) => {
      renderTasks(tasks.tasks);
      // re-register the click events
      completeStatusAnimation();
      addEditorEvents();
      setDefaultDate();
      setDefaultValue();
      renderDetails(category);
    })
    .catch((error) => {
      console.log(error);
    });
};

const submitNewTask = async (element) => {
  const $form = $(element);
  const formArray = $form.serializeArray();

  let task = {
    description: formArray[0].value,
    category: formArray[1].value,
    due_date: formArray[2].value,
    data: {},
  };

  if (!task.category || task.category === 'auto') {
    task = await determineCategory(task);
  } else {
    console.log('Selected category:', task.category);
    task = await callAPIByCategory(task);
  }

  $.post('/tasks', task)
    .then(() => {
      $('#tasks-ul').empty();
      loadTasks('incomplete');
      $form[0].reset();
      closeEditor($('.editor'));
    })
    .fail((err) => {
      console.log(err);
    });
};

const createTaskElement = (task) => {
  let completeStatus;
  let iconSrc;
  if (task.complete === true) {
    completeStatus = 'completed';
    iconSrc = 'images/completed.png';
  } else {
    completeStatus = 'not-completed';
    iconSrc = 'images/not-completed.png';
  }
  const dueDate = formatDate(task.due_date.slice(0, 10));
  let iconType = `<i class="fa-solid fa-clipboard-question category-icon"></i>`;
  if (task.category === 'films') {
    iconType = `<i class="fa-solid fa-video category-icon"></i>`;
  }
  if (task.category === 'books') {
    iconType = `<i class="fa-solid fa-book-open category-icon"></i>`;
  }
  if (task.category === 'restaurants') {
    iconType = `<i class="fa-solid fa-utensils category-icon"></i>`;
  }
  if (task.category === 'products') {
    iconType = `<i class="fa-solid fa-cart-shopping category-icon"></i>`;
  }
  if (task.category === 'others') {
    iconType = `<i class="fa-solid fa-clipboard-question category-icon"></i>`;
  }

  let $task;
  const header = $('#header-text').text();
  let id;
  if (
    header === 'Watch' ||
    header === 'Read' ||
    header === 'Eat' ||
    header === 'Shop'
  ) {
    id = task.task_id;
  } else {
    id = task.id;
  }
  if (task.category === 'others') {
    $task = $(`
    <li id="task_id_${id}">
    <div class="task-content">
      <img src="${iconSrc}" alt="" class="complete-status ${completeStatus}">
      ${iconType}
      <span class="task-title">${escape(task.task_name)}</span>
      <span class="edit-delete-section">
        <span class="due-date">Due ${dueDate}</span>
        <span class="edit-delete"><button data-modal-target="#old-task-editor" class="edit-button"><i class="fa-solid fa-pen-to-square"></i></button></span>
        <span class="edit-delete"><button class="delete-btn" onclick="deleteTask(${id})"><i class="fa-sharp fa-solid fa-trash"></i></button></span>
      </span>
    </div>
    </li>
    `);
    return $task;
  }

  $task = $(`
  <li id="task_id_${id}">
    <div class="task-content">
      <img src="${iconSrc}" alt="" class="complete-status ${completeStatus}">
      ${iconType}
      <span class="task-title">${escape(task.task_name)}</span>
      <span class="edit-delete-section">
        <span class="due-date">Due ${dueDate}</span>
        <span class="edit-delete"><button data-modal-target="#old-task-editor" class="edit-button"><i class="fa-solid fa-pen-to-square"></i></button></span>
        <span class="edit-delete"><button class="delete-btn" onclick="deleteTask(${id})"><i class="fa-sharp fa-solid fa-trash"></i></button></span>
      </span>
    </div>
    <button
    class="collapse-btn"
    type="button"
    data-bs-toggle="collapse"
    data-bs-target="#collapseDetails${id}"
    aria-expanded="false"
    aria-controls="collapseDetails${id}">
    <i class="fa-solid fa-angles-down"></i>
  </button>
  <div class="collapse details" id="collapseDetails${id}">
    <div class="poster-container"><img src="https://www.themoviedb.org/t/p/original/1AnfXMG9PPMVjwXcHW6JLSJUbPo.jpg" alt="poster" id="poster"></div>
    <div class="info">
      <div class="info-header">
        <div class="title">no-data</div>
        <div class="genres">
        </div>
      </div>
      <div class="description">A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.</div>
      <div class="director">
        <div class="director-title">Director</div>
        <div class="director-name">Denis Villeneuve</div>
      </div>
      <div class="cast">
        <div class="cast-title">Cast</div>
        <div class="cast-names">Amy Adams Jeremy Renner Forest Whitaker</div>
      </div>

    </div>

    <div class="more">
      <div class="ratings">
        <div class="IMDB-rating">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 575 289.83" ><defs><path d="M575 24.91C573.44 12.15 563.97 1.98 551.91 0C499.05 0 76.18 0 23.32 0C10.11 2.17 0 14.16 0 28.61C0 51.84 0 237.64 0 260.86C0 276.86 12.37 289.83 27.64 289.83C79.63 289.83 495.6 289.83 547.59 289.83C561.65 289.83 573.26 278.82 575 264.57C575 216.64 575 48.87 575 24.91Z" id="d1pwhf9wy2"></path><path d="M69.35 58.24L114.98 58.24L114.98 233.89L69.35 233.89L69.35 58.24Z" id="g5jjnq26yS"></path><path d="M201.2 139.15C197.28 112.38 195.1 97.5 194.67 94.53C192.76 80.2 190.94 67.73 189.2 57.09C185.25 57.09 165.54 57.09 130.04 57.09L130.04 232.74L170.01 232.74L170.15 116.76L186.97 232.74L215.44 232.74L231.39 114.18L231.54 232.74L271.38 232.74L271.38 57.09L211.77 57.09L201.2 139.15Z" id="i3Prh1JpXt"></path><path d="M346.71 93.63C347.21 95.87 347.47 100.95 347.47 108.89C347.47 115.7 347.47 170.18 347.47 176.99C347.47 188.68 346.71 195.84 345.2 198.48C343.68 201.12 339.64 202.43 333.09 202.43C333.09 190.9 333.09 98.66 333.09 87.13C338.06 87.13 341.45 87.66 343.25 88.7C345.05 89.75 346.21 91.39 346.71 93.63ZM367.32 230.95C372.75 229.76 377.31 227.66 381.01 224.67C384.7 221.67 387.29 217.52 388.77 212.21C390.26 206.91 391.14 196.38 391.14 180.63C391.14 174.47 391.14 125.12 391.14 118.95C391.14 102.33 390.49 91.19 389.48 85.53C388.46 79.86 385.93 74.71 381.88 70.09C377.82 65.47 371.9 62.15 364.12 60.13C356.33 58.11 343.63 57.09 321.54 57.09C319.27 57.09 307.93 57.09 287.5 57.09L287.5 232.74L342.78 232.74C355.52 232.34 363.7 231.75 367.32 230.95Z" id="a4ov9rRGQm"></path><path d="M464.76 204.7C463.92 206.93 460.24 208.06 457.46 208.06C454.74 208.06 452.93 206.98 452.01 204.81C451.09 202.65 450.64 197.72 450.64 190C450.64 185.36 450.64 148.22 450.64 143.58C450.64 135.58 451.04 130.59 451.85 128.6C452.65 126.63 454.41 125.63 457.13 125.63C459.91 125.63 463.64 126.76 464.6 129.03C465.55 131.3 466.03 136.15 466.03 143.58C466.03 146.58 466.03 161.58 466.03 188.59C465.74 197.84 465.32 203.21 464.76 204.7ZM406.68 231.21L447.76 231.21C449.47 224.5 450.41 220.77 450.6 220.02C454.32 224.52 458.41 227.9 462.9 230.14C467.37 232.39 474.06 233.51 479.24 233.51C486.45 233.51 492.67 231.62 497.92 227.83C503.16 224.05 506.5 219.57 507.92 214.42C509.34 209.26 510.05 201.42 510.05 190.88C510.05 185.95 510.05 146.53 510.05 141.6C510.05 131 509.81 124.08 509.34 120.83C508.87 117.58 507.47 114.27 505.14 110.88C502.81 107.49 499.42 104.86 494.98 102.98C490.54 101.1 485.3 100.16 479.26 100.16C474.01 100.16 467.29 101.21 462.81 103.28C458.34 105.35 454.28 108.49 450.64 112.7C450.64 108.89 450.64 89.85 450.64 55.56L406.68 55.56L406.68 231.21Z" id="fk968BpsX"></path></defs><g><g><g><use xlink:href="#d1pwhf9wy2" opacity="1" fill="#f6c700" fill-opacity="1"></use><g><use xlink:href="#d1pwhf9wy2" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#g5jjnq26yS" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#g5jjnq26yS" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#fk968BpsX" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#fk968BpsX" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g></g></g></svg>
          <span id="imdb" class="rating-numbers">7.9</span>
        </div>
        <div class="RT-rating">

        <svg id="svg3390" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 138.75 141.25" width="138.75" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
        <metadata id="metadata3396">
         <rdf:RDF>
          <cc:Work rdf:about="">
           <dc:format>image/svg+xml</dc:format>
           <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
           <dc:title/>
          </cc:Work>
         </rdf:RDF>
        </metadata>
        <g id="layer1" fill="#f93208">
         <path id="path3412" d="m20.154 40.829c-28.149 27.622-13.657 61.011-5.734 71.931 35.254 41.954 92.792 25.339 111.89-5.9071 4.7608-8.2027 22.554-53.467-23.976-78.009z"/>
         <path id="path3471" d="m39.613 39.265 4.7778-8.8607 28.406-5.0384 11.119 9.2082z"/>
        </g>
        <g id="layer2">
         <path id="path3437" d="m39.436 8.5696 8.9682-5.2826 6.7569 15.479c3.7925-6.3226 13.79-16.316 24.939-4.6684-4.7281 1.2636-7.5161 3.8553-7.7397 8.4768 15.145-4.1697 31.343 3.2127 33.539 9.0911-10.951-4.314-27.695 10.377-41.771 2.334 0.009 15.045-12.617 16.636-19.902 17.076 2.077-4.996 5.591-9.994 1.474-14.987-7.618 8.171-13.874 10.668-33.17 4.668 4.876-1.679 14.843-11.39 24.448-11.425-6.775-2.467-12.29-2.087-17.814-1.475 2.917-3.961 12.149-15.197 28.625-8.476z" fill="#02902e"/>
        </g>
       </svg>

          <span id="rt" class="rating-numbers">92%</span>
        </div>
        <div class="MC-rating">
          <img src="images/metacritic-logo.png" alt="">
          <span id="meta" class="rating-numbers">80</span>
        </div>
        <div class="Meta-rating"></div>
      </div>

      <div class="streaming-guide">
        <div class="streaming">Streaming Guide</div>
      <a href="https://www.justwatch.com/us/movie/arrival-2016" id="just-watch-link">
        <img src="images/just-watch-logo.png" alt="justwatch">
      </a>
      </div>
    </div>
  </div>
    </li>
  `);
  return $task;
};

const loadTasksByCategory = function () {
  $('.menu-category').click(function () {
    $('#tasks-ul').empty();

    if ($(this).hasClass('all-tasks')) {
      loadTasks();
      $('#header-text').text('All');
    }

    if ($(this).hasClass('incomplete-tasks')) {
      $('#header-text').text('Incomplete');
      loadTasks('incomplete');
    }

    if ($(this).hasClass('completed-tasks')) {
      $('#header-text').text('Completed');
      loadTasks('completed');
    }

    if ($(this).hasClass('watch-tasks')) {
      $('#header-text').text('Watch');
      loadTasks('films');
    }

    if ($(this).hasClass('read-tasks')) {
      $('#header-text').text('Read');
      loadTasks('books');
    }

    if ($(this).hasClass('eat-tasks')) {
      $('#header-text').text('Eat');
      loadTasks('restaurants');
    }

    if ($(this).hasClass('shop-tasks')) {
      $('#header-text').text('Shop');
      loadTasks('products');
    }

    if ($(this).hasClass('others-tasks')) {
      $('#header-text').text('Others');
      loadTasks('others');
    }
  });
};

const deleteTask = (taskID) => {
  $.ajax({
    url: `/tasks/${taskID}/delete`,
    method: 'POST',
    data: { id: taskID, status: status },
  })
    .then(() => {
      console.log('Task deleted successfully');
    })
    .catch((err) => {
      console.log(err);
    });
};
