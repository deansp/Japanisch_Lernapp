const flashcard = document.getElementById("flashcard");
const cardShell = document.querySelector(".card-shell");
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
const requestedLevel = Number(new URLSearchParams(window.location.search).get("level"));
const level = LEVELS.find(item => item.id === requestedLevel) || LEVELS[0];
const selectedLevel = level.id;
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
let activePointer = null;

function cancelDrag() {
  dragging = false;
  activePointer = null;
  cardShell.style.transform = "";
  cardShell.classList.remove("is-dragging", "pull-left", "pull-right");
}

function setSpeakingState(isSpeaking) {
  speakButton.classList.toggle("is-speaking", isSpeaking);
  slowSpeakButton.classList.toggle("is-speaking", isSpeaking);
}

function speakJapaneseWord(rate = 1) {
  if (!currentCard || animating) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(`assets/audio/${currentCard.id}.wav`);
  currentAudio.playbackRate = rate;
  currentAudio.preservesPitch = true;
  setSpeakingState(true);
  const audio = currentAudio;
  const finish = () => { if (currentAudio === audio) setSpeakingState(false); };
  audio.addEventListener("ended", finish, { once: true });
  audio.addEventListener("error", finish, { once: true });
  audio.play().catch(finish);
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
  languageToggle.disabled = !enabled;
  speakButton.disabled = !enabled;
  slowSpeakButton.disabled = !enabled;
}

function fitTextToCard(element) {
  const face = element.closest(".card-face");
  if (!face) return;

  const faceStyle = window.getComputedStyle(face);
  const availableWidth = face.clientWidth
    - Number.parseFloat(faceStyle.paddingLeft)
    - Number.parseFloat(faceStyle.paddingRight)
    - 4;

  if (availableWidth <= 0) return;

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
  cancelDrag();
  const cards = new Map(getLevelCards(selectedLevel).map(card => [card.id, card]));
  queue = queue.filter(id => cards.has(id));
  currentCard = queue.length ? cards.get(queue[0]) : null;
  cardShell.className = "card-shell";
  cardShell.style.transform = "";
  flashcard.className = "flashcard";

  if (!currentCard) {
    speakButton.disabled = true;
    slowSpeakButton.disabled = true;
    setAnswerControlsEnabled(false);
    completion.hidden = false;
    document.querySelector(".study-page").inert = true;
    completion.querySelector("a").focus();
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
  cancelDrag();
  setAnswerControlsEnabled(false);
  if (currentAudio) {
    currentAudio.pause();
    setSpeakingState(false);
  }
  cardShell.style.transform = "";
  cardShell.classList.add(wasCorrect ? "swipe-right" : "swipe-left");

  window.setTimeout(() => {
    const [answeredId, ...rest] = queue;
    updateCardStage(answeredId, wasCorrect);
    queue = wasCorrect ? rest : [...rest, answeredId];
    animating = false;
    renderCard();
  }, 260);
}

flashcard.addEventListener("pointerdown", event => {
  if (!currentCard || animating || dragging || event.isPrimary === false || event.button !== 0) return;
  activePointer = event.pointerId;
  startX = event.clientX;
  startY = event.clientY;
  startTime = Date.now();
  dragging = true;
  cardShell.classList.remove("is-returning");
  cardShell.classList.add("is-dragging");
  flashcard.setPointerCapture?.(event.pointerId);
});

flashcard.addEventListener("pointermove", event => {
  if (!dragging || event.pointerId !== activePointer || !currentCard || animating) return;
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaY) > 16) {
    cancelDrag();
    return;
  }
  if (Math.abs(deltaX) > Math.abs(deltaY)) event.preventDefault();
  const rotation = Math.max(-12, Math.min(12, deltaX / 16));
  cardShell.style.transform = `translateX(${deltaX * 1.16}px) rotate(${rotation}deg)`;
  cardShell.classList.toggle("pull-right", deltaX > 20);
  cardShell.classList.toggle("pull-left", deltaX < -20);
});

flashcard.addEventListener("pointerup", event => {
  if (!dragging || event.pointerId !== activePointer || !currentCard || animating) return;
  dragging = false;
  activePointer = null;
  cardShell.classList.remove("is-dragging", "pull-left", "pull-right");
  if (flashcard.hasPointerCapture?.(event.pointerId)) flashcard.releasePointerCapture(event.pointerId);

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  const velocity = Math.abs(deltaX) / Math.max(1, Date.now() - startTime);
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 0.8;

  if (horizontal && (Math.abs(deltaX) > SWIPE_DISTANCE || (Math.abs(deltaX) >= 24 && velocity > SWIPE_VELOCITY))) {
    answer(deltaX > 0);
    return;
  }

  cardShell.style.transform = "";
  cardShell.classList.add("is-returning");
  if (Math.abs(deltaX) < TAP_DISTANCE && Math.abs(deltaY) < TAP_DISTANCE) {
    flashcard.classList.toggle("is-flipped");
  }
  window.setTimeout(() => cardShell.classList.remove("is-returning"), 180);
});

flashcard.addEventListener("pointercancel", cancelDrag);
flashcard.addEventListener("lostpointercapture", () => { if (dragging) cancelDrag(); });
flashcard.addEventListener("click", event => {
  if (event.detail === 0 && currentCard && !animating) flashcard.classList.toggle("is-flipped");
});
window.addEventListener("pagehide", () => currentAudio?.pause());

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
