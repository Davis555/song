const audio = new Audio();
const songBg = document.getElementById('songBg');
const lyricsText = document.getElementById('lyricsText');
const bgLyrics = document.getElementById('songBgLyrics');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progress = document.getElementById('progress');
const timeText = document.getElementById('timeText');
const volume = document.getElementById('volume');
const volumeText = document.getElementById('volumeText');
const downloadBtn = document.getElementById('downloadBtn');
const albumWrap = document.getElementById('albumWrap');

const MUSIC_DATA = {
  albums: [
    {
      name: "Instrument",
      songs: [
        {
          title: "Rain Night",
          bg: "image/Cover2.png",
          url: "audio/Rain Night.mp3",
          srt: "",
          story: "《Rain Night》创作于雨夜，氛围安静治愈。"
        }
      ]
    },
    {
      name: "POP Song",
      songs: [
        {
          title: "An Other Way",
          bg: "image/Cover1.png",
          url: "audio/An Other Way.mp3",
          srt: "lyric/AnOtherWay.srt",
          story: "讲述人生选择与自我坚持的创作理念。"
        }
      ]
    }
  ]
};

let allSongs = [];
let lyrics = [];

function parseSRT(text) {
  const lines = text.trim().split('\n');
  let res = [];
  for(let i=0;i<lines.length;i++){
    let line = lines[i].trim();
    if(!line.match(/\d{2}:\d{2}:\d{2}/)) continue;
    let timeReg = /(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
    let match = line.match(timeReg);
    if(!match) continue;
    let start = Number(match[1])*3600 + Number(match[2])*60 + Number(match[3]) + Number(match[4])/1000;
    let lyric = '';
    if(i+1<lines.length) lyric = lines[++i].trim();
    res.push({start, text: lyric});
  }
  return res;
}

function syncLyrics() {
  let now = audio.currentTime;
  let txt = "";
  for(let i=0;i<lyrics.length;i++){
    if(now >= lyrics[i].start) txt = lyrics[i].text;
  }
  bgLyrics.innerText = txt;
}

function renderDesktopAlbums(){
  albumWrap.innerHTML = '';
  MUSIC_DATA.albums.forEach(al=>{
    let wrap = document.createElement('div');
    let titleDom = document.createElement('div');
    titleDom.className = 'album-title';
    titleDom.textContent = al.name;
    wrap.appendChild(titleDom);

    let listDom = document.createElement('div');
    listDom.className = 'song-list';

    al.songs.forEach(s=>{
      let item = document.createElement('div');
      item.className = 'song-item';
      item.textContent = s.title;
      item.onclick = ()=>playSong(s);
      listDom.appendChild(item);
      allSongs.push(s);
    });
    wrap.appendChild(listDom);
    albumWrap.appendChild(wrap);
  });
}

async function playSong(song) {
  songBg.style.backgroundImage = `url(${song.bg})`;
  bgLyrics.innerText = '';
  lyricsText.innerText = song.story || '';
  lyrics = [];

  if(song.srt){
    try {
      let r = await fetch(song.srt);
      let t = await r.text();
      lyrics = parseSRT(t);
    } catch(e) {}
  }

  audio.src = song.url;
  await audio.load();
  audio.play();
  playBtn.textContent = '⏸';
}

playBtn.onclick = () => {
  if(audio.paused){
    audio.play();
    playBtn.textContent = '⏸';
  } else {
    audio.pause();
    playBtn.textContent = '▶';
  }
};

audio.ontimeupdate = () => {
  if(!audio.duration) return;
  progress.value = audio.currentTime / audio.duration * 100;
  let cm = Math.floor(audio.currentTime/60), cs = Math.floor(audio.currentTime%60);
  let dm = Math.floor(audio.duration/60), ds = Math.floor(audio.duration%60);
  timeText.textContent = `${String(cm).padStart(2,'0')}:${String(cs).padStart(2,'0')} / ${String(dm).padStart(2,'0')}:${String(ds).padStart(2,'0')}`;
  syncLyrics();
};

progress.oninput = () => {
  if(audio.duration) audio.currentTime = progress.value / 100 * audio.duration;
};

volume.oninput = () => {
  audio.volume = volume.value / 100;
  volumeText.textContent = volume.value + '%';
};

downloadBtn.onclick = () => {
  let a = document.createElement('a');
  a.href = audio.src;
  a.download = "song.mp3";
  a.click();
};

prevBtn.onclick = () => { audio.currentTime = 0; };
nextBtn.onclick = () => { audio.currentTime = 0; };
audio.onended = () => { playBtn.textContent = '▶'; };

renderDesktopAlbums();
volumeText.textContent = volume.value + '%';
songBg.style.backgroundImage = "url('image/bg.png')";
