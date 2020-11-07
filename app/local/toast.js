// https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_snackbar

function toast(message, durationMs=1500) {
  const snackbar = document.getElementById("snackbar");
  snackbar.innerText = message;
  snackbar.className = 'show';
  setTimeout(function(){
    snackbar.className = snackbar.className.replace('show', '');
    }, durationMs);
}

window.toast = toast;

export {
  toast,
}
