// 💡 Hàm hiển thị Toast Notification chuyên nghiệp thay cho alert()
function showToast(message, type = "error") {
  let container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️";
  toast.innerHTML = `<span style="font-size: 20px;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Tự động tắt sau 3.5s
  setTimeout(() => {
    toast.style.animation = "fadeOutRight 0.4s forwards";
    setTimeout(() => toast.remove(), 400); // Chờ animation chạy xong rồi xóa element
  }, 3500);
}

// 💡 Hàm hiển thị Confirm Modal chuyên nghiệp thay cho confirm()
function showConfirm(message, onConfirm) {
  const overlay = document.getElementById("confirmOverlay");
  const msgEl = document.getElementById("confirmMessage");
  const btnCancel = document.getElementById("btnConfirmCancel");
  const btnOk = document.getElementById("btnConfirmOk");

  msgEl.textContent = message;
  overlay.classList.add("show");

  // Dọn dẹp event cũ (tránh bị gọi nhiều lần nếu mở đóng liên tục)
  btnCancel.onclick = () => {
    overlay.classList.remove("show");
  };
  btnOk.onclick = () => {
    overlay.classList.remove("show");
    onConfirm();
  };
}

//  Web Audio API cho Sound Effects (SFX)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSFX(type) {
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === "correct") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Node C5
    osc.frequency.exponentialRampToValueAtTime(
      1046.5,
      audioCtx.currentTime + 0.1,
    ); // Vuốt lên
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.4,
    );
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } else {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime); // Âm trầm
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2); // Vuốt xuống
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.3,
    );
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () =>
    window.speechSynthesis.getVoices();
}

let preparedData = [];
let totalQuestions = 0;
let answeredQuestions = 0;
let correctAnswers = 0;
let mistakes = [];
let flashcardData = [];
let currentCardIndex = 0;

// === Quản lý Kho Từ Vựng bằng LocalStorage ===
let savedDecks = JSON.parse(localStorage.getItem("vocaDecks")) || [];
let currentDeckId = null;

// Lọc bỏ các course lessons bị save nhầm vào localStorage (fix bug)
savedDecks = savedDecks.filter((d) => !d.id.startsWith("course_"));
localStorage.setItem("vocaDecks", JSON.stringify(savedDecks));

document.addEventListener("DOMContentLoaded", () => {
  // Check Web Speech API availability
  if (!window.speechSynthesis) {
    console.warn("⚠️ Web Speech API NOT available on this browser!");
  } else {
    console.log("✅ Web Speech API available");
    let voices = window.speechSynthesis.getVoices();
    console.log("Voices at load:", voices.length);
  }

  if (savedDecks.length > 0 || courseData.length > 0) {
    showDashboard();
  } else {
    showInputSection();
  }
});

function showDashboard() {
  document.getElementById("dashboardSection").style.display = "block";
  document.getElementById("inputSection").style.display = "none";
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("quizArea").innerHTML = "";
  document.getElementById("statsArea").style.display = "none";
  document.getElementById("progressContainer").style.display = "none";

  // Tính toán thống kê chung
  let totalLessons = 0;
  let totalWords = 0;
  let completedLessons = 0;

  courseData.forEach((course) => {
    course.lessons.forEach((lesson) => {
      totalLessons++;
      totalWords += lesson.words.length;
      let lessonMistakesKey = "lesson_mistakes_" + course.id + "_" + lesson.id;
      let savedMistakes = JSON.parse(
        localStorage.getItem(lessonMistakesKey) || "[]",
      );
      if (savedMistakes.length === 0) completedLessons++;
    });
  });

  // 1. Render Khóa Học Chuẩn (Hardcode)
  let courseHtml = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 20px; margin-bottom: 35px; box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3); position: relative; overflow: hidden;">
      <div style="position: absolute; top: -50px; right: -50px; font-size: 150px; opacity: 0.1;">📚</div>
      <div style="position: relative; z-index: 1;">
        <h1 style="margin: 0 0 12px 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 8px rgba(0,0,0,0.2);">🎓 Khóa Học Chuẩn Tiếng Anh</h1>
        <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500;">Nâng cao kỹ năng với 18 bài học toàn diện</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
          <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center;">
            <p style="margin: 0 0 6px 0; color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Bài học</p>
            <p style="margin: 0; color: white; font-size: 28px; font-weight: 900;">${totalLessons}</p>
          </div>
          <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center;">
            <p style="margin: 0 0 6px 0; color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Từ vựng</p>
            <p style="margin: 0; color: white; font-size: 28px; font-weight: 900;">${totalWords}</p>
          </div>
          <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); text-align: center;">
            <p style="margin: 0 0 6px 0; color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hoàn thành</p>
            <p style="margin: 0; color: white; font-size: 28px; font-weight: 900;">${completedLessons}/${totalLessons}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  courseData.forEach((course) => {
    // Tính progress per course
    let courseCompletedLessons = 0;
    let courseTotalLessons = course.lessons.length;

    course.lessons.forEach((lesson) => {
      let lessonMistakesKey = "lesson_mistakes_" + course.id + "_" + lesson.id;
      let savedMistakes = JSON.parse(
        localStorage.getItem(lessonMistakesKey) || "[]",
      );
      if (savedMistakes.length === 0) courseCompletedLessons++;
    });

    let progressPercent = (courseCompletedLessons / courseTotalLessons) * 100;

    courseHtml += `<div style="margin-bottom: 28px; background: white; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); transition: all 0.3s ease;" onmouseenter="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'; this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'; this.style.transform='translateY(0)'">
      <div onclick="toggleCourse('${course.id}')" style="cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; user-select: none; transition: all 0.3s ease;">
        <div style="flex: 1;">
          <h3 style="margin: 0; font-size: 18px; color: white; font-weight: 800; display: flex; align-items: center; gap: 10px;">
            <span>${["📱", "🏪", "✈️", "🛍️", "🍽️", "🥘", "🍴", "⚕️", "📋", "💼", "🏨", "👔", "💻", "💼", "👥", "💰", "📦", "✅"][courseData.indexOf(course)]}</span>
            ${course.title}
          </h3>
          <div style="margin-top: 10px; height: 6px; background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; background: linear-gradient(90deg, #f39c12 0%, #27ae60 100%); width: ${progressPercent}%; transition: width 0.5s ease; border-radius: 3px;"></div>
          </div>
          <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 600;">${courseCompletedLessons}/${courseTotalLessons} bài hoàn thành</p>
        </div>
        <span id="icon_${course.id}" style="font-size: 22px; transition: transform 0.3s; display: inline-block;">▼</span>
      </div>
      <div id="lessons_${course.id}" style="display: none; flex-direction: column; gap: 14px; padding: 24px; background: linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%);">`;

    course.lessons.forEach((lesson) => {
      let wordCount = lesson.words.length;
      let btnColor = wordCount > 0 ? "var(--primary)" : "#95a5a6";
      let btnBg =
        wordCount > 0
          ? "linear-gradient(135deg, var(--primary) 0%, #2980b9 100%)"
          : "linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)";
      let cursor = wordCount > 0 ? "cursor: pointer;" : "cursor: not-allowed;";

      let lessonMistakesKey = "lesson_mistakes_" + course.id + "_" + lesson.id;
      let savedMistakes = JSON.parse(
        localStorage.getItem(lessonMistakesKey) || "[]",
      );
      let mistakesBtn =
        savedMistakes.length > 0
          ? `<button class="main-btn" style="padding: 9px 16px; font-size: 12px; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; border: none; border-radius: 8px; box-shadow: 0 3px 10px rgba(243, 156, 18, 0.25); font-weight: 700; white-space: nowrap; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(243, 156, 18, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(243, 156, 18, 0.25)';" onclick="playLessonMistakes('${course.id}', '${lesson.id}')">⚠️ ${savedMistakes.length} lỗi</button>`
          : "";

      courseHtml += `
        <div style="background: white; border: 2px solid #e8ecf1; padding: 16px 18px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.04); ${wordCount > 0 ? "" : "opacity: 0.7;"}" class="lesson-item">
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 800; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; background: #667eea; border-radius: 50%;"></span>
              ${lesson.title}
            </p>
            <p style="margin: 4px 0 0 0; color: #95a5a6; font-size: 12px; font-weight: 600;">${wordCount} từ vựng</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
            ${mistakesBtn}
            <button class="main-btn" style="padding: 9px 16px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #1abc9c 0%, #16a085 100%); color: white; border-radius: 8px; box-shadow: ${wordCount > 0 ? "0 3px 10px rgba(26, 188, 156, 0.25)" : "none"}; transition: all 0.3s ease; white-space: nowrap; border: none; ${cursor}" 
              onmouseover="if(${wordCount} > 0) {this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(26, 188, 156, 0.4)';}"
              onmouseout="if(${wordCount} > 0) {this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(26, 188, 156, 0.25)';}"
              onclick="if(${wordCount} > 0) openListenModal('${course.id}', '${lesson.id}')">
              🎧 Nghe
            </button>
            <button class="main-btn btn-primary" style="padding: 9px 16px; font-size: 13px; font-weight: 700; background: ${btnBg}; color: white; border-radius: 8px; box-shadow: ${wordCount > 0 ? "0 3px 10px rgba(52, 152, 219, 0.25)" : "none"}; transition: all 0.3s ease; white-space: nowrap; border: none; ${cursor}" 
              onmouseover="if(${wordCount} > 0) {this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(52, 152, 219, 0.4)';}"
              onmouseout="if(${wordCount} > 0) {this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(52, 152, 219, 0.25)';}"
              onclick="if(${wordCount} > 0) playCourseLesson('${course.id}', '${lesson.id}')">
              ${wordCount > 0 ? `▶ Học` : `⏳ Sắp cập nhật`}
            </button>
          </div>
        </div>
      `;
    });
    courseHtml += `</div></div></div>`;
  });
  let courseListEl = document.getElementById("courseList");
  if (courseListEl) courseListEl.innerHTML = courseHtml;

  // 2. Render Tủ Từ Của Tôi (LocalStorage)
  let html = "";
  if (savedDecks.length > 0) {
    html = `<h2 style="color: #2c3e50; font-size: 20px; font-weight: 800; margin: 35px 0 20px 0; display: flex; align-items: center; gap: 10px;"><span>📚</span> Bộ Từ Của Tôi</h2>`;
  }
  savedDecks.forEach((deck) => {
    html += `
      <div style="background: white; border: 2px solid var(--secondary); padding: 18px 20px; border-radius: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(155, 89, 182, 0.15); transition: all 0.3s ease; cursor: pointer;" onmouseenter="this.style.boxShadow='0 8px 20px rgba(155, 89, 182, 0.25)'; this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='0 4px 12px rgba(155, 89, 182, 0.15)'; this.style.transform='translateY(0)'">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 6px 0; color: var(--secondary-dark); font-size: 16px; font-weight: 800;">${deck.name || "Bộ từ chưa tên"}</h3>
          <p style="margin: 0; color: #7f8c8d; font-size: 13px; font-weight: 600;">📊 ${deck.words.length} từ vựng</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          ${deck.mistakes && deck.mistakes.length > 0 ? `<button class="main-btn btn-spell" style="padding: 10px 14px; font-size: 13px; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; border: none; border-radius: 8px; box-shadow: 0 3px 10px rgba(243, 156, 18, 0.25); font-weight: 700; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(243, 156, 18, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(243, 156, 18, 0.25)';" onclick="playMistakesDeck('${deck.id}')">⚠️ Ôn ${deck.mistakes.length}</button>` : ""}
          <button class="main-btn btn-quiz" style="padding: 10px 14px; font-size: 13px; background: linear-gradient(135deg, var(--secondary) 0%, #8e44ad 100%); color: white; border: none; border-radius: 8px; box-shadow: 0 3px 10px rgba(155, 89, 182, 0.25); font-weight: 700; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(155, 89, 182, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(155, 89, 182, 0.25)';" onclick="playSelectedDeck('${deck.id}')">▶ Học</button>
          <button class="main-btn" style="padding: 10px 14px; font-size: 13px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; border-radius: 8px; box-shadow: 0 3px 10px rgba(231, 76, 60, 0.25); font-weight: 700; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(231, 76, 60, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(231, 76, 60, 0.25)';" onclick="deleteDeck('${deck.id}')">🗑️</button>
        </div>
      </div>
    `;
  });
  if (savedDecks.length === 0)
    html = `<p style="text-align:center; color:#7f8c8d; margin-top: 30px; font-size: 14px;">Bạn chưa có bộ từ vựng nào.</p>`;
  document.getElementById("deckList").innerHTML = html;
}

function showInputSection() {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("inputSection").style.display = "block";
  document.getElementById("deckName").value = "";
  document.getElementById("wordInput").value = "";
  currentDeckId = Date.now().toString(); // Khởi tạo ID mới
}

function deleteDeck(id) {
  showConfirm("Bạn có chắc muốn xóa bộ từ này khỏi máy?", () => {
    savedDecks = savedDecks.filter((d) => d.id !== id);
    localStorage.setItem("vocaDecks", JSON.stringify(savedDecks));
    if (savedDecks.length > 0 || courseData.length > 0) showDashboard();
    else showInputSection();
    showToast("Xóa bộ từ vựng thành công!", "success");
  });
}

function toggleCourse(courseId) {
  let lessonsDiv = document.getElementById("lessons_" + courseId);
  let iconSpan = document.getElementById("icon_" + courseId);
  if (lessonsDiv.style.display === "none") {
    lessonsDiv.style.display = "flex";
    iconSpan.style.transform = "rotate(180deg)";
  } else {
    lessonsDiv.style.display = "none";
    iconSpan.style.transform = "rotate(0deg)";
  }
}

function playCourseLesson(courseId, lessonId) {
  let course = courseData.find((c) => c.id === courseId);
  if (course) {
    let lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson && lesson.words.length > 0) {
      currentDeckId = "course_" + courseId + "_" + lessonId; // Phân biệt với tự tạo
      document.getElementById("deckName").value =
        `${course.title} - ${lesson.title}`;
      // Clone dữ liệu cứng ra để không đụng chạm tới JSON gốc
      preparedData = JSON.parse(JSON.stringify(lesson.words));
      window.preparedData = preparedData; // Expose to window for listening
      renderPreviewHtml();
    }
  }
}

function playLessonMistakes(courseId, lessonId) {
  let course = courseData.find((c) => c.id === courseId);
  if (course) {
    let lesson = course.lessons.find((l) => l.id === lessonId);
    let lessonMistakesKey = "lesson_mistakes_" + courseId + "_" + lessonId;
    let savedMistakes = JSON.parse(
      localStorage.getItem(lessonMistakesKey) || "[]",
    );
    if (savedMistakes.length > 0 && lesson) {
      currentDeckId = "course_" + courseId + "_" + lessonId + "_mistakes";
      document.getElementById("deckName").value =
        `${course.title} - ${lesson.title} (Làm lại câu sai - ${savedMistakes.length} từ)`;
      // Lấy chỉ các từ sai từ lesson
      preparedData = JSON.parse(JSON.stringify(lesson.words)).filter((w) =>
        savedMistakes.includes(w.word),
      );
      window.preparedData = preparedData; // Expose to window for listening
      renderPreviewHtml();
    }
  }
}

function playSelectedDeck(id) {
  let deck = savedDecks.find((d) => d.id === id);
  if (deck) {
    currentDeckId = deck.id;
    document.getElementById("deckName").value = deck.name;
    preparedData = JSON.parse(JSON.stringify(deck.words)); // Clone dữ liệu
    window.preparedData = preparedData; // Expose to window for listening
    renderPreviewHtml();
  }
}

function playMistakesDeck(id) {
  let deck = savedDecks.find((d) => d.id === id);
  if (deck && deck.mistakes && deck.mistakes.length > 0) {
    currentDeckId = deck.id;
    document.getElementById("deckName").value = deck.name; // Keep tracking the original deck
    // Chỉ lấy những từ nằm trong danh sách mistakes của bộ này
    preparedData = JSON.parse(JSON.stringify(deck.words)).filter((w) =>
      deck.mistakes.includes(w.word),
    );
    window.preparedData = preparedData; // Expose to window for listening
    renderPreviewHtml();
  }
}

function saveDeck() {
  let name =
    document.getElementById("deckName").value.trim() ||
    "Bộ từ " + new Date().toLocaleDateString("vi-VN");
  // Nếu đang chơi course lesson, tạo ID mới thay vì dùng course ID
  let deckId = currentDeckId;
  if (deckId && deckId.startsWith("course_")) {
    deckId = Date.now().toString(); // Tạo ID mới cho bộ tự tạo
  }
  let existingIdx = savedDecks.findIndex((d) => d.id === deckId);
  if (existingIdx >= 0) {
    savedDecks[existingIdx].name = name;
    savedDecks[existingIdx].words = preparedData;
  } else {
    savedDecks.push({
      id: deckId || Date.now().toString(),
      name: name,
      words: preparedData,
    });
  }
  localStorage.setItem("vocaDecks", JSON.stringify(savedDecks));
}
// ==========================================

function speakWord(word, accent) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  // Tách các từ bằng dấu "/" (ví dụ: "child / children" -> ["child", "children"])
  let words = word
    .split("/")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  let voices = window.speechSynthesis.getVoices();
  let targetVoice = voices.find((v) =>
    accent === "en-GB" || accent === "uk"
      ? v.lang === "en-GB" || v.lang === "en_GB"
      : v.lang === "en-US" || v.lang === "en_US",
  );

  // Đọc từng từ liên tiếp với delay
  words.forEach((w, index) => {
    setTimeout(() => {
      let utterance = new SpeechSynthesisUtterance(w);
      if (targetVoice) utterance.voice = targetVoice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }, index * 800); // Delay 800ms giữa các từ
  });
}

// 💡 Hàm đoán từ loại từ nghĩa tiếng Việt
function guessPartOfSpeech(enWord, viMeaning) {
  if (!viMeaning) return "Từ loại khác";
  let lowerMeaning = viMeaning.toLowerCase().trim();
  let lowerEn = enWord.toLowerCase().trim();

  let wordsCount = lowerEn.split(/[\s\-]+/).filter((w) => w).length;
  if (wordsCount >= 2) return "Cụm từ";

  if (/^(sự|cái|con|người|việc|chiếc)(?:\s|$)/.test(lowerMeaning))
    return "Danh từ (n)";
  if (
    /^(tính|thuộc|thuộc về|rất|khá|cực kỳ)(?:\s|$)/.test(lowerMeaning) ||
    /\smột cách$/.test(lowerMeaning)
  )
    return "Tính/Trạng từ (adj/adv)";
  if (
    /^(làm|chạy|đi|đứng|bị|được|có|đẩy|kéo|nói|cười|khóc|nhìn|nghe|ăn|uống|hoạt động|ngủ|giết|đánh|học|bay|nhảy|mua|bán|chơi)(?:\s|$)/.test(
      lowerMeaning,
    )
  )
    return "Động từ (v)";

  return "Từ vựng";
}

// 💡 Hàm dọn dẹp các ký tự IPA phức tạp (Phiên âm chuẩn từ điển cơ bản)
function cleanPhonetic(ipaStr) {
  if (!ipaStr) return "";
  return ipaStr
    .replace(/ɹ/g, "r") // Đổi chữ 'r' ngược thành r bình thường
    .replace(/ɡ/g, "g") // Đổi chữ 'g' bụng cong thành g bình thường
    .replace(/[̠̝͡ʷʲʰʴ]/g, ""); // Lọc bỏ các dấu móc nối, dấu gạch dưới, dấu nhỏ li ti gây rối mắt
}

async function fetchWordDictData(singleWord) {
  try {
    let resDict = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(singleWord)}`,
    );
    if (resDict.ok) {
      let dictData = await resDict.json();

      // 1. Lấy phiên âm IPA
      let phonetics = dictData[0]?.phonetics || [];
      let ipa = "";
      let broadIPA = phonetics.find((p) => p.text && p.text.includes("/"));
      if (broadIPA) ipa = broadIPA.text;
      else {
        let validP = phonetics.find((p) => p.text);
        if (validP) ipa = validP.text;
        else if (dictData[0]?.phonetic) ipa = dictData[0].phonetic;
      }

      // 2. Lấy Từ loại (Part of Speech) gốc tiếng Anh
      let posRaw = dictData[0]?.meanings?.[0]?.partOfSpeech || "";

      return { ipa: cleanPhonetic(ipa), pos: posRaw.toLowerCase() };
    }
  } catch (e) {}
  return { ipa: "", pos: "" };
}

async function loadAndPreviewWords() {
  const deckNameVal = document.getElementById("deckName").value.trim();
  const finalDeckName =
    deckNameVal || "Bộ từ " + new Date().toLocaleDateString("vi-VN");

  // 🛡️ Bắt lỗi trùng tên bộ từ
  const isDuplicate = savedDecks.find(
    (d) =>
      d.name.toLowerCase() === finalDeckName.toLowerCase() &&
      d.id !== currentDeckId,
  );
  if (isDuplicate) {
    showToast(
      `Bộ từ mang tên "${finalDeckName}" đã tồn tại! Vui lòng làm tên khác.`,
      "error",
    );
    document.getElementById("deckName").focus();
    return;
  }

  const input = document.getElementById("wordInput").value;
  const loading = document.getElementById("loading");
  const inputSection = document.getElementById("inputSection");
  const previewSection = document.getElementById("previewSection");

  let words = [
    ...new Set(
      input
        .split(/[,\n\r\/]+/)
        .map((w) => w.trim())
        .filter((w) => w !== ""),
    ),
  ];
  if (words.length === 0) {
    showToast("Oops! Bạn quên nhập từ vựng rồi kìa!", "error");
    return;
  }

  loading.style.display = "block";
  document.getElementById("btnLoad").disabled = true;

  preparedData = [];
  for (let word of words) {
    try {
      let resTranslate = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`,
      );
      let translatedWord = word;
      if (resTranslate.ok) {
        let data = await resTranslate.json();
        translatedWord = data[0][0][0];
      }

      let ipa = "";
      let fetchedPos = "";
      let subWords = word.split(/\s+/).filter((w) => w !== "");

      if (subWords.length > 1) {
        let ipaParts = [];
        for (let subWord of subWords) {
          let cleanSub = subWord.replace(/[^a-zA-Z]/g, "");
          if (cleanSub) {
            let dictInfo = await fetchWordDictData(cleanSub);
            let subIpa = dictInfo.ipa;
            ipaParts.push(
              subIpa ? subIpa.replace(/[\/\[\]]/g, "") : cleanSub.toLowerCase(),
            );
          }
        }
        if (ipaParts.length > 0) ipa = "/" + ipaParts.join(" ") + "/";
        fetchedPos = "idiom"; // Là cụm từ
      } else {
        let dictInfo = await fetchWordDictData(word);
        let singleIpa = dictInfo.ipa;
        fetchedPos = dictInfo.pos;

        if (singleIpa)
          ipa = singleIpa.startsWith("[")
            ? "/" + singleIpa.slice(1, -1) + "/"
            : singleIpa;
      }

      // Chuyển đổi mã từ loại của API sang tiếng Việt
      let posMap = {
        noun: "Danh từ (n)",
        verb: "Động từ (v)",
        adjective: "Tính từ (adj)",
        adverb: "Trạng từ (adv)",
        pronoun: "Đại từ (pron)",
        preposition: "Giới từ (prep)",
        conjunction: "Liên từ (conj)",
        interjection: "Thán từ (int)",
        idiom: "Cụm từ",
      };

      // Nếu API có từ loại, dùng luôn. Nếu không có (hoặc lỗi), dùng hàm guessPartOfSpeech để dự đoán tự động (fallback)
      let pos = posMap[fetchedPos] || guessPartOfSpeech(word, translatedWord);

      preparedData.push({ word, definition: translatedWord, ipa, pos });
    } catch (error) {}
  }

  loading.style.display = "none";
  document.getElementById("btnLoad").disabled = false;

  if (preparedData.length === 0) {
    showToast("Không thể phân tích dữ liệu đầu vào. Thử lại nhé!", "error");
    return;
  }

  inputSection.style.display = "none";
  window.preparedData = preparedData; // Expose to window for listening
  renderPreviewHtml();
}

function renderPreviewHtml() {
  const previewSection = document.getElementById("previewSection");
  previewSection.style.display = "block";
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("inputSection").style.display = "none";
  document.getElementById("quizArea").innerHTML = "";
  document.getElementById("statsArea").style.display = "none";
  document.getElementById("progressContainer").style.display = "none";

  const posList = [
    "Danh từ (n)",
    "Động từ (v)",
    "Tính từ (adj)",
    "Trạng từ (adv)",
    "Tính/Trạng từ (adj/adv)",
    "Đại từ (pron)",
    "Giới từ (prep)",
    "Liên từ (conj)",
    "Thán từ (int)",
    "Cụm từ",
    "Cụm động từ",
    "Từ vựng",
    "Từ loại khác",
  ];

  let previewHtml = `
          <h3>🔍 Xem trước & Chỉnh sửa nghĩa</h3>
          <p style="color:#7f8c8d; font-size:14px; margin-bottom:15px;">Chỉnh sửa nghĩa tiếng Việt (nếu cần) trước khi bắt đầu học nhé!</p>
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button class="main-btn" style="flex: 1; background: linear-gradient(135deg, #27ae60 0%, #229954 100%); box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="window.startListeningNow(); display: none">🎧 Nghe từng từ</button>
            <button class="main-btn" style="flex: 0 0 auto; background: #3498db; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3); font-weight: 700;" onclick="window.openListenSettings()">⚙️ Cài đặt</button>
          </div>
          <div class="preview-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px; padding-right:5px;">
        `;

  preparedData.forEach((item, idx) => {
    let currentPos = item.pos || "Từ vựng";
    let optionsHtml = posList
      .map(
        (p) =>
          `<option value="${p}" ${p === currentPos ? "selected" : ""}>${p}</option>`,
      )
      .join("");
    if (!posList.includes(currentPos)) {
      optionsHtml += `<option value="${currentPos}" selected>${currentPos}</option>`;
    }

    previewHtml += `
            <div class="preview-item">
              <div class="preview-word-info">
                ${item.word} 
                <span style="position: relative; display: inline-block; transform: translateY(-2px);">
                  <select style="width: 125px; font-size: 11px; font-weight: 800; color: var(--primary); padding: 2px 18px 2px 6px; background: rgba(52, 152, 219, 0.08); border: 1px dashed rgba(52, 152, 219, 0.6); border-radius: 6px; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; -moz-appearance: none; text-align: center; text-align-last: center; font-family: 'Nunito', sans-serif;" onchange="updateCustomPos(${idx}, this.value)">
                    ${optionsHtml}
                  </select>
                  <span style="position: absolute; right: 5px; top: 4px; font-size: 10px; pointer-events: none; opacity: 0.7;">▼</span>
                </span>
                <span style="font-size: 13px; margin-left: 3px;">${item.ipa || "/.../"}</span>
              </div>
              <input type="text" class="preview-input" value="${item.definition}" onchange="updateCustomDefinition(${idx}, this.value)">
            </div>
          `;
  });

  previewHtml += `
          </div>
          <p style="font-weight:800; color:var(--primary-dark); margin-bottom:10px; text-align:center;">🎯 CHỌN CHẾ ĐỘ BẮT ĐẦU HỌC:</p>
          <div class="btn-group">
            <button class="main-btn btn-flashcard" onclick="startApp('flashcard')">🗂️ Lật Thẻ</button>
            <button class="main-btn btn-quiz" onclick="startApp('quiz')">📝 Trắc Nghiệm</button>
            <button class="main-btn btn-spell" onclick="startApp('spell')">⌨️ Gõ Từ</button>
          </div>
          <button class="main-btn" style="width:100%; margin-top:15px; background: linear-gradient(135deg, var(--primary) 0%, #2980b9 100%); box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3); font-weight: 700;" onclick="goBackToDashboard()">🎓 Quay lại</button>
        `;
  previewSection.innerHTML = previewHtml;
}

window.updateCustomPos = (index, value) => {
  if (preparedData[index]) preparedData[index].pos = value.trim();
};

window.updateCustomDefinition = (index, value) => {
  if (preparedData[index]) preparedData[index].definition = value.trim();
};

window.scrollToUnanswered = () => {
  const unanswered = document.querySelector(".question-card:not(.answered)");
  if (unanswered) {
    unanswered.scrollIntoView({ behavior: "smooth", block: "center" });
    unanswered.classList.add("shake");
    setTimeout(() => unanswered.classList.remove("shake"), 400);
  } else {
    showToast("Hoan hô! Bạn đã hoàn thành tất cả các câu!", "success");
  }
};

window.removeFixedButtonBar = () => {
  const fixedBar = document.getElementById("fixedButtonBar");
  if (fixedBar) fixedBar.remove();
  const quizArea = document.getElementById("quizArea");
  quizArea.style.paddingBottom = "0";
};

window.goBackToDashboard = () => {
  window.removeFixedButtonBar();
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("quizArea").innerHTML = "";
  document.getElementById("statsArea").style.display = "none";
  document.getElementById("progressContainer").style.display = "none";
  if (savedDecks.length > 0 || courseData.length > 0) {
    showDashboard();
  } else {
    showInputSection();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
};

function startApp(mode) {
  saveDeck(); // Lưu ngay vào LocalStorage trước khi học
  document.getElementById("previewSection").style.display = "none";
  const quizArea = document.getElementById("quizArea");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");

  let localData = JSON.parse(JSON.stringify(preparedData));

  // Không trộn từ vựng nếu đang ở chế độ Lật Thẻ (Flashcard)
  if (mode !== "flashcard") {
    localData = localData.sort(() => 0.5 - Math.random());
  }

  progressBar.style.width = "0%";
  progressContainer.style.display = mode !== "flashcard" ? "block" : "none";

  // Tạo fixed button bar ở bottom cho quiz & spell mode
  if (mode !== "flashcard") {
    window.removeFixedButtonBar(); // Xóa bar cũ nếu có
    let fixedBar = document.createElement("div");
    fixedBar.id = "fixedButtonBar";
    fixedBar.style = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid rgba(52, 152, 219, 0.3);
      padding: 8px 16px;
      display: flex;
      justify-content: center;
      gap: 12px;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
      z-index: 1000;
    `;
    fixedBar.innerHTML = `
      <button style="padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.12);" onmouseover="this.style.background='#2d3748'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.background='#4a5568'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.12)'" onclick="scrollToUnanswered()">🔍 Tìm câu</button>
      <button style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s; box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);" onmouseover="this.style.background='#2980b9'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(52, 152, 219, 0.4)'" onmouseout="this.style.background='var(--primary)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(52, 152, 219, 0.3)'" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">⬆️ Top</button>
    `;
    document.body.appendChild(fixedBar);
    quizArea.style.paddingBottom = "60px";
  }

  quizArea.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom: 15px;">
            <button class="speaker-btn" onclick="renderPreviewHtml()" style="border-color:var(--primary); color:var(--primary-dark);">⬅️ Trở lại tùy chọn</button>
          </div>
        `;

  if (mode === "flashcard") {
    flashcardData = localData;
    currentCardIndex = 0;
    renderFlashcard();
  } else {
    totalQuestions = localData.length;
    answeredQuestions = 0;
    correctAnswers = 0;
    mistakes = [];

    const updateProgress = () => {
      progressBar.style.width = `${(answeredQuestions / totalQuestions) * 100}%`;
      if (answeredQuestions === totalQuestions)
        setTimeout(() => showStatistics(mode), 600);
    };

    if (mode === "quiz") {
      const prefixLetters = ["A", "B", "C", "D"];
      localData.forEach((item, index) => {
        let pool = [...localData, ...dummyDistractors].filter(
          (x) =>
            x.definition.toLowerCase().trim() !==
              item.definition.toLowerCase().trim() &&
            x.word.toLowerCase().trim() !== item.word.toLowerCase().trim(),
        );

        let uniquePool = [];
        let seenDefs = new Set();
        pool.forEach((x) => {
          let defLower = x.definition.toLowerCase().trim();
          if (!seenDefs.has(defLower)) {
            seenDefs.add(defLower);
            uniquePool.push(x);
          }
        });

        let wrongOptions = uniquePool
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        let options = [item, ...wrongOptions].sort(() => 0.5 - Math.random());

        let questionDiv = document.createElement("div");
        questionDiv.className = "question-card";
        questionDiv.innerHTML = `
                <div class="question-text">
                  <span>${index + 1}. <b>"${item.word}"</b> có nghĩa là gì?</span>
                  <button class="speaker-btn" onclick="speakWord('${item.word.replace(/'/g, "\\'")}', 'uk')">🇬🇧</button>
                  <button class="speaker-btn" onclick="speakWord('${item.word.replace(/'/g, "\\'")}', 'us')">🇺🇸</button>
                </div>
                <div class="options-grid"></div>
                <div class="explanation-box"></div>
              `;

        let grid = questionDiv.querySelector(".options-grid");
        let explanationDiv = questionDiv.querySelector(".explanation-box");

        options.forEach((opt, optIndex) => {
          let optDiv = document.createElement("div");
          optDiv.className = "option";
          optDiv.innerText = `${prefixLetters[optIndex]}. ${opt.definition}`;

          optDiv.onclick = function () {
            if (optDiv.classList.contains("disabled")) return;
            questionDiv
              .querySelectorAll(".option")
              .forEach((el) => el.classList.add("disabled"));
            answeredQuestions++;
            explanationDiv.style.display = "block";

            if (opt.definition === item.definition) {
              playSFX("correct");
              optDiv.classList.add("correct");
              correctAnswers++;
              explanationDiv.innerHTML = `🎉 <b>Chính xác!</b> Từ <b>"${item.word}"</b> có nghĩa là <b>"${item.definition}"</b>.`;
              explanationDiv.style.background = "#eafaf1";
              explanationDiv.style.color = "var(--success-dark)";
            } else {
              playSFX("wrong");
              optDiv.classList.add("wrong");
              questionDiv.classList.add("shake");
              questionDiv.style.borderColor = "var(--danger)";
              questionDiv.querySelectorAll(".option").forEach((el) => {
                if (el.innerText.includes(item.definition))
                  el.classList.add("correct");
              });

              mistakes.push({
                word: item.word,
                question: `Từ "${item.word}"`,
                correct: item.definition,
                userAnswer: opt.definition,
              });
              explanationDiv.innerHTML = `❌ <b>Chưa chính xác!</b><br>• <b>"${item.word}"</b> nghĩa là <b style="color:var(--success-dark);">${item.definition}</b>.<br>• Bạn chọn nhầm nghĩa của từ: <b>${opt.word}</b>`;
              explanationDiv.style.background = "#fdedec";
              explanationDiv.style.color = "var(--danger-dark)";
            }
            updateProgress();
          };
          grid.appendChild(optDiv);
        });
        quizArea.appendChild(questionDiv);
      });
    } else if (mode === "spell") {
      localData.forEach((item, index) => {
        let questionDiv = document.createElement("div");
        questionDiv.className = "question-card";
        questionDiv.innerHTML = `
                <div class="question-text">${index + 1}. Từ nào có nghĩa là <b>"${item.definition}"</b>?</div>
                <div style="display:flex; gap:10px;">
                  <input type="text" class="spell-input" placeholder="Gõ từ tiếng Anh...">
                  <button class="spell-btn">Check</button>
                </div>
                <div class="explanation-box"></div>
              `;

        let inputField = questionDiv.querySelector(".spell-input");
        let checkBtn = questionDiv.querySelector(".spell-btn");
        let explanationDiv = questionDiv.querySelector(".explanation-box");

        const checkAnswer = () => {
          let userWord = inputField.value.trim().toLowerCase();
          if (!userWord) return;
          inputField.disabled = true;
          checkBtn.disabled = true;
          answeredQuestions++;
          explanationDiv.style.display = "block";

          // Normalize spaces around "/" for correct matching: "tooth / teeth" -> "tooth/teeth"
          let normalizedUserWord = userWord.replace(/\s*\/\s*/g, "/");
          let normalizedExpectedWord = item.word
            .toLowerCase()
            .replace(/\s*\/\s*/g, "/");

          if (normalizedUserWord === normalizedExpectedWord) {
            playSFX("correct");
            correctAnswers++;
            inputField.style.borderColor = "var(--success)";
            inputField.style.background = "#eafaf1";
            explanationDiv.innerHTML = `🎉 <b>Xuất sắc!</b> Đúng chuẩn chính tả.
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);">
                <p style="margin: 8px 0; font-size: 13px; color: #555;"><b>IPA:</b> ${item.ipa || "N/A"}</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button style="padding: 6px 12px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;" onmouseover="this.style.background='#229954'" onmouseout="this.style.background='#27ae60'" onclick="speakWord('${item.word}', 'en-US')">🔊 A-A (US)</button>
                  <button style="padding: 6px 12px; background: #2980b9; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;" onmouseover="this.style.background='#1f618d'" onmouseout="this.style.background='#2980b9'" onclick="speakWord('${item.word}', 'en-GB')">🔊 A-M (UK)</button>
                </div>
              </div>`;
            explanationDiv.style.background = "#eafaf1";
            explanationDiv.style.color = "var(--success-dark)";
          } else {
            playSFX("wrong");
            questionDiv.classList.add("shake");
            questionDiv.style.borderColor = "var(--danger)";
            inputField.style.borderColor = "var(--danger)";
            inputField.style.background = "#fdedec";
            mistakes.push({
              word: item.word,
              question: `Nghĩa là "${item.definition}"`,
              correct: item.word,
              userAnswer: userWord,
            });
            explanationDiv.innerHTML = `❌ <b>Sai mặt rồi!</b> Đáp án đúng: <b style="font-size:18px;">${item.word}</b>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);">
                <p style="margin: 8px 0; font-size: 13px; color: #555;"><b>IPA:</b> ${item.ipa || "N/A"}</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;" onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'" onclick="speakWord('${item.word}', 'en-US')">🔊 A-A (US)</button>
                  <button style="padding: 6px 12px; background: #e67e22; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;" onmouseover="this.style.background='#d35400'" onmouseout="this.style.background='#e67e22'" onclick="speakWord('${item.word}', 'en-GB')">🔊 A-M (UK)</button>
                </div>
              </div>`;
            explanationDiv.style.background = "#fdedec";
            explanationDiv.style.color = "var(--danger-dark)";
          }
          updateProgress();
        };

        checkBtn.onclick = checkAnswer;
        inputField.addEventListener("keypress", (e) => {
          if (e.key === "Enter") checkAnswer();
        });
        quizArea.appendChild(questionDiv);
      });
    }

    // Nút Điều hướng đã di chuyển vào fixed bar ở bottom
  }
}

function renderFlashcard() {
  const quizArea = document.getElementById("quizArea");
  let item = flashcardData[currentCardIndex];

  const posList = [
    "Danh từ (n)",
    "Động từ (v)",
    "Tính từ (adj)",
    "Trạng từ (adv)",
    "Tính/Trạng từ (adj/adv)",
    "Đại từ (pron)",
    "Giới từ (prep)",
    "Liên từ (conj)",
    "Thán từ (int)",
    "Cụm từ",
    "Cụm động từ",
    "Từ vựng",
    "Từ loại khác",
  ];
  let currentPos = item.pos || "Từ vựng";
  let optionsHtml = posList
    .map(
      (p) =>
        `<option value="${p}" ${p === currentPos ? "selected" : ""}>${p}</option>`,
    )
    .join("");
  if (!posList.includes(currentPos)) {
    optionsHtml += `<option value="${currentPos}" selected>${currentPos}</option>`;
  }

  // Tạo chuỗi hình nền mặc định
  let defaultBg =
    "linear-gradient(135deg, var(--secondary) 0%, var(--secondary-dark) 100%)";
  let cardBackStyle = item.imageUrl
    ? `background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('${item.imageUrl}') center/cover;`
    : `background: ${defaultBg};`;

  quizArea.innerHTML = `
          <div>
            <button class="speaker-btn" onclick="renderPreviewHtml()" style="margin-bottom: 20px; border-color:var(--primary); color:var(--primary-dark);">⬅️ Trở lại tùy chọn</button>
          </div>
          <div class="flashcard-wrapper">
            <p style="color: #7f8c8d; font-weight: 600; margin-bottom: 10px;">✨ Chạm vào thẻ để lật (có thể sửa trực tiếp nghĩa & từ loại)</p>
            <div class="flip-card" onclick="if(event.target.tagName !== 'SELECT' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'BUTTON') this.classList.toggle('flipped')">
              <div class="flip-card-inner">
                <div class="flip-card-front">
                  <div class="fc-word">${item.word}</div>
                  <div style="margin-top: 5px;">
                    <span style="position: relative; display: inline-block;">
                      <select style="width: auto; padding-right: 15px; font-size:14px; font-weight:700; color:var(--primary); background: rgba(52, 152, 219, 0.1); padding-top: 4px; padding-bottom: 4px; border: 1px dashed rgba(52, 152, 219, 0.6); border-radius: 8px; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; -moz-appearance: none; text-align: center; text-align-last: center; font-family: 'Nunito', sans-serif;" onchange="updateFlashcardPos(${currentCardIndex}, this.value)">
                        ${optionsHtml}
                      </select>
                      <span style="position: absolute; right: 5px; top: 7px; font-size: 10px; pointer-events: none; opacity: 0.7;">▼</span>
                    </span>
                  </div>
                  <div class="fc-ipa" style="margin-top:8px;">${item.ipa || "/.../"}</div>
                  <div style="display:flex; gap:15px; margin-top:10px;">
                    <button class="speaker-btn" onclick="event.stopPropagation(); speakWord('${item.word.replace(/'/g, "\\'")}', 'uk')">🇬🇧 UK</button>
                    <button class="speaker-btn" onclick="event.stopPropagation(); speakWord('${item.word.replace(/'/g, "\\'")}', 'us')">🇺🇸 US</button>
                  </div>
                </div>
                <div class="flip-card-back" id="fcBackBg_${currentCardIndex}" style="${cardBackStyle}">
                  <div class="fc-def-container" style="width: 80%; display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <input type="text" class="preview-input" style="width: 100%; text-align: center; font-size: 28px; font-weight: 800; background: transparent; color: white; border: 2px dashed rgba(255,255,255,0.5); padding: 5px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);" value="${item.definition}" onclick="event.stopPropagation()" onchange="updateFlashcardDef(${currentCardIndex}, this.value)" title="Nhấn để sửa nghĩa">
                    ${item.example ? `<div style="font-size: 16px; font-style: italic; color: #f1f2f6; text-shadow: 1px 1px 3px rgba(0,0,0,0.6); padding: 0 10px; text-align: center;">"${item.example}"</div>` : ""}
                  </div>
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:20px; margin-top:30px;">
              <button class="speaker-btn" onclick="prevCard()" ${currentCardIndex === 0 ? "disabled" : ""}>⬅️ Trước</button>
              <span style="font-weight:800; font-size:18px; color:var(--text-color)">${currentCardIndex + 1} / ${flashcardData.length}</span>
              <button class="speaker-btn" onclick="nextCard()" ${currentCardIndex === flashcardData.length - 1 ? "disabled" : ""}>Sau ➡️</button>
            </div>
          </div>
        `;

  // Tự động tải ảnh từ API Wikipedia (Dùng Search Mode để khớp đa dạng hơn)
  if (item.imageUrl === undefined) {
    fetch(
      `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(item.word)}%20-intitle:"disambiguation"&gsrlimit=3&prop=pageimages&format=json&pithumbsize=600&origin=*`,
    )
      .then((res) => res.json())
      .then((data) => {
        let pages = data.query?.pages;
        let foundImage = false;

        if (pages) {
          let bestImage = null;
          let maxScore = -999;
          let wordLower = item.word.toLowerCase().trim();

          for (let pageId in pages) {
            let page = pages[pageId];
            if (page.thumbnail) {
              let score = 0;
              let titleLower = page.title.toLowerCase();

              // Thuật toán chấm điểm mức độ liên quan (Fuzzy Scoring)
              if (titleLower === wordLower) {
                score += 100; // Khớp chính xác hoàn toàn tên bài viết
              } else if (new RegExp(`\\b${wordLower}\\b`).test(titleLower)) {
                score += 50; // Nằm riêng biệt bên trong câu (Word boundary)
              } else if (titleLower.startsWith(wordLower)) {
                score += 30; // Từ khóa nằm ở đầu tiêu đề
              } else if (titleLower.includes(wordLower)) {
                score += 10; // Có xuất hiện chuỗi từ khóa
              }

              // Trừ điểm dựa trên rank trả về của Wiki (kết quả ở xa thì bị trừ bớt điểm độ tin cậy)
              score -= (page.index || 0) * 2;

              // Cập nhật lấy ảnh có điểm số cao nhất
              if (score > maxScore) {
                maxScore = score;
                bestImage = page.thumbnail.source;
              }
            }
          }

          if (bestImage) {
            item.imageUrl = bestImage;
            foundImage = true;
          }
        }

        if (foundImage) {
          let targetItem = preparedData.find((p) => p.word === item.word);
          if (targetItem) targetItem.imageUrl = item.imageUrl;

          // Nếu người dùng vẫn đang ở thẻ này, thì cập nhật background luôn
          if (flashcardData[currentCardIndex] === item) {
            let backEl = document.getElementById(
              "fcBackBg_" + currentCardIndex,
            );
            if (backEl) {
              backEl.style.background = `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('${item.imageUrl}') center/cover`;
            }
          }
          saveDeck(); // Lưu lại vào máy
        } else {
          item.imageUrl = false; // Đánh dấu là không tìm thấy
          let targetItem = preparedData.find((p) => p.word === item.word);
          if (targetItem) targetItem.imageUrl = false;
        }
      })
      .catch(() => {
        item.imageUrl = false;
      });
  }
}

window.updateFlashcardPos = (index, value) => {
  if (flashcardData[index]) {
    let val = value.trim();
    flashcardData[index].pos = val;
    // Đồng bộ lại với preparedData gốc trước khi lưu
    let targetItem = preparedData.find(
      (p) => p.word === flashcardData[index].word,
    );
    if (targetItem) targetItem.pos = val;

    saveDeck(); // Lưu vào bộ nhớ LocalStorage
  }
};

window.updateFlashcardDef = (index, value) => {
  if (flashcardData[index]) {
    let val = value.trim();
    flashcardData[index].definition = val;
    // Đồng bộ lại với preparedData gốc trước khi lưu
    let targetItem = preparedData.find(
      (p) => p.word === flashcardData[index].word,
    );
    if (targetItem) targetItem.definition = val;

    saveDeck(); // Lưu vào bộ nhớ LocalStorage
  }
};

window.prevCard = () => {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    renderFlashcard();
  }
};
window.nextCard = () => {
  if (currentCardIndex < flashcardData.length - 1) {
    currentCardIndex++;
    renderFlashcard();
  }
};

function showStatistics(mode) {
  window.removeFixedButtonBar(); // Xóa fixed button bar
  // --- LƯU LẠI TỪ SAI VÀO LOCALSTORAGE ---
  if (currentDeckId && mode !== "flashcard") {
    // Nếu là course lesson, lưu mistakes cho lesson đó
    if (currentDeckId.startsWith("course_")) {
      let parts = currentDeckId.split("_");
      if (parts.length >= 3) {
        let courseId = parts[1];
        let lessonId = parts[2];
        let lessonMistakesKey = "lesson_mistakes_" + courseId + "_" + lessonId;
        let savedMistakes = JSON.parse(
          localStorage.getItem(lessonMistakesKey) || "[]",
        );

        // Update mistakes set
        let mistakesSet = new Set(savedMistakes);
        preparedData.forEach((item) => {
          let missedThisTime = mistakes.find((m) => m.word === item.word);
          if (missedThisTime) {
            mistakesSet.add(item.word); // Làm sai -> Thêm vào
          } else {
            mistakesSet.delete(item.word); // Làm đúng -> Xóa khỏi
          }
        });
        localStorage.setItem(
          lessonMistakesKey,
          JSON.stringify(Array.from(mistakesSet)),
        );
      }
    }
    // Nếu là bộ từ tự tạo, lưu vào savedDecks
    else if (!currentDeckId.startsWith("course_")) {
      let deckIndex = savedDecks.findIndex((d) => d.id === currentDeckId);
      if (deckIndex >= 0) {
        let deckMistakes = new Set(savedDecks[deckIndex].mistakes || []);
        preparedData.forEach((item) => {
          let missedThisTime = mistakes.find((m) => m.word === item.word);
          if (missedThisTime) {
            deckMistakes.add(item.word);
          } else {
            deckMistakes.delete(item.word);
          }
        });
        savedDecks[deckIndex].mistakes = Array.from(deckMistakes);
        localStorage.setItem("vocaDecks", JSON.stringify(savedDecks));
      }
    }
  }
  // --------------------------------------------------------

  document.getElementById("progressContainer").style.display = "none";
  const statsArea = document.getElementById("statsArea");
  statsArea.style.display = "block";

  let percent = Math.round((correctAnswers / totalQuestions) * 100);
  if (percent === 100)
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

  let feedback =
    percent === 100
      ? "Tuyệt đỉnh! Không chê vào đâu được! 🏆"
      : percent >= 70
        ? "Rất tốt! Cố lên chút nữa là hoàn hảo! 👍"
        : "Đừng buồn, luyện tập thêm là sẽ giỏi thôi! 💪";

  let html = `
          <div class="stats-title">📊 KẾT QUẢ BÀI HỌC</div>
          <div style="font-size:22px; font-weight:800; color:var(--text-color); margin-bottom:10px;">Đúng ${correctAnswers} / ${totalQuestions} câu (${percent}%)</div>
          <p style="color:#7f8c8d; font-weight:600; margin-bottom:20px;">${feedback}</p>
        `;

  if (mistakes.length > 0) {
    html += `<div style="text-align:left; background:#fff; padding:20px; border-radius:15px; border:2px dashed #f1c40f;">
            <strong style="font-size:18px; color:var(--danger-dark); display:block; margin-bottom:15px;">⚠️ Danh sách các từ cần chú ý:</strong>`;
    mistakes.forEach((err) => {
      html += `<div style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
              <span style="font-weight:700;">${err.question}</span><br>
              <span style="color:var(--danger);">❌ Bạn điền: "${err.userAnswer}"</span><br>
              <span style="color:var(--success-dark); font-weight:700;">✅ Đáp án chuẩn: "${err.correct}"</span>
            </div>`;
    });
    html += `</div>`;
    html += `<button class="main-btn btn-spell" style="margin-top:20px; width:100%;" onclick="redoMistakes('${mode}')">🔄 Ôn tập riêng các từ sai</button>`;
  }

  html += `<button class="main-btn btn-quiz" style="margin-top:15px; width:100%;" onclick="goBackToDashboard()">Về tủ từ vựng / Làm bài khác</button>`;
  statsArea.innerHTML = html;
  statsArea.scrollIntoView({ behavior: "smooth" });
}

window.redoMistakes = (mode) => {
  let mistakeWords = mistakes.map((err) => err.word.toLowerCase());
  preparedData = preparedData.filter((item) =>
    mistakeWords.includes(item.word.toLowerCase()),
  );
  window.preparedData = preparedData; // Expose to window for listening

  document.getElementById("statsArea").style.display = "none";
  document.getElementById("quizArea").innerHTML = "";

  startApp(mode);
};

// -------------------------------------------------------------
// ============================================================================
// NGHE TỪ VỰNG - ĐƠNGIẢN & TRỰC TIẾP (copy từ speakWord logic)
// ============================================================================

let isListening = false;
let listenTimeoutIds = [];

// Hàm convert số thành tiếng Anh
const numberToEnglish = (num) => {
  const ones = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  if (num === 0) return "zero";
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100)
    return (
      tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    );
  if (num < 1000) {
    return (
      ones[Math.floor(num / 100)] +
      " hundred" +
      (num % 100 !== 0 ? " " + numberToEnglish(num % 100) : "")
    );
  }
  return num.toString();
};

window.listenWords = function (words, startIdx = 0, endIdx = -1, loops = 1) {
  if (!words || words.length === 0) {
    showToast("Không có từ để đọc!", "error");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showToast("❌ Trình duyệt không hỗ trợ Text-to-Speech!", "error");
    return;
  }

  isListening = true;
  if (endIdx === -1 || endIdx > words.length - 1) endIdx = words.length - 1;
  if (startIdx < 0) startIdx = 0;

  document.getElementById("btnListenStart").style.display = "none";
  document.getElementById("btnListenStop").style.display = "inline-block";
  document.getElementById("listenStatus").style.display = "block";

  let wordIndex = startIdx; // BẮT ĐẦU TỪ startIdx, KHÔNG PHẢI 0!
  let currentLoop = 1;
  let totalDelay = 0;
  let currentNumber = startIdx + 1; // Track số hiển thị (từ 1, 2, 3, ...)

  const playNextWord = () => {
    if (!isListening) return;

    if (wordIndex > endIdx) {
      // Hết từ trong 1 loop
      if (currentLoop < loops) {
        // Còn loop tiếp
        currentLoop++;
        wordIndex = startIdx;
        currentNumber = startIdx + 1; // Reset số hiển thị
        // Delay trước loop tiếp
        const timeoutId = setTimeout(playNextWord, 1500);
        listenTimeoutIds.push(timeoutId);
        return;
      } else {
        // Hết tất cả loops
        document.getElementById("listenStatus").innerHTML =
          "<b style='color: var(--primary);'>✅ Hoàn thành!</b>";
        setTimeout(() => window.stopListen(), 1500);
        return;
      }
    }

    const word = words[wordIndex];
    if (!word) {
      wordIndex++;
      currentNumber++;
      playNextWord();
      return;
    }

    // Update UI
    document.getElementById("listenStatus").innerHTML =
      `<b style="font-size:20px; color: var(--primary);">${currentNumber}. ${word.word}</b>
       <div style="font-size:14px; color:#7f8c8d; margin-top:8px;">${word.definition}</div>
       <div style="font-size:12px; color:#95a5a6; margin-top:5px;">Lặp ${currentLoop}/${loops}</div>`;

    // Lấy voices
    let voices = window.speechSynthesis.getVoices();
    let enVoice = voices.find((v) => v.lang === "en-US" || v.lang === "en_US");
    let viVoice = voices.find((v) => v.lang === "vi-VN" || v.lang === "vi_VN");

    window.speechSynthesis.cancel();

    let speakDelay = 0;

    // CAPTURE currentNumber trước khi increment!
    const capturedNumber = currentNumber;

    // Đọc số trước (ví dụ: "number one")
    const timeoutId0 = setTimeout(() => {
      if (!isListening) return;
      const numberText = "number " + numberToEnglish(capturedNumber);
      const utterance = new SpeechSynthesisUtterance(numberText);
      if (enVoice) utterance.voice = enVoice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }, speakDelay);
    listenTimeoutIds.push(timeoutId0);
    speakDelay += 1200;

    // Đọc Tiếng Anh (split "/" nếu có)
    const wordVariants = word.word
      .split("/")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    wordVariants.forEach((variant, varIdx) => {
      const timeoutId = setTimeout(() => {
        if (!isListening) return;
        const utterance = new SpeechSynthesisUtterance(variant);
        if (enVoice) utterance.voice = enVoice;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }, speakDelay);
      listenTimeoutIds.push(timeoutId);
      speakDelay += 1800; // Tăng từ 1000 → 1800ms để đủ thời gian đọc từ + delay
    });

    // Đọc Tiếng Việt
    const timeoutId2 = setTimeout(() => {
      if (!isListening) return;
      // Split definition nếu có "/" (ví dụ: "phục vụ / người phục vụ")
      const defVariants = word.definition
        .split("/")
        .map((d) => d.trim())
        .filter((d) => d.length > 0)
        .join(", "); // Join với dấu phẩy để phát âm liền
      const utterance = new SpeechSynthesisUtterance(defVariants);
      if (viVoice) utterance.voice = viVoice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }, speakDelay);
    listenTimeoutIds.push(timeoutId2);
    speakDelay += 2200; // Tăng từ 1500 → 2200ms để đủ thời gian đọc định nghĩa

    // Chuyển từ tiếp theo
    wordIndex++;
    currentNumber++;
    const timeoutId3 = setTimeout(playNextWord, speakDelay);
    listenTimeoutIds.push(timeoutId3);
  };

  playNextWord();
};

window.stopListen = function () {
  isListening = false;
  window.speechSynthesis.cancel();

  // Clear tất cả timeouts
  listenTimeoutIds.forEach((id) => clearTimeout(id));
  listenTimeoutIds = [];

  document.getElementById("listenStatus").style.display = "none";
  document.getElementById("btnListenStart").style.display = "inline-block";
  document.getElementById("btnListenStop").style.display = "none";
};

// Mở modal nghe từ courseData
window.openListenModal = function (courseId, lessonId) {
  const course = courseData.find((c) => c.id === courseId);
  if (!course) return;
  const lesson = course.lessons.find((l) => l.id === lessonId);
  if (!lesson) return;

  const start = 1;
  const end = Math.min(10, lesson.words.length);
  const reps = 2;

  document.getElementById("listenStart").value = start;
  document.getElementById("listenEnd").value = end;
  document.getElementById("listenEnd").max = lesson.words.length;
  document.getElementById("listenRepetitions").value = reps;
  document.getElementById("listenStatus").style.display = "none";
  document.getElementById("btnListenStart").style.display = "inline-block";
  document.getElementById("btnListenStop").style.display = "none";

  const overlay = document.getElementById("listenOverlay");
  overlay.classList.add("show");

  // Set global data
  window.currentListenWords = lesson.words;
};

// Mở modal nghe từ preparedData (preview)
// Auto start listening (fromvocabulary preview)
window.startListeningNow = function () {
  if (!preparedData || preparedData.length === 0) {
    showToast("Không có từ để đọc!", "error");
    return;
  }

  window.currentListenWords = preparedData;
  // Mặc định: từ 1-10, 2 lần
  const start = 0;
  const end = Math.min(9, preparedData.length - 1);
  const reps = 2;

  window.listenWords(preparedData, start, end, reps);
};

// Open settings modal for preview page
window.openListenSettings = function () {
  if (!preparedData || preparedData.length === 0) {
    showToast("Không có từ để đọc!", "error");
    return;
  }

  // Set global data
  window.currentListenWords = preparedData;

  // Show modal settings
  document.getElementById("listenStart").value = 1;
  document.getElementById("listenEnd").value = Math.min(
    10,
    preparedData.length,
  );
  document.getElementById("listenEnd").max = preparedData.length;
  document.getElementById("listenRepetitions").value = 2;
  document.getElementById("listenStatus").style.display = "none";
  document.getElementById("btnListenStart").style.display = "inline-block";
  document.getElementById("btnListenStop").style.display = "none";

  const overlay = document.getElementById("listenOverlay");
  overlay.classList.add("show");
};

// Legacy function for backward compatibility
window.openListenFromPreview = function () {
  window.openListenSettings();
};

window.closeListenModal = function () {
  document.getElementById("listenOverlay").classList.remove("show");
  window.stopListen();
};

// Hàm xử lý click button "Bắt đầu"
window.handleListenStart = function () {
  if (isListening) {
    showToast("Đang đọc, chờ chút...", "warning");
    return;
  }

  const start = parseInt(document.getElementById("listenStart").value) || 1;
  let end = parseInt(document.getElementById("listenEnd").value) || 10;
  const reps =
    parseInt(document.getElementById("listenRepetitions").value) || 1;
  const words = window.currentListenWords || [];

  if (words.length === 0) {
    showToast("Không có từ để đọc!", "error");
    return;
  }

  // Validate: end không được vượt quá số từ vựng
  if (end > words.length) {
    showToast(
      `⚠️ Chỉ có ${words.length} từ! Chỉnh "Đến từ số" thành ${words.length}`,
      "warning",
    );
    end = words.length;
    document.getElementById("listenEnd").value = end;
  }

  // Validate: end phải >= start
  if (end < start) {
    showToast("❌ 'Đến từ số' phải lớn hơn 'Từ số'!", "error");
    return;
  }

  window.listenWords(words, start - 1, end - 1, reps);
};

// Bind event listeners
document.addEventListener("DOMContentLoaded", function () {
  const btnStart = document.getElementById("btnListenStart");
  if (btnStart) {
    btnStart.onclick = window.handleListenStart;
  }

  const btnStop = document.getElementById("btnListenStop");
  if (btnStop) {
    btnStop.onclick = window.stopListen;
  }
});
