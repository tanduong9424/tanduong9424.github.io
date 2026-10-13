const pageBody = document.body;
const pageLangButton = document.getElementById('langBtn');
const pageThemeButton = document.getElementById('themeBtn');

function setPageLanguage(language) {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-vi][data-en]').forEach(element => {
    element.innerHTML = element.dataset[language];
  });
  try {
    localStorage.setItem('lang', language);
  } catch (error) {
    // Storage may be unavailable for local files; the page still works in-session.
  }
}

let pageLanguage = 'vi';
let pageTheme = 'light';
try {
  pageLanguage = localStorage.getItem('lang') || 'vi';
  pageTheme = localStorage.getItem('theme') || 'light';
} catch (error) {
  // Keep the default language and theme when browser storage is unavailable.
}
if (pageTheme === 'dark') pageBody.classList.add('dark');
setPageLanguage(pageLanguage);

pageLangButton.addEventListener('click', () => {
  pageLanguage = pageLanguage === 'vi' ? 'en' : 'vi';
  setPageLanguage(pageLanguage);
});

pageThemeButton.addEventListener('click', () => {
  pageBody.classList.toggle('dark');
  pageTheme = pageBody.classList.contains('dark') ? 'dark' : 'light';
  try {
    localStorage.setItem('theme', pageTheme);
  } catch (error) {
    // Keep the selected theme for this page even when storage is unavailable.
  }
});

document.getElementById('year').textContent = new Date().toLocaleDateString(
  document.documentElement.lang === 'vi' ? 'vi-VN' : 'en-US',
  { month: 'short', day: 'numeric', year: 'numeric' }
);
