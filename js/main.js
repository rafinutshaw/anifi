function dismissStartOverlay(){
  const overlay = document.getElementById('startOverlay');
  if(overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
  tryAutoStartMusic();
}
document.body.style.overflow = 'hidden';

const coverPhoto = document.getElementById('coverPhoto');
const coverPhotoInput = document.getElementById('coverPhotoInput');
let coverPhotoData = null;

function renderCover(){
  coverPhoto.src = coverPhotoData || DEFAULT_PHOTO;
}

coverPhotoInput.addEventListener('change', function(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    coverPhotoData = ev.target.result;
    renderCover();
    try{ localStorage.setItem('netflix_bday_cover', coverPhotoData); }catch(err){}
  };
  reader.readAsDataURL(file);
});

try{
  const savedCover = localStorage.getItem('netflix_bday_cover');
  if(savedCover){ coverPhotoData = savedCover; }
}catch(err){}

render();
syncAllCardThumbs();
renderCover();
