function pickIconByTime() {
  let icon;
  const date = new Date();
  const mm = date.getMinutes();
  const hh = date.getHours();
  if ((hh === 4 || hh === 16) && mm === 20) {
    icon = 'fire';
  }
  else if (hh === 12 && mm === 0) {
    icon = 'thermometer full';
  }
  else if (hh === 3 && mm > 1 && mm < 15) {
    icon = 'bug';
  }
  else if (hh >= 22 || hh < 6) {
    if (mm === 28) {
      icon = 'moon outline';
    }
    else {
      icon = 'moon';
    }
  }
  else {
    icon = 'lab';
  }

  return icon;
}

export {
  pickIconByTime,
}
