// 核心元素获取
const audio = document.createElement('audio');
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

// 音乐数据
const MUSIC_DATA = {
  albums: [
    {
      name: "Instrument 纯音乐",
      songs: [
        {
          title: "Rain Night 雨夜",
          bg: "image/Cover2.png",
          url: "audio/Rain Night.mp3",
          srt: "",
          story: "《Rain Night》创作于雨夜，淅淅沥沥的雨声融入旋律，营造出安静治愈的氛围，适合独处时聆听，抚平内心的烦躁。"
        }
      ]
    },
    {
      name: "POP Song 流行单曲",
      songs: [
        {
          title: "An Other Way 另一条路",
          bg: "image/Cover1.png",
          url: "audio/An Other Way.mp3",
          srt: "lyric/AnOtherWay.srt",
          story: "《An Other Way》讲述人生选择与自我坚持的创作理念，在迷茫时选择不被定义的道路，勇敢做自己，旋律融合流行与电子元素，节奏轻快却饱含力量。"
        }
      ]
    }
  ]
};

// 全局变量
let allSongs = [];
let lyrics = [];
let currentSongIndex = 0;

// 解析SRT歌词文件
function parseSRT(text) {
  const lines = text.trim().split('\n');
  let res = [];
  for(let i = 0; i < lines.length; i++){
    let line = lines[i].trim();
    if(!line.match(/\d{2}:\d{2}:\d{2}/)) continue;
    let timeReg = /(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
    let matchStart = line.match(timeReg);
    if(!matchStart) continue;
    
    // 解析开始时间
    let startTime = Number(matchStart[1])*3600 + Number(matchStart[2])*60 + Number(matchStart[3]) + Number(matchStart[4])/1000;
    let lyric = '';
    
    // 获取歌词内容
    if(i+1 < lines.length) {
      i++;
      while(i < lines.length && lines[i].trim() && !lines[i].trim().match(/\d{2}:\d{2}:\d{2}/)){
        lyric += lines[i].trim() + '\n';
        i++;
      }
      i--; // 回退一步，避免跳过下一个时间戳
    }
    res.push({start: startTime, text: lyric.trim()});
  }
  return res;
}

// 同步歌词显示
function syncLyrics() {
  if(!lyrics.length) return;
  let now = audio.currentTime;
  let showText = "";
  
  for(let i = 0; i < lyrics.length; i++){
    if(now >= lyrics[i].start) {
      showText = lyrics[i].text;
      // 如果下一句存在且当前时间超过下一句开始，就跳过
      if(i+1 < lyrics.length && now >= lyrics[i+1].start) continue;
      break;
    }
  }
  bgLyrics.innerText = showText;
}

// 渲染电脑端专辑列表
function renderDesktopAlbums(){
  albumWrap.innerHTML = '';
  allSongs = []; // 重置歌曲列表
  
  // 遍历专辑
  MUSIC_DATA.albums.forEach(album => {
    // 专辑标题
    let albumTitle = document.createElement('div');
    albumTitle.className = 'album-title';
    albumTitle.textContent = album.name;
    albumWrap.appendChild(albumTitle);
    
    // 歌曲列表
    let songList = document.createElement('div');
    songList.className = 'song-list';
    
    // 遍历歌曲
    album.songs.forEach((song, index) => {
      let songItem = document.createElement('div');
      songItem.className = 'song-item';
      songItem.textContent = song.title;
      songItem.dataset.index = allSongs.length; // 记录歌曲索引
      
      // 点击播放歌曲
      songItem.onclick = () => {
        currentSongIndex = Number(songItem.dataset.index);
        playSong(song);
      };
      
      songList.appendChild(songItem);
      allSongs.push(song); // 加入全局歌曲列表
    });
    
    albumWrap.appendChild(songList);
  });
}

// 播放指定歌曲
async function playSong(song) {
  try {
    // 更新背景图
    songBg.style.backgroundImage = song.bg ? `url(${song.bg})` : `url('image/bg.png')`;
    bgLyrics.innerText = '';
    lyricsText.innerText = song.story || "暂无创作故事";
    
    // 重置歌词
    lyrics = [];
    
    // 加载SRT歌词
    if(song.srt){
      try{
        let response = await fetch(song.srt);
        if(response.ok){
          let srtText = await response.text();
          lyrics = parseSRT(srtText);
        }
      }catch(e){
        console.log("歌词加载失败:", e);
      }
    }
    
    // 加载并播放音频
    audio.src = song.url;
    await audio.load();
    audio.play();
    playBtn.textContent = '⏸';
    
  } catch (error) {
    console.error("播放歌曲失败:", error);
    alert("歌曲播放失败，请检查文件路径！");
  }
}

// 播放/暂停按钮
playBtn.onclick = function(){
  if(audio.paused){
    audio.play();
    playBtn.textContent = '⏸';
  }else{
    audio.pause();
    playBtn.textContent = '▶';
  }
};

// 进度条更新
audio.ontimeupdate = function(){
  if(!audio.duration) return;
  
  // 更新进度条
  progress.value = (audio.currentTime / audio.duration) * 100;
  
  // 更新时间显示
  let curMinutes = Math.floor(audio.currentTime / 60);
  let curSeconds = Math.floor(audio.currentTime % 60);
  let durMinutes = Math.floor(audio.duration / 60);
  let durSeconds = Math.floor(audio.duration % 60);
  
  timeText.textContent = `${String(curMinutes).padStart(2,'0')}:${String(curSeconds).padStart(2,'0')} / ${String(durMinutes).padStart(2,'0')}:${String(durSeconds).padStart(2,'0')}`;
  
  // 同步歌词
  syncLyrics();
};

// 进度条拖动
progress.oninput = function(){
  if(!audio.duration) return;
  let seekTime = (progress.value / 100) * audio.duration;
  audio.currentTime = seekTime;
};

// 音量控制
volume.oninput = function(){
  audio.volume = volume.value / 100;
  volumeText.textContent = `${volume.value}%`;
};

// 下载按钮
downloadBtn.onclick = function(){
  if(!audio.src) {
    alert("请先选择并播放歌曲！");
    return;
  }
  let a = document.createElement('a');
  a.href = audio.src;
  a.download = audio.src.split('/').pop() || "music.mp3";
  a.click();
};

// 上一曲（重置进度）
prevBtn.onclick = () => {
  if(audio.src) {
    audio.currentTime = 0;
    audio.play();
    playBtn.textContent = '⏸';
  }
};

// 下一曲（重置进度）
nextBtn.onclick = () => {
  if(audio.src) {
    audio.currentTime = 0;
    audio.play();
    playBtn.textContent = '⏸';
  }
};

// 播放结束
audio.onended = () => {
  playBtn.textContent = '▶';
  bgLyrics.innerText = '';
};

// 初始化
window.onload = function() {
  // 渲染专辑列表
  renderDesktopAlbums();
  
  // 初始化音量显示
  volumeText.textContent = `${volume.value}%`;
  
  // 初始化背景图
  songBg.style.backgroundImage = "url('image/bg.png')";
  
  // 设置音频音量
  audio.volume = volume.value / 100;
};
