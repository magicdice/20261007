// 定義氣球總數量常數
const BALLOON_COUNT = 50;

// 定義指定色盤的 Hex 色碼陣列
const PALETTE = [
  '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f',
  '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'
];

// 宣告全域陣列用於存儲所有氣球實例
let balloons = [];

// 宣告音效資源與控制變數
let bgMusic;
let popSound;
let isSoundEnabled = true;
let soundToggleBtn;

// p5.js 資源預先載入函式
function preload() {
  // 載入背景音樂檔案
  bgMusic = loadSound('assets/mixkit-game-level-music-689.mp3');
  // 載入氣球爆破音效檔案
  popSound = loadSound('assets/balloon-pop-36589.mp3');
}

// p5.js 初始化設定函式
function setup() {
  // 建立填滿視窗大小的全螢幕畫布
  createCanvas(windowWidth, windowHeight);

  // 設定色彩模式為 RGB，範圍 0 至 255
  colorMode(RGB, 255);

  // 設定角度模式為弧度制
  angleMode(RADIANS);

  // 初始化並設定背景音樂循環播放與較高音量
  bgMusic.setLoop(true);
  bgMusic.setVolume(0.5);

  // 設定爆破音效音量為較小聲，避免蓋過背景音樂
  popSound.setVolume(0.15);

  // 建立音效開關 HTML 按鈕
  soundToggleBtn = createButton('🔊 爆破音效：開啟');
  // 設定按鈕樣式與位置
  updateSoundButtonPosition();
  soundToggleBtn.style('padding', '8px 16px');
  soundToggleBtn.style('font-size', '14px');
  soundToggleBtn.style('background', 'rgba(255, 255, 255, 0.85)');
  soundToggleBtn.style('border', '1px solid #ccc');
  soundToggleBtn.style('border-radius', '20px');
  soundToggleBtn.style('cursor', 'pointer');
  soundToggleBtn.style('font-family', 'sans-serif');
  soundToggleBtn.style('box-shadow', '0 2px 6px rgba(0,0,0,0.15)');
  // 綁定按鈕點擊觸發事件
  soundToggleBtn.mousePressed(toggleSound);

  // 產生指定數量的氣球實例並推入陣列中
  for (let i = 0; i < BALLOON_COUNT; i++) {
    balloons.push(new Balloon(true));
  }
}

// p5.js 每幀繪製循環函式
function draw() {
  // 清除背景並填上柔和的淺灰藍色，突顯氣球色彩
  background(242, 245, 248);

  // 遍歷所有氣球以更新狀態並繪製
  for (let i = 0; i < balloons.length; i++) {
    // 更新氣球的物理位置與生命週期
    balloons[i].update();
    // 將氣球繪製於畫布上
    balloons[i].display();
  }
}

// 視窗尺寸改變時的事件監聽函式
function windowResized() {
  // 動態調整畫布尺寸以符合全新視窗大小
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算所有氣球的尺寸以符合畫布比例（10% - 30%）
  for (let i = 0; i < balloons.length; i++) {
    balloons[i].recalculateSize();
  }
  // 重新調整右下角按鈕的位置
  updateSoundButtonPosition();
}

// 輔助函式：更新右下角音效切換按鈕的位置
function updateSoundButtonPosition() {
  // 將按鈕固定在畫布右下角，留有 20px 的邊距
  soundToggleBtn.position(windowWidth - 170, windowHeight - 50);
}

// 輔助函式：切換音效狀態開關
function toggleSound() {
  // 切換布林開關狀態
  isSoundEnabled = !isSoundEnabled;
  // 依據當前狀態更新按鈕文字顯示
  if (isSoundEnabled) {
    soundToggleBtn.html('🔊 爆破音效：開啟');
  } else {
    soundToggleBtn.html('🔇 爆破音效：關閉');
  }
}

// 使用者互動時自動啟動背景音樂（相容瀏覽器自動播放政策）
function mousePressed() {
  // 若背景音樂尚未開始播放，則啟動播放
  if (bgMusic.isLoaded() && !bgMusic.isPlaying()) {
    bgMusic.play();
  }
}

// 繪製五角星星的輔助函式
function drawStar(x, y, radius1, radius2) {
  // 定義五角星頂點角度增量
  let angle = TWO_PI / 5;
  let halfAngle = angle / 2.0;

  // 開始形狀繪製路徑
  beginShape();
  // 迴圈計算並連結構建五角星頂點
  for (let a = 0; a < TWO_PI; a += angle) {
    // 外圈頂點座標計算
    let sx = x + cos(a - HALF_PI) * radius2;
    let sy = y + sin(a - HALF_PI) * radius2;
    vertex(sx, sy);
    // 內圈頂點座標計算
    sx = x + cos(a + halfAngle - HALF_PI) * radius1;
    sy = y + sin(a + halfAngle - HALF_PI) * radius1;
    vertex(sx, sy);
  }
  // 閉合並繪製完成形狀
  endShape(CLOSE);
}

// 氣球物件導向類別定義
class Balloon {
  // 建構子函式，isInitial 用於標記是否為開場初始化
  constructor(isInitial = false) {
    // 隨機選取色盤中的 Hex 色碼
    this.hexColor = random(PALETTE);
    // 隨機設定上升速度（垂直向上因此為負值）
    this.speedY = random(1.2, 2.8);
    // 設定水平擺動的雜訊偏移初始相位
    this.noiseOffsetX = random(1000);
    // 設定透明度動態呼吸變化的正弦初始相位
    this.alphaPhase = random(TWO_PI);
    // 動態計算氣球的基準直徑大小（畫面較小邊長的 10% 至 30%）
    this.sizeRatio = random(0.10, 0.30);
    this.recalculateSize();

    // 氣球水平初始位置隨機分佈在視窗內
    this.x = random(this.width / 2, width - this.width / 2);

    // 依據是否為開場初始化，決定垂直初始位置
    if (isInitial) {
      // 開場均勻散佈在螢幕中，營造動態空間感
      this.y = random(height * 0.1, height + 200);
    } else {
      // 爆破後由畫面底部重新生成
      this.y = height + this.height + random(50, 150);
    }

    // 設定可能引發爆破的垂直目標高度閾值（例如上升到畫面上半部至中段區間）
    this.popThresholdY = random(-50, height * 0.7);

    // 爆破粒子特效系統陣列
    this.isPopping = false;
    this.particles = [];
  }

  // 依照當前視窗動態重新計算氣球幾何尺寸
  recalculateSize() {
    // 取得視窗寬高之較小維度作為計算基礎
    let baseDimension = min(width, height);
    // 寬度設定為基準尺寸乘以隨機比例
    this.width = baseDimension * this.sizeRatio;
    // 高度設定為長寬比約 1.25 的立體橢圓比例
    this.height = this.width * 1.25;
  }

  // 觸發爆破行為函式
  pop() {
    // 標記為爆破中狀態
    this.isPopping = true;

    // 若音效開啟且檔案載入完成，則觸發微小音量的爆破音效
    if (isSoundEnabled && popSound.isLoaded()) {
      popSound.play();
    }

    // 產生碎裂爆破粒子
    let particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
      // 計算分散的速度向量
      let angle = random(TWO_PI);
      let speed = random(2, 7);
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        size: random(this.width * 0.05, this.width * 0.12),
        alpha: 255
      });
    }
  }

  // 重置氣球屬性並置於底部
  reset() {
    // 重新選取顏色
    this.hexColor = random(PALETTE);
    // 重新設定尺寸比例
    this.sizeRatio = random(0.10, 0.30);
    this.recalculateSize();
    // 重新設定位置
    this.x = random(this.width / 2, width - this.width / 2);
    this.y = height + this.height + random(20, 100);
    // 重新設定上升速率與爆破高度閾值
    this.speedY = random(1.2, 2.8);
    this.popThresholdY = random(-50, height * 0.7);
    // 狀態復原
    this.isPopping = false;
    this.particles = [];
  }

  // 更新氣球運動與狀態數據
  update() {
    // 若處於爆破粒子動畫狀態
    if (this.isPopping) {
      let activeCount = 0;
      // 更新所有碎裂粒子的物理狀態
      for (let p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // 模擬重力微幅下墜
        p.alpha -= 8; // 漸漸淡出
        if (p.alpha > 0) activeCount++;
      }
      // 當所有粒子完全淡出消失時，重置並在下方生成新氣球
      if (activeCount === 0) {
        this.reset();
      }
      return;
    }

    // 氣球向上移動
    this.y -= this.speedY;

    // 利用 Perlin Noise 計算水平柔和左右微幅漂移
    let drift = map(noise(this.noiseOffsetX), 0, 1, -1.2, 1.2);
    this.x += drift;
    this.noiseOffsetX += 0.008;

    // 動態調整透明度相位
    this.alphaPhase += 0.04;

    // 隨機爆破機率判定（需上升到閾值高度以上，每幀微小機率觸發，或飛出頂部邊界）
    if (this.y < this.popThresholdY) {
      // 隨機機率觸發爆破，或達到畫面頂部直接破裂
      if (random(1) < 0.007 || this.y < -this.height) {
        this.pop();
      }
    }
  }

  // 繪製氣球元件至畫布
  display() {
    // 若在爆破狀態，繪製彩色擴散粒子
    if (this.isPopping) {
      noStroke();
      let c = color(this.hexColor);
      for (let p of this.particles) {
        fill(red(c), green(c), blue(c), p.alpha);
        circle(p.x, p.y, p.size);
      }
      return;
    }

    // 計算正弦呼吸動態透明度（透明度區間落在約 140 至 235 之間）
    let dynamicAlpha = map(sin(this.alphaPhase), -1, 1, 140, 235);

    // 1. 繪製氣球下方的垂懸細線
    stroke(120, 120, 120, dynamicAlpha * 0.8);
    strokeWeight(1.5);
    noFill();
    let stringLength = this.height * 0.85;
    // 繪製貝茲曲線產生風吹擺動感
    let stringControlX = this.x + sin(this.alphaPhase) * (this.width * 0.15);
    bezier(
      this.x, this.y + this.height * 0.5,
      this.x, this.y + this.height * 0.5 + stringLength * 0.4,
      stringControlX, this.y + this.height * 0.5 + stringLength * 0.7,
      this.x, this.y + this.height * 0.5 + stringLength
    );

    // 2. 繪製氣球本體（嚴格無外框）
    noStroke();
    let balloonColor = color(this.hexColor);
    fill(red(balloonColor), green(balloonColor), blue(balloonColor), dynamicAlpha);

    // 繪製底部小三角打結造型
    let knotSize = this.width * 0.12;
    let knotY = this.y + this.height * 0.5;
    triangle(
      this.x - knotSize * 0.5, knotY + knotSize * 0.8,
      this.x + knotSize * 0.5, knotY + knotSize * 0.8,
      this.x, knotY
    );

    // 繪製氣球主體橢圓
    ellipse(this.x, this.y, this.width, this.height);

    // 3. 繪製氣球內部右上方的黃色星星（尺寸與氣球大小連動並跟隨移動）
    let starOffsetX = this.width * 0.22;
    let starOffsetY = -this.height * 0.20;
    let starOuterRadius = this.width * 0.12;
    let starInnerRadius = starOuterRadius * 0.45;

    // 星星填色為明亮黃色，透明度與氣球呼吸動態同步
    fill(255, 220, 40, dynamicAlpha * 0.95);
    drawStar(this.x + starOffsetX, this.y + starOffsetY, starInnerRadius, starOuterRadius);
  }
}