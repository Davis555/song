// ======================== DOM 元素 ========================
const audio = document.getElementById('audio');
const songBg = document.getElementById('songBg');
const bgLyrics = document.getElementById('bgLyrics');
const lyricsText = document.getElementById('lyricsText');
const lyricsBox = document.getElementById('lyricsBox');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progress = document.getElementById('progress');
const timeText = document.getElementById('timeText');
const volume = document.getElementById('volume');
const volumeText = document.getElementById('volumeText');
const downloadBtn = document.getElementById('downloadBtn');
const albumWrap = document.getElementById('albumWrap');
const albumScroll = document.getElementById('albumScroll');
const songListPanel = document.getElementById('songListPanel');

// ======================== 音乐数据 ========================
const MUSIC_DATA = {
  albums: [
    {
      name: "Instrument",
      songs: [
        { title: "Rain Night", bg: "image/Cover2.png", url: "audio/Rain Night.mp3", srt: "", story: "《Rain Night》创作于雨夜，氛围安静治愈。" }
      ]
    },
    {
      name: "POP Song",
      songs: [
        { title: "An Other Way", bg: "image/Cover1.png", url: "audio/An Other Way.mp3", srt: "lyric/AnOtherWay.srt", story: "讲述人生选择与自我坚持的创作理念。" }
      ]
    }
  ]
};

let allSongs = [];
let currentIndex = 0;
let lyrics = [];

// ======================== 工具函数 ========================
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toggleMoPanel(type) {
  document.getElementById(type + 'Panel').classList.toggle('active');
}

// ======================== 歌词解析 ========================
function parseSRT(text) {
  const lines = text.trim().split('\n');
  let res = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line.match(/\d{2}:\d{2}:\d{2}/)) continue;
    let timeReg = /(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
    let match = line.match(timeReg);
    if (!match) continue;
    let startTime = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
    let lyric = '';
    if (i + 1 < lines.length) lyric = lines[++i].trim();
    res.push({ start: startTime, text: lyric });
  }
  return res;
}

function syncLyrics() {
  if (lyrics.length === 0) return;
  let now = audio.currentTime;
  let showText = "";
  for (let i = 0; i < lyrics.length; i++) {
    if (now >= lyrics[i].start) showText = lyrics[i].text;
  }
  bgLyrics.innerText = showText;
}

// ======================== 渲染函数 ========================
// 扁平化歌曲列表
function buildSongList() {
  allSongs = [];
  MUSIC_DATA.albums.forEach(al => al.songs.forEach(s => allSongs.push(s)));
}

// 电脑端专辑渲染
function renderDesktopAlbums() {
  albumWrap.innerHTML = '';
  const titleDom = document.createElement('div');
  titleDom.className = 'album-title';
  titleDom.textContent = 'Album';
  albumWrap.appendChild(titleDom);

  MUSIC_DATA.albums.forEach(al => {
    let wrap = document.createElement('div');
    let albumTitle = document.createElement('div');
    albumTitle.className = 'album-title';
    albumTitle.textContent = al.name;
    wrap.appendChild(albumTitle);

    let listDom = document.createElement('div');
    listDom.className = 'song-list';
    al.songs.forEach(s => {
      let item = document.createElement('div');
      item.className = 'song-item';
      item.textContent = s.title;
      item.onclick = () => playSong(s);
      listDom.appendChild(item);
    });
    wrap.appendChild(listDom);
    albumWrap.appendChild(wrap);
  });
}

// 手机端专辑横向滚动渲染
function renderMobileAlbums() {
  albumScroll.innerHTML = '';
  MUSIC_DATA.albums.forEach((al, idx) => {
    let card = document.createElement('div');
    card.className = 'album-card';
    // 使用专辑第一首歌的封面作为专辑封面，若无则用默认色
    let coverUrl = al.songs[0]?.bg || 'image/default_album.png';
    card.innerHTML = `<img src="${coverUrl}" alt="${al.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM4ODgiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BbGJ1bTwvdGV4dD48L3N2Zz4='">`;
    card.innerHTML += `<span>${al.name}</span>`;
    card.onclick = () => {
      if (al.songs.length > 0) playSong(al.songs[0]);
    };
    albumScroll.appendChild(card);
  });
}

// 手机端歌曲列表渲染
function renderMobileSongs() {
  songListPanel.innerHTML = '';
  allSongs.forEach(s => {
    let item = document.createElement('div');
    item.className = 'song-item';
    item.textContent = s.title;
    item.onclick = () => playSong(s);
    songListPanel.appendChild(item);
  });
}

// ======================== 播放控制 ========================
function playSong(song) {
  const songIndex = allSongs.findIndex(s => s.url === song.url);
  if (songIndex !== -1) currentIndex = songIndex;

  // 更新UI状态
  songBg.style.backgroundImage = `url('${song.bg}')`;
  bgLyrics.innerText = '';
  lyricsText.innerText = song.story || "暂无创作故事";
  
  // 清除并加载歌词
  lyrics = [];
  if (song.srt) {
    fetch(song.srt)
      .then(r => r.text())
      .then(t => { lyrics = parseSRT(t); })
      .catch(e => console.warn("歌词加载失败或无权限:", e));
  }

  // 设置音频并播放
  audio.src = song.url;
  audio.load();
  audio.play().catch(err => console.log("自动播放被浏览器拦截，请手动点击播放:", err));
  playBtn.textContent = '⏸';
  progress.value = 0;
}

function updatePlayBtn(paused) {
  playBtn.textContent = paused ? '▶' : '⏸';
}

// 事件绑定
playBtn.onclick = () => {
  if (audio.paused) { audio.play(); updatePlayBtn(false); }
  else { audio.pause(); updatePlayBtn(true); }
};

prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
  playSong(allSongs[currentIndex]);
};

nextBtn.onclick = () => {
  currentIndex = (currentIndex + 1) % allSongs.length;
  playSong(allSongs[currentIndex]);
};

audio.ontimeupdate = () => {
  if (!audio.duration) return;
  progress.value = (audio.currentTime / audio.duration) * 100;
  timeText.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  syncLyrics();
};

progress.oninput = () => {
  if (!audio.duration) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
};

volume.oninput = () => {
  audio.volume = volume.value / 100;
  volumeText.textContent = volume.value + '%';
};

downloadBtn.onclick = () => {
  if (!audio.src) return;
  let a = document.createElement('a');
  a.href = audio.src;
  a.download = allSongs[currentIndex]?.title + '.mp3' || 'music.mp3';
  a.click();
};

audio.onended = () => updatePlayBtn(true);
audio.onerror = () => console.error("音频加载失败，请检查路径是否正确");

// ======================== 初始化 ========================
function init() {
  buildSongList();
  renderDesktopAlbums();
  renderMobileAlbums();
  renderMobileSongs();
  
  // 默认背景
  songBg.style.backgroundImage = "url('image/bg.png')";
  volumeText.textContent = volume.value + '%';
  
  // 移动端首次交互解锁音频上下文（部分手机浏览器限制）
  document.addEventListener('touchstart', () => {
    if (audio.paused) audio.play().then(() => audio.pause());
  }, { once: true });
}

init();
