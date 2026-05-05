const audio = document.getElementById('audio');
const songBg = document.getElementById('songBg');
const lyricsText = document.getElementById('lyricsText');
const bgLyrics = document.getElementById('bgLyrics');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progress = document.getElementById('progress');
const timeText = document.getElementById('timeText');
const volume = document.getElementById('volume');
const volumeText = document.getElementById('volumeText');
const downloadBtn = document.getElementById('downloadBtn');
const albumWrap = document.getElementById('albumWrap');

// 数据：只加了 logo，其他和你原来一模一样
const MUSIC_DATA = {
  albums: [
    {
      name: "Instrument",
      songs: [
        {
          title: "Rain Night",
          bg: "image/Cover2.png",
          logo: "image/hdj.png",
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
          logo: "image/AnOtherWay_logo.png",
          url: "audio/An Other Way.mp3",
          srt: "lyric/AnOtherWay.srt",
          story: "讲述人生选择与自我坚持的创作理念。"
        }
      ]
    }
  ]
};

let allSongs = [];
let currentIndex = 0;
let lyrics = [];

function parseSRT(text) {
  const lines = text.trim().split('\n');
  let res = [];
  for(let i = 0; i < lines.length; i++){
    let line = lines[i].trim();
    if(!line.match(/\d{2}:\d{2}:\d{2}/)) continue;
    let timeReg = /(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
    let match = line.match(timeReg);
    if(!match) continue;
    let startTime = Number(match[1])*3600 + Number(match[2])*60 + Number(match[3]) + Number(match[4])/1000;
    let lyric = '';
    if(i+1 < lines.length) lyric = lines[++i].trim();
    res.push({start: startTime, text: lyric});
  }
  return res;
}

function syncLyrics() {
  let now = audio.currentTime;
  let showText = "";
  for(let i = 0; i < lyrics.length; i++){
    if(now >= lyrics[i].start){
      showText = lyrics[i].text;
    }
  }
  bgLyrics.innerText = showText;
}

// 渲染歌单（和你原来完全一样，没动）
function renderDesktopAlbums(){
  albumWrap.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'album-title';
  root.textContent = 'Album';
  albumWrap.appendChild(root);

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

// 播放歌曲：加了黑胶切换，别的不动
async function playSong(song) {
  songBg.style.backgroundImage = `url(${song.bg})`;
  bgLyrics.innerText = '';
  lyricsText.innerText = song.story || "暂无创作故事";

  lyrics = [];
  if(song.srt){
    try{
      let r = await fetch(song.srt);
      let t = await r.text();
      lyrics = parseSRT(t);
    }catch(e){
      console.log("歌词加载失败",e);
    }
  }

  audio.src = song.url;
  await audio.load();
  audio.play().catch(err=>console.log(err));
  playBtn.textContent = '⏸';

  // 黑胶切换
  let vinyl = document.getElementById("vinylDisc");
  if(vinyl){
    vinyl.src = song.logo;
    vinyl.classList.add("playing");
  }
}

// 播放/暂停
playBtn.onclick = function(){
  if(audio.paused){
    audio.play();
    playBtn.textContent = '⏸';
    let vinyl = document.getElementById("vinylDisc");
    if(vinyl) vinyl.classList.add("playing");
  }else{
    audio.pause();
    playBtn.textContent = '▶';
    let vinyl = document.getElementById("vinylDisc");
    if(vinyl) vinyl.classList.remove("playing");
  }
};

// 时间更新
audio.ontimeupdate = function(){
  if(!audio.duration) return;
  progress.value = audio.currentTime / audio.duration * 100;
  let curM = Math.floor(audio.currentTime / 60);
  let curS = Math.floor(audio.currentTime % 60);
  let durM = Math.floor(audio.duration / 60);
  let durS = Math.floor(audio.duration % 60);
  timeText.textContent = 
    `${String(curM).padStart(2,'0')}:${String(curS).padStart(2,'0')} / ${String(durM).padStart(2,'0')}:${String(durS).padStart(2,'0')}`;
  syncLyrics();
};

progress.oninput = function(){
  if(!audio.duration) return;
  audio.currentTime = progress.value / 100 * audio.duration;
};

volume.oninput = function(){
  audio.volume = volume.value / 100;
  volumeText.textContent = volume.value + '%';
};

downloadBtn.onclick = function(){
  let a = document.createElement('a');
  a.href = audio.src;
  a.download = "歌曲.mp3";
  a.click();
};

prevBtn.onclick = () => audio.currentTime = 0;
nextBtn.onclick = () => audio.currentTime = 0;

audio.onended = () => {
  playBtn.textContent = '▶';
  let vinyl = document.getElementById("vinylDisc");
  if(vinyl) vinyl.classList.remove("playing");
};

// 初始化：只留一次！
renderDesktopAlbums();
volumeText.textContent = volume.value + '%';
songBg.style.backgroundImage = "url('image/bg.png')";
