const wordList = document.getElementById("wordList");
let overviewAudio = null;

function playOverviewWord(card) {
  if (overviewAudio) {
    overviewAudio.pause();
    overviewAudio.currentTime = 0;
  }

  overviewAudio = new Audio(`assets/audio/${card.id}.wav`);
  overviewAudio.play().catch(() => {});
}

function renderWords() {
  wordList.innerHTML = "";

  LEVELS.forEach(level => {
    const section = document.createElement("section");
    section.className = "word-level";
    const heading = document.createElement("div");
    heading.className = "word-level-head";
    heading.innerHTML = `<small>Level ${level.id}</small><h2>${level.name}</h2>`;
    section.appendChild(heading);

    getLevelCards(level.id).forEach(card => {
      const isLearned = card.stage > MAX_STAGE;
      const row = document.createElement("article");
      row.className = "word-row";

      const words = document.createElement("div");
      words.className = "word-row-words";
      const reading = document.createElement("strong");
      reading.textContent = card.reading;
      const japanese = document.createElement("span");
      japanese.lang = "ja";
      japanese.textContent = card.japanese;
      const german = document.createElement("span");
      german.textContent = card.german;
      words.append(reading, japanese, german);

      const meta = document.createElement("div");
      meta.className = "word-row-meta";
      const statusLabel = document.createElement("small");
      statusLabel.className = `word-status ${isLearned ? "is-learned" : ""}`;
      statusLabel.textContent = isLearned ? "Gelernt" : `Stufe ${card.stage}`;
      const audioButton = document.createElement("button");
      audioButton.className = "word-audio-button";
      audioButton.type = "button";
      audioButton.setAttribute("aria-label", `${card.reading} anhören`);
      audioButton.textContent = "♪";
      audioButton.addEventListener("click", () => playOverviewWord(card));
      meta.append(statusLabel, audioButton);

      row.append(words, meta);
      section.appendChild(row);
    });

    wordList.appendChild(section);
  });
}

renderWords();
