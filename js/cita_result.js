(function () {
  let s = parseInt(document.body.dataset.sec || 0, 10);
  const el = document.getElementById('cnt');

  const iv = setInterval(() => {
    s = Math.max(0, s - 1);
    el.textContent = s;
    if (s <= 0) {
      clearInterval(iv);
      window.close();
    }
  }, 1000);

  document
    .getElementById('close-now')
    ?.addEventListener('click', () => window.close());
})();
