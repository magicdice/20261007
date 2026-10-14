// 設定畫面上同時存在的氣球總數量
const TOTAL_BALLOONS = 50;

// 定義氣球色彩庫（參考 Coolors 色票）
const PALETTE = [
  '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f',
  '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'
];

// 存放所有氣球物件的陣列
let balloons = [];

// 定義氣球類別，管理單一氣球的狀態、運動與爆破粒子
class Balloon {
  // 建構函式，初始化氣球屬性
  constructor() {
    // 呼叫重設方法，賦予氣球隨機初始值
    this.reset(true);
  }

  // 重設氣球狀態，isInitial 代表是否為遊戲剛開始的生成
  reset(isInitial = false) {
    // 計算螢幕基準尺寸（取寬與高中較小者）
    let baseDim = min(width, height);
    // 設定氣球寬度為畫布基準尺寸的 10% 到 30% 之間
    this.w = random(baseDim * 0.10, baseDim * 0.30);
    // 設定氣球高度（稍微偏橢圓形，高度為寬度的 1.25 倍）
    this.h = this.w * 1.25;
    // 水平位置隨機分佈在畫布寬度範圍內
    this.x = random(this.w * 0.5, width - this.w * 0.5);
    // 垂直位置：若是初次建立則隨機分佈於全螢幕，否則從畫面下方外緣生成
    this.y = isInitial ? random(height) : height + this.h + random(50, 150);
    // 隨機設定垂直上升速度（每幀移動量）
    this.speedY = random(1.2, 2.8);
    // 設定水平擺動的振幅（漂浮擺動寬度）
    this.swingAmp = random(1.5, 4.0);
    // 隨機設定水平擺動的正弦波頻率
    this.swingFreq = random(0.02, 0.04);
    // 隨機角度偏移，避免所有氣球同步左右擺動
    this.swingOffset = random(TWO_PI);
    // 從色盤中隨機抽取一個色碼
    this.baseHex = random(PALETTE);
    // 設定基礎透明度（範圍介於 160 至 230，達到透光感）
    this.baseAlpha = random(160, 230);
    // 用於透明度動態呼吸變化的正弦波相位
    this.alphaPhase = random(TWO_PI);
    // 動態呼吸透明度的頻率
    this.alphaSpeed = random(0.03, 0.06);
    // 隨機決定此氣球在上升過程中引爆的目標 Y 座標高度
    this.popTriggerY = random(height * 0.15, height * 0.85);
    // 標記氣球是否處於爆破狀態
    this.isPopped = false;
    // 儲存爆破後的碎片粒子陣列
    this.particles = [];
  }

  // 更新氣球的物理位置與生命週期
  update() {
    // 若氣球已經爆破，則更新所有噴射粒子
    if (this.isPopped) {
      // 逆向遍歷粒子陣列以便安全移除消失的粒子
      for (let i = this.particles.length - 1; i >= 0; i--) {
        // 更新單一粒子狀態
        this.particles[i].update();
        // 若粒子壽命結束（透明度歸零），則將其從陣列中刪除
        if (this.particles[i].isDead()) {
          // 移除該索引位置的粒子
          this.particles.splice(i, 1);
        }
      }
      // 當所有粒子都完全消失後，在下方重新生成新氣球
      if (this.particles.length === 0) {
        // 重設此氣球狀態為全新氣球
        this.reset(false);
      }
      // 爆破狀態下不執行後續氣球本體的移動邏輯
      return;
    }

    // 氣球向上移動
    this.y -= this.speedY;
    // 利用正弦波產生左右緩慢漂移效果
    this.x += sin(frameCount * this.swingFreq + this.swingOffset) * (this.swingAmp * 0.3);
    // 更新透明度動態變化的相位
    this.alphaPhase += this.alphaSpeed;

    // 當氣球上升穿過設定的爆破高度時，以微小機率觸發隨機爆破
    if (this.y < this.popTriggerY && random() < 0.04) {
      // 觸發爆破函式
      this.explode();
    }

    // 若氣球一路飄移超出螢幕頂部且未引爆，則在畫面下方重生
    if (this.y < -this.h - 100) {
      // 重設氣球位置至下方
      this.reset(false);
    }
  }

  // 觸發氣球爆破效果
  explode() {
    // 將狀態設為已爆破
    this.isPopped = true;
    // 設定爆破噴出的碎片數量（依氣球尺寸決定）
    let particleCount = floor(map(this.w, 40, 250, 16, 32));
    // 產生碎裂粒子
    for (let i = 0; i < particleCount; i++) {
      // 建立並存入新粒子
      this.particles.push(new PopParticle(this.x, this.y, this.baseHex));
    }
  }

  // 繪製氣球及其組件
  display() {
    // 若處於爆破狀態，僅需繪製碎片粒子
    if (this.isPopped) {
      // 逐一繪製每個粒子
      for (let p of this.particles) {
        // 呼叫粒子的顯示函式
        p.display();
      }
      // 提早結束，不繪製氣球本體
      return;
    }

    // 保存當前的繪圖座標系統與樣式設定
    push();
    // 將座標原點平移至氣球當前中心 (x, y)
    translate(this.x, this.y);

    // 計算當前幀的動態動態透明度（在基礎值上下浮動 25）
    let currentAlpha = this.baseAlpha + sin(this.alphaPhase) * 25;
    // 將十六進位色碼轉換為具有動態透明度的 p5.Color 物件
    let balloonColor = color(this.baseHex);
    // 設定該顏色的 Alpha 透明度值
    balloonColor.setAlpha(currentAlpha);

    // --- 1. 繪製氣球下方的棉線 ---
    // 繪製線段前先儲存狀態
    push();
    // 移除填色
    noFill();
    // 設定線條顏色為半透明淡灰色
    stroke(220, 220, 220, currentAlpha * 0.7);
    // 設定綁線的筆畫粗細
    strokeWeight(1.5);
    // 開啟貝茲曲線形狀繪製
    beginShape();
    // 起點位於氣球底部開口結點處
    vertex(0, this.h * 0.5);
    // 計算氣球線擺動的波浪偏移量
    let wave = sin(frameCount * 0.05 + this.swingOffset) * (this.w * 0.15);
    // 使用貝茲曲線畫出自然的飄逸柔和感
    bezierVertex(
      wave, this.h * 0.5 + this.h * 0.25,
      -wave, this.h * 0.5 + this.h * 0.5,
      0, this.h * 0.5 + this.h * 0.75
    );
    // 結束形狀繪製
    endShape();
    // 恢復線段繪製前的繪圖狀態
    pop();

    // --- 2. 繪製氣球本體 ---
    // 嚴格依規範：氣球本體無外框
    noStroke();
    // 填入具備透明度的氣球本體顏色
    fill(balloonColor);
    // 繪製氣球的主體橢圓
    ellipse(0, 0, this.w, this.h);

    // 繪製氣球底部綁繩處的小三角形打結處
    let knotW = this.w * 0.08;
    // 計算打結三角形的高度大小
    let knotH = this.h * 0.05;
    // 繪製倒三角結
    triangle(
      -knotW, this.h * 0.5 + knotH,
      knotW, this.h * 0.5 + knotH,
      0, this.h * 0.5 - 1
    );

    // --- 3. 繪製氣球內部右上方的黃色星星 ---
    // 星星位置相對於氣球中心：右上方
    let starX = this.w * 0.24;
    // 星星 Y 座標位置
    let starY = -this.h * 0.24;
    // 星星外半徑與氣球尺寸成等比例連動（約氣球寬度的 14%）
    let starRadiusOuter = this.w * 0.14;
    // 星星內凹點半徑為外徑的約一半
    let starRadiusInner = starRadiusOuter * 0.48;

    // 保存星星繪製設定
    push();
    // 移動座標系統至星星中心點
    translate(starX, starY);
    // 讓星星隨漂浮產生輕微的自轉動態
    rotate(sin(frameCount * 0.03 + this.swingOffset) * 0.15);
    // 星星無外框
    noStroke();
    // 填入明亮溫暖的黃色，並配合氣球本體動態透明度
    fill(255, 225, 53, currentAlpha * 0.95);
    // 呼叫自定義多角星形繪製函式（5角星）
    drawStar(0, 0, starRadiusInner, starRadiusOuter, 5);
    // 恢復星星繪製前的狀態
    pop();

    // 恢復最外層平移前的畫布狀態
    pop();
  }
}

// 定義氣球爆破碎片的粒子類別
class PopParticle {
  // 建構函式，傳入粒子爆炸原點與母體顏色
  constructor(x, y, hexColor) {
    // 記錄粒子的目前 X 座標
    this.x = x;
    // 記錄粒子的目前 Y 座標
    this.y = y;
    // 隨機發散的爆炸方向角度
    let angle = random(TWO_PI);
    // 隨機爆炸初速度大小
    let speed = random(3, 9);
    // 計算 X 軸速度向量
    this.vx = cos(angle) * speed;
    // 計算 Y 軸速度向量
    this.vy = sin(angle) * speed;
    // 設定粒子半徑大小
    this.size = random(4, 10);
    // 從十六進位色碼生成 p5.Color
    this.col = color(hexColor);
    // 初始透明度設為全滿
    this.alpha = 255;
    // 每幀衰減的透明度數值（決定殘留壽命）
    this.decay = random(6, 12);
    // 微弱的重力加速度效果
    this.gravity = 0.15;
  }

  // 更新單一粒子運動狀態
  update() {
    // X 座標加上水平速度
    this.x += this.vx;
    // Y 座標加上垂直速度
    this.y += this.vy;
    // 空氣阻力讓粒子水平速度逐漸減慢
    this.vx *= 0.96;
    // Y 軸受重力影響逐漸下墜
    this.vy += this.gravity;
    // 透明度逐漸衰減
    this.alpha -= this.decay;
  }

  // 繪製單一粒子
  display() {
    // 保存繪製狀態
    push();
    // 粒子無外框
    noStroke();
    // 賦予粒子漸漸變淡的透明度
    this.col.setAlpha(max(0, this.alpha));
    // 填入粒子色彩
    fill(this.col);
    // 繪製圓形碎片
    circle(this.x, this.y, this.size);
    // 恢復繪製狀態
    pop();
  }

  // 檢查粒子壽命是否已經結束
  isDead() {
    // 當透明度降至 0 以下時視為消失
    return this.alpha <= 0;
  }
}

// 輔助函式：繪製正多角星形
function drawStar(x, y, radius1, radius2, npoints) {
  // 計算每一個頂點的旋轉角度增量
  let angle = TWO_PI / npoints;
  // 半形角度（用於凹角點）
  let halfAngle = angle / 2.0;
  // 開始定義幾何形狀頂點
  beginShape();
  // 依序繞圈產生外凸點與內凹點
  for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) {
    // 計算外頂點 X
    let sx = x + cos(a) * radius2;
    // 計算外頂點 Y
    let sy = y + sin(a) * radius2;
    // 建立頂點
    vertex(sx, sy);
    // 計算內凹點 X
    sx = x + cos(a + halfAngle) * radius1;
    // 計算內凹點 Y
    sy = y + sin(a + halfAngle) * radius1;
    // 建立頂點
    vertex(sx, sy);
  }
  // 閉合多邊形
  endShape(CLOSE);
}

// p5.js 初始化函式，在網頁載入時執行一次
function setup() {
  // 建立填滿視窗的全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 依設定的數量迴圈建立氣球實例
  for (let i = 0; i < TOTAL_BALLOONS; i++) {
    // 將新建立的氣球物件加入至陣列中，以隨機分佈狀態開始
    balloons.push(new Balloon());
  }
}

// p5.js 主循環繪製函式，每幀自動呼叫
function draw() {
  // 繪製深邃的灰深藍色漸層背景色，凸顯繽紛透亮的氣球
  background(24, 30, 42);

  // 遍歷所有氣球以進行物理運算與繪圖渲染
  for (let b of balloons) {
    // 更新氣球位置、透明度變化與爆破判斷
    b.update();
    // 渲染氣球本體、氣球線、內部星星或爆破粒子
    b.display();
  }
}

// p5.js 視窗縮放事件監聽函式，當瀏覽器尺寸改變時自動觸發
function windowResized() {
  // 動態調整畫布尺寸以符合改變後的視窗長寬
  resizeCanvas(windowWidth, windowHeight);
  // 遍歷所有氣球，動態重新依據新畫布比例調整大小，維持 10% ~ 30% 比例
  for (let b of balloons) {
    // 取得當前新畫布的較短邊長
    let baseDim = min(width, height);
    // 重新按比例計算氣球寬度
    b.w = random(baseDim * 0.10, baseDim * 0.30);
    // 同步更新氣球高度
    b.h = b.w * 1.25;
  }
}