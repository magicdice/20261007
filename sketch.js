// 定義畫布上氣球的最大數量
const BALLOON_COUNT = 50;

// 定義儲存所有氣球物件的陣列
let balloons = [];

// 定義儲存爆破粒子特效的陣列
let particles = [];

// 定義儲存氣球爆破音效的變數
let popSound;

// 定義音效開關狀態變數（預設為開啟 true）
let soundEnabled = true;

// 定義右下角音效切換按鈕的 DOM 元素變數
let soundButton;

// 預先載入外部資源的函式
function preload() {
  // 載入指定的氣球爆破音效檔案
  popSound = loadSound('assets/balloon-pop-36589.mp3');
}

// 根據指定色盤定義的氣球顏色陣列 (Hex 格式)
const PALETTE = [
  '#f94144', // 紅色
  '#f3722c', // 橙紅
  '#f8961e', // 橙色
  '#f9844a', // 珊瑚粉橘
  '#f9c74f', // 暖黃
  '#90be6d', // 草綠
  '#43aa8b', // 碧綠
  '#4d908e', // 灰青
  '#577590', // 墨藍
  '#277da1'  // 湖藍
];

// 初始化設定函式
function setup() {
  // 建立全螢幕畫布，填滿瀏覽器視窗寬度與高度
  createCanvas(windowWidth, windowHeight);
  // 設定角度計算模式為度數 (Degrees)，方便旋轉與三角運算
  angleMode(DEGREES);
  // 建立右下角的音效切換按鈕
  soundButton = createButton('🔊 音效：開啟');
  // 調整按鈕在畫面中的位置
  positionSoundButton();
  // 為按鈕綁定點擊事件回呼函式
  soundButton.mousePressed(toggleSound);
  // 為按鈕套用基礎的美化樣式
  styleSoundButton();

  // 根據設定的數量初始化所有氣球
  for (let i = 0; i < BALLOON_COUNT; i++) {
    // 建立新的氣球物件並隨機分散初始 y 軸高度以避免一次全部湧入
    balloons.push(new Balloon(true));
  }
}

// 畫格更新繪製函式
function draw() {
  // 清除背景並設定帶有漸層感的暗夜藍紫色天空背景
  background(20, 24, 38);

  // 遍歷所有氣球以進行物理運算與繪製
  for (let i = 0; i < balloons.length; i++) {
    // 更新氣球的物理位置與浮動狀態
    balloons[i].update();
    // 將氣球繪製於畫布上
    balloons[i].display();

    // 檢查氣球是否觸發爆破或飛出螢幕頂端
    if (balloons[i].isPopped) {
      // 觸發該氣球的破裂特效並產生殘片粒子
      createPopExplosion(balloons[i].x, balloons[i].y, balloons[i].radius, balloons[i].col);
      // 檢查是否已開啟音效，若開啟則播放音效
      if (soundEnabled && popSound && popSound.isLoaded()) {
        // 播放破裂音效
        popSound.play();
      }
      // 在畫布底部重新生成一個全新的氣球替補該位置
      balloons[i] = new Balloon(false);
    }
  }

  // 倒序遍歷爆破碎片粒子，方便在粒子生命結束時安全刪除
  for (let i = particles.length - 1; i >= 0; i--) {
    // 更新粒子速度與位置
    particles[i].update();
    // 繪製粒子於畫布上
    particles[i].display();
    // 若粒子生命週期結束則從陣列中移除
    if (particles[i].isDead()) {
      // 移除當前索引的粒子
      particles.splice(i, 1);
    }
  }
}

// 當視窗大小發生變更時觸發的自適應重設函式
function windowResized() {
  // 重新調整畫布尺寸為當前視窗的寬與高
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算並定位右下角按鈕位置
  positionSoundButton();
  // 讓所有氣球依照新的視窗尺寸重新調整大小比例
  for (let i = 0; i < balloons.length; i++) {
    // 重新呼叫氣球尺寸自適應函式
    balloons[i].recalculateSize();
  }
}

// 重新定位音效控制按鈕至畫布右下角的函式
function positionSoundButton() {
  // 設定按鈕靠右下對齊，邊距為 20 像素
  soundButton.position(width - 150, height - 60);
}

// 切換音效開啟/關閉狀態的函式
function toggleSound() {
  // 如果使用者尚未與瀏覽器互動導致音訊未啟動，則主動啟動音訊環境
  userStartAudio();
  // 反轉目前音效布林值狀態
  soundEnabled = !soundEnabled;
  // 根據最新狀態更新按鈕文字內容與圖示
  if (soundEnabled) {
    // 音效開啟時的標籤文字
    soundButton.html('🔊 音效：開啟');
    // 開啟時套用明亮的翡翠綠色按鈕背景
    soundButton.style('background-color', 'rgba(67, 170, 139, 0.85)');
  } else {
    // 音效關閉時的標籤文字
    soundButton.html('🔇 音效：關閉');
    // 關閉時套用半透明暗灰背景
    soundButton.style('background-color', 'rgba(87, 117, 144, 0.85)');
  }
}

// 設定按鈕 CSS 樣式的函式
function styleSoundButton() {
  // 設定按鈕背景色彩
  soundButton.style('background-color', 'rgba(67, 170, 139, 0.85)');
  // 設定字體顏色為純白色
  soundButton.style('color', '#ffffff');
  // 移除預設外框
  soundButton.style('border', 'none');
  // 設定圓角半徑
  soundButton.style('border-radius', '20px');
  // 設定內部留白空間
  soundButton.style('padding', '10px 18px');
  // 設定字體大小
  soundButton.style('font-size', '14px');
  // 設定字體粗細
  soundButton.style('font-weight', 'bold');
  // 設定滑鼠游標為手指形狀
  soundButton.style('cursor', 'pointer');
  // 設定陰影增加立體視覺質感
  soundButton.style('box-shadow', '0 4px 10px rgba(0, 0, 0, 0.3)');
  // 設定圖層順序在最上方
  soundButton.style('z-index', '100');
}

// 產生爆破碎片粒子效果的函式
function createPopExplosion(x, y, radius, colorHex) {
  // 隨機產生 20 到 30 個殘片粒子
  const count = int(random(20, 30));
  // 迴圈新增粒子
  for (let i = 0; i < count; i++) {
    // 將新產生的粒子推入全域粒子陣列中
    particles.push(new Particle(x, y, radius, colorHex));
  }
}

// 繪製五角星星幾何形狀的通用工具函式
function drawStar(x, y, radius1, radius2, npoints) {
  // 計算星形內外頂點間的角度差
  let angle = 360 / npoints;
  // 內部凹點的偏移半角
  let halfAngle = angle / 2.0;
  // 開始定義自由形狀
  beginShape();
  // 依照頂點數進行角度迭代繪製
  for (let a = 0; a < 360; a += angle) {
    // 計算外部星尖頂點的 X 座標
    let sx = x + cos(a) * radius2;
    // 計算外部星尖頂點的 Y 座標
    let sy = y + sin(a) * radius2;
    // 標記外頂點
    vertex(sx, sy);
    // 計算內部凹槽頂點的 X 座標
    sx = x + cos(a + halfAngle) * radius1;
    // 計算內部凹槽頂點的 Y 座標
    sy = y + sin(a + halfAngle) * radius1;
    // 標記內頂點
    vertex(sx, sy);
  }
  // 封閉並完成星星繪製
  endShape(CLOSE);
}

// 氣球類別定義
class Balloon {
  // 建構元函式，接收一個是否為初始隨機分布的布林參數
  constructor(isInitial) {
    // 從指定色彩盤中隨機選取氣球顏色
    this.col = random(PALETTE);
    // 隨機指派氣球的水平位置 (X 軸)
    this.x = random(width * 0.05, width * 0.95);
    // 根據是否初次載入，隨機分配 Y 軸高度或直接置於畫布底部下方
    this.y = isInitial ? random(-height * 0.2, height * 1.2) : height + random(50, 200);
    // 隨機產生上升的速度（速度介於 1.2 到 2.8 像素之間）
    this.speedY = random(1.2, 2.8);
    // 設定水平漂浮擾動的隨機雜訊偏移量
    this.noiseOffset = random(1000);
    // 設定透明度動態呼吸擾動的雜訊偏移量
    this.alphaNoiseOffset = random(1000);
    // 標記氣球是否已破裂
    this.isPopped = false;
    // 隨機指派一個會引發自發爆破的高度臨界值 (畫布上中段之間)
    this.popThresholdY = random(height * 0.1, height * 0.7);
    // 根據視窗尺寸動態計算氣球半徑大小 (寬或高中較小值的 10% 到 30%)
    this.recalculateSize();
  }

  // 動態根據目前視窗短邊尺寸計算氣球半徑
  recalculateSize() {
    // 取得當前畫布長寬中較小的一側作為計算基準
    let minDimension = min(width, height);
    // 直徑設為基準邊的 10% 到 30% 之間
    let diameter = minDimension * random(0.10, 0.30);
    // 計算氣球半徑
    this.radius = diameter / 2;
  }

  // 更新氣球的物理位置與隨機爆破機率邏輯
  update() {
    // 氣球以固定速度向上飄升
    this.y -= this.speedY;
    // 藉由 Perlin Noise 產生自然的左右擺動風力效果 (映射至 -1 到 1 像素)
    let sway = map(noise(this.noiseOffset), 0, 1, -1.2, 1.2);
    // 更新 X 軸位置
    this.x += sway;
    // 推進雜訊偏移量時間軸
    this.noiseOffset += 0.01;

    // 當氣球飄升至隨機指定的爆破高度範圍時
    if (this.y < this.popThresholdY) {
      // 每一個畫格有 0.8% 的隨機機率自然觸發破裂
      if (random() < 0.008) {
        // 設定爆破標記為 true
        this.isPopped = true;
      }
    }

    // 若氣球一路平安飄升超出畫布頂端安全區，亦標記為破裂以重新循環
    if (this.y < -this.radius * 2) {
      // 標記重置為 true
      this.isPopped = true;
    }
  }

  // 繪製氣球本體、氣球線與內部連動星星的函式
  display() {
    // 儲存當前變形矩陣與繪圖設定
    push();
    // 移動坐標原點至氣球中心
    translate(this.x, this.y);

    // 藉由 Perlin Noise 動態調節氣球透明度 (透明度介於 160 到 235 之間，形成柔和呼吸感)
    let dynamicAlpha = map(noise(this.alphaNoiseOffset), 0, 1, 160, 235);
    // 推進透明度雜訊偏移量
    this.alphaNoiseOffset += 0.015;

    // 氣球寬度為半徑的兩倍
    let bWidth = this.radius * 2;
    // 氣球高度稍長於寬度（橢圓縱向延伸 1.2 倍比例）
    let bHeight = this.radius * 2.4;

    // --- 1. 繪製氣球下方的懸掛線條 ---
    // 繪製線條前儲存樣式狀態
    push();
    // 移除填色
    noFill();
    // 設定半透明柔和淺灰色線條
    stroke(255, 255, 255, dynamicAlpha * 0.6);
    // 設定細緻的線條寬度
    strokeWeight(1.5);
    // 起點從氣球底部的綁結處出發
    let startY = bHeight * 0.5 + 8;
    // 定義線條長度，與氣球尺寸成正比
    let stringLength = bHeight * 1.1;
    // 運用貝茲曲線模擬隨風自然垂落擺動的棉線
    bezier(
      0, startY, // 線條起點
      sin(frameCount * 2) * 15, startY + stringLength * 0.35, // 第一個控制點
      -cos(frameCount * 2) * 15, startY + stringLength * 0.7, // 第二個控制點
      sin(frameCount * 2) * 8, startY + stringLength // 線條終點
    );
    // 恢復樣式狀態
    pop();

    // --- 2. 繪製氣球底部的封口結 ---
    // 設定封口結外框為無
    noStroke();
    // 轉化 Hex 色彩並帶入當前動態透明度
    let baseColor = color(this.col);
    // 設定透明度
    baseColor.setAlpha(dynamicAlpha);
    // 設定填色為氣球本體顏色
    fill(baseColor);
    // 繪製微型倒三角形作為氣球打結處
    triangle(-6, bHeight * 0.5, 6, bHeight * 0.5, 0, bHeight * 0.5 + 9);

    // --- 3. 繪製氣球本體 (無外框、動態半透明) ---
    // 明確設定本體絕無外框 (滿足規格：氣球本體無外框)
    noStroke();
    // 設定氣球本體填色
    fill(baseColor);
    // 繪製卵型氣球形狀
    ellipse(0, 0, bWidth, bHeight);

    // --- 4. 氣球內部的右上角星星圖案 (黃色，大小與氣球連動) ---
    // 繪製星星前儲存繪圖樣式
    push();
    // 計算星星位於氣球內部的右上角偏移座標 (維持於氣球輪廓內)
    let starX = this.radius * 0.38;
    // 計算星星 Y 軸位置 (向上偏移)
    let starY = -bHeight * 0.22;
    // 星星的外半徑與氣球半徑成等比例 (約為氣球半徑的 24%)
    let starOuterRadius = this.radius * 0.24;
    // 星星的內凹半徑為外半徑的一半
    let starInnerRadius = starOuterRadius * 0.48;
    // 星星無外框
    noStroke();
    // 設定星星為溫潤的亮黃色，並伴隨氣球透明度連動
    fill(255, 225, 53, dynamicAlpha * 0.95);
    // 移動坐標至右上角星星所在處
    translate(starX, starY);
    // 稍微旋轉星星角度，增添動態輕盈感
    rotate(frameCount * 0.5 + this.radius);
    // 繪製五角星
    drawStar(0, 0, starInnerRadius, starOuterRadius, 5);
    // 恢復星形繪圖狀態
    pop();

    // 恢復原本的坐標系與繪圖設定
    pop();
  }
}

// 氣球破裂飛散粒子類別定義
class Particle {
  // 建構元函式，接收破裂源頭座標、尺寸與主色彩
  constructor(x, y, radius, colorHex) {
    // 設定粒子起始 X 座標
    this.x = x;
    // 設定粒子起始 Y 座標
    this.y = y;
    // 隨機朝 360 度四面八方發射
    let angle = random(360);
    // 根據氣球大小決定爆破初速度強度
    let speed = random(2, map(radius, 20, 150, 4, 10));
    // 依三角函數分解為 X 方向速度
    this.vx = cos(angle) * speed;
    // 依三角函數分解為 Y 方向速度
    this.vy = sin(angle) * speed;
    // 粒子起始透明度 (全滿 255)
    this.lifespan = 255;
    // 透明度遞減衰退速率
    this.decay = random(6, 12);
    // 粒子尺寸隨氣球本體尺寸成正比
    this.size = random(2, radius * 0.12);
    // 繼承氣球的原色
    this.col = color(colorHex);
  }

  // 更新粒子的位移、重力與衰退壽命
  update() {
    // 疊加水平位移
    this.x += this.vx;
    // 疊加垂直位移
    this.y += this.vy;
    // 施加微量重力加速度往下落
    this.vy += 0.12;
    // 空氣阻力使水平擴散趨緩
    this.vx *= 0.96;
    // 扣除壽命透明度
    this.lifespan -= this.decay;
  }

  // 繪製碎片粒子
  display() {
    // 儲存樣式
    push();
    // 碎片無外框
    noStroke();
    // 根據剩餘壽命更新粒子透明度
    this.col.setAlpha(this.lifespan);
    // 設定填色
    fill(this.col);
    // 繪製碎圓片
    circle(this.x, this.y, this.size);
    // 恢復樣式
    pop();
  }

  // 檢查粒子壽命是否已完全耗盡
  isDead() {
    // 若透明度小於等於 0 則回傳 true
    return this.lifespan <= 0;
  }
}