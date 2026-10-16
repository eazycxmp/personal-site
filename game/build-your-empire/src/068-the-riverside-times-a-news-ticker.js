// ------------------------------------------------------------------ the Riverside Times: a news ticker
const NEWS = [];
function news(t) { NEWS.unshift(t.replace(/<[^>]+>/g, '')); if (NEWS.length > 10) NEWS.pop(); drawTicker(); }
function drawTicker() {
  const el = $('tickerText'); if (!el) return;
  $('ticker').hidden = true; stage.classList.remove('news');   // the side feed shows the news now
  el.textContent = '📰 THE RIVERSIDE TIMES  •  ' + NEWS.join('  •  ') + '  •  ';
}

