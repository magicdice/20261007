// 定義畫面上欲產生的氣球總數量
const BALLOON_COUNT = 50;

// 定義氣球色彩參考色盤（十六進位色碼字串陣列）
const COLOR_PALETTE = [
  '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f',
  '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'
];

// 宣告儲存所有氣球物件實例的陣列
let balloons = [];

// 定義氣球類別（Balloon）以封裝個別狀態與渲染行為
class Balloon {
  // 建構函式，初始化氣球屬性
  constructor() {
    // 呼叫重設位置與初始屬性方法（初次生成分佈於全螢幕）
    this.reset(true);
  }

  // 重設氣球狀態方法，initial 為 true 代表初次產生，false 代表飄出螢幕後由底部重生
  reset(initial = false) {
    // 隨機選取畫面基準維度（取寬與高的較小值），尺寸介於畫面 10% 至 30% 之間
    this.sizeRatio = random(0.10, 0.30);
    // 根據當前視窗動態計算氣球的實際直徑
    this.diameter = min(width, height) * this.sizeRatio;
    // 氣球橢圓的高度為寬度的 1.25 倍
    this.h = this.diameter * 1.25;
    // 氣球橢圓的寬度
    this.w = this.diameter;
    // 隨機決定氣球水平 X 軸位置
    this.x = random(width);
    // 若為初次生成則隨機散佈於整個畫布，否則從畫面底部外側生成
    this.y = initial ? random(height) : height + this.h;
    // 向上漂浮的速度（大小較大的氣球飄得稍微快一點）
    this.speedY = map(this.sizeRatio, 0.10, 0.30, 0.8, 2.2);
    // 左右擺動的水平位移振幅
    this.swingAmplitude = random(15, 35);
    // 隨機賦予擺動的起始角度相位
    this.swingAngle = random(TWO_PI);
    // 擺動角度隨時間推進的角速度
    this.swingSpeed = random(0.015, 0.035);
    // 隨機選定底色色碼
    this.baseColorHex = random(COLOR_PALETTE);
    // 基礎透明度（範圍 150 至 230，保持輕透層次）
    this.baseAlpha = random(150, 230);
    // 透明度動態震盪的時間相位
    this.alphaPhase = random(TWO_PI);
    // 透明度變化的更新速率
    this.alphaSpeed = random(0.02, 0.05);
    // 氣球下方懸掛繩線的長度（與氣球本體高度成正比）
    this.stringLength = this.h * 1.2;
  }

  // 當視窗縮放時重新計算氣球當前尺寸
  recalculateSize() {
    // 重新計算直徑
    this.diameter = min(width, height) * this.sizeRatio;
    // 重新計算高度
    this.h = this.diameter * 1.25;
    // 重新計算寬度
    this.w = this.diameter;
    // 重新計算繩線長度
    this.stringLength = this.h * 1.2;
  }

  // 更新氣球位置與動態數值
  update() {
    // 氣球縱向向上飄升
    this.y -= this.speedY;
    // 推進左右擺動的角度相位
    this.swingAngle += this.swingSpeed;
    // 推進透明度呼吸動態的相位
    this.alphaPhase += this.alphaSpeed;

    // 若氣球頂端與繩線完全脫離螢幕上方，則從底部重新生成
    if (this.y < -this.h - this.stringLength) {
      // 呼叫 reset 且帶入 false 表示自底部重設
      this.reset(false);
    }
  }

  // 繪製氣球與附屬物件的方法
  display() {
    // 計算水平擺動所產生的即時偏移量
    let swingOffset = sin(this.swingAngle) * this.swingAmplitude;
    // 結合氣球基準 X 與擺動位移得出當前繪製中心 X
    let currentX = this.x + swingOffset;

    // 動態計算目前的透明度（利用正弦波產生 ±25 的平滑浮動）
    let dynamicAlpha = this.baseAlpha + sin(this.alphaPhase) * 25;

    // 儲存當前繪圖矩陣狀態
    push();
    // 將座標原點平移至氣球中心
    translate(currentX, this.y);

    // --- 繪製下方繩線 ---
    // 啟用線條繪製模式
    stroke(80, 80, 80, dynamicAlpha * 0.7);
    // 設定繩線粗細，依氣球大小動態縮放
    strokeWeight(max(1, this.diameter * 0.015));
    // 繩線不填色
    noFill();
    // 繪製從氣球底部出發並自然彎曲的貝茲曲線繩線
    bezier(
      0, this.h * 0.5,
      sin(this.swingAngle) * 12, this.h * 0.5 + this.stringLength * 0.35,
      -sin(this.swingAngle) * 12, this.h * 0.5 + this.stringLength * 0.7,
      0, this.h * 0.5 + this.stringLength
    );

    // --- 繪製氣球本體與束口結（無外框） ---
    // 關閉線條邊框（符合氣球本體無外框要求）
    noStroke();
    // 轉換底色色碼並套用動態調整後的透明度
    let c = color(this.baseColorHex);
    // 設定色彩的 alpha 透明度通道
    c.setAlpha(dynamicAlpha);
    // 套用氣球填色
    fill(c);

    // 繪製氣球下方的三角形束口結
    triangle(
      0, this.h * 0.48,
      -this.w * 0.06, this.h * 0.53,
      this.w * 0.06, this.h * 0.53
    );

    // 繪製氣球本體橢圓形狀
    ellipse(0, 0, this.w, this.h);

    // --- 繪製右上方內部黃色星星圖案 ---
    // 計算星星位於氣球右上方內部的相對中心座標（與氣球寬高連動）
    let starX = this.w * 0.22;
    // 計算星星 Y 軸相對位置
    let starY = -this.h * 0.22;
    // 星星外半徑與氣球直徑成固定比例連動（約為直徑的 14%）
    let starRadiusOut = this.diameter * 0.14;
    // 星星內凹半徑（設定為外徑的一半）
    let starRadiusIn = starRadiusOut * 0.48;

    // 設定星星的亮黃色填色，並隨氣球透明度動態變化
    fill(255, 225, 53, dynamicAlpha);
    // 呼叫五角星繪製函式
    this.drawStar(starX, starY, starRadiusIn, starRadiusOut, 5);

    // 回復先前儲存的繪圖矩陣狀態
    pop();
  }

  // 繪製多角星形幾何頂點的輔助函式
  drawStar(x, y, radius1, radius2, npoints) {
    // 計算每個頂點的角度跨距
    let angle = TWO_PI / npoints;
    // 計算內凹頂點的半角跨距
    let halfAngle = angle / 2.0;
    // 開始自定義形狀
    beginShape();
    // 依序繞行計算各角座標
    for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) {
      // 計算外凸頂點的 X 座標
      let sx = x + cos(a) * radius2;
      // 計算外凸頂點的 Y 座標
      let sy = y + sin(a) * radius2;
      // 標註頂點
      vertex(sx, sy);
      // 計算內凹頂點的 X 座標
      sx = x + cos(a + halfAngle) * radius1;
      // 計算內凹頂點的 Y 座標
      sy = y + sin(a + halfAngle) * radius1;
      // 標註頂點
      vertex(sx, sy);
    }
    // 結束形狀並自動閉合多邊形
    endShape(CLOSE);
  }
}

// p5.js 初始化設定函式
function setup() {
  // 建立填滿瀏覽器視窗的全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 迴圈實例化指定數量的氣球物件並加入陣列
  for (let i = 0; i < BALLOON_COUNT; i++) {
    // 產生一個新的 Balloon 實例並推入陣列
    balloons.push(new Balloon());
  }
}

// p5.js 每幀繪圖迴圈函式
function draw() {
  // 清空畫布背景，填入柔和的深灰藍底色（凸顯各色氣球與星星）
  background(26, 32, 44);

  // 逐一更新並渲染陣列中的每一顆氣球
  for (let b of balloons) {
    // 更新氣球的物理位移、擺動與透明度數值
    b.update();
    // 繪製氣球、繩線與連動星星
    b.display();
  }
}

// 當瀏覽器視窗大小改變時自動觸發的處理函式
function windowResized() {
  // 重新調整畫布尺寸以符合新的視窗大小
  resizeCanvas(windowWidth, windowHeight);
  // 遍歷所有氣球，根據新解析度重算氣球大小
  for (let b of balloons) {
    // 依最新畫布尺寸更新半徑與繩長
    b.recalculateSize();
  }
}