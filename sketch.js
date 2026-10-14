// 定義色盤陣列，色彩取自指定 Coolors 參考色盤
const PALETTE = [
  '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f',
  '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'
];

// 設定畫面上預計產生的氣球總數量
const BALLOON_COUNT = 50;

// 宣告儲存所有氣球物件實例的陣列
let balloons = [];

// 定義 Balloon（氣球）類別，封裝單一氣球的所有屬性與行為
class Balloon {
  // 建構函式：初始化氣球的相對尺寸、位置、顏色與物理動態參數
  constructor() {
    // 隨機決定氣球相對於畫面短邊的比例大小（介於 10% 到 30% 之間）
    this.sizeRatio = random(0.10, 0.30);
    // 依據目前視窗尺寸計算氣球的實際像素寬度
    this.w = min(windowWidth, windowHeight) * this.sizeRatio;
    // 氣球為縱向橢圓，高度設定為寬度的 1.25 倍
    this.h = this.w * 1.25;
    // 隨機生成氣球在視窗水平寬度內的初始 X 座標
    this.x = random(0, windowWidth);
    // 隨機生成氣球在畫面下方向下延伸範圍內的初始 Y 座標，呈現錯落上升感
    this.y = random(windowHeight, windowHeight * 2);
    // 隨機設定垂直上升速率（每影格移動像素）
    this.speedY = random(0.8, 2.2);
    // 隨機決定水平正弦飄動的角速度增量（模擬空氣氣流擾動）
    this.swingSpeed = random(0.015, 0.035);
    // 隨機決定水平飄動的偏移振幅寬度（像素）
    this.swingAmplitude = random(20, 60);
    // 隨機設定水平擺動的初始相位角度
    this.angle = random(TWO_PI);
    // 隨機設定透明度動態呼吸變化的相位角度
    this.alphaAngle = random(TWO_PI);
    // 隨機挑選色盤中的一個 Hex 色碼
    this.hexColor = random(PALETTE);
  }

  // 視窗尺寸改變時更新氣球的實際像素尺寸
  resize() {
    // 根據縮放後的新視窗短邊重新動態計算寬度
    this.w = min(windowWidth, windowHeight) * this.sizeRatio;
    // 根據新寬度等比例更新高度
    this.h = this.w * 1.25;
  }

  // 更新氣球的物理位置與動畫數值狀態
  update() {
    // 依據上升速度累減 Y 座標（讓氣球向上升空）
    this.y -= this.speedY;
    // 累加擺動角度以推動水平正弦擺動
    this.angle += this.swingSpeed;
    // 累加呼吸燈角度以平滑動態變換透明度
    this.alphaAngle += 0.02;

    // 當氣球完全浮出視窗頂部與繩線長度邊界時，重置到底部重新升空
    if (this.y < -this.h - this.h * 1.5) {
      // 將 Y 座標重置到視窗底部之外
      this.y = windowHeight + this.h;
      // 重新在水平寬度內隨機分配一個 X 座標
      this.x = random(0, windowWidth);
    }
  }

  // 繪製氣球實體、高光點、打結處與底部飄動細線
  display() {
    // 計算受正弦波影響後的當前即時水平中心 X 座標
    let currentX = this.x + sin(this.angle) * this.swingAmplitude;
    // 取得當前的即時垂直中心 Y 座標
    let currentY = this.y;
    // 計算氣球繩線的長度（約為氣球高度的 1.3 倍）
    let stringLength = this.h * 1.3;
    // 氣球底部打結點的 Y 座標
    let bottomY = currentY + this.h / 2;

    // --- 繪製氣球下方的線 ---
    // 推入獨立繪圖狀態，避免線段樣式污染全域
    push();
    // 取消線段填色
    noFill();
    // 設定氣球繩線顏色為半透明淡灰色
    stroke(120, 120, 120, 140);
    // 設定繩線線條粗細為 1.5 像素
    strokeWeight(1.5);
    // 開始繪製貝茲曲線形態的飄動細線
    beginShape();
    // 定義繩線起點（氣球底部中心）
    vertex(currentX, bottomY);
    // 使用貝茲曲線控制點繪製出隨風微擺的彎曲繩線
    bezierVertex(
      currentX + sin(this.angle + 1) * 15, bottomY + stringLength * 0.35,
      currentX - sin(this.angle + 2) * 15, bottomY + stringLength * 0.70,
      currentX + sin(this.angle + 3) * 10, bottomY + stringLength
    );
    // 結束繪製繩線路徑
    endShape();
    // 還原繪圖狀態
    pop();

    // --- 繪製氣球本體與打結處 ---
    // 推入獨立繪圖狀態，繪製氣球球體
    push();
    // 依據作業規範嚴格設定氣球本體無外框
    noStroke();
    // 解析色碼為 p5.Color 物件
    let c = color(this.hexColor);
    // 利用正弦函數在 140 至 230 之間動態映射呼吸透明度
    let dynamicAlpha = map(sin(this.alphaAngle), -1, 1, 140, 230);
    // 套用動態計算後的 Alpha 透明度數值至該顏色
    c.setAlpha(dynamicAlpha);
    // 設定填充顏色為該半透明色彩
    fill(c);

    // 繪製氣球底部的三角形小打結節點
    triangle(
      currentX, bottomY,
      currentX - this.w * 0.06, bottomY + this.h * 0.05,
      currentX + this.w * 0.06, bottomY + this.h * 0.05
    );

    // 繪製氣球本體（半透明無外框橢圓形）
    ellipse(currentX, currentY, this.w, this.h);

    // --- 繪製氣球立體高光反射效果 ---
    // 高光透明度隨氣球整體透明度同調變化（約 30% 到 70% 之間）
    let highlightAlpha = map(sin(this.alphaAngle), -1, 1, 80, 180);
    // 設定高光反射層為半透明純白
    fill(255, 255, 255, highlightAlpha);
    // 在氣球左上方繪製白色橢圓高光，增加通透立體光澤
    ellipse(
      currentX - this.w * 0.22,
      currentY - this.h * 0.22,
      this.w * 0.20,
      this.h * 0.28
    );
    // 還原繪圖狀態
    pop();
  }
}

// p5.js 初始化設定函式，於程式載入時執行一次
function setup() {
  // 建立全螢幕自適應畫布，填滿瀏覽器可用視窗寬度與高度
  createCanvas(windowWidth, windowHeight);
  // 依設定的數量循環生成所有氣球物件並加入陣列
  for (let i = 0; i < BALLOON_COUNT; i++) {
    // 建立新氣球實例並推入陣列管理
    balloons.push(new Balloon());
  }
}

// p5.js 主繪製迴圈，每影格（約 60fps）自動循環執行
function draw() {
  // 每影格填繪柔和微米白的背景色，清除前一影格畫面
  background(248, 249, 250);

  // 遍歷所有氣球實例，依序執行狀態更新與繪製
  for (let i = 0; i < balloons.length; i++) {
    // 更新第 i 個氣球的座標位置與透明度狀態
    balloons[i].update();
    // 繪製第 i 個氣球到畫布上
    balloons[i].display();
  }
}

// 監聽瀏覽器視窗大小變更事件，確保畫布始終全螢幕自適應
function windowResized() {
  // 將畫布大小動態調整為目前新的視窗寬高
  resizeCanvas(windowWidth, windowHeight);
  // 遍歷所有氣球以重新計算其相對於畫布短邊的實際像素大小
  for (let i = 0; i < balloons.length; i++) {
    // 呼叫單一氣球的尺寸更新方法
    balloons[i].resize();
  }
}