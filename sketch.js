// 定義畫面上欲產生的氣球總數量
const BALLOON_COUNT = 50;

// 定義指定色盤的十六進位色碼陣列（參考 Coolors 經典色盤）
const COLOR_PALETTE = [
  '#f94144', // 紅橙色
  '#f3722c', // 珊瑚橙
  '#f8961e', // 亮橘黃
  '#f9844a', // 淺杏橙
  '#f9c74f', // 暖日光黃
  '#90be6d', // 開心果綠
  '#43aa8b', // 碧松綠
  '#4d908e', // 灰青綠
  '#577590', // 鋼灰藍
  '#277da1'  // 普魯士湛藍
];

// 宣告用於儲存所有氣球物件結構資料的陣列
let balloons = [];

// 初始化並建構單一氣球的幾何與樣式參數
function createBalloon() {
  // 取得當前畫布寬高中的較小維度作為基準尺寸，確保比例自適應
  const baseDim = min(width, height);
  // 根據基準尺寸計算 10% 至 30% 之間的隨機直徑大小
  const size = random(baseDim * 0.1, baseDim * 0.3);
  // 氣球中心點 X 座標（水平方向隨機分布在畫面邊界內）
  const x = random(size * 0.5, width - size * 0.5);
  // 氣球中心點 Y 座標（垂直方向隨機分布在畫面上半至中下區間）
  const y = random(size * 0.5, height - size * 0.8);
  // 從色盤中隨機選取一個基礎顏色代碼
  const hex = random(COLOR_PALETTE);
  // 建立 p5.Color 色彩物件以利後續讀取 RGB 通道數值
  const baseCol = color(hex);
  // 隨機設定半透明度（Alpha 值介於 120 至 210 之間，使重疊時呈現層次感）
  const alphaVal = random(120, 210);
  // 隨機產生下垂綁繩的自然擺動弧度長度
  const stringLength = random(size * 0.9, size * 1.5);
  // 隨機設定貝茲曲線控制點的水平偏移量，營造繩線微彎垂墜感
  const curveOffset = random(-size * 0.35, size * 0.35);

  // 回傳該氣球的完整資料結構物件
  return {
    x: x,                                   // X 座標
    y: y,                                   // Y 座標
    size: size,                             // 寬度基準大小
    r: red(baseCol),                        // 紅色通道數值
    g: green(baseCol),                      // 綠色通道數值
    b: blue(baseCol),                       // 藍色通道數值
    alpha: alphaVal,                        // 動態透明度
    stringLength: stringLength,             // 繩子總長度
    curveOffset: curveOffset                // 繩子微彎偏移度
  };
}

// 產生所有氣球實例並依據尺寸進行排序（小的在後、大的在前）
function generateBalloons() {
  // 清空既有的氣球資料庫
  balloons = [];
  // 依照設定數量迴圈建構每個氣球
  for (let i = 0; i < BALLOON_COUNT; i++) {
    // 將新建立的氣球結構推入陣列中
    balloons.push(createBalloon());
  }
  // 根據氣球直徑進行由小至大排序，呈現近大遠小的自然層次遮蔽
  balloons.sort((a, b) => a.size - b.size);
}

// 繪製單個氣球本體、綁結與垂掛線
function renderBalloon(b) {
  // 依據氣球基準直徑設定高寬比例（氣球長度稍大於寬度，呈現橢圓形態）
  const w = b.size;
  const h = b.size * 1.18;
  // 計算底部綁結的小三角形頂點 Y 座標
  const knotY = b.y + h * 0.5;
  const knotSize = b.size * 0.08;

  // 1. 繪製氣球下方的繫繩
  stroke(100, 100, 100, b.alpha * 0.75); // 繩子線條顏色帶有適度透明度
  strokeWeight(max(1, b.size * 0.012));   // 繩子粗細隨氣球大小動態等比縮放
  noFill();                              // 繪製線條不填滿封閉區域
  beginShape();                          // 開始構建貝茲平滑曲線路徑
  vertex(b.x, knotY + knotSize * 0.5);   // 繩線起點設置於綁結正下方
  bezierVertex(                          // 利用三次貝茲曲線產生自然微彎垂放效果
    b.x + b.curveOffset, knotY + b.stringLength * 0.35,
    b.x - b.curveOffset * 0.5, knotY + b.stringLength * 0.7,
    b.x + b.curveOffset * 0.3, knotY + b.stringLength
  );
  endShape();                            // 結束繩線幾何路徑繪製

  // 2. 繪製氣球本體（嚴格無外框）
  noStroke();                                    // 取消幾何圖形外框描邊
  fill(b.r, b.g, b.b, b.alpha);                  // 套用獨立隨機色彩與指定透明度
  ellipse(b.x, b.y, w, h);                       // 繪製氣球主體橢圓

  // 3. 繪製氣球底部綁結（小倒三角）
  triangle(
    b.x, knotY,                                  // 三角形上方尖端對準氣球底緣
    b.x - knotSize * 0.5, knotY + knotSize,      // 左下角節點
    b.x + knotSize * 0.5, knotY + knotSize       // 右下角節點
  );

  // 4. 繪製高光反射，增添立體球體光澤感
  fill(255, 255, 255, b.alpha * 0.32);          // 採用淡白色半透明作為高光亮斑
  ellipse(b.x - w * 0.22, b.y - h * 0.22, w * 0.22, h * 0.16); // 在左上方繪製反光亮點
}

// p5.js 初始化設定函式
function setup() {
  // 建立填滿瀏覽器視窗寬度與高度的全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 產生全數氣球幾何與樣式數據
  generateBalloons();
  // 氣球為靜止狀態，關閉 draw 的持續重繪迴圈以優化效能
  noLoop();
}

// p5.js 主要繪圖函式
function draw() {
  // 填補柔和溫潤的象牙白底色以襯托半透明豐富色塊
  background('#f8f9fa');
  // 依序迭代陣列中已排序好的所有氣球並繪製於畫布上
  for (let i = 0; i < balloons.length; i++) {
    // 繪製當前索引的氣球物件
    renderBalloon(balloons[i]);
  }
}

// 瀏覽器視窗縮放事件監聽函式
function windowResized() {
  // 將畫布即時重設為最新的視窗可視寬高
  resizeCanvas(windowWidth, windowHeight);
  // 依據新視窗比例重新計算氣球大小與擺放座標（維持 10% - 30% 螢幕比例）
  generateBalloons();
  // 手動觸發一次繪製更新畫面
  redraw();
}