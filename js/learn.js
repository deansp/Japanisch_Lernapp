const flashcard = document.getElementById("flashcard");
const frontWord = document.getElementById("frontWord");
const frontReading = document.getElementById("frontReading");
const backWord = document.getElementById("backWord");
const backReading = document.getElementById("backReading");
const languageToggle = document.getElementById("languageToggle");
const completion = document.getElementById("completion");
const speakButton = document.getElementById("speakButton");
const slowSpeakButton = document.getElementById("slowSpeakButton");
const wrongButton = document.getElementById("wrongButton");
const correctButton = document.getElementById("correctButton");
const selectedLevel = Math.min(LEVELS.length, Math.max(1, Number(new URLSearchParams(window.location.search).get("level")) || 1));
const level = LEVELS.find(item => item.id === selectedLevel) || LEVELS[0];
document.getElementById("levelName").textContent = level.name;

const SWIPE_DISTANCE = 42;
const SWIPE_VELOCITY = 0.26;
const TAP_DISTANCE = 12;
const MIN_CARD_FONT_SIZE = 11;
let queue = [];
let currentCard = null;
let startX = 0;
let startY = 0;
let startTime = 0;
let dragging = false;
let animating = false;
let currentAudio = null;

function setSpeakingState(isSpeaking) {
  speakButton.classList.toggle("is-speaking", isSpeaking);
  slowSpeakButton.classList.toggle("is-speaking", isSpeaking);
}

function speakJapaneseWord(rate = 1) {
  if (!currentCard) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(`assets/audio/${currentCard.id}.wav`);
  currentAudio.playbackRate = rate;
  currentAudio.preservesPitch = true;
  setSpeakingState(true);
  currentAudio.addEventListener("ended", () => setSpeakingState(false), { once: true });
  currentAudio.addEventListener("error", () => setSpeakingState(false), { once: true });
  currentAudio.play().catch(() => setSpeakingState(false));
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function startsWithJapanese() {
  return languageToggle.checked;
}

function setAnswerControlsEnabled(enabled) {
  wrongButton.disabled = !enabled;
  correctButton.disabled = !enabled;
}

function fitTextToCard(element) {
  const face = element.closest(".card-face");
  if (!face) return;

  const faceStyle = window.getComputedStyle(face);
  const availableWidth = face.clientWidth
    - Number.parseFloat(faceStyle.paddingLeft)
    - Number.parseFloat(faceStyle.paddingRight)
    - 4;

  element.style.fontSize = "";
  element.style.width = `${availableWidth}px`;
  element.style.maxWidth = `${availableWidth}px`;
  let fontSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
  if (!Number.isFinite(fontSize) || availableWidth <= 0) return;

  while (element.scrollWidth > availableWidth && fontSize > MIN_CARD_FONT_SIZE) {
    fontSize -= 1;
    element.style.fontSize = `${fontSize}px`;
  }
}

function fitVisibleCardText() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      [frontWord, frontReading, backWord, backReading].forEach(fitTextToCard);
    });
  });
}

function renderCard() {
  const cards = new Map(getLevelCards(selectedLevel).map(card => [card.id, card]));
  queue = queue.filter(id => cards.has(id));
  currentCard = queue.length ? cards.get(queue[0]) : null;
  flashcard.className = "flashcard";
  flashcard.style.transform = "";

  if (!currentCard) {
    speakButton.disabled = true;
    slowSpeakButton.disabled = true;
    setAnswerControlsEnabled(false);
    completion.hidden = false;
    return;
  }

  speakButton.disabled = false;
  slowSpeakButton.disabled = false;
  setAnswerControlsEnabled(true);
  const japaneseFirst = startsWithJapanese();
  frontWord.textContent = japaneseFirst ? currentCard.japanese : currentCard.german;
  frontReading.textContent = japaneseFirst ? currentCard.reading : "";
  backWord.textContent = japaneseFirst ? currentCard.german : currentCard.japanese;
  backReading.textContent = japaneseFirst ? "" : currentCard.reading;
  flashcard.querySelector(".card-front").classList.toggle("is-japanese", japaneseFirst);
  flashcard.querySelector(".card-back").classList.toggle("is-japanese", !japaneseFirst);
  document.body.dataset.stage = String(Math.min(currentCard.stage, MAX_STAGE));
  fitVisibleCardText();
}

function answer(wasCorrect) {
  if (!currentCard || animating) return;
  animating = true;
  setAnswerControlsEnabled(false);
  if (currentAudio) {
    currentAudio.pause();
    setSpeakingState(false);
  }
  flashcard.style.transform = "";
  flashcard.classList.add(wasCorrect ? "swipe-right" : "swipe-left");

  window.setTimeout(() => {
    const [answeredId, ...rest] = queue;
    updateCardStage(answeredId, wasCorrect);
    queue = wasCorrect ? rest : [...rest, answeredId];
    animating = false;
    renderCard();
  }, 260);
}

flashcard.addEventListener("pointerdown", event => {
  if (!currentCard || animating) return;
  startX = event.clientX;
  startY = event.clientY;
  startTime = Date.now();
  dragging = true;
  flashcard.classList.add("is-dragging");
  flashcard.setPointerCapture?.(event.pointerId);
});

flashcard.addEventListener("pointermove", event => {
  if (!dragging || !currentCard || animating) return;
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  if (Math.abs(deltaX) > Math.abs(deltaY)) event.preventDefault();
  const rotation = Math.max(-12, Math.min(12, deltaX / 16));
  flashcard.style.transform = `translateX(${deltaX * 1.16}px) rotate(${rotation}deg)`;
});

flashcard.addEventListener("pointerup", event => {
  if (!dragging || !currentCard || animating) return;
  dragging = false;
  flashcard.classList.remove("is-dragging");
  flashcard.releasePointerCapture?.(event.pointerId);

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  const velocity = Math.abs(deltaX) / Math.max(1, Date.now() - startTime);
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 0.8;

  if (horizontal && (Math.abs(deltaX) > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY)) {
    answer(deltaX > 0);
    return;
  }

  flashcard.style.transform = "";
  flashcard.classList.add("is-returning");
  if (Math.abs(deltaX) < TAP_DISTANCE && Math.abs(deltaY) < TAP_DISTANCE) {
    flashcard.classList.toggle("is-flipped");
  }
  window.setTimeout(() => flashcard.classList.remove("is-returning"), 180);
});

flashcard.addEventListener("pointercancel", () => {
  dragging = false;
  flashcard.style.transform = "";
  flashcard.classList.remove("is-dragging");
});

languageToggle.addEventListener("change", () => {
  localStorage.setItem(LANGUAGE_KEY, startsWithJapanese() ? "jp" : "de");
  renderCard();
});

window.addEventListener("resize", fitVisibleCardText);
document.fonts?.ready.then(fitVisibleCardText);

speakButton.addEventListener("click", () => speakJapaneseWord(1));
slowSpeakButton.addEventListener("click", () => speakJapaneseWord(0.62));
wrongButton.addEventListener("click", () => answer(false));
correctButton.addEventListener("click", () => answer(true));

languageToggle.checked = localStorage.getItem(LANGUAGE_KEY) !== "de";
queue = shuffle(getLevelCards(selectedLevel).map(card => card.id));
renderCard();
