const totalSlides = episodes.length;
let currentEp = 0;

const playerEl = document.getElementById("player");
const playerLabel = document.getElementById("playerLabelText");
const playerTitle = document.getElementById("playerTitle");
const textChips = document.getElementById("textChips");
const photoInput = document.getElementById("photoInput");
const playerPhoto = document.getElementById("playerPhoto");
const playerMedia = document.getElementById("playerMedia");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const epDots = document.getElementById("epDots");

epDots.innerHTML = episodes
  .map(
    (ep, i) =>
      `<button class="ep-dot${i === episodes.length - 1 ? " final" : ""}" onclick="goTo(${i})"></button>`,
  )
  .join("");

// splits an episode's letter text into small chunks so it renders as several
// cute little boxes instead of one big paragraph; the finale (multi-paragraph
// letter) splits on blank lines, the episodes split sentence by sentence
function splitToChunks(text, isFinale) {
  if (isFinale) {
    return text
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g);
  return (sentences || [text]).map((s) => s.trim()).filter(Boolean);
}

function renderTextChips(text, isFinale) {
  textChips.innerHTML = "";
  splitToChunks(text, isFinale).forEach((chunk) => {
    const chip = document.createElement("div");
    chip.className = "text-chip";
    chip.textContent = chunk;
    textChips.appendChild(chip);
  });
}

function syncCardThumb(i) {
  const img = document.getElementById("cardPhoto" + i);
  if (!img) return;
  img.src = episodes[i].photo || episodes[i].defaultPhoto;
  img.classList.add("set");
}
function syncAllCardThumbs() {
  episodes.forEach((ep, i) => syncCardThumb(i));
}

function applyContent() {
  const ep = episodes[currentEp];
  const isFinale = currentEp === episodes.length - 1;
  playerLabel.textContent = "NETFLIX · " + ep.label;
  playerTitle.textContent = ep.title;
  renderTextChips(ep.text, isFinale);
  playerPhoto.src = ep.photo || ep.defaultPhoto;
  prevBtn.disabled = currentEp === 0;
  nextBtn.textContent = isFinale ? "↻ Rewatch" : "Next Episode ▶";
  [...epDots.children].forEach((d, i) =>
    d.classList.toggle("active", i === currentEp),
  );
  playerMedia.classList.toggle("letter-mode", isFinale);
  if (isFinale) {
    startContinuousConfetti();
  } else {
    stopContinuousConfetti();
  }
}

// used for the initial open — content appears together with the player fade-in
function render() {
  applyContent();
}

// used for Previous/Next/dots — gently fades the image and text out, swaps
// the content, then fades it back in
function goTo(i) {
  if (i < 0) return;
  if (i >= episodes.length) {
    i = 0;
  }
  if (i === currentEp) return;
  playerMedia.classList.add("fading");
  setTimeout(() => {
    currentEp = i;
    applyContent();
    requestAnimationFrame(() => playerMedia.classList.remove("fading"));
  }, 420);
}

function openPlayer(startEp) {
  currentEp = typeof startEp === "number" ? startEp : 0;
  playerMedia.classList.remove("fading");
  render();
  playerEl.classList.add("open");
  tryAutoStartMusic();
}
function closePlayer() {
  playerEl.classList.remove("open");
  stopContinuousConfetti();
}

photoInput.addEventListener("change", function (e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    episodes[currentEp].photo = ev.target.result;
    render();
    syncCardThumb(currentEp);
    persistEpisodes();
  };
  reader.readAsDataURL(file);
});
