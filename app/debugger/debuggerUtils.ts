function pickIconByTime() {
  const date = new Date();
  const mm = date.getMinutes();
  const hh = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
    return hh % 2 ? 'cocktail' : 'beer';
  }
  else if (month === 12 && day === 25) {
    return 'tree';
  }
  else if (month === 4 && day === 1) {
    return 'rocket';
  }
  else if ((hh === 4 || hh === 16) && mm === 20) {
    return 'fire';
  }
  else if (hh === 12 && mm === 0) {
    return 'thermometer full';
  }
  else if (hh === 3 && mm > 1 && mm < 15) {
    return 'bug';
  }
  else if (hh === 4) {
    return 'lightbulb';
  }
  else if (hh === 5) {
    return 'sun';
  }
  else if (hh >= 22 || hh < 6) {
    return mm === 28 ? 'moon outline' : 'moon';
  }
  else {
    return 'lab';
  }
}

export {
  pickIconByTime,
}
