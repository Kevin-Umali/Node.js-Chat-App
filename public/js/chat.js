const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('input');
const $messageFormBtn = document.querySelector('button');
const $sendLocationBtn = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplates = document.querySelector('#message-template').innerHTML;
const locationTemplates = document.querySelector('#location-template')
  .innerHTML;
const sidebarTemplates = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//Autoscroll
const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = ($messages.scrollTop + visibleHeight) * 2;

  if (
    Math.round(containerHeight - newMessageHeight - 5) <
    Math.round(scrollOffset)
  ) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (data) => {
  //   console.log(message);
  const html = Mustache.render(messageTemplates, {
    message: data.text,
    createdAt: moment(data.createdAt).format('h:mm A'),
    username: data.username,
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (data) => {
  const html = Mustache.render(locationTemplates, {
    url: data.url,
    createdAt: moment(data.createdAt).format('h:mm A'),
    username: data.username,
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', (data) => {
  const html = Mustache.render(sidebarTemplates, {
    room: data.room,
    users: data.users,
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormBtn.setAttribute('disabled', 'disabled');

  const message = e.target.elements.message.value;
  if (message) {
    socket.emit('sendMessage', message, (err) => {
      $messageFormBtn.removeAttribute('disabled');
      $messageFormInput.value = '';
      $messageFormInput.focus();
      if (err) return console.log(err);
    });
  }
});

document.querySelector('#send-location').addEventListener('click', (e) => {
  e.preventDefault();

  if (!navigator.geolocation) {
    return alert("Geolocation isn't not supported by your browser");
  }

  $sendLocationBtn.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (err) => {
        if (err) return console.log(err);

        $sendLocationBtn.removeAttribute('disabled');
        console.log(position.coords.latitude, position.coords.longitude);
      }
    );
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
// socket.on('countUpdated', (count) => {
//   console.log(`The count has been updated ${count}`);
// });

// document.querySelector('#increment').addEventListener('click', (e) => {
//   e.preventDefault();
//   console.log('clicked');
//   socket.emit('increment');
// });
