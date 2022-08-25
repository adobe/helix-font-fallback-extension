window.cls = 0;
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    // 500 ms input exclusion window
    if (entry.hadRecentInput) cls = 0;
    window.cls += entry.value;
    entry.sources.forEach((source) => {
      if (window.markers !== 'no' && source.node?.style) {
        source.node.style.border = '1px solid red';
      }
    });
    // console.log('CONSOLE - Current CLS value:', cls, entry);
  }
// the buffered flag enables observer to access entries from before the observer creation
}).observe({type: 'layout-shift', buffered: false});

window.setInterval(() => {
  let c = document.querySelector('.cls');

  if (!c) {
    c = document.createElement('div');
    c.className = 'cls';
    c.style.position = 'absolute';
    c.style.top = '50';
    c.style.left = '50';
    c.style['z-index'] = '9999';
    c.style['padding'] = '30px';
    document.body.appendChild(c);
  }

  const displayCLS = Math.round(window.cls * 10000) / 1000;
  if (displayCLS > 0.25) {
    c.style['background-color'] = 'red';
  } else if (displayCLS > 0.1) {
    c.style['background-color'] = 'orange';
  } else {
    c.style['background-color'] = 'lightgreen';
  }

  c.innerHTML = `Current CLS value: ${displayCLS}`;
}, 2000);