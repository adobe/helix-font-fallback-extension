let cls = 0;
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    // 500 ms input exclusion window
    if (entry.hadRecentInput) cls = 0;
    cls += entry.value;
    console.log('CONSOLE - Current CLS value:', cls, entry);
  }
// the buffered flag enables observer to access entries from before the observer creation
}).observe({type: 'layout-shift', buffered: false});

window.setInterval(() => {
  let c = document.querySelector('.cls');
  const displayCLS = Math.round(cls * 10000) / 1000;
  if (!c) {
    c = document.createElement('div');
    c.className = 'cls';
    c.style.position = 'absolute';
    c.style.top = '50';
    c.style.left = '50';
    c.style['z-index'] = '9999';
    if (displayCLS > 0.25) {
      c.style['background-color'] = 'red';
    } else if (displayCLS > 0.1) {
      c.style['background-color'] = 'orange';
    } else {
      c.style['background-color'] = 'lightgreen';
    }
    c.style['padding'] = '30px';
    document.body.appendChild(c);
  }
  c.innerHTML = `Current CLS value: ${displayCLS}`;
}, 2000);