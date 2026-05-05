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

// 原始正确结构，没乱嵌套
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
let currentIndex = 0;
let lyrics = [];

// 修复版SRT解析，解决歌词时间错位
function parseSRT(text) {
  const lines = text.trim().split('\n');
  let res = [];
  for(let i = 0; i < lines.length; i++){
    let line = lines[i].trim();
    if(!line.match(/\d{2}:\d{2}:\d{2}/)) continue;
    
    // 时间轴正则精准匹配
    let timeReg = /(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
    let match = line.match(timeReg);
    if(!match) continue;

       let startTime = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
    
    // 取下一行作为歌词
    let lyric = '';
    if(i+1 < lines.length) lyric = lines[++i].trim();
    
    res.push({start: startTime, text: lyric});
  }
  return res;
}

// 精准歌词同步，修复错位
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

// 渲染左侧专辑歌单（保持你原来正常逻辑）
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

// 播放歌曲：只加创作故事，不动歌词逻辑
async function playSong(song) {
  songBg.style.backgroundImage = `url(${song.bg})`;
  bgLyrics.innerText = '';
  // 右侧创作背景显示歌曲故事
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
}

// 播放暂停
playBtn.onclick = function(){
  if(audio.paused){
    audio.play();
    playBtn.textContent = '⏸';
  }else{
    audio.pause();
    playBtn.textContent = '▶';
  }
};

// 时间更新 + 歌词同步
audio.ontimeupdate = function(){
  if(!audio.duration) return;
  // 进度条
  progress.value = audio.currentTime / audio.duration * 100;
  // 时间格式化
  let curM = Math.floor(audio.currentTime / 60);
  let curS = Math.floor(audio.currentTime % 60);
  let durM = Math.floor(audio.duration / 60);
  let durS = Math.floor(audio.duration % 60);
  timeText.textContent = 
    `${String(curM).padStart(2,'0')}:${String(curS).padStart(2,'0')} / ${String(durM).padStart(2,'0')}:${String(durS).padStart(2,'0')}`;
  
  // 歌词同步
  syncLyrics();
};

// 拖动进度
progress.oninput = function(){
  if(!audio.duration) return;
  audio.currentTime = progress.value / 100 * audio.duration;
};

// 音量
volume.oninput = function(){
  audio.volume = volume.value / 100;
  volumeText.textContent = volume.value + '%';
};

// 下载
downloadBtn.onclick = function(){
  let a = document.createElement('a');
  a.href = audio.src;
  a.download = "歌曲.mp3";
  a.click();
};

prevBtn.onclick = () => audio.currentTime = 0;
nextBtn.onclick = () => audio.currentTime = 0;
audio.onended = () => playBtn.textContent = '▶';

// 初始化
renderDesktopAlbums();
volumeText.textContent = volume.value + '%';

// 默认显示背景图
songBg.style.backgroundImage = "url('image/bg.png')";

renderDesktopAlbums();
volumeText.textContent = volume.value + '%';
