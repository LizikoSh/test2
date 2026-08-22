/*
  4Garmin — простий клієнтський екран входу.
  УВАГА: це захист від випадкового перегляду, а не серверна авторизація.

  Щоб змінити дані входу, відредагуйте лише ці два рядки:
*/
const AUTH_LOGIN = '4garmin';
const AUTH_PASSWORD = 'garmin2026';

(() => {
  const SESSION_KEY = '4garmin_page_access';
  const body = document.body;
  const screen = document.getElementById('authScreen');
  const form = document.getElementById('authForm');
  const loginInput = document.getElementById('authLogin');
  const passwordInput = document.getElementById('authPassword');
  const error = document.getElementById('authError');
  const toggle = document.getElementById('togglePassword');

  function unlock() {
    body.classList.remove('auth-locked');
    body.classList.add('auth-unlocked');
    if (screen) screen.hidden = true;
  }

  function lock() {
    body.classList.add('auth-locked');
    body.classList.remove('auth-unlocked');
    if (screen) screen.hidden = false;
  }

  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      unlock();
    } else {
      lock();
      setTimeout(() => loginInput?.focus(), 60);
    }
  } catch (_) {
    lock();
  }

  toggle?.addEventListener('click', () => {
    const showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    toggle.setAttribute('aria-label', showing ? 'Показати пароль' : 'Сховати пароль');
    toggle.textContent = showing ? 'Показати' : 'Сховати';
    passwordInput.focus();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const login = loginInput.value.trim();
    const password = passwordInput.value;

    if (login === AUTH_LOGIN && password === AUTH_PASSWORD) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) {}
      error.textContent = '';
      form.classList.remove('auth-shake');
      unlock();
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    error.textContent = 'Неправильний логін або пароль.';
    passwordInput.value = '';
    passwordInput.focus();
    form.classList.remove('auth-shake');
    void form.offsetWidth;
    form.classList.add('auth-shake');
  });
})();
