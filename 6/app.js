/**
 * 汽車業務新人實戰挑戰 - 遊戲核心邏輯 (app.js)
 * 包含：隨機洗牌、題目渲染、答題反饋、XP與Combo成就系統、8大能力分析、歪招迷因指數與結果判定
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素引用
  const homeView = document.getElementById('home-view');
  const quizView = document.getElementById('quiz-view');
  const resultView = document.getElementById('result-view');

  const btnStart = document.getElementById('btn-start');
  const btnShowQr = document.getElementById('btn-show-qr');
  const btnNext = document.getElementById('btn-next');
  const btnRestart = document.getElementById('btn-restart');

  const questionCounter = document.getElementById('question-counter');
  const xpBadge = document.getElementById('xp-badge');
  const comboBadge = document.getElementById('combo-badge');
  const progressFill = document.getElementById('progress-fill');

  const tagCategory = document.getElementById('tag-category');
  const tagType = document.getElementById('tag-type');
  const questionText = document.getElementById('question-text');
  const optionsGrid = document.getElementById('options-grid');
  
  const feedbackBox = document.getElementById('feedback-box');
  const feedbackHeader = document.getElementById('feedback-header');
  const explanationText = document.getElementById('explanation-text');

  const toastContainer = document.getElementById('toast-achievement');

  // 結果頁 DOM 元素
  const resultScore = document.getElementById('result-score');
  const resultXp = document.getElementById('result-xp');
  const resultCombo = document.getElementById('result-combo');
  const archetypeIcon = document.getElementById('archetype-icon');
  const archetypeName = document.getElementById('archetype-name');
  const archetypeDesc = document.getElementById('archetype-desc');
  const abilityAnalysisContainer = document.getElementById('ability-analysis-container');
  const commentText = document.getElementById('comment-text');

  const quirkyTitle = document.getElementById('quirky-title');
  const quirkyDesc = document.getElementById('quirky-desc');

  // 遊戲狀態變數
  let currentQuestions = [];
  let currentIndex = 0;
  let score = 0;
  let xp = 0;
  let combo = 0;
  let maxCombo = 0;
  let quirkyCount = 0; // 學生選擇搞笑歪選項的次數
  let categoryStats = {};
  let isAnswered = false;

  const CATEGORY_NAMES = [
    "銷售流程",
    "業務形象與禮儀",
    "銷售工具",
    "客戶接近",
    "需求探詢與口語表達",
    "殺價與異議處理",
    "成交判斷",
    "交車與售後服務"
  ];

  // 1. 初始化遊戲
  btnStart.addEventListener('click', startChallenge);
  if (btnShowQr) {
    btnShowQr.addEventListener('click', () => {
      window.location.href = 'teacher.html';
    });
  }
  btnNext.addEventListener('click', handleNextQuestion);
  btnRestart.addEventListener('click', startChallenge);

  function startChallenge() {
    // 重置數據
    currentIndex = 0;
    score = 0;
    xp = 0;
    combo = 0;
    maxCombo = 0;
    quirkyCount = 0;
    isAnswered = false;

    categoryStats = {};
    CATEGORY_NAMES.forEach(cat => {
      categoryStats[cat] = { correct: 0, total: 0 };
    });

    // 準備並隨機洗牌題目與選項
    currentQuestions = prepareQuestions(window.QUIZ_QUESTIONS);

    // 統計各類別總題數
    currentQuestions.forEach(q => {
      if (categoryStats[q.category]) {
        categoryStats[q.category].total += 1;
      }
    });

    // 切換視圖
    homeView.classList.add('hidden');
    resultView.classList.add('hidden');
    quizView.classList.remove('hidden');

    renderQuestion();
  }

  // 2. Fisher-Yates 隨機洗牌演算法（含題目洗牌與選項同步洗牌）
  function prepareQuestions(rawQuestions) {
    // 複製題目
    const questionsCopy = JSON.parse(JSON.stringify(rawQuestions));
    
    // 洗牌題目順序
    shuffleArray(questionsCopy);

    // 對每題的選項進行洗牌，並同步更新 correct answer index 與 quirky index
    questionsCopy.forEach(q => {
      const originalCorrectOption = q.options[q.answer];
      const originalQuirkyOption = (q.quirkyIndex !== undefined) ? q.options[q.quirkyIndex] : null;

      shuffleArray(q.options);

      q.answer = q.options.indexOf(originalCorrectOption);
      if (originalQuirkyOption) {
        q.quirkyIndex = q.options.indexOf(originalQuirkyOption);
      }
    });

    return questionsCopy;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // 3. 渲染單一題目
  function renderQuestion() {
    isAnswered = false;
    const q = currentQuestions[currentIndex];

    // 更新頂部狀態
    questionCounter.textContent = `第 ${currentIndex + 1} / ${currentQuestions.length} 題`;
    xpBadge.textContent = `✨ ${xp} XP`;
    comboBadge.textContent = `🔥 COMBO × ${combo}`;
    
    const progressPercent = Math.round(((currentIndex) / currentQuestions.length) * 100);
    progressFill.style.width = `${progressPercent}%`;

    // 填寫題目內容
    tagCategory.textContent = getCategoryTagIcon(q.category) + ' ' + q.category;
    tagType.textContent = q.type;
    questionText.textContent = q.question;

    // 清空並生成選項按鈕
    optionsGrid.innerHTML = '';
    const optionKeys = ['A', 'B', 'C', 'D'];

    q.options.forEach((optText, idx) => {
      const optCard = document.createElement('div');
      optCard.className = 'option-card';
      optCard.dataset.index = idx;

      optCard.innerHTML = `
        <div class="option-key">${optionKeys[idx]}</div>
        <div class="option-label">${escapeHtml(optText)}</div>
      `;

      optCard.addEventListener('click', () => selectOption(idx));
      optionsGrid.appendChild(optCard);
    });

    // 隱藏反饋與下一題按鈕
    feedbackBox.classList.add('hidden');
    btnNext.classList.add('hidden');
  }

  function getCategoryTagIcon(cat) {
    const icons = {
      "銷售流程": "🚗",
      "業務形象與禮儀": "👔",
      "銷售工具": "📋",
      "客戶接近": "🤝",
      "需求探詢與口語表達": "🗣️",
      "殺價與異議處理": "💰",
      "成交判斷": "🎯",
      "交車與售後服務": "🔧"
    };
    return icons[cat] || "🚗";
  }

  // 4. 處理答題選擇
  function selectOption(selectedIndex) {
    if (isAnswered) return;
    isAnswered = true;

    const q = currentQuestions[currentIndex];
    const isCorrect = (selectedIndex === q.answer);
    const isQuirky = (selectedIndex === q.quirkyIndex);

    // 累計搞笑歪選項次數
    if (isQuirky) {
      quirkyCount += 1;
    }

    const optionCards = optionsGrid.querySelectorAll('.option-card');

    // 鎖定所有選項卡片
    optionCards.forEach((card, idx) => {
      card.classList.add('disabled');
      if (idx === q.answer) {
        card.classList.add('correct');
      } else if (idx === selectedIndex && !isCorrect) {
        card.classList.add('incorrect');
      }
    });

    // 更新計分與成就
    if (isCorrect) {
      score += 1;
      combo += 1;
      if (combo > maxCombo) maxCombo = combo;
      
      const earnedXP = 100 + (combo * 20);
      xp += earnedXP;

      if (categoryStats[q.category]) {
        categoryStats[q.category].correct += 1;
      }

      // Combo 彈跳動畫與成就提示
      bumpComboBadge();
      checkAchievements(combo);

      feedbackHeader.textContent = "✅ 答對了！經驗值 +" + earnedXP + " XP";
      feedbackHeader.className = "feedback-header correct-text";
      feedbackBox.className = "feedback-box correct-box";
    } else {
      combo = 0;
      if (isQuirky) {
        feedbackHeader.textContent = "🤪 歪招選項被你踩中了！笑死，但不能這樣賣車啦～";
      } else {
        feedbackHeader.textContent = "❌ 答錯了！別灰心，看解析學習～";
      }
      feedbackHeader.className = "feedback-header incorrect-text";
      feedbackBox.className = "feedback-box incorrect-box";
    }

    // 更新頂部 XP / Combo 顯示
    xpBadge.textContent = `✨ ${xp} XP`;
    comboBadge.textContent = `🔥 COMBO × ${combo}`;

    // 顯示解析與下一題按鈕
    explanationText.textContent = q.explanation;
    feedbackBox.classList.remove('hidden');

    if (currentIndex === currentQuestions.length - 1) {
      btnNext.textContent = "🏆 查看挑戰結果 →";
    } else {
      btnNext.textContent = "下一題 →";
    }
    btnNext.classList.remove('hidden');
  }

  function bumpComboBadge() {
    comboBadge.classList.add('bump');
    setTimeout(() => comboBadge.classList.remove('bump'), 300);
  }

  // 成就提示系統
  function checkAchievements(currentCombo) {
    if (currentCombo === 3) {
      showToast("🔥 業務手感來了！連勝 × 3");
    } else if (currentCombo === 5) {
      showToast("⚡ 展間神射手！連勝 × 5");
    } else if (currentCombo === 10) {
      showToast("👑 超級銷售天王！連勝 × 10");
    }
  }

  function showToast(msg) {
    toastContainer.textContent = msg;
    toastContainer.classList.add('show');
    setTimeout(() => {
      toastContainer.classList.remove('show');
    }, 2500);
  }

  // 5. 下一題或進入結果頁
  function handleNextQuestion() {
    if (currentIndex < currentQuestions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      showResult();
    }
  }

  // 6. 計算並顯示結果 View
  function showResult() {
    quizView.classList.add('hidden');
    resultView.classList.remove('hidden');

    showToast("🏆 展間挑戰完成！");

    // 填寫基礎數據
    resultScore.textContent = `${score} / ${currentQuestions.length}`;
    resultXp.textContent = `${xp} XP`;
    resultCombo.textContent = `${maxCombo} 次`;

    // 計算 8 大能力維度百分比
    const categoryPercentages = {};
    CATEGORY_NAMES.forEach(cat => {
      const stats = categoryStats[cat];
      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      categoryPercentages[cat] = pct;
    });

    // 判定業務類型 Archetype
    const archetype = evaluateArchetype(score, currentQuestions.length, categoryPercentages);
    archetypeIcon.textContent = archetype.icon;
    archetypeName.textContent = archetype.name;
    archetypeDesc.textContent = archetype.desc;

    // 評估歪招指數點評 (Quirky Evaluation)
    const quirkyInfo = evaluateQuirkyFeedback(quirkyCount);
    quirkyTitle.textContent = quirkyInfo.title;
    quirkyDesc.textContent = quirkyInfo.desc;

    // 渲染 8 大能力維度進度條
    renderAbilityAnalysis(categoryPercentages);

    // 生成動態業務評語
    commentText.textContent = generateDynamicComment(categoryPercentages, archetype.name);
  }

  // 多維度結果判定 logic
  function evaluateArchetype(totalScore, totalCount, pcts) {
    const overallPct = (totalScore / totalCount) * 100;

    const commScore = (pcts["客戶接近"] + pcts["需求探詢與口語表達"] + pcts["業務形象與禮儀"]) / 3;
    const profScore = (pcts["銷售流程"] + pcts["銷售工具"] + pcts["殺價與異議處理"] + pcts["交車與售後服務"]) / 4;

    // 1. 展間王牌 (整體 >= 85% 且 各類皆 >= 65%)
    const allHigh = Object.values(pcts).every(val => val >= 65);
    if (overallPct >= 85 && allHigh) {
      return {
        icon: "🏆",
        name: "展間王牌",
        desc: "太厲害了！你對汽車銷售流程、職場禮儀、異議處理與顧客溝通都有全方位的精準掌握。你就是展示間最具信賴感的王牌業務！"
      };
    }

    // 2. 溝通高手 (溝通能力群組 >= 75%)
    if (commScore >= 75) {
      return {
        icon: "🗣️",
        name: "溝通高手",
        desc: "你擁有出色的親和力與口語表達天賦！非常懂得降低顧客防備心、探詢真實需求並進行真誠讚美。只要再加強合約細節與成交時機，能力會更加圓滿！"
      };
    }

    // 3. 專業分析派 (專業流程與工具異議群組 >= 75%)
    if (profScore >= 75) {
      return {
        icon: "📋",
        name: "專業分析派",
        desc: "你對銷售流程規範、銷售工具應用、異議處理絕招與交車保固條款瞭若指掌！給予顧客滿滿的專業感與安全感，是顧客心中最靠譜的顧問！"
      };
    }

    // 4. 潛力業務 (整體 >= 60%)
    if (overallPct >= 60) {
      return {
        icon: "🚗",
        name: "潛力業務",
        desc: "你已經掌握了汽車業務的基本觀念與接待禮儀！基礎功底很扎實，只要針對產品介紹細節與成交判斷多加實戰練習，很快就能躍升為頂尖銷售！"
      };
    }

    // 5. 業務新鮮人 (整體 >= 40%)
    if (overallPct >= 40) {
      return {
        icon: "🔰",
        name: "業務新鮮人",
        desc: "你剛踏入汽車銷售的初學者階段，對於展間實戰應對與銷售工具還需要多加磨練。建議再複習課本教材與服務流程，相信你的實力會突飛猛進！"
      };
    }

    // 6. 差點把客人嚇跑 (整體 < 40%)
    return {
      icon: "😂",
      name: "差點把客人嚇跑",
      desc: "哎呀～客人在展間被你神乎其技的回答搞得有點哭笑不得喔！別灰心，汽車業務的溝通藝術本來就需要經驗累積。趕快按下再挑戰一次，這次一定會表現更好！"
    };
  }

  // 歪招迷因評價演算法
  function evaluateQuirkyFeedback(count) {
    if (count === 0) {
      return {
        title: "😇 歪招指數 0% —— 【正襟危坐銷售員】",
        desc: "你的答題態度極度端莊正經，完全沒有被任何搞笑選項誘惑！展間規章與職場禮儀的絕對模範生！"
      };
    } else if (count <= 2) {
      return {
        title: `😎 歪招指數 20% —— 【偶爾開小差】(踩中 ${count} 次歪招)`,
        desc: "整體答題非常靠譜，但腦袋裡偶爾會冒出一些奇特的小鬼點子！展示間就需要你這種帶點幽默感的新人～"
      };
    } else if (count <= 5) {
      return {
        title: `🤡 歪招指數 50% —— 【展間迷因大師】(踩中 ${count} 次歪招)`,
        desc: "你是不是故意選那些搞笑選項的？叫顧客買防彈衣、飛拋名片、拍桌子怒吼...展間有你在絕對天天充滿歡笑！"
      };
    } else {
      return {
        title: `💣 歪招指數 80%+ —— 【展間破壞神 / 歡樂喜劇人】(踩中 ${count} 次歪招)`,
        desc: `太狂了！你居然踩中了 ${count} 次搞笑歪招！客人都懷疑你是不是隔壁敵營派來的喜劇臥底，展間差點被你掀翻啦！`
      };
    }
  }

  // 渲染 8 大能力進度條
  function renderAbilityAnalysis(pcts) {
    abilityAnalysisContainer.innerHTML = '';

    CATEGORY_NAMES.forEach(cat => {
      const pct = pcts[cat];
      const icon = getCategoryTagIcon(cat);

      const row = document.createElement('div');
      row.className = 'ability-row';
      row.innerHTML = `
        <div class="ability-meta">
          <span class="ability-name">${icon} ${cat}</span>
          <span class="ability-score">${pct}%</span>
        </div>
        <div class="ability-bar-track">
          <div class="ability-bar-fill" style="width: 0%;"></div>
        </div>
      `;

      abilityAnalysisContainer.appendChild(row);

      // 動態成長動畫
      setTimeout(() => {
        row.querySelector('.ability-bar-fill').style.width = `${pct}%`;
      }, 100);
    });
  }

  // 生成客製動態評語
  function generateDynamicComment(pcts, archetypeName) {
    // 找出得分最高與最低的類別
    let maxCat = CATEGORY_NAMES[0];
    let minCat = CATEGORY_NAMES[0];

    CATEGORY_NAMES.forEach(cat => {
      if (pcts[cat] > pcts[maxCat]) maxCat = cat;
      if (pcts[cat] < pcts[minCat]) minCat = cat;
    });

    const highestScore = pcts[maxCat];
    const lowestScore = pcts[minCat];

    if (highestScore === lowestScore) {
      return `【導師評語】你在各個銷售維度的表現非常平均（均為 ${highestScore}%）！繼續維持全面均衡的學習態度，你在職場上將無往不利！`;
    }

    return `【導師評語】你在「${maxCat}」領域展現出極強的專業優勢（得分 ${highestScore}%），處理得相當出色！下一步建議針對「${minCat}」（得分 ${lowestScore}%）進行補強練習，你的汽車業務實力將更加全面完整！`;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
