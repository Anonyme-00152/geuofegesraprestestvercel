/* -------------------------
   Points (uniquement rues)
------------------------- */
const cityPoints = {
  paris: [
    {lat:48.853889, lng:2.291351}, {lat:48.856472, lng:2.298883}, {lat:48.858340, lng:2.294520},
    {lat:48.857548, lng:2.303404}, {lat:48.861005, lng:2.335870}, {lat:48.860070, lng:2.341250},
    {lat:48.864270, lng:2.332010}, {lat:48.870450, lng:2.331220}, {lat:48.872740, lng:2.343770},
    {lat:48.883100, lng:2.333800}, {lat:48.888020, lng:2.338650}, {lat:48.887450, lng:2.352830},
    {lat:48.882750, lng:2.370130}, {lat:48.872000, lng:2.370400}, {lat:48.865110, lng:2.363460},
    {lat:48.861310, lng:2.371100}, {lat:48.854210, lng:2.348320}, {lat:48.852110, lng:2.361120},
    {lat:48.848700, lng:2.354800}, {lat:48.841480, lng:2.348110}, {lat:48.840030, lng:2.322410},
    {lat:48.832870, lng:2.315840}, {lat:48.829320, lng:2.344820}, {lat:48.822540, lng:2.362330}
  ],
  strasbourg: [
    {lat:48.583800, lng:7.744930}, {lat:48.583310, lng:7.748320}, {lat:48.581900, lng:7.743180},
    {lat:48.581150, lng:7.746900}, {lat:48.580210, lng:7.749480}, {lat:48.579320, lng:7.750240},
    {lat:48.577970, lng:7.745990}, {lat:48.575450, lng:7.748020}, {lat:48.574630, lng:7.757230},
    {lat:48.573870, lng:7.760580}, {lat:48.578920, lng:7.772100}, {lat:48.587000, lng:7.751500},
    {lat:48.588440, lng:7.741840}, {lat:48.593210, lng:7.748950}, {lat:48.598180, lng:7.759090},
    {lat:48.600420, lng:7.744360}, {lat:48.591210, lng:7.780200}, {lat:48.583650, lng:7.780760},
    {lat:48.570850, lng:7.746120}, {lat:48.567700, lng:7.747230}
  ],
  reichshoffen: [
    {lat:48.938780, lng:7.854920}, {lat:48.939850, lng:7.858590}, {lat:48.941540, lng:7.861430},
    {lat:48.943690, lng:7.865010}, {lat:48.944830, lng:7.871260}, {lat:48.945980, lng:7.875930},
    {lat:48.947300, lng:7.880660}, {lat:48.949200, lng:7.885950}, {lat:48.950770, lng:7.890010},
    {lat:48.951920, lng:7.893030}, {lat:48.953430, lng:7.896210}, {lat:48.954850, lng:7.899230},
    {lat:48.955900, lng:7.902150}, {lat:48.957110, lng:7.905210}, {lat:48.958410, lng:7.908260}
  ],
  lunel: [
    {lat:43.676510, lng:4.135760}, {lat:43.677600, lng:4.138450}, {lat:43.675800, lng:4.130200},
    {lat:43.674620, lng:4.132880}, {lat:43.678260, lng:4.140020}, {lat:43.679400, lng:4.142950},
    {lat:43.680300, lng:4.145210}, {lat:43.682220, lng:4.148340}, {lat:43.684150, lng:4.146970},
    {lat:43.685980, lng:4.143440}, {lat:43.687320, lng:4.140840}, {lat:43.688780, lng:4.138150},
    {lat:43.689910, lng:4.134830}, {lat:43.690540, lng:4.131780}, {lat:43.691800, lng:4.129520},
    {lat:43.693100, lng:4.128020}, {lat:43.694520, lng:4.132620}, {lat:43.693920, lng:4.137550},
    {lat:43.692750, lng:4.141320}, {lat:43.691300, lng:4.144250}
  ]
};

/* Europe sample points */
const europePoints = [
  {lat:51.507350, lng:-0.127758}, {lat:52.520008, lng:13.404954},
  {lat:52.370216, lng:4.895168}, {lat:40.416775, lng:-3.703790},
  {lat:41.902782, lng:12.496366}, {lat:38.722252, lng:-9.139337},
  {lat:50.850346, lng:4.351721}
];

/* Utilitaires */
function randInt(n){ return Math.floor(Math.random()*n) }
function choice(arr){ return arr[randInt(arr.length)] }

/* Haversine distance (km) */
function haversineKm(lat1, lon1, lat2, lon2){
  function toRad(d){ return d * Math.PI/180 }
  const R = 6371;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/* Score function */
function scoreFromDistanceKm(dKm){
  if(isNaN(dKm)) return 0;
  if(dKm <= 0.02) return 5000;
  const maxEffective = 20000;
  const v = Math.log10(1 + dKm) / Math.log10(1 + maxEffective);
  const score = Math.round(5000 * (1 - v));
  return Math.max(0, Math.min(5000, score));
}

/* -------------------------
   Etat du jeu
------------------------- */
let current = { lat:null, lng:null, cityKey:null, mode:'city' };
let map, guessMarker = null, actualMarker = null, line = null;
let placing = false, guessLatLng = null;
let roundsTotal = 5, roundIndex = 0, timerSeconds = 60, timerId = null, timerRunning = false;
let totalScore = 0;

/* ---------- Leaflet init ---------- */
function initMap(){
  map = L.map('map', {attributionControl:false}).setView([48.8566,2.3522], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  map.on('click', function(e){
    if(!placing) return;
    placeGuessMarker(e.latlng);
  });
}

/* Place guess marker */
function placeGuessMarker(latlng){
  guessLatLng = latlng;
  if(guessMarker) guessMarker.setLatLng(latlng);
  else {
    guessMarker = L.marker(latlng, {draggable:true}).addTo(map);
    guessMarker.on('dragend', e => { guessLatLng = e.target.getLatLng() });
  }
}

/* Fit map to both points */
function fitMapToBoth(aLatLng){
  const group = [];
  if(guessLatLng) group.push([guessLatLng.lat, guessLatLng.lng]);
  if(aLatLng) group.push([aLatLng.lat, aLatLng.lng]);
  if(group.length>0) map.fitBounds(group, {padding:[30,30], maxZoom:14});
}

/* Cleanup */
function clearRoundDraw(){
  if(guessMarker){ map.removeLayer(guessMarker); guessMarker = null; guessLatLng = null; }
  if(actualMarker){ map.removeLayer(actualMarker); actualMarker = null; }
  if(line){ map.removeLayer(line); line = null; }
}

/* -------------------------
   Street View iframe
------------------------- */
function setStreetView(lat,lng){
  const iframe = document.getElementById('sv');
  iframe.style.opacity = '0';
  setTimeout(()=>{
    iframe.src = `https://www.google.com/maps?q&layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&output=svembed`;
    iframe.style.opacity = '1';
  }, 260);
}

/* -------------------------
   Game flow
------------------------- */
function resetGame(){
  roundIndex = 0; totalScore = 0;
  document.getElementById('scoreInfo').textContent = totalScore;
  document.getElementById('finalBox').innerHTML = '';
  clearRoundDraw();
  stopTimer();
  updateRoundUI();
}

function startGame(){
  roundsTotal = parseInt(document.getElementById('roundsInput').value) || 5;
  timerSeconds = parseInt(document.getElementById('timerInput').value) || 60;
  document.getElementById('roundScore').textContent = '—';
  resetGame();
  nextRound();
}

function nextRound(){
  clearRoundDraw();
  guessLatLng = null;
  placing = true;
  document.getElementById('distanceInfo').textContent = '—';
  document.getElementById('roundScore').textContent = '—';
  document.getElementById('confirmBtn').disabled = false;
  document.getElementById('placeGuessBtn').disabled = false;
  document.getElementById('revealBtn').disabled = false;
  document.getElementById('skipBtn').disabled = false;

  roundIndex++;
  updateRoundUI();

  const mode = document.getElementById('modeSelect').value;
  current.mode = mode;
  if(mode === 'city'){
    const cityKey = document.getElementById('city-select').value;
    current.cityKey = cityKey;
    const p = choice(cityPoints[cityKey]);
    current.lat = p.lat; current.lng = p.lng;
  } else if(mode === 'france'){
    const cityKey = choice(Object.keys(cityPoints));
    current.cityKey = cityKey;
    const p = choice(cityPoints[cityKey]);
    current.lat = p.lat; current.lng = p.lng;
  } else if(mode === 'europe'){
    const p = choice(europePoints);
    current.cityKey = 'europe';
    current.lat = p.lat; current.lng = p.lng;
  }

  setStreetView(current.lat, current.lng);
  map.setView([current.lat, current.lng], (current.mode === 'europe' ? 6 : 13));
  startTimer(timerSeconds);
  document.getElementById('finalBox').innerHTML = '';
}

/* Submit guess */
function submitGuess(auto=false){
  if(!placing) return;
  placing = false;
  stopTimer();
  document.getElementById('confirmBtn').disabled = true;
  document.getElementById('placeGuessBtn').disabled = true;

  if(!guessLatLng){
    document.getElementById('distanceInfo').textContent = 'Aucune estimation — 0 pts';
    document.getElementById('roundScore').textContent = '0';
    updateScoreAndProceed(0, null);
    return;
  }

  const dKm = haversineKm(current.lat, current.lng, guessLatLng.lat, guessLatLng.lng);
  const pts = scoreFromDistanceKm(dKm);
  document.getElementById('distanceInfo').textContent = dKm.toFixed(2) + ' km';
  document.getElementById('roundScore').textContent = pts;

  actualMarker = L.marker([current.lat, current.lng], {opacity:0.95}).addTo(map);
  line = L.polyline([[guessLatLng.lat, guessLatLng.lng],[current.lat, current.lng]], {color:'#22c1c1', weight:4, opacity:0.9}).addTo(map);
  fitMapToBoth({lat:current.lat, lng:current.lng});

  updateScoreAndProceed(pts, dKm);
}

/* Skip */
function skipRound(){
  placing = false;
  stopTimer();
  clearRoundDraw();
  document.getElementById('distanceInfo').textContent = 'Passée — 0 pts';
  document.getElementById('roundScore').textContent = '0';
  updateScoreAndProceed(0, null);
}

/* Reveal actual */
function revealActual(){
  if(actualMarker) return;
  actualMarker = L.marker([current.lat, current.lng]).addTo(map);
  map.setView([current.lat, current.lng], 14);
}

/* Score update */
function updateScoreAndProceed(pts, dKm){
  totalScore += pts;
  document.getElementById('scoreInfo').textContent = totalScore;

  if(roundIndex >= roundsTotal){
    setTimeout(()=> endGame(), 900);
  } else {
    setTimeout(()=> nextRound(), 900);
  }
}

/* End game + localStorage best */
function endGame(){
  placing = false; stopTimer();
  document.getElementById('finalBox').innerHTML = `<div style="font-weight:700; font-size:16px">Partie terminée — Score final : ${totalScore}</div>
    <div style="margin-top:8px">Vous pouvez rejouer ou changer les paramètres.</div>`;

  saveBest(totalScore);
  showBest();
}

/* Timer */
function startTimer(seconds){
  stopTimer();
  let t = seconds;
  document.getElementById('timer').textContent = t;
  timerRunning = true;
  timerId = setInterval(()=>{
    t--;
    document.getElementById('timer').textContent = t;
    if(t <= 0){
      clearInterval(timerId);
      timerRunning = false;
      submitGuess(true);
    }
  }, 1000);
}

function stopTimer(){
  if(timerId) clearInterval(timerId);
  timerId = null;
  timerRunning = false;
}

/* UI & events */
document.getElementById('startBtn').addEventListener('click', ()=> startGame());
document.getElementById('replayBtn').addEventListener('click', ()=> { resetGame(); showBest(); });
document.getElementById('nextBtnTop').addEventListener('click', ()=> {
  if(roundIndex >= roundsTotal){ resetGame(); startGame(); return; }
  nextRound();
});
document.getElementById('placeGuessBtn').addEventListener('click', ()=> {
  placing = true;
  document.getElementById('finalBox').innerHTML = '<div class="muted">Clique sur la mini-carte pour placer ton estimation ou déplace le marqueur.</div>';
});
document.getElementById('confirmBtn').addEventListener('click', ()=> submitGuess(false));
document.getElementById('skipBtn').addEventListener('click', ()=> skipRound());
document.getElementById('revealBtn').addEventListener('click', ()=> revealActual());
document.getElementById('pauseBtn').addEventListener('click', ()=>{
  if(timerRunning){ stopTimer(); document.getElementById('pauseBtn').textContent = 'Reprendre'; }
  else { startTimer(parseInt(document.getElementById('timer').textContent)||timerSeconds); document.getElementById('pauseBtn').textContent = 'Pause'; }
});

function updateRoundUI(){
  document.getElementById('roundInfo').textContent = `${Math.min(roundIndex+1, roundsTotal)} / ${roundsTotal}`;
  document.getElementById('timer').textContent = timerSeconds;
  document.getElementById('distanceInfo').textContent = '—';
  document.getElementById('roundScore').textContent = '—';
}

/* localStorage best scores */
const BEST_KEY = 'mini_geo_best_score_v1';
function saveBest(score){
  const prev = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
  if(score > prev){
    localStorage.setItem(BEST_KEY, String(score));
    const bestBox = document.getElementById('bestBox');
    bestBox.innerHTML = `<div class="best-badge">Nouveau meilleur : ${score}</div>`;
  }
}
function showBest(){
  const best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
  const bestBox = document.getElementById('bestBox');
  if(best > 0) bestBox.innerHTML = `<div>Meilleur score local : <strong>${best}</strong></div>`;
  else bestBox.innerHTML = `<div>Aucun meilleur score enregistré.</div>`;
}

/* Init */
initMap();
resetGame();
showBest();

/* initial preview SV */
(function initialPreview(){
  const p = choice(cityPoints.paris);
  setStreetView(p.lat, p.lng);
})();

/* Enter key validation */
document.addEventListener('keydown', (e)=> { if(e.key === 'Enter') submitGuess(false); });
map && map.on && map.on('click', ()=> { document.getElementById('confirmBtn').disabled = false });

