const openCards = document.getElementById("openCards");
const knownCards = document.getElementById("knownCards");
const resetProgress = document.getElementById("resetProgress");
const levelList = document.getElementById("levelList");

function renderHome() {
  const stats = getStats();
  openCards.textContent = stats.open;
  knownCards.textContent = stats.known;
  levelList.innerHTML = "";

  LEVELS.forEach(level => {
    const cards = getLevelCards(level.id);
    const learned = cards.filter(card => card.stage > MAX_STAGE).length;
    const link = document.createElement("a");
    link.className = `level-button level-${level.id}`;
    link.href = `learn.html?level=${level.id}`;
    link.innerHTML = `
      <span class="level-kanji" lang="ja" aria-hidden="true">${["一", "二", "三", "四"][level.id - 1]}</span>
      <span class="level-number">Level ${level.id}</span>
      <strong>${level.name}</strong>
      <span>${level.description}</span>
      <small>${learned} von ${cards.length} gelernt</small>
    `;
    levelList.appendChild(link);
  });
}

resetProgress.addEventListener("click", () => {
  if (!window.confirm("Möchtest du deinen japanischen Lernstand wirklich zurücksetzen?")) return;
  resetJapaneseProgress();
  renderHome();
});

renderHome();
