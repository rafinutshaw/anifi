const DEFAULT_PHOTO = "photos/cover.jpg";
const cover = "cover.jpg";
const s1 = "s1.jpg";
const s2 = "s2.jpg";
const s3 = "s3.jpg";
const s4 = "s4.jpg";
const bd = "bd.png";
const episodes = [
  {
    label: "S1 · The Descent",
    title: "The Descent",
    text: "The world didn't have you in it yet — and then it did, and everything got a little brighter. This is the story of how a truly special person came to this earth: a small miracle who changed the lives of everyone around her from the very first day. Some people arrive quietly. You arrived like a gift the world didn't know it had been waiting for. 🌍✨",
    defaultPhoto: `photos/${s1}`,
    photo: null,
  },
  {
    label: "S2 · The Glow Up",
    title: "The Glow Up",
    text: "Plot twist: the little girl grew up — and she did NOT come to play. 😎 She built a whole life on her own terms, and made it look easy. These days she's either boarding a flight to somewhere new or curled up halfway through her next book (and already eyeing the one after that). Passport stamps, dog-eared pages, and a story that keeps getting better. Honestly? Iconic. Character development at its finest. 📚✈️✨",
    defaultPhoto: `photos/${s2}`,
    photo: null,
  },
  {
    label: "S3 · Main Character",
    title: "Main Character",
    text: "Let's be honest — the camera was always going to follow you. 🎥 You walk in with an open mind, a big heart, and main character energy that simply cannot be turned off. You're the one quietly looking after everyone you love. Nicest person in the room? Easily. Prettiest smile? Not even a competition. And the best PERSONALITY (pun intended 😏😘). The rest of us are just the supporting cast. ✨💫",
    defaultPhoto: `photos/${s3}`,
    photo: null,
  },
  {
    label: "S4 · Only The Beginning",
    title: "Only The Beginning",
    text: "Spoiler alert: everything so far? Just the pilot episode. 🎬 Sure, there were a few tough scenes along the way — but that's just God's way of preparing His favorite for something even better. The biggest adventures, the best chapters, and the happiest moments are all still in the script. So grab the popcorn, because the rest of your life is going to be the best of your life. Your real story is only getting started. 🌅🙏",
    defaultPhoto: `photos/${s4}`,
    photo: null,
  },
  {
    label: "S5 · Happy Birthday",
    title: "Happy Birthday, Anika! 🎂",
    text: "Hello Hello!\n\nHappy birthday to my favourite person! 🎉 \n\nToday we get to celebrate everything you are — your strength, your kindness, your brilliance, and that smile that lights up every room you walk into. 💫\n\nThank you for being exactly who you are. Thank you for showing up for the people you care about, again and again. May this new year bring you joy and happiness, more laughter than you can count, and every single thing your heart has been hoping for. 🌸\n\nHere's to you, today and always.\n\nWishing you the best!\n 🎂🎈💛",
    defaultPhoto: `photos/${bd}`,
    photo: null,
  },
];

function persistEpisodes() {
  try {
    const slim = episodes.map((ep) => ({ photo: ep.photo }));
    localStorage.setItem("netflix_bday_episodes", JSON.stringify(slim));
  } catch (err) {}
}

try {
  const saved = localStorage.getItem("netflix_bday_episodes");
  if (saved) {
    const parsed = JSON.parse(saved);
    parsed.forEach((ep, i) => {
      // only photos are restored; titles and text always come from this file
      if (episodes[i] && ep.photo) episodes[i].photo = ep.photo;
    });
  }
} catch (err) {}
