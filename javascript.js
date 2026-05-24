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

// 🌙 Xử lý Theme (Dark Mode)
function toggleTheme(e) {
  if (e.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
  }
}
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  document.getElementById("checkbox").checked = true;
}

// 🎵 Web Audio API cho Sound Effects (SFX)
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

// === DỮ LIỆU KHÓA HỌC CHUẨN (HARDCODE JSON) ===
const courseData = [
  {
    id: "course-1",
    title: "🌟 Tiếng Anh Giao Tiếp Khởi Điểm",
    lessons: [
      {
        id: "lesson-1",
        title: "Lesson 1: Vocabulary Foundation",
        words: [
          {
            word: "teacher",
            definition: "giáo viên",
            ipa: "/ˈtiːtʃər/",
            pos: "Danh từ (n)",
            imageUrl:
              "https://img.magnific.com/free-photo/front-view-young-beautiful-lady-white-t-shirt-black-jeans-coat-holding-green-book-pen-smiling-white_140725-18658.jpg",
          },
          {
            word: "doctor",
            definition: "bác sĩ",
            ipa: "/ˈdɒktər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "nurse",
            definition: "y tá",
            ipa: "/nɜːrs/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "police officer",
            definition: "cảnh sát",
            ipa: "/pəˈliːs ˈɒfɪsər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "firefighter",
            definition: "lính cứu hỏa",
            ipa: "/ˈfaɪərfaɪtər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "chef",
            definition: "đầu bếp",
            ipa: "/ʃef/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "waiter / waitress",
            definition: "bồi bàn nam / nữ",
            ipa: "/ˈweɪtər/ / /ˈweɪtrəs/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "farmer",
            definition: "nông dân",
            ipa: "/ˈfɑːrmər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "driver",
            definition: "tài xế",
            ipa: "/ˈdraɪvər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "student",
            definition: "học sinh / sinh viên",
            ipa: "/ˈstjuːdənt/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "head",
            definition: "cái đầu",
            ipa: "/hed/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "hair",
            definition: "tóc",
            ipa: "/her/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "face",
            definition: "khuôn mặt",
            ipa: "/feɪs/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "eye",
            definition: "con mắt",
            ipa: "/aɪ/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "ear",
            definition: "lỗ tai",
            ipa: "/ɪr/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "nose",
            definition: "mũi",
            ipa: "/noʊz/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "mouth",
            definition: "miệng",
            ipa: "/maʊθ/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "tooth / teeth",
            definition: "răng (số ít / nhiều)",
            ipa: "/tuːθ/ / /tiːθ/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "neck",
            definition: "cái cổ",
            ipa: "/nek/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "shoulder",
            definition: "vai",
            ipa: "/ˈʃoʊldər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "arm",
            definition: "cánh tay",
            ipa: "/ɑːrm/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "hand",
            definition: "bàn tay",
            ipa: "/hænd/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "finger",
            definition: "ngón tay",
            ipa: "/ˈfɪŋɡər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "leg",
            definition: "đôi chân",
            ipa: "/leɡ/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "knee",
            definition: "đầu gối",
            ipa: "/niː/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "foot / feet",
            definition: "bàn chân (ít / nhiều)",
            ipa: "/fʊt/ / /fiːt/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "wake up",
            definition: "tỉnh giấc",
            ipa: "/weɪk ʌp/",
            pos: "Cụm động từ",
            imageUrl: "",
          },
          {
            word: "get up",
            definition: "thức dậy",
            ipa: "/ɡet ʌp/",
            pos: "Cụm động từ",
            imageUrl: "",
          },
          {
            word: "brush my teeth",
            definition: "đánh răng của tôi",
            ipa: "/brʌʃ maɪ tiːθ/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "wash my face",
            definition: "rửa mặt của tôi",
            ipa: "/wɒʃ maɪ feɪs/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "take a shower",
            definition: "tắm vòi sen",
            ipa: "/teɪk ə ˈʃaʊər/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "get dressed",
            definition: "mặc quần áo",
            ipa: "/ɡet drest/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "have breakfast",
            definition: "ăn sáng",
            ipa: "/hæv ˈbrekfəst/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "go to school",
            definition: "đi học",
            ipa: "/ɡoʊ tə skuːl/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "study",
            definition: "học bài",
            ipa: "/ˈstʌdi/",
            pos: "Động từ (v)",
            imageUrl: "",
          },
          {
            word: "have lunch",
            definition: "ăn trưa",
            ipa: "/hæv lʌntʃ/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "play with friends",
            definition: "chơi với bạn bè",
            ipa: "/pleɪ wɪð frendz/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "do homework",
            definition: "làm bài tập",
            ipa: "/duː ˈhoʊmwɜːrk/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "watch TV",
            definition: "xem tivi",
            ipa: "/wɒtʃ tiːˈviː/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "have dinner",
            definition: "ăn tối",
            ipa: "/hæv ˈdɪnər/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "go to bed",
            definition: "đi ngủ",
            ipa: "/ɡoʊ tə bed/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "read a book",
            definition: "đọc sách",
            ipa: "/riːd ə bʊk/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "listen to music",
            definition: "nghe nhạc",
            ipa: "/ˈlɪsən tə ˈmjuːzɪk/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "clean the room",
            definition: "dọn dẹp phòng",
            ipa: "/kliːn ðə ruːm/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "cook dinner",
            definition: "nấu bữa tối",
            ipa: "/kʊk ˈdɪnər/",
            pos: "Cụm từ",
            imageUrl: "",
          },
          {
            word: "family",
            definition: "gia đình",
            ipa: "/ˈfæməli/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "father / dad",
            definition: "bố / ba",
            ipa: "/ˈfɑːðər/ / /dæd/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "mother / mom",
            definition: "mẹ / má",
            ipa: "/ˈmʌðər/ / /mɒm/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "parents",
            definition: "bố mẹ",
            ipa: "/ˈpeərənts/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "son",
            definition: "con trai",
            ipa: "/sʌn/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "daughter",
            definition: "con gái",
            ipa: "/ˈdɔːtər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "brother",
            definition: "anh/em trai",
            ipa: "/ˈbrʌðər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "sister",
            definition: "chị/em gái",
            ipa: "/ˈsɪstər/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "grandfather / grandpa",
            definition: "ông",
            ipa: "/ˈɡrænfɑːðər/ / /ˈɡræn.pɑː/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "grandmother / grandma",
            definition: "bà",
            ipa: "/ˈɡrænmʌðər/ / /ˈɡræn.mɑː/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "grandparents",
            definition: "ông bà",
            ipa: "/ˈɡrænpeərənts/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "uncle",
            definition: "chú/bác/cậu",
            ipa: "/ˈʌŋkl/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "aunt",
            definition: "cô/dì/bác gái",
            ipa: "/ænt/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "cousin",
            definition: "anh/chị/em họ",
            ipa: "/ˈkʌzn/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "husband",
            definition: "chồng",
            ipa: "/ˈhʌzbənd/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "wife",
            definition: "vợ",
            ipa: "/waɪf/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "nephew",
            definition: "cháu trai",
            ipa: "/ˈnefjuː/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "niece",
            definition: "cháu gái",
            ipa: "/niːs/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "child / children",
            definition: "đứa trẻ / những đứa trẻ",
            ipa: "/tʃaɪld/ / /ˈtʃɪldrən/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
          {
            word: "baby",
            definition: "em bé",
            ipa: "/ˈbeɪbi/",
            pos: "Danh từ (n)",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-2",
        title: "Lesson 2: Daily Actions & Objects",
        words: [
          {
            word: "football",
            pos: "Danh từ (n)",
            ipa: "/ˈfʊtbɔːl/",
            definition: "bóng đá",
            example: "He plays football every weekend.",
            imageUrl: "",
          },
          {
            word: "correct",
            pos: "Tính từ (adj)",
            ipa: "/kəˈrekt/",
            definition: "đúng",
            example: "Your answer is correct.",
            imageUrl: "",
          },
          {
            word: "correct",
            pos: "Động từ (v)",
            ipa: "/kəˈrekt/",
            definition: "sửa",
            example: "The teacher will correct the mistakes.",
            imageUrl: "",
          },
          {
            word: "letter",
            pos: "Danh từ (n)",
            ipa: "/ˈletər/",
            definition: "thư; chữ cái",
            example: "She wrote a formal letter.",
            imageUrl: "",
          },
          {
            word: "lunch",
            pos: "Danh từ (n)",
            ipa: "/lʌntʃ/",
            definition: "bữa trưa",
            example: "We have lunch at noon.",
            imageUrl: "",
          },
          {
            word: "lunch",
            pos: "Động từ (v)",
            ipa: "/lʌntʃ/",
            definition: "ăn trưa",
            example: "They lunched at a café.",
            imageUrl: "",
          },
          {
            word: "manager",
            pos: "Danh từ (n)",
            ipa: "/ˈmænɪdʒər/",
            definition: "quản lý",
            example: "The manager approved the request.",
            imageUrl: "",
          },
          {
            word: "project",
            pos: "Danh từ (n)",
            ipa: "/ˈprɑːdʒekt/",
            definition: "dự án",
            example: "The team completed the project on time.",
            imageUrl: "",
          },
          {
            word: "project",
            pos: "Động từ (v)",
            ipa: "/prəˈdʒekt/",
            definition: "dự đoán; trình chiếu",
            example: "Sales are projected to increase.",
            imageUrl: "",
          },
          {
            word: "stand by",
            pos: "Cụm động từ",
            ipa: "/stænd baɪ/",
            definition: "chờ sẵn; ủng hộ; đứng cạnh",
            example: "Please stand by for further instructions.",
            imageUrl: "",
          },
          {
            word: "look at",
            pos: "Cụm động từ",
            ipa: "/lʊk æt/",
            definition: "nhìn; xem xét",
            example: "The manager will look at the report.",
            imageUrl: "",
          },
          {
            word: "look in",
            pos: "Cụm động từ",
            ipa: "/lʊk ɪn/",
            definition: "ghé thăm nhanh",
            example: "I will look in on the office later.",
            imageUrl: "",
          },
          {
            word: "look out",
            pos: "Cụm động từ",
            ipa: "/lʊk aʊt/",
            definition: "coi chừng",
            example: "Look out! The car is coming.",
            imageUrl: "",
          },
          {
            word: "look through",
            pos: "Cụm động từ",
            ipa: "/lʊk θruː/",
            definition: "xem qua",
            example: "She looked through the documents.",
            imageUrl: "",
          },
          {
            word: "hold",
            pos: "Động từ (v)",
            ipa: "/hoʊld/",
            definition: "giữ; tổ chức",
            example: "The company will hold a meeting.",
            imageUrl: "",
          },
          {
            word: "hold",
            pos: "Danh từ (n)",
            ipa: "/hoʊld/",
            definition: "sự nắm giữ",
            example: "Keep a firm hold on the rope.",
            imageUrl: "",
          },
          {
            word: "wear",
            pos: "Động từ (v)",
            ipa: "/wer/",
            definition: "mặc; đeo",
            example: "She wears a uniform to work.",
            imageUrl: "",
          },
          {
            word: "paint",
            pos: "Động từ (v)",
            ipa: "/peɪnt/",
            definition: "sơn; vẽ",
            example: "They will paint the office.",
            imageUrl: "",
          },
          {
            word: "paint",
            pos: "Danh từ (n)",
            ipa: "/peɪnt/",
            definition: "sơn",
            example: "The wall needs fresh paint.",
            imageUrl: "",
          },
          {
            word: "airplane",
            pos: "Danh từ (n)",
            ipa: "/ˈerpleɪn/",
            definition: "máy bay",
            example: "The airplane landed safely.",
            imageUrl: "",
          },
          {
            word: "drawer",
            pos: "Danh từ (n)",
            ipa: "/drɔːr/",
            definition: "ngăn kéo",
            example: "The files are in the top drawer.",
            imageUrl: "",
          },
          {
            word: "telescope",
            pos: "Danh từ (n)",
            ipa: "/ˈtelɪskoʊp/",
            definition: "kính thiên văn",
            example: "He observed the stars with a telescope.",
            imageUrl: "",
          },
          {
            word: "bicycle",
            pos: "Danh từ (n)",
            ipa: "/ˈbaɪsɪkl/",
            definition: "xe đạp",
            example: "She rides her bicycle to school.",
            imageUrl: "",
          },
          {
            word: "instrument",
            pos: "Danh từ (n)",
            ipa: "/ˈɪnstrəmənt/",
            definition: "nhạc cụ; dụng cụ",
            example: "The surgeon used a medical instrument.",
            imageUrl: "",
          },
          {
            word: "laboratory",
            pos: "Danh từ (n)",
            ipa: "/ˈlæbrətɔːri/",
            definition: "phòng thí nghiệm",
            example: "The experiment was conducted in a laboratory.",
            imageUrl: "",
          },
          {
            word: "equipment",
            pos: "Danh từ (n)",
            ipa: "/ɪˈkwɪpmənt/",
            definition: "thiết bị",
            example: "New equipment was installed.",
            imageUrl: "",
          },
          {
            word: "the front of",
            pos: "Cụm từ",
            ipa: "/ðə frʌnt əv/",
            definition: "phía trước của",
            example: "She stood at the front of the room.",
            imageUrl: "",
          },
          {
            word: "carry",
            pos: "Động từ (v)",
            ipa: "/ˈkæri/",
            definition: "mang, vác",
            example: "He carried a heavy box.",
            imageUrl: "",
          },
          {
            word: "cross",
            pos: "Động từ (v)",
            ipa: "/krɔːs/",
            definition: "băng qua",
            example: "She crossed the street carefully.",
            imageUrl: "",
          },
          {
            word: "examine",
            pos: "Động từ (v)",
            ipa: "/ɪɡˈzæmɪn/",
            definition: "kiểm tra, xem xét",
            example: "The doctor will examine the patient.",
            imageUrl: "",
          },
          {
            word: "handle",
            pos: "Động từ (v)",
            ipa: "/ˈhændl/",
            definition: "xử lý",
            example: "She can handle customer complaints.",
            imageUrl: "",
          },
          {
            word: "move",
            pos: "Động từ (v)",
            ipa: "/muːv/",
            definition: "di chuyển",
            example: "They moved to a new office.",
            imageUrl: "",
          },
          {
            word: "move",
            pos: "Danh từ (n)",
            ipa: "/muːv/",
            definition: "bước đi, hành động",
            example: "That was a smart move.",
            imageUrl: "",
          },
          {
            word: "pack",
            pos: "Động từ (v)",
            ipa: "/pæk/",
            definition: "đóng gói",
            example: "He packed his suitcase.",
            imageUrl: "",
          },
          {
            word: "push",
            pos: "Động từ (v)",
            ipa: "/pʊʃ/",
            definition: "đẩy",
            example: "She pushed the cart.",
            imageUrl: "",
          },
          {
            word: "reach for",
            pos: "Cụm động từ",
            ipa: "/riːtʃ fɔːr/",
            definition: "với lấy",
            example: "He reached for the book.",
            imageUrl: "",
          },
          {
            word: "read",
            pos: "Động từ (v)",
            ipa: "/riːd/",
            definition: "đọc",
            example: "She reads the newspaper daily.",
            imageUrl: "",
          },
          {
            word: "talk",
            pos: "Động từ (v)",
            ipa: "/tɔːk/",
            definition: "nói chuyện",
            example: "They talked about the project.",
            imageUrl: "",
          },
          {
            word: "talk",
            pos: "Danh từ (n)",
            ipa: "/tɔːk/",
            definition: "cuộc nói chuyện",
            example: "We had a long talk.",
            imageUrl: "",
          },
          {
            word: "walk",
            pos: "Động từ (v)",
            ipa: "/wɔːk/",
            definition: "đi bộ",
            example: "She walks to work.",
            imageUrl: "",
          },
          {
            word: "walk",
            pos: "Danh từ (n)",
            ipa: "/wɔːk/",
            definition: "cuộc đi bộ",
            example: "He went for a walk.",
            imageUrl: "",
          },
          {
            word: "produce",
            pos: "Động từ (v)",
            ipa: "/prəˈduːs/",
            definition: "sản xuất",
            example: "The factory produces cars.",
            imageUrl: "",
          },
          {
            word: "produce",
            pos: "Danh từ (n)",
            ipa: "/ˈprɑːduːs/",
            definition: "nông sản",
            example: "Fresh produce is available here.",
            imageUrl: "",
          },
          {
            word: "patient",
            pos: "Danh từ (n)",
            ipa: "/ˈpeɪʃnt/",
            definition: "bệnh nhân",
            example: "The nurse helped the patient.",
            imageUrl: "",
          },
          {
            word: "suitcase",
            pos: "Danh từ (n)",
            ipa: "/ˈsuːtkeɪs/",
            definition: "vali",
            example: "She packed her clothes in a suitcase.",
            imageUrl: "",
          },
          {
            word: "gardener",
            pos: "Danh từ (n)",
            ipa: "/ˈɡɑːrdnər/",
            definition: "người làm vườn",
            example: "The gardener planted new flowers.",
            imageUrl: "",
          },
          {
            word: "empty",
            pos: "Tính từ (adj)",
            ipa: "/ˈempti/",
            definition: "trống rỗng",
            example: "The room is empty.",
            imageUrl: "",
          },
          {
            word: "empty",
            pos: "Động từ (v)",
            ipa: "/ˈempti/",
            definition: "làm trống",
            example: "Please empty the trash bin.",
            imageUrl: "",
          },
          {
            word: "wheelbarrow",
            pos: "Danh từ (n)",
            ipa: "/ˈwiːlbæroʊ/",
            definition: "xe cút kít",
            example: "He pushed a wheelbarrow in the garden.",
            imageUrl: "",
          },
          {
            word: "newspaper",
            pos: "Danh từ (n)",
            ipa: "/ˈnuːzˌpeɪpər/",
            definition: "báo",
            example: "She reads the newspaper every morning.",
            imageUrl: "",
          },
          {
            word: "shore",
            pos: "Danh từ (n)",
            ipa: "/ʃɔːr/",
            definition: "bờ biển",
            example: "They walked along the shore.",
            imageUrl: "",
          },
          {
            word: "change",
            pos: "Động từ (v)",
            ipa: "/tʃeɪndʒ/",
            definition: "thay đổi",
            example: "The company plans to change its policy.",
            imageUrl: "",
          },
          {
            word: "change",
            pos: "Danh từ (n)",
            ipa: "/tʃeɪndʒ/",
            definition: "sự thay đổi",
            example: "There has been a major change in management.",
            imageUrl: "",
          },
          {
            word: "clean",
            pos: "Động từ (v)",
            ipa: "/kliːn/",
            definition: "lau dọn",
            example: "She cleaned the office.",
            imageUrl: "",
          },
          {
            word: "clean",
            pos: "Tính từ (adj)",
            ipa: "/kliːn/",
            definition: "sạch",
            example: "The room is clean.",
            imageUrl: "",
          },
          {
            word: "cook",
            pos: "Động từ (v)",
            ipa: "/kʊk/",
            definition: "nấu ăn",
            example: "He cooks dinner every evening.",
            imageUrl: "",
          },
          {
            word: "cook",
            pos: "Danh từ (n)",
            ipa: "/kʊk/",
            definition: "đầu bếp",
            example: "She works as a restaurant cook.",
            imageUrl: "",
          },
          {
            word: "deliver",
            pos: "Động từ (v)",
            ipa: "/dɪˈlɪvər/",
            definition: "giao hàng; trình bày",
            example: "The company will deliver the package tomorrow.",
            imageUrl: "",
          },
          {
            word: "do",
            pos: "Động từ (v)",
            ipa: "/duː/",
            definition: "làm",
            example: "She does her homework at night.",
            imageUrl: "",
          },
          {
            word: "eat",
            pos: "Động từ (v)",
            ipa: "/iːt/",
            definition: "ăn",
            example: "They are eating lunch.",
            imageUrl: "",
          },
          {
            word: "enter",
            pos: "Động từ (v)",
            ipa: "/ˈentər/",
            definition: "đi vào; nhập (dữ liệu)",
            example: "Please enter your password.",
            imageUrl: "",
          },
          {
            word: "exit",
            pos: "Động từ (v)",
            ipa: "/ˈeksɪt/",
            definition: "đi ra",
            example: "Employees must exit through the main door.",
            imageUrl: "",
          },
          {
            word: "exit",
            pos: "Danh từ (n)",
            ipa: "/ˈeksɪt/",
            definition: "lối ra",
            example: "The exit is on the left.",
            imageUrl: "",
          },
          {
            word: "fish",
            pos: "Động từ (v)",
            ipa: "/fɪʃ/",
            definition: "câu cá",
            example: "They are fishing by the lake.",
            imageUrl: "",
          },
          {
            word: "fish",
            pos: "Danh từ (n)",
            ipa: "/fɪʃ/",
            definition: "cá",
            example: "He caught a large fish.",
            imageUrl: "",
          },
          {
            word: "focus",
            pos: "Động từ (v)",
            ipa: "/ˈfoʊkəs/",
            definition: "tập trung",
            example: "We need to focus on customer service.",
            imageUrl: "",
          },
          {
            word: "focus",
            pos: "Danh từ (n)",
            ipa: "/ˈfoʊkəs/",
            definition: "sự tập trung",
            example: "The main focus is improving quality.",
            imageUrl: "",
          },
          {
            word: "board",
            pos: "Động từ (v)",
            ipa: "/bɔːrd/",
            definition: "lên (tàu, máy bay)",
            example: "Passengers are boarding the plane.",
            imageUrl: "",
          },
          {
            word: "board",
            pos: "Danh từ (n)",
            ipa: "/bɔːrd/",
            definition: "bảng; cái thớt; ban quản trị",
            example: "The notice is on the bulletin board.",
            imageUrl: "",
          },
          {
            word: "food",
            pos: "Danh từ (n)",
            ipa: "/fuːd/",
            definition: "thức ăn",
            example: "The restaurant serves healthy food.",
            imageUrl: "",
          },
          {
            word: "mail",
            pos: "Danh từ (n)",
            ipa: "/meɪl/",
            definition: "thư từ",
            example: "I checked my mail this morning.",
            imageUrl: "",
          },
          {
            word: "mail",
            pos: "Động từ (v)",
            ipa: "/meɪl/",
            definition: "gửi thư",
            example: "She mailed the package yesterday.",
            imageUrl: "",
          },
          {
            word: "construction",
            pos: "Danh từ (n)",
            ipa: "/kənˈstrʌkʃn/",
            definition: "sự xây dựng",
            example: "The bridge is under construction.",
            imageUrl: "",
          },
          {
            word: "construction work",
            pos: "Cụm danh từ",
            ipa: "/kənˈstrʌkʃn wɜːrk/",
            definition: "công việc xây dựng",
            example: "Construction work begins next month.",
            imageUrl: "",
          },
          {
            word: "meal",
            pos: "Danh từ (n)",
            ipa: "/miːl/",
            definition: "bữa ăn",
            example: "Breakfast is my favorite meal.",
            imageUrl: "",
          },
          {
            word: "passenger",
            pos: "Danh từ (n)",
            ipa: "/ˈpæsɪndʒər/",
            definition: "hành khách",
            example: "The passengers are waiting to board.",
            imageUrl: "",
          },
          {
            word: "gather",
            pos: "Động từ (v)",
            ipa: "/ˈɡæðər/",
            definition: "tụ tập; thu thập",
            example: "Employees gathered for a meeting.",
            imageUrl: "",
          },
          {
            word: "gaze at",
            pos: "Cụm động từ",
            ipa: "/ɡeɪz æt/",
            definition: "nhìn chằm chằm",
            example: "She gazed at the painting.",
            imageUrl: "",
          },
          {
            word: "get out of",
            pos: "Cụm động từ",
            ipa: "/ɡet aʊt əv/",
            definition: "ra khỏi",
            example: "He got out of the car.",
            imageUrl: "",
          },
          {
            word: "go up",
            pos: "Cụm động từ",
            ipa: "/ɡoʊ ʌp/",
            definition: "tăng lên; đi lên",
            example: "Prices have gone up recently.",
            imageUrl: "",
          },
          {
            word: "greet",
            pos: "Động từ (v)",
            ipa: "/ɡriːt/",
            definition: "chào hỏi",
            example: "The manager greeted the guests.",
            imageUrl: "",
          },
          {
            word: "sign",
            pos: "Động từ (v)",
            ipa: "/saɪn/",
            definition: "ký tên",
            example: "Please sign the contract.",
            imageUrl: "",
          },
          {
            word: "sign",
            pos: "Danh từ (n)",
            ipa: "/saɪn/",
            definition: "biển báo; chữ ký",
            example: "There is a warning sign ahead.",
            imageUrl: "",
          },
          {
            word: "lay",
            pos: "Động từ (v)",
            ipa: "/leɪ/",
            definition: "đặt xuống (có tân ngữ)",
            example: "She laid the book on the table.",
            imageUrl: "",
          },
          {
            word: "lean",
            pos: "Động từ (v)",
            ipa: "/liːn/",
            definition: "dựa vào",
            example: "He leaned against the wall.",
            imageUrl: "",
          },
          {
            word: "lift",
            pos: "Động từ (v)",
            ipa: "/lɪft/",
            definition: "nhấc lên",
            example: "She lifted the box carefully.",
            imageUrl: "",
          },
          {
            word: "lift",
            pos: "Danh từ (n)",
            ipa: "/lɪft/",
            definition: "thang máy (BrE); sự nâng",
            example: "Take the lift to the 5th floor.",
            imageUrl: "",
          },
          {
            word: "light",
            pos: "Danh từ (n)",
            ipa: "/laɪt/",
            definition: "ánh sáng; đèn",
            example: "The light is very bright.",
            imageUrl: "",
          },
          {
            word: "light",
            pos: "Tính từ (adj)",
            ipa: "/laɪt/",
            definition: "nhẹ",
            example: "This bag is very light.",
            imageUrl: "",
          },
          {
            word: "light",
            pos: "Động từ (v)",
            ipa: "/laɪt/",
            definition: "thắp (đèn, nến)",
            example: "He lit the candle.",
            imageUrl: "",
          },
          {
            word: "outdoor event",
            pos: "Cụm danh từ",
            ipa: "/ˈaʊtdɔːr ɪˈvent/",
            definition: "sự kiện ngoài trời",
            example: "The company hosted an outdoor event.",
            imageUrl: "",
          },
          {
            word: "brick",
            pos: "Danh từ (n)",
            ipa: "/brɪk/",
            definition: "viên gạch",
            example: "The wall is made of bricks.",
            imageUrl: "",
          },
          {
            word: "candle",
            pos: "Danh từ (n)",
            ipa: "/ˈkændl/",
            definition: "cây nến",
            example: "She lit a candle.",
            imageUrl: "",
          },
          {
            word: "a match",
            pos: "Danh từ (n)",
            ipa: "/mætʃ/",
            definition: "que diêm",
            example: "He struck a match to light the fire.",
            imageUrl: "",
          },
          {
            word: "operate",
            pos: "Động từ (v)",
            ipa: "/ˈɑːpəreɪt/",
            definition: "vận hành; phẫu thuật",
            example: "She knows how to operate the machine.",
            imageUrl: "",
          },
          {
            word: "pass",
            pos: "Động từ (v)",
            ipa: "/pæs/",
            definition: "đi ngang qua; vượt qua",
            example: "He passed the building.",
            imageUrl: "",
          },
          {
            word: "pass",
            pos: "Danh từ (n)",
            ipa: "/pæs/",
            definition: "thẻ; vé",
            example: "Show your boarding pass.",
            imageUrl: "",
          },
          {
            word: "pick up",
            pos: "Cụm động từ",
            ipa: "/pɪk ʌp/",
            definition: "nhặt lên; đón",
            example: "She picked up the phone.",
            imageUrl: "",
          },
          {
            word: "point",
            pos: "Động từ (v)",
            ipa: "/pɔɪnt/",
            definition: "chỉ vào",
            example: "He pointed at the screen.",
            imageUrl: "",
          },
          {
            word: "point",
            pos: "Danh từ (n)",
            ipa: "/pɔɪnt/",
            definition: "điểm; ý chính",
            example: "That’s a good point.",
            imageUrl: "",
          },
          {
            word: "put",
            pos: "Động từ (v)",
            ipa: "/pʊt/",
            definition: "đặt",
            example: "She put the keys on the table.",
            imageUrl: "",
          },
          {
            word: "rearrange",
            pos: "Động từ (v)",
            ipa: "/ˌriːəˈreɪndʒ/",
            definition: "sắp xếp lại",
            example: "They rearranged the furniture.",
            imageUrl: "",
          },
          {
            word: "repair",
            pos: "Động từ (v)",
            ipa: "/rɪˈper/",
            definition: "sửa chữa",
            example: "He repaired the computer.",
            imageUrl: "",
          },
          {
            word: "repair",
            pos: "Danh từ (n)",
            ipa: "/rɪˈper/",
            definition: "sự sửa chữa",
            example: "The car is under repair.",
            imageUrl: "",
          },
          {
            word: "rest",
            pos: "Động từ (v)",
            ipa: "/rest/",
            definition: "nghỉ ngơi; tựa vào",
            example: "She rested her head on the desk.",
            imageUrl: "",
          },
          {
            word: "rest",
            pos: "Danh từ (n)",
            ipa: "/rest/",
            definition: "phần còn lại; sự nghỉ ngơi",
            example: "Take a short rest.",
            imageUrl: "",
          },
          {
            word: "pour",
            pos: "Động từ (v)",
            ipa: "/pɔːr/",
            definition: "rót",
            example: "She poured some coffee.",
            imageUrl: "",
          },
          {
            word: "review",
            pos: "Động từ (v)",
            ipa: "/rɪˈvjuː/",
            definition: "xem xét lại",
            example: "The manager will review the report.",
            imageUrl: "",
          },
          {
            word: "review",
            pos: "Danh từ (n)",
            ipa: "/rɪˈvjuː/",
            definition: "bản đánh giá",
            example: "The product received a positive review.",
            imageUrl: "",
          },
          {
            word: "furniture",
            pos: "Danh từ (n)",
            ipa: "/ˈfɜːrnɪtʃər/",
            definition: "đồ nội thất",
            example: "The office bought new furniture.",
            imageUrl: "",
          },
          {
            word: "run",
            pos: "Động từ (v)",
            ipa: "/rʌn/",
            definition: "chạy; vận hành",
            example: "She runs every morning. / He runs a small business.",
            imageUrl: "",
          },
          {
            word: "speak",
            pos: "Động từ (v)",
            ipa: "/spiːk/",
            definition: "nói",
            example: "She speaks three languages.",
            imageUrl: "",
          },
          {
            word: "trim",
            pos: "Động từ (v)",
            ipa: "/trɪm/",
            definition: "cắt tỉa",
            example: "He trimmed the bushes.",
            imageUrl: "",
          },
          {
            word: "type",
            pos: "Động từ (v)",
            ipa: "/taɪp/",
            definition: "đánh máy",
            example: "She is typing a report.",
            imageUrl: "",
          },
          {
            word: "type",
            pos: "Danh từ (n)",
            ipa: "/taɪp/",
            definition: "loại",
            example: "What type of job are you looking for?",
            imageUrl: "",
          },
          {
            word: "unload",
            pos: "Động từ (v)",
            ipa: "/ˌʌnˈloʊd/",
            definition: "dỡ hàng",
            example: "Workers are unloading the truck.",
            imageUrl: "",
          },
          {
            word: "view",
            pos: "Động từ (v)",
            ipa: "/vjuː/",
            definition: "xem",
            example: "Customers can view the products online.",
            imageUrl: "",
          },
          {
            word: "view",
            pos: "Danh từ (n)",
            ipa: "/vjuː/",
            definition: "quang cảnh; quan điểm",
            example: "The hotel has a sea view.",
            imageUrl: "",
          },
          {
            word: "wash",
            pos: "Động từ (v)",
            ipa: "/wɑːʃ/",
            definition: "rửa; giặt",
            example: "She is washing the dishes.",
            imageUrl: "",
          },
          {
            word: "water",
            pos: "Động từ (v)",
            ipa: "/ˈwɔːtər/",
            definition: "tưới nước",
            example: "He is watering the plants.",
            imageUrl: "",
          },
          {
            word: "water",
            pos: "Danh từ (n)",
            ipa: "/ˈwɔːtər/",
            definition: "nước",
            example: "Please drink more water.",
            imageUrl: "",
          },
          {
            word: "wheel",
            pos: "Động từ (v)",
            ipa: "/wiːl/",
            definition: "đẩy (xe có bánh)",
            example: "He wheeled the cart into the store.",
            imageUrl: "",
          },
          {
            word: "wheel",
            pos: "Danh từ (n)",
            ipa: "/wiːl/",
            definition: "bánh xe",
            example: "The car has four wheels.",
            imageUrl: "",
          },
          {
            word: "wipe",
            pos: "Động từ (v)",
            ipa: "/waɪp/",
            definition: "lau, chùi",
            example: "She wiped the table clean.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-3",
        title: "Lesson 3: Places & Objects",
        words: [
          {
            word: "car",
            pos: "Danh từ (n)",
            ipa: "/kɑːr/",
            definition: "xe hơi",
            example: "He parked his car.",
            imageUrl: "",
          },
          {
            word: "boat",
            pos: "Danh từ (n)",
            ipa: "/boʊt/",
            definition: "thuyền nhỏ",
            example: "A boat is sailing on the river.",
            imageUrl: "",
          },
          {
            word: "ship",
            pos: "Danh từ (n)",
            ipa: "/ʃɪp/",
            definition: "tàu lớn",
            example: "The cargo ship arrived.",
            imageUrl: "",
          },
          {
            word: "train",
            pos: "Danh từ (n)",
            ipa: "/treɪn/",
            definition: "tàu hỏa",
            example: "The train is arriving.",
            imageUrl: "",
          },
          {
            word: "airplane",
            pos: "Danh từ (n)",
            ipa: "/ˈerpleɪn/",
            definition: "máy bay",
            example: "The airplane is taking off.",
            imageUrl: "",
          },
          {
            word: "vehicle",
            pos: "Danh từ (n)",
            ipa: "/ˈviːəkl/",
            definition: "phương tiện",
            example: "Many vehicles are parked outside.",
            imageUrl: "",
          },
          {
            word: "bicycle",
            pos: "Danh từ (n)",
            ipa: "/ˈbaɪsɪkl/",
            definition: "xe đạp",
            example: "She rides a bicycle.",
            imageUrl: "",
          },
          {
            word: "truck",
            pos: "Danh từ (n)",
            ipa: "/trʌk/",
            definition: "xe tải",
            example: "The truck is unloading goods.",
            imageUrl: "",
          },
          {
            word: "platform",
            pos: "Danh từ (n)",
            ipa: "/ˈplætfɔːrm/",
            definition: "sân ga",
            example: "Passengers are waiting on the platform.",
            imageUrl: "",
          },
          {
            word: "intersection",
            pos: "Danh từ (n)",
            ipa: "/ˌɪntərˈsekʃn/",
            definition: "ngã tư",
            example: "The accident happened at the intersection.",
            imageUrl: "",
          },
          {
            word: "railway",
            pos: "Danh từ (n)",
            ipa: "/ˈreɪlweɪ/",
            definition: "đường sắt",
            example: "The railway connects two cities.",
            imageUrl: "",
          },
          {
            word: "highway",
            pos: "Danh từ (n)",
            ipa: "/ˈhaɪweɪ/",
            definition: "đường cao tốc",
            example: "The highway is very busy.",
            imageUrl: "",
          },
          {
            word: "dock",
            pos: "Danh từ (n)",
            ipa: "/dɑːk/",
            definition: "bến tàu",
            example: "The ship is at the dock.",
            imageUrl: "",
          },
          {
            word: "cross a bridge",
            pos: "Cụm từ",
            ipa: "/krɔːs ə brɪdʒ/",
            definition: "băng qua cầu",
            example: "They crossed a bridge.",
            imageUrl: "",
          },
          {
            word: "building",
            pos: "Danh từ (n)",
            ipa: "/ˈbɪldɪŋ/",
            definition: "tòa nhà",
            example: "The office building is tall.",
            imageUrl: "",
          },
          {
            word: "bridge",
            pos: "Danh từ (n)",
            ipa: "/brɪdʒ/",
            definition: "cây cầu",
            example: "The bridge spans the river.",
            imageUrl: "",
          },
          {
            word: "area",
            pos: "Danh từ (n)",
            ipa: "/ˈeriə/",
            definition: "khu vực",
            example: "This is a residential area.",
            imageUrl: "",
          },
          {
            word: "stair",
            pos: "Danh từ (n)",
            ipa: "/ster/",
            definition: "bậc thang",
            example: "He sat on the stairs.",
            imageUrl: "",
          },
          {
            word: "step",
            pos: "Danh từ (n)",
            ipa: "/step/",
            definition: "bước chân; bậc",
            example: "She took a step forward.",
            imageUrl: "",
          },
          {
            word: "deserted",
            pos: "Tính từ (adj)",
            ipa: "/dɪˈzɜːrtɪd/",
            definition: "hoang vắng",
            example: "The street was deserted.",
            imageUrl: "",
          },
          {
            word: "lawn",
            pos: "Danh từ (n)",
            ipa: "/lɔːn/",
            definition: "bãi cỏ",
            example: "He is mowing the lawn.",
            imageUrl: "",
          },
          {
            word: "flowerpot",
            pos: "Danh từ (n)",
            ipa: "/ˈflaʊərpɑːt/",
            definition: "chậu hoa",
            example: "A plant is in the flowerpot.",
            imageUrl: "",
          },
          {
            word: "chair",
            pos: "Danh từ (n)",
            ipa: "/tʃer/",
            definition: "ghế",
            example: "She is sitting on a chair.",
            imageUrl: "",
          },
          {
            word: "table",
            pos: "Danh từ (n)",
            ipa: "/ˈteɪbl/",
            definition: "bàn",
            example: "The book is on the table.",
            imageUrl: "",
          },
          {
            word: "furniture",
            pos: "Danh từ (không đếm được)",
            ipa: "/ˈfɜːrnɪtʃər/",
            definition: "đồ nội thất",
            example: "The office has modern furniture.",
            imageUrl: "",
          },
          {
            word: "sofa",
            pos: "Danh từ (n)",
            ipa: "/ˈsoʊfə/",
            definition: "ghế sofa",
            example: "He is lying on the sofa.",
            imageUrl: "",
          },
          {
            word: "drawer",
            pos: "Danh từ (n)",
            ipa: "/drɔːr/",
            definition: "ngăn kéo",
            example: "The files are in the drawer.",
            imageUrl: "",
          },
          {
            word: "cabinet",
            pos: "Danh từ (n)",
            ipa: "/ˈkæbɪnət/",
            definition: "tủ",
            example: "The dishes are in the cabinet.",
            imageUrl: "",
          },
          {
            word: "light",
            pos: "Danh từ (n)",
            ipa: "/laɪt/",
            definition: "đèn; ánh sáng",
            example: "The light is on.",
            imageUrl: "",
          },
          {
            word: "lamp",
            pos: "Danh từ (n)",
            ipa: "/læmp/",
            definition: "đèn bàn",
            example: "A lamp is on the desk.",
            imageUrl: "",
          },
          {
            word: "clock",
            pos: "Danh từ (n)",
            ipa: "/klɑːk/",
            definition: "đồng hồ treo tường",
            example: "The clock shows 10 o’clock.",
            imageUrl: "",
          },
          {
            word: "picture",
            pos: "Danh từ (n)",
            ipa: "/ˈpɪktʃər/",
            definition: "bức tranh",
            example: "There is a picture on the wall.",
            imageUrl: "",
          },
          {
            word: "document",
            pos: "Danh từ (n)",
            ipa: "/ˈdɑːkjəmənt/",
            definition: "tài liệu",
            example: "Please sign the document.",
            imageUrl: "",
          },
          {
            word: "paper",
            pos: "Danh từ (n)",
            ipa: "/ˈpeɪpər/",
            definition: "giấy; bài báo",
            example: "She printed the report on paper.",
            imageUrl: "",
          },
          {
            word: "display",
            pos: "Danh từ (n)",
            ipa: "/dɪˈspleɪ/",
            definition: "sự trưng bày",
            example: "The products are on display.",
            imageUrl: "",
          },
          {
            word: "display",
            pos: "Động từ (v)",
            ipa: "/dɪˈspleɪ/",
            definition: "trưng bày",
            example: "The store displays new items.",
            imageUrl: "",
          },
          {
            word: "organized",
            pos: "Tính từ (adj)",
            ipa: "/ˈɔːrɡənaɪzd/",
            definition: "gọn gàng; có tổ chức",
            example: "The files are neatly organized.",
            imageUrl: "",
          },
          {
            word: "display shelf",
            pos: "Danh từ (n)",
            ipa: "/dɪˈspleɪ ʃelf/",
            definition: "kệ trưng bày",
            example: "The products are on a display shelf.",
            imageUrl: "",
          },
          {
            word: "shirt",
            pos: "Danh từ (n)",
            ipa: "/ʃɜːrt/",
            definition: "áo sơ mi",
            example: "He is wearing a white shirt.",
            imageUrl: "",
          },
          {
            word: "merchandise",
            pos: "Danh từ (không đếm được)",
            ipa: "/ˈmɜːrtʃəndaɪs/",
            definition: "hàng hóa",
            example: "The store sells imported merchandise.",
            imageUrl: "",
          },
          {
            word: "basket",
            pos: "Danh từ (n)",
            ipa: "/ˈbæskɪt/",
            definition: "giỏ",
            example: "She put fruit in a basket.",
            imageUrl: "",
          },
          {
            word: "box",
            pos: "Danh từ (n)",
            ipa: "/bɑːks/",
            definition: "hộp",
            example: "The books are in a box.",
            imageUrl: "",
          },
          {
            word: "carton",
            pos: "Danh từ (n)",
            ipa: "/ˈkɑːrtn/",
            definition: "thùng giấy; hộp (sữa)",
            example: "He opened a milk carton.",
            imageUrl: "",
          },
          {
            word: "container",
            pos: "Danh từ (n)",
            ipa: "/kənˈteɪnər/",
            definition: "thùng chứa",
            example: "Goods are shipped in large containers.",
            imageUrl: "",
          },
          {
            word: "suitcase",
            pos: "Danh từ (n)",
            ipa: "/ˈsuːtkeɪs/",
            definition: "vali",
            example: "She packed her clothes in a suitcase.",
            imageUrl: "",
          },
          {
            word: "book",
            pos: "Danh từ (n)",
            ipa: "/bʊk/",
            definition: "sách",
            example: "A book is on the table.",
            imageUrl: "",
          },
          {
            word: "globe",
            pos: "Danh từ (n)",
            ipa: "/ɡloʊb/",
            definition: "quả địa cầu",
            example: "A globe is displayed in the classroom.",
            imageUrl: "",
          },
          {
            word: "guitar",
            pos: "Danh từ (n)",
            ipa: "/ɡɪˈtɑːr/",
            definition: "đàn guitar",
            example: "He is playing the guitar.",
            imageUrl: "",
          },
          {
            word: "food",
            pos: "Danh từ (n)",
            ipa: "/fuːd/",
            definition: "thức ăn",
            example: "The food looks delicious.",
            imageUrl: "",
          },
          {
            word: "dish",
            pos: "Danh từ (n)",
            ipa: "/dɪʃ/",
            definition: "món ăn; cái đĩa",
            example: "She served a traditional dish.",
            imageUrl: "",
          },
          {
            word: "plant",
            pos: "Danh từ (n)",
            ipa: "/plænt/",
            definition: "cây",
            example: "There is a green plant in the office.",
            imageUrl: "",
          },
          {
            word: "potted plant",
            pos: "Danh từ (n)",
            ipa: "/ˈpɑːtɪd plænt/",
            definition: "cây trồng trong chậu",
            example: "A potted plant is near the window.",
            imageUrl: "",
          },
          {
            word: "fruit",
            pos: "Danh từ (n)",
            ipa: "/fruːt/",
            definition: "trái cây",
            example: "Fresh fruit is on sale.",
            imageUrl: "",
          },
          {
            word: "flower",
            pos: "Danh từ (n)",
            ipa: "/ˈflaʊər/",
            definition: "hoa",
            example: "She bought a flower.",
            imageUrl: "",
          },
          {
            word: "flower arrangements",
            pos: "Danh từ (số nhiều)",
            ipa: "/ˈflaʊər əˈreɪndʒmənts/",
            definition: "bình hoa trang trí",
            example: "The flower arrangements are beautiful.",
            imageUrl: "",
          },
          {
            word: "grassy area",
            pos: "Danh từ (n)",
            ipa: "/ˈɡræsi ˈeriə/",
            definition: "khu vực có cỏ",
            example: "Children are playing in a grassy area.",
            imageUrl: "",
          },
          {
            word: "crop",
            pos: "Danh từ (n)",
            ipa: "/krɑːp/",
            definition: "mùa màng",
            example: "Farmers harvested the rice crop.",
            imageUrl: "",
          },
          {
            word: "ladder",
            pos: "Danh từ (n)",
            ipa: "/ˈlædər/",
            definition: "cái thang",
            example: "He is standing on a ladder.",
            imageUrl: "",
          },
          {
            word: "equipment",
            pos: "Danh từ (không đếm được)",
            ipa: "/ɪˈkwɪpmənt/",
            definition: "thiết bị",
            example: "The gym has modern equipment.",
            imageUrl: "",
          },
          {
            word: "machine",
            pos: "Danh từ (n)",
            ipa: "/məˈʃiːn/",
            definition: "máy móc",
            example: "The machine is operating.",
            imageUrl: "",
          },
          {
            word: "instrument",
            pos: "Danh từ (n)",
            ipa: "/ˈɪnstrəmənt/",
            definition: "dụng cụ; nhạc cụ",
            example: "The surgeon used a medical instrument.",
            imageUrl: "",
          },
          {
            word: "tool",
            pos: "Danh từ (n)",
            ipa: "/tuːl/",
            definition: "công cụ",
            example: "He picked up a tool.",
            imageUrl: "",
          },
          {
            word: "cord",
            pos: "Danh từ (n)",
            ipa: "/kɔːrd/",
            definition: "dây điện",
            example: "The lamp is connected by a cord.",
            imageUrl: "",
          },
          {
            word: "be on display",
            pos: "Cụm từ",
            ipa: "/bi ɑːn dɪˈspleɪ/",
            definition: "được trưng bày",
            example: "The products are on display.",
            imageUrl: "",
          },
          {
            word: "parked",
            pos: "Tính từ (V3)",
            ipa: "/pɑːrkt/",
            definition: "được đậu",
            example: "The cars are parked outside.",
            imageUrl: "",
          },
          {
            word: "arranged",
            pos: "Tính từ (V3)",
            ipa: "/əˈreɪndʒd/",
            definition: "được sắp xếp",
            example: "The chairs are neatly arranged.",
            imageUrl: "",
          },
          {
            word: "placed",
            pos: "Tính từ (V3)",
            ipa: "/pleɪst/",
            definition: "được đặt",
            example: "The books are placed on the shelf.",
            imageUrl: "",
          },
          {
            word: "unoccupied",
            pos: "Tính từ (adj)",
            ipa: "/ˌʌnˈɑːkjupaɪd/",
            definition: "không có người",
            example: "The seats are unoccupied.",
            imageUrl: "",
          },
          {
            word: "lined up",
            pos: "Cụm động từ (V3)",
            ipa: "/laɪnd ʌp/",
            definition: "xếp thành hàng",
            example: "The bottles are lined up.",
            imageUrl: "",
          },
          {
            word: "displayed",
            pos: "Tính từ (V3)",
            ipa: "/dɪˈspleɪd/",
            definition: "được trưng bày",
            example: "The paintings are displayed.",
            imageUrl: "",
          },
          {
            word: "stacked",
            pos: "Tính từ (V3)",
            ipa: "/stækt/",
            definition: "được xếp chồng",
            example: "The boxes are stacked neatly.",
            imageUrl: "",
          },
          {
            word: "attached",
            pos: "Tính từ (V3)",
            ipa: "/əˈtætʃt/",
            definition: "được gắn vào",
            example: "The sign is attached to the wall.",
            imageUrl: "",
          },
          {
            word: "connected",
            pos: "Tính từ (V3)",
            ipa: "/kəˈnektɪd/",
            definition: "được kết nối",
            example: "The device is connected by a cable.",
            imageUrl: "",
          },
          {
            word: "piled up",
            pos: "Cụm động từ (V3)",
            ipa: "/paɪld ʌp/",
            definition: "chất đống",
            example: "Papers are piled up on the desk.",
            imageUrl: "",
          },
          {
            word: "filled with",
            pos: "Cụm tính từ (V3)",
            ipa: "/fɪld wɪð/",
            definition: "được lấp đầy bằng",
            example: "The glass is filled with water.",
            imageUrl: "",
          },
          {
            word: "organized",
            pos: "Tính từ (V3)",
            ipa: "/ˈɔːrɡənaɪzd/",
            definition: "được sắp xếp gọn gàng",
            example: "The files are neatly organized.",
            imageUrl: "",
          },
          {
            word: "posted",
            pos: "Tính từ (V3)",
            ipa: "/ˈpoʊstɪd/",
            definition: "được dán; được đăng",
            example: "A notice is posted on the wall.",
            imageUrl: "",
          },
          {
            word: "set",
            pos: "Tính từ (V3)",
            ipa: "/set/",
            definition: "được bày sẵn",
            example: "The table is set for dinner.",
            imageUrl: "",
          },
          {
            word: "situated",
            pos: "Tính từ (V3)",
            ipa: "/ˈsɪtʃueɪtɪd/",
            definition: "tọa lạc",
            example: "The hotel is situated near the beach.",
            imageUrl: "",
          },
          {
            word: "stocked",
            pos: "Tính từ (V3)",
            ipa: "/stɑːkt/",
            definition: "được dự trữ đầy đủ",
            example: "The shelves are fully stocked.",
            imageUrl: "",
          },
          {
            word: "surrounded",
            pos: "Tính từ (V3)",
            ipa: "/səˈraʊndɪd/",
            definition: "được bao quanh",
            example: "The house is surrounded by trees.",
            imageUrl: "",
          },
          {
            word: "taken out",
            pos: "Cụm từ (V3)",
            ipa: "/ˈteɪkən aʊt/",
            definition: "được lấy ra",
            example: "The trash has been taken out.",
            imageUrl: "",
          },
          {
            word: "turned on",
            pos: "Cụm từ (V3)",
            ipa: "/tɜːrnd ɑːn/",
            definition: "được bật",
            example: "The lights are turned on.",
            imageUrl: "",
          },
          {
            word: "laid out",
            pos: "Cụm từ (V3)",
            ipa: "/leɪd aʊt/",
            definition: "được bày ra",
            example: "The documents are laid out on the desk.",
            imageUrl: "",
          },
          {
            word: "hang",
            pos: "Động từ (v)",
            ipa: "/hæŋ/",
            definition: "treo",
            example: "A jacket is hanging on the wall.",
            imageUrl: "",
          },
          {
            word: "lean",
            pos: "Động từ (v)",
            ipa: "/liːn/",
            definition: "dựa vào",
            example: "He is leaning against the fence.",
            imageUrl: "",
          },
          {
            word: "cast",
            pos: "Động từ (v)",
            ipa: "/kæst/",
            definition: "ném; đổ bóng",
            example: "The tree casts a shadow.",
            imageUrl: "",
          },
          {
            word: "cross",
            pos: "Động từ (v)",
            ipa: "/krɔːs/",
            definition: "băng qua",
            example: "They are crossing the street.",
            imageUrl: "",
          },
          {
            word: "float",
            pos: "Động từ (v)",
            ipa: "/floʊt/",
            definition: "nổi",
            example: "A boat is floating on the water.",
            imageUrl: "",
          },
          {
            word: "grow",
            pos: "Động từ (v)",
            ipa: "/ɡroʊ/",
            definition: "mọc; phát triển",
            example: "Flowers are growing in the garden.",
            imageUrl: "",
          },
          {
            word: "stand",
            pos: "Động từ (v)",
            ipa: "/stænd/",
            definition: "đứng",
            example: "She is standing near the door.",
            imageUrl: "",
          },
          {
            word: "approach",
            pos: "Động từ (v)",
            ipa: "/əˈproʊtʃ/",
            definition: "tiến đến",
            example: "A train is approaching the station.",
            imageUrl: "",
          },
          {
            word: "on display",
            pos: "Cụm giới từ",
            ipa: "/ɑːn dɪˈspleɪ/",
            definition: "đang được trưng bày",
            example: "The products are on display.",
            imageUrl: "",
          },
          {
            word: "on the ground",
            pos: "Cụm giới từ",
            ipa: "/ɑːn ðə ɡraʊnd/",
            definition: "trên mặt đất",
            example: "The tools are lying on the ground.",
            imageUrl: "",
          },
          {
            word: "on a cart",
            pos: "Cụm giới từ",
            ipa: "/ɑːn ə kɑːrt/",
            definition: "trên xe đẩy",
            example: "The boxes are on a cart.",
            imageUrl: "",
          },
          {
            word: "on the highway",
            pos: "Cụm giới từ",
            ipa: "/ɑːn ðə ˈhaɪweɪ/",
            definition: "trên đường cao tốc",
            example: "The cars are traveling on the highway.",
            imageUrl: "",
          },
          {
            word: "on the hill",
            pos: "Cụm giới từ",
            ipa: "/ɑːn ðə hɪl/",
            definition: "trên đồi",
            example: "A house is located on the hill.",
            imageUrl: "",
          },
          {
            word: "on the shelves",
            pos: "Cụm giới từ",
            ipa: "/ɑːn ðə ʃelvz/",
            definition: "trên các kệ",
            example: "The merchandise is on the shelves.",
            imageUrl: "",
          },
          {
            word: "on either side of",
            pos: "Cụm giới từ",
            ipa: "/ɑːn ˈaɪðər saɪd əv/",
            definition: "ở hai bên của",
            example: "Trees are planted on either side of the road.",
            imageUrl: "",
          },
          {
            word: "on each side of",
            pos: "Cụm giới từ",
            ipa: "/ɑːn iːtʃ saɪd əv/",
            definition: "ở mỗi bên của",
            example: "There are chairs on each side of the table.",
            imageUrl: "",
          },
          {
            word: "in a vehicle",
            pos: "Cụm giới từ",
            ipa: "/ɪn ə ˈviːəkl/",
            definition: "trong phương tiện",
            example: "People are sitting in a vehicle.",
            imageUrl: "",
          },
          {
            word: "in the corner",
            pos: "Cụm giới từ",
            ipa: "/ɪn ðə ˈkɔːrnər/",
            definition: "trong góc",
            example: "A plant is in the corner.",
            imageUrl: "",
          },
          {
            word: "in the parking area",
            pos: "Cụm giới từ",
            ipa: "/ɪn ðə ˈpɑːrkɪŋ ˈeriə/",
            definition: "trong khu đậu xe",
            example: "Several cars are parked in the parking area.",
            imageUrl: "",
          },
          {
            word: "in the middle of the room",
            pos: "Cụm giới từ",
            ipa: "/ɪn ðə ˈmɪdl əv ðə ruːm/",
            definition: "ở giữa phòng",
            example: "A table is placed in the middle of the room.",
            imageUrl: "",
          },
          {
            word: "in a line",
            pos: "Cụm giới từ",
            ipa: "/ɪn ə laɪn/",
            definition: "theo một hàng",
            example: "The customers are standing in a line.",
            imageUrl: "",
          },
          {
            word: "in rows",
            pos: "Cụm giới từ",
            ipa: "/ɪn roʊz/",
            definition: "theo nhiều hàng",
            example: "The chairs are arranged in rows.",
            imageUrl: "",
          },
          {
            word: "in a similar style",
            pos: "Cụm giới từ",
            ipa: "/ɪn ə ˈsɪmələr staɪl/",
            definition: "theo phong cách tương tự",
            example: "The houses are built in a similar style.",
            imageUrl: "",
          },
          {
            word: "near the beach",
            pos: "Cụm giới từ",
            ipa: "/nɪr ðə biːtʃ/",
            definition: "gần bãi biển",
            example: "The hotel is near the beach.",
            imageUrl: "",
          },
          {
            word: "near the building's entrance",
            pos: "Cụm giới từ",
            ipa: "/nɪr ðə ˈbɪldɪŋz ˈentrəns/",
            definition: "gần lối vào tòa nhà",
            example: "A guard is standing near the building's entrance.",
            imageUrl: "",
          },
          {
            word: "near the platform",
            pos: "Cụm giới từ",
            ipa: "/nɪr ðə ˈplætfɔːrm/",
            definition: "gần sân ga",
            example: "Passengers are waiting near the platform.",
            imageUrl: "",
          },
          {
            word: "near the dock",
            pos: "Cụm giới từ",
            ipa: "/nɪr ðə dɑːk/",
            definition: "gần bến tàu",
            example: "Boats are anchored near the dock.",
            imageUrl: "",
          },
          {
            word: "beside the path",
            pos: "Cụm giới từ",
            ipa: "/bɪˈsaɪd ðə pæθ/",
            definition: "bên cạnh lối đi",
            example: "Flowers grow beside the path.",
            imageUrl: "",
          },
          {
            word: "beside the entrance",
            pos: "Cụm giới từ",
            ipa: "/bɪˈsaɪd ði ˈentrəns/",
            definition: "bên cạnh lối vào",
            example: "A sign is posted beside the entrance.",
            imageUrl: "",
          },
          {
            word: "by the doorway",
            pos: "Cụm giới từ",
            ipa: "/baɪ ðə ˈdɔːrweɪ/",
            definition: "gần ngay cửa ra vào",
            example: "A chair is placed by the doorway.",
            imageUrl: "",
          },
          {
            word: "by size",
            pos: "Cụm giới từ",
            ipa: "/baɪ saɪz/",
            definition: "theo kích cỡ",
            example: "The items are arranged by size.",
            imageUrl: "",
          },
          {
            word: "around the table",
            pos: "Cụm giới từ",
            ipa: "/əˈraʊnd ðə ˈteɪbl/",
            definition: "xung quanh bàn",
            example: "People are sitting around the table.",
            imageUrl: "",
          },
          {
            word: "at the station",
            pos: "Cụm giới từ",
            ipa: "/æt ðə ˈsteɪʃn/",
            definition: "tại nhà ga",
            example: "The train is arriving at the station.",
            imageUrl: "",
          },
          {
            word: "under construction",
            pos: "Cụm tính từ",
            ipa: "/ˈʌndər kənˈstrʌkʃn/",
            definition: "đang được xây dựng",
            example: "The building is under construction.",
            imageUrl: "",
          },
          {
            word: "behind the sofa",
            pos: "Cụm giới từ",
            ipa: "/bɪˈhaɪnd ðə ˈsoʊfə/",
            definition: "phía sau ghế sofa",
            example: "A lamp is placed behind the sofa.",
            imageUrl: "",
          },
          {
            word: "between the cabinets",
            pos: "Cụm giới từ",
            ipa: "/bɪˈtwiːn ðə ˈkæbɪnəts/",
            definition: "ở giữa các tủ",
            example: "A refrigerator is between the cabinets.",
            imageUrl: "",
          },
          {
            word: "over the water",
            pos: "Cụm giới từ",
            ipa: "/ˈoʊvər ðə ˈwɔːtər/",
            definition: "phía trên mặt nước",
            example: "A bridge extends over the water.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-4",
        title: "Lesson 4: Travel & Transportation",
        words: [
          {
            word: "taxi",
            pos: "Danh từ (n)",
            ipa: "/ˈtæk.si/",
            definition: "xe taxi",
            example: "We took a taxi from the airport to the hotel.",
            imageUrl: "",
          },
          {
            word: "bus",
            pos: "Danh từ (n)",
            ipa: "/bʌs/",
            definition: "xe buýt",
            example: "The last bus leaves at 10 p.m.",
            imageUrl: "",
          },
          {
            word: "subway / metro",
            pos: "Danh từ (n)",
            ipa: "/ˈsʌb.weɪ/ /ˈmet.rəʊ/",
            definition: "tàu điện ngầm",
            example: "I take the subway to work every morning.",
            imageUrl: "",
          },
          {
            word: "train",
            pos: "Danh từ (n)",
            ipa: "/treɪn/",
            definition: "tàu hỏa",
            example: "The train to Berlin leaves in 10 minutes.",
            imageUrl: "",
          },
          {
            word: "travel",
            pos: "Động từ (v)",
            ipa: "/ˈtræv.əl/",
            definition: "đi du lịch",
            example: "I often travel abroad for work.",
            imageUrl: "",
          },
          {
            word: "travel",
            pos: "Danh từ (n)",
            ipa: "/ˈtræv.əl/",
            definition: "chuyến đi",
            example: "Travel is good for the soul.",
            imageUrl: "",
          },
          {
            word: "traveler",
            pos: "Danh từ (n)",
            ipa: "/ˈtræv.ə.lər/",
            definition: "du khách",
            example: "The traveler showed his passport at customs.",
            imageUrl: "",
          },
          {
            word: "traveling",
            pos: "Danh từ (n)",
            ipa: "/ˈtræv.əlɪŋ/",
            definition: "việc đi du lịch",
            example: "Traveling helps you learn about other cultures.",
            imageUrl: "",
          },
          {
            word: "traveling",
            pos: "Tính từ (adj)",
            ipa: "/ˈtræv.əlɪŋ/",
            definition: "đi du lịch",
            example: "He has a traveling job.",
            imageUrl: "",
          },
          {
            word: "tourist",
            pos: "Danh từ (n)",
            ipa: "/ˈtʊə.rɪst/",
            definition: "khách du lịch",
            example: "Many tourists visit Ha Long Bay every year.",
            imageUrl: "",
          },
          {
            word: "tourism",
            pos: "Danh từ (n)",
            ipa: "/ˈtʊə.rɪ.zəm/",
            definition: "ngành du lịch",
            example: "Tourism plays a vital role in the economy.",
            imageUrl: "",
          },
          {
            word: "journey",
            pos: "Danh từ (n)",
            ipa: "/ˈdʒɜː.ni/",
            definition: "hành trình, chuyến đi",
            example: "The journey took three hours by train.",
            imageUrl: "",
          },
          {
            word: "trip",
            pos: "Danh từ (n)",
            ipa: "/trɪp/",
            definition: "chuyến đi ngắn",
            example: "We took a weekend trip to the mountains.",
            imageUrl: "",
          },
          {
            word: "flight",
            pos: "Danh từ (n)",
            ipa: "/flaɪt/",
            definition: "chuyến bay",
            example: "Our flight to Tokyo departs at 7 p.m.",
            imageUrl: "",
          },
          {
            word: "airplane / aeroplane",
            pos: "Danh từ (n)",
            ipa: "/ˈeə.pleɪn/",
            definition: "máy bay",
            example: "The airplane is landing at the airport.",
            imageUrl: "",
          },
          {
            word: "airport",
            pos: "Danh từ (n)",
            ipa: "/ˈeə.pɔːt/",
            definition: "sân bay",
            example: "The airport was crowded this morning.",
            imageUrl: "",
          },
          {
            word: "terminal",
            pos: "Danh từ (n)",
            ipa: "/ˈtɜː.mɪ.nəl/",
            definition: "nhà ga (trong sân bay)",
            example: "We arrived at Terminal 2 for our flight.",
            imageUrl: "",
          },
          {
            word: "gate",
            pos: "Danh từ (n)",
            ipa: "/ɡeɪt/",
            definition: "cổng ra máy bay",
            example: "Please go to gate 15 for boarding.",
            imageUrl: "",
          },
          {
            word: "board",
            pos: "Động từ (v)",
            ipa: "/bɔːd/",
            definition: "lên tàu / máy bay",
            example: "Passengers are now boarding the plane.",
            imageUrl: "",
          },
          {
            word: "boarding",
            pos: "Danh từ (n)",
            ipa: "/ˈbɔː.dɪŋ/",
            definition: "việc lên tàu / máy bay",
            example: "Boarding starts 45 minutes before departure.",
            imageUrl: "",
          },
          {
            word: "passport",
            pos: "Danh từ (n)",
            ipa: "/ˈpɑːs.pɔːt/",
            definition: "hộ chiếu",
            example: "Don’t forget to bring your passport.",
            imageUrl: "",
          },
          {
            word: "visa",
            pos: "Danh từ (n)",
            ipa: "/ˈviː.zə/",
            definition: "thị thực",
            example: "You need a visa to enter the country.",
            imageUrl: "",
          },
          {
            word: "luggage / baggage",
            pos: "Danh từ (không đếm được)",
            ipa: "/ˈlʌɡ.ɪdʒ/",
            definition: "hành lý",
            example: "Please don’t leave your luggage unattended.",
            imageUrl: "",
          },
          {
            word: "suitcase",
            pos: "Danh từ (n)",
            ipa: "/ˈsuːt.keɪs/",
            definition: "va li",
            example: "He packed his clothes in a big suitcase.",
            imageUrl: "",
          },
          {
            word: "carry-on",
            pos: "Danh từ (n)",
            ipa: "/ˈkær.i ɒn/",
            definition: "hành lý xách tay",
            example: "You can take one carry-on bag on the plane.",
            imageUrl: "",
          },
          {
            word: "check-in",
            pos: "Danh từ (n)",
            ipa: "/ˈtʃek ɪn/",
            definition: "thủ tục làm kiểm tra",
            example: "Please proceed to the check-in.",
            imageUrl: "",
          },
          {
            word: "check-in",
            pos: "Động từ (v)",
            ipa: "/ˈtʃek ɪn/",
            definition: "làm thủ tục (nhận phòng / lên máy bay)",
            example: "Please check in at the counter.",
            imageUrl: "",
          },
          {
            word: "check-out",
            pos: "Danh từ (n)",
            ipa: "/ˈtʃek aʊt/",
            definition: "thủ tục trả phòng",
            example: "The check-out is before noon.",
            imageUrl: "",
          },
          {
            word: "check-out",
            pos: "Động từ (v)",
            ipa: "/ˈtʃek aʊt/",
            definition: "làm thủ tục trả phòng",
            example: "We will check out before noon.",
            imageUrl: "",
          },
          {
            word: "passport control",
            pos: "Danh từ (n)",
            ipa: "/ˈpɑːs.pɔːt kənˌtrəʊl/",
            definition: "khu kiểm tra hộ chiếu",
            example: "The line at passport control was long.",
            imageUrl: "",
          },
          {
            word: "customs",
            pos: "Danh từ (n)",
            ipa: "/ˈkʌs.təmz/",
            definition: "hải quan",
            example: "The officer checked our bags at customs.",
            imageUrl: "",
          },
          {
            word: "ticket",
            pos: "Danh từ (n)",
            ipa: "/ˈtɪk.ɪt/",
            definition: "vé",
            example: "I bought a ticket to Paris online.",
            imageUrl: "",
          },
          {
            word: "reserve",
            pos: "Động từ (v)",
            ipa: "/rɪˈzɜːv/",
            definition: "đặt trước",
            example: "We reserved a table for two.",
            imageUrl: "",
          },
          {
            word: "reservation",
            pos: "Danh từ (n)",
            ipa: "/ˌrez.əˈveɪ.ʃən/",
            definition: "đặt chỗ, đặt phòng",
            example: "I made a reservation at the Hilton Hotel.",
            imageUrl: "",
          },
          {
            word: "hotel",
            pos: "Danh từ (n)",
            ipa: "/həʊˈtel/",
            definition: "khách sạn",
            example: "The hotel offers free breakfast.",
            imageUrl: "",
          },
          {
            word: "hostel",
            pos: "Danh từ (n)",
            ipa: "/ˈhɒs.təl/",
            definition: "nhà trọ, ký túc xá",
            example: "We stayed in a cheap hostel near the station.",
            imageUrl: "",
          },
          {
            word: "accommodation",
            pos: "Danh từ (n)",
            ipa: "/əˌkɒm.əˈdeɪ.ʃən/",
            definition: "chỗ ở",
            example: "Finding accommodation in London can be expensive.",
            imageUrl: "",
          },
          {
            word: "platform",
            pos: "Danh từ (n)",
            ipa: "/ˈplæt.fɔːm/",
            definition: "sân ga",
            example: "Please wait on platform 3.",
            imageUrl: "",
          },
          {
            word: "route",
            pos: "Danh từ (n)",
            ipa: "/ruːt/",
            definition: "tuyến đường",
            example: "This is the fastest route to the airport.",
            imageUrl: "",
          },
          {
            word: "map",
            pos: "Danh từ (n)",
            ipa: "/mæp/",
            definition: "bản đồ",
            example: "I used a map to find the restaurant.",
            imageUrl: "",
          },
          {
            word: "direction",
            pos: "Danh từ (n)",
            ipa: "/daɪˈrek.ʃən/",
            definition: "chỉ đường, hướng đi",
            example: "Can you give me directions to the station?",
            imageUrl: "",
          },
          {
            word: "delay",
            pos: "Động từ (v)",
            ipa: "/dɪˈleɪ/",
            definition: "hoãn",
            example: "The flight was delayed due to bad weather.",
            imageUrl: "",
          },
          {
            word: "delay",
            pos: "Danh từ (n)",
            ipa: "/dɪˈleɪ/",
            definition: "sự chậm trễ",
            example: "There will be a delay.",
            imageUrl: "",
          },
          {
            word: "delayed",
            pos: "Tính từ (adj)",
            ipa: "/dɪˈleɪd/",
            definition: "bị hoãn",
            example: "The delayed flight will depart soon.",
            imageUrl: "",
          },
          {
            word: "planner",
            pos: "Danh từ (n)",
            ipa: "/ˈplæn.ər/",
            definition: "người lập kế hoạch",
            example: "A travel planner can help organize your trip.",
            imageUrl: "",
          },
          {
            word: "itinerary",
            pos: "Danh từ (n)",
            ipa: "/aɪˈtɪn.ər.əri/",
            definition: "lịch trình",
            example: "Our travel itinerary includes five cities.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-5",
        title: "Lesson 5: Shopping, Business & Actions",
        words: [
          {
            word: "advertise",
            pos: "Động từ (v)",
            ipa: "/ˈæd.və.taɪz/",
            definition: "quảng cáo",
            example: "They advertise their new product online.",
            imageUrl: "",
          },
          {
            word: "advertisement",
            pos: "Danh từ (n)",
            ipa: "/ədˈvɜː.tɪs.mənt/",
            definition: "quảng cáo",
            example: "I saw an advertisement for a new smartphone.",
            imageUrl: "",
          },
          {
            word: "advertising",
            pos: "Danh từ (n)",
            ipa: "/ˈæd.və.taɪ.zɪŋ/",
            definition: "ngành quảng cáo",
            example: "She works in an advertising company.",
            imageUrl: "",
          },
          {
            word: "as soon as",
            pos: "Liên từ (conj)",
            ipa: "/æz suːn æz/",
            definition: "ngay khi",
            example: "We will call you as soon as the package arrives.",
            imageUrl: "",
          },
          {
            word: "attract",
            pos: "Động từ (v)",
            ipa: "/əˈtrækt/",
            definition: "thu hút",
            example: "The promotion will attract more customers.",
            imageUrl: "",
          },
          {
            word: "bill",
            pos: "Danh từ (n)",
            ipa: "/bɪl/",
            definition: "hóa đơn, tài khoản",
            example: "The waiter brought the bill to our table.",
            imageUrl: "",
          },
          {
            word: "branch",
            pos: "Danh từ (n)",
            ipa: "/bræntʃ/",
            definition: "chi nhánh",
            example: "The bank opened a new branch downtown.",
            imageUrl: "",
          },
          {
            word: "buy",
            pos: "Động từ (v)",
            ipa: "/baɪ/",
            definition: "mua",
            example: "I usually buy groceries at this market.",
            imageUrl: "",
          },
          {
            word: "buyer",
            pos: "Danh từ (n)",
            ipa: "/ˈbaɪ.ər/",
            definition: "người mua",
            example: "The buyer agreed to pay in cash.",
            imageUrl: "",
          },
          {
            word: "cash",
            pos: "Danh từ (n)",
            ipa: "/kæʃ/",
            definition: "tiền mặt",
            example: "I don’t have enough cash right now.",
            imageUrl: "",
          },
          {
            word: "cashier",
            pos: "Danh từ (n)",
            ipa: "/kæʃˈɪər/",
            definition: "thu ngân",
            example: "The cashier gave me the wrong change.",
            imageUrl: "",
          },
          {
            word: "cheap",
            pos: "Tính từ (adj)",
            ipa: "/tʃiːp/",
            definition: "rẻ",
            example: "These shoes are cheap but comfortable.",
            imageUrl: "",
          },
          {
            word: "choice",
            pos: "Danh từ (n)",
            ipa: "/tʃɔɪs/",
            definition: "sự lựa chọn",
            example: "You have a wide choice of colors.",
            imageUrl: "",
          },
          {
            word: "choose",
            pos: "Động từ (v)",
            ipa: "/tʃuːz/",
            definition: "chọn lựa",
            example: "Please choose the correct size.",
            imageUrl: "",
          },
          {
            word: "choosy",
            pos: "Tính từ (adj)",
            ipa: "/ˈtʃuː.zi/",
            definition: "kén chọn",
            example: "He’s very choosy about his clothes.",
            imageUrl: "",
          },
          {
            word: "clerk",
            pos: "Danh từ (n)",
            ipa: "/klɜːk/",
            definition: "nhân viên bán hàng / thư ký",
            example: "The store clerk helped me find the shoes.",
            imageUrl: "",
          },
          {
            word: "client",
            pos: "Danh từ (n)",
            ipa: "/ˈklaɪ.ənt/",
            definition: "khách hàng (dịch vụ)",
            example: "Our client requested a new contract.",
            imageUrl: "",
          },
          {
            word: "clientele",
            pos: "Danh từ (n)",
            ipa: "/ˌkliː.ɒnˈtel/",
            definition: "nhóm khách hàng",
            example: "The hotel has a wealthy clientele.",
            imageUrl: "",
          },
          {
            word: "cost",
            pos: "Danh từ (n)",
            ipa: "/kɒst/",
            definition: "chi phí",
            example: "The cost of living is high here.",
            imageUrl: "",
          },
          {
            word: "cost",
            pos: "Động từ (v)",
            ipa: "/kɒst/",
            definition: "tốn",
            example: "How much does this shirt cost?",
            imageUrl: "",
          },
          {
            word: "costly",
            pos: "Tính từ (adj)",
            ipa: "/ˈkɒst.li/",
            definition: "đắt tiền",
            example: "Buying a car can be a costly decision.",
            imageUrl: "",
          },
          {
            word: "credit card",
            pos: "Danh từ (n)",
            ipa: "/ˈkred.ɪt ˌkɑːd/",
            definition: "thẻ tín dụng",
            example: "Do you accept credit cards here?",
            imageUrl: "",
          },
          {
            word: "customer",
            pos: "Danh từ (n)",
            ipa: "/ˈkʌs.tə.mər/",
            definition: "khách hàng",
            example: "The customer asked for a refund.",
            imageUrl: "",
          },
          {
            word: "deliver",
            pos: "Động từ (v)",
            ipa: "/dɪˈlɪv.ər/",
            definition: "giao hàng",
            example: "The store delivers products to your home.",
            imageUrl: "",
          },
          {
            word: "delivery",
            pos: "Danh từ (n)",
            ipa: "/dɪˈlɪv.ər.i/",
            definition: "việc giao hàng",
            example: "The delivery will arrive this afternoon.",
            imageUrl: "",
          },
          {
            word: "delivery truck",
            pos: "Cụm danh từ",
            ipa: "/dɪˈlɪvəri trʌk/",
            definition: "xe giao hàng",
            example: "The delivery truck arrived this morning.",
            imageUrl: "",
          },
          {
            word: "discount",
            pos: "Danh từ (n)",
            ipa: "/ˈdɪs.kaʊnt/",
            definition: "giảm giá; chiết khấu",
            example: "We offer a 20% discount for members.",
            imageUrl: "",
          },
          {
            word: "discount",
            pos: "Động từ (v)",
            ipa: "/ˈdɪs.kaʊnt/",
            definition: "giảm giá",
            example: "The store discounted all items.",
            imageUrl: "",
          },
          {
            word: "discuss",
            pos: "Động từ (v)",
            ipa: "/dɪˈskʌs/",
            definition: "thảo luận",
            example: "They will discuss the marketing plan.",
            imageUrl: "",
          },
          {
            word: "exchange",
            pos: "Động từ (v)",
            ipa: "/ɪksˈtʃeɪndʒ/",
            definition: "đổi hàng; trao đổi",
            example: "I want to exchange this shirt for a larger size.",
            imageUrl: "",
          },
          {
            word: "exchange",
            pos: "Danh từ (n)",
            ipa: "/ɪksˈtʃeɪndʒ/",
            definition: "sự trao đổi",
            example: "We had a brief exchange.",
            imageUrl: "",
          },
          {
            word: "expensive",
            pos: "Tính từ (adj)",
            ipa: "/ɪkˈspen.sɪv/",
            definition: "đắt đỏ",
            example: "That jacket is too expensive for me.",
            imageUrl: "",
          },
          {
            word: "guarantee",
            pos: "Danh từ (n)",
            ipa: "/ˌɡær.ənˈtiː/",
            definition: "bảo đảm, cam kết",
            example: "This phone has a two-year guarantee.",
            imageUrl: "",
          },
          {
            word: "guarantee",
            pos: "Động từ (v)",
            ipa: "/ˌɡær.ənˈtiː/",
            definition: "bảo đảm",
            example: "We guarantee satisfaction.",
            imageUrl: "",
          },
          {
            word: "launch",
            pos: "Động từ (v)",
            ipa: "/lɔːntʃ/",
            definition: "ra mắt (sản phẩm, dịch vụ)",
            example: "The company will launch a new product next month.",
            imageUrl: "",
          },
          {
            word: "launch",
            pos: "Danh từ (n)",
            ipa: "/lɔːntʃ/",
            definition: "sự ra mắt",
            example: "The launch of the new phone attracted many customers.",
            imageUrl: "",
          },
          {
            word: "loyal customers",
            pos: "Cụm danh từ",
            ipa: "/ˈlɔɪəl ˈkʌstəmərz/",
            definition: "khách hàng trung thành",
            example: "The store offers discounts to loyal customers.",
            imageUrl: "",
          },
          {
            word: "loyalty card",
            pos: "Cụm danh từ",
            ipa: "/ˈlɔɪəlti kɑːrd/",
            definition: "thẻ khách hàng thân thiết",
            example: "Customers can earn points with a loyalty card.",
            imageUrl: "",
          },
          {
            word: "mall",
            pos: "Danh từ (n)",
            ipa: "/mɔːl/",
            definition: "trung tâm thương mại",
            example: "The new mall has more than 100 stores.",
            imageUrl: "",
          },
          {
            word: "market",
            pos: "Danh từ (n)",
            ipa: "/ˈmɑː.kɪt/",
            definition: "chợ",
            example: "They market their products very effectively.",
            imageUrl: "",
          },
          {
            word: "market",
            pos: "Động từ (v)",
            ipa: "/ˈmɑː.kɪt/",
            definition: "tiếp thị",
            example: "They market their products very effectively.",
            imageUrl: "",
          },
          {
            word: "marketing",
            pos: "Danh từ (n)",
            ipa: "/ˈmɑː.kɪ.tɪŋ/",
            definition: "tiếp thị, quảng bá",
            example: "She works in digital marketing.",
            imageUrl: "",
          },
          {
            word: "marketplace",
            pos: "Danh từ (n)",
            ipa: "/ˈmɑː.kɪt.pleɪs/",
            definition: "khu chợ, thị trường",
            example: "Farmers sell their products at the local marketplace.",
            imageUrl: "",
          },
          {
            word: "order",
            pos: "Danh từ (n)",
            ipa: "/ˈɔː.dər/",
            definition: "đơn đặt hàng",
            example: "The order will be shipped today.",
            imageUrl: "",
          },
          {
            word: "order",
            pos: "Động từ (v)",
            ipa: "/ˈɔː.dər/",
            definition: "đặt hàng",
            example: "I ordered a new laptop online.",
            imageUrl: "",
          },
          {
            word: "pay",
            pos: "Động từ (v)",
            ipa: "/peɪ/",
            definition: "trả tiền",
            example: "You can pay by cash or card.",
            imageUrl: "",
          },
          {
            word: "payment",
            pos: "Danh từ (n)",
            ipa: "/ˈpeɪ.mənt/",
            definition: "khoản thanh toán",
            example: "The payment is due next week.",
            imageUrl: "",
          },
          {
            word: "perfume",
            pos: "Danh từ (n)",
            ipa: "/pərˈfjuːm/",
            definition: "nước hoa",
            example: "She bought a bottle of perfume.",
            imageUrl: "",
          },
          {
            word: "price",
            pos: "Danh từ (n)",
            ipa: "/praɪs/",
            definition: "giá",
            example: "The price of fuel is rising again.",
            imageUrl: "",
          },
          {
            word: "pricey",
            pos: "Tính từ (adj)",
            ipa: "/ˈpraɪ.si/",
            definition: "đắt đỏ",
            example: "That restaurant is a bit pricey.",
            imageUrl: "",
          },
          {
            word: "pricing policy",
            pos: "Cụm danh từ",
            ipa: "/ˈpraɪsɪŋ ˈpɑːləsi/",
            definition: "chính sách giá",
            example: "The company changed its pricing policy.",
            imageUrl: "",
          },
          {
            word: "purchase",
            pos: "Danh từ (n)",
            ipa: "/ˈpɜː.tʃəs/",
            definition: "món hàng mua; việc mua hàng",
            example: "Keep the receipt after your purchase.",
            imageUrl: "",
          },
          {
            word: "purchase",
            pos: "Động từ (v)",
            ipa: "/ˈpɜːrtʃəs/",
            definition: "mua",
            example: "Customers can purchase items online.",
            imageUrl: "",
          },
          {
            word: "receipt",
            pos: "Danh từ (n)",
            ipa: "/rɪˈsiːt/",
            definition: "hóa đơn; biên lai",
            example: "Please keep the receipt for refund.",
            imageUrl: "",
          },
          {
            word: "reorder",
            pos: "Động từ (v)",
            ipa: "/ˌriːˈɔː.dər/",
            definition: "đặt lại hàng",
            example: "We need to reorder office supplies.",
            imageUrl: "",
          },
          {
            word: "repay",
            pos: "Động từ (v)",
            ipa: "/rɪˈpeɪ/",
            definition: "hoàn trả",
            example: "He promised to repay the money soon.",
            imageUrl: "",
          },
          {
            word: "return",
            pos: "Theo/Động từ (v)",
            ipa: "/rɪˈtɜːn/",
            definition: "trả lại",
            example: "You can return the item within 7 days.",
            imageUrl: "",
          },
          {
            word: "return",
            pos: "Danh từ (n)",
            ipa: "/rɪˈtɜːn/",
            definition: "sự trả lại",
            example: "Please process the return.",
            imageUrl: "",
          },
          {
            word: "sale",
            pos: "Danh từ (n)",
            ipa: "/seɪl/",
            definition: "việc bán hàng, đợt giảm giá",
            example: "The store is having a big sale this weekend.",
            imageUrl: "",
          },
          {
            word: "sales",
            pos: "Danh từ (số nhiều)",
            ipa: "/seɪlz/",
            definition: "doanh số bán hàng",
            example: "Our sales increased by 15% last quarter.",
            imageUrl: "",
          },
          {
            word: "salesperson",
            pos: "Danh từ (n)",
            ipa: "/ˈseɪlzˌpɜː.sən/",
            definition: "nhân viên bán hàng",
            example: "The salesperson helped me choose a new phone.",
            imageUrl: "",
          },
          {
            word: "sell",
            pos: "Động từ (v)",
            ipa: "/sel/",
            definition: "bán",
            example: "This store sells computers.",
            imageUrl: "",
          },
          {
            word: "seller",
            pos: "Danh từ (n)",
            ipa: "/ˈsel.ər/",
            definition: "người bán",
            example: "The seller offered a 10% discount.",
            imageUrl: "",
          },
          {
            word: "serve",
            pos: "Động từ (v)",
            ipa: "/sɜːv/",
            definition: "phục vụ",
            example: "They serve lunch until 3 p.m.",
            imageUrl: "",
          },
          {
            word: "server",
            pos: "Danh từ (n)",
            ipa: "/ˈsɜː.vər/",
            definition: "người phục vụ",
            example: "The server took our order politely.",
            imageUrl: "",
          },
          {
            word: "service",
            pos: "Danh từ (n)",
            ipa: "/ˈsɜː.vɪs/",
            definition: "dịch vụ",
            example: "The restaurant offers excellent service.",
            imageUrl: "",
          },
          {
            word: "shipment",
            pos: "Danh từ (n)",
            ipa: "/ˈʃɪpmənt/",
            definition: "lô hàng",
            example: "The shipment will arrive tomorrow.",
            imageUrl: "",
          },
          {
            word: "shop",
            pos: "Danh từ (n)",
            ipa: "/ʃɒp/",
            definition: "cửa hàng",
            example: "I like this shop.",
            imageUrl: "",
          },
          {
            word: "shop",
            pos: "Động từ (v)",
            ipa: "/ʃɒp/",
            definition: "mua sắm",
            example: "I like to shop for clothes on weekends.",
            imageUrl: "",
          },
          {
            word: "shopper",
            pos: "Danh từ (n)",
            ipa: "/ˈʃɒp.ər/",
            definition: "người mua hàng",
            example: "The shopper is looking for a new dress.",
            imageUrl: "",
          },
          {
            word: "shopping",
            pos: "Danh từ (n)",
            ipa: "/ˈʃɒp.ɪŋ/",
            definition: "việc mua sắm",
            example: "Online shopping is very convenient.",
            imageUrl: "",
          },
          {
            word: "storage",
            pos: "Danh từ (n)",
            ipa: "/ˈstɔː.rɪdʒ/",
            definition: "sự lưu trữ, kho chứa",
            example: "There isn’t enough storage space in the shop.",
            imageUrl: "",
          },
          {
            word: "store",
            pos: "Danh từ (n)",
            ipa: "/stɔːr/",
            definition: "cửa hàng, kho",
            example: "The store opens at 9 a.m.",
            imageUrl: "",
          },
          {
            word: "store clerk",
            pos: "Cụm danh từ",
            ipa: "/stɔːr klɜːrk/",
            definition: "nhân viên cửa hàng",
            example: "A store clerk helped me find the item.",
            imageUrl: "",
          },
          {
            word: "take longer than expected",
            pos: "Cụm từ",
            ipa: "/teɪk ˈlɔːŋɡər ðæn ɪkˈspektɪd/",
            definition: "mất nhiều thời gian hơn dự kiến",
            example: "The repair may take longer than expected.",
            imageUrl: "",
          },
          {
            word: "warranty",
            pos: "Danh từ (n)",
            ipa: "/ˈwɒr.ən.ti/",
            definition: "bảo hành",
            example: "The warranty covers all manufacturing defects.",
            imageUrl: "",
          },
          {
            word: "select",
            pos: "Động từ (v)",
            ipa: "/sɪˈlekt/",
            definition: "chọn",
            example: "Customers can select items online.",
            imageUrl: "",
          },
          {
            word: "salad dressing",
            pos: "Cụm danh từ",
            ipa: "/ˈsæləd ˈdresɪŋ/",
            definition: "nước sốt salad",
            example: "She added salad dressing to the vegetables.",
            imageUrl: "",
          },
          {
            word: "stack up",
            pos: "Cụm động từ",
            ipa: "/stæk ʌp/",
            definition: "xếp chồng lên",
            example: "The boxes are stacked up near the door.",
            imageUrl: "",
          },
          {
            word: "basket",
            pos: "Danh từ (n)",
            ipa: "/ˈbæskɪt/",
            definition: "cái giỏ",
            example: "She put the fruit in a basket.",
            imageUrl: "",
          },
          {
            word: "adjust",
            pos: "Động từ (v)",
            ipa: "/əˈdʒʌst/",
            definition: "điều chỉnh",
            example: "He adjusted the chair height.",
            imageUrl: "",
          },
          {
            word: "railing",
            pos: "Danh từ (n)",
            ipa: "/ˈreɪlɪŋ/",
            definition: "lan can",
            example: "She leaned on the railing.",
            imageUrl: "",
          },
          {
            word: "reflection",
            pos: "Danh từ (n)",
            ipa: "/rɪˈflekʃn/",
            definition: "sự phản chiếu",
            example: "His reflection appeared in the mirror.",
            imageUrl: "",
          },
          {
            word: "cartons",
            pos: "Danh từ (số nhiều)",
            ipa: "/ˈkɑːrtnz/",
            definition: "thùng giấy",
            example: "Several cartons are stacked in the warehouse.",
            imageUrl: "",
          },
          {
            word: "hand",
            pos: "Động từ (v)",
            ipa: "/hænd/",
            definition: "đưa, trao",
            example: "He handed the documents to the manager.",
            imageUrl: "",
          },
          {
            word: "headset",
            pos: "Danh từ (n)",
            ipa: "/ˈhedset/",
            definition: "tai nghe có mic",
            example: "She is wearing a headset.",
            imageUrl: "",
          },
          {
            word: "tidy",
            pos: "Tính từ (adj)",
            ipa: "/ˈtaɪdi/",
            definition: "gọn gàng",
            example: "The office looks neat and tidy.",
            imageUrl: "",
          },
          {
            word: "scenery",
            pos: "Danh từ (n)",
            ipa: "/ˈsiːnəri/",
            definition: "phong cảnh",
            example: "The mountain scenery is beautiful.",
            imageUrl: "",
          },
          {
            word: "sweater",
            pos: "Danh từ (n)",
            ipa: "/ˈswetər/",
            definition: "áo len",
            example: "She wore a warm sweater.",
            imageUrl: "",
          },
          {
            word: "mountain",
            pos: "Danh từ (n)",
            ipa: "/ˈmaʊntən/",
            definition: "núi",
            example: "They climbed the mountain.",
            imageUrl: "",
          },
          {
            word: "window",
            pos: "Danh từ (n)",
            ipa: "/ˈwɪndoʊ/",
            definition: "cửa sổ",
            example: "The window is open.",
            imageUrl: "",
          },
          {
            word: "mirror",
            pos: "Danh từ (n)",
            ipa: "/ˈmɪrər/",
            definition: "gương",
            example: "She looked at herself in the mirror.",
            imageUrl: "",
          },
          {
            word: "take notes",
            pos: "Cụm động từ",
            ipa: "/teɪk noʊts/",
            definition: "ghi chép",
            example: "Students are taking notes.",
            imageUrl: "",
          },
          {
            word: "hold",
            pos: "Động từ (v)",
            ipa: "/hoʊld/",
            definition: "giữ; tổ chức",
            example: "The company will hold a meeting tomorrow.",
            imageUrl: "",
          },
          {
            word: "take off",
            pos: "Cụm động từ",
            ipa: "/teɪk ɔːf/",
            definition: "cởi ra; cất cánh",
            example: "He took off his jacket.",
            imageUrl: "",
          },
          {
            word: "button up",
            pos: "Cụm động từ",
            ipa: "/ˈbʌtn ʌp/",
            definition: "cài nút",
            example: "She buttoned up her coat.",
            imageUrl: "",
          },
          {
            word: "ladder",
            pos: "Danh từ (n)",
            ipa: "/ˈlædər/",
            definition: "cái thang",
            example: "He climbed a ladder.",
            imageUrl: "",
          },
          {
            word: "pile up",
            pos: "Cụm động từ",
            ipa: "/paɪl ʌp/",
            definition: "chất đống",
            example: "Papers piled up on the desk.",
            imageUrl: "",
          },
          {
            word: "weigh",
            pos: "Động từ (v)",
            ipa: "/weɪ/",
            definition: "cân",
            example: "The clerk weighed the package.",
            imageUrl: "",
          },
          {
            word: "rise",
            pos: "Động từ (v)",
            ipa: "/raɪz/",
            definition: "tăng; mọc lên",
            example: "Prices continue to rise.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-6",
        title: "Lesson 6: Food & Dining",
        words: [
          {
            word: "food",
            pos: "Danh từ (n)",
            ipa: "/fuːd/",
            definition: "thức ăn",
            example: "The restaurant serves delicious food.",
            imageUrl: "",
          },
          {
            word: "meal",
            pos: "Danh từ (n)",
            ipa: "/miːl/",
            definition: "bữa ăn",
            example: "Breakfast is the most important meal of the day.",
            imageUrl: "",
          },
          {
            word: "dish",
            pos: "Danh từ (n)",
            ipa: "/dɪʃ/",
            definition: "món ăn",
            example: "I’d like to try the local dishes.",
            imageUrl: "",
          },
          {
            word: "cuisine",
            pos: "Danh từ (n)",
            ipa: "/kwɪˈziːn/",
            definition: "ẩm thực",
            example: "Italian cuisine is famous around the world.",
            imageUrl: "",
          },
          {
            word: "ingredient",
            pos: "Danh từ (n)",
            ipa: "/ɪnˈɡriːdiənt/",
            definition: "nguyên liệu",
            example: "Fresh ingredients make a big difference in taste.",
            imageUrl: "",
          },
          {
            word: "recipe",
            pos: "Danh từ (n)",
            ipa: "/ˈresəpi/",
            definition: "công thức nấu ăn",
            example: "Do you have the recipe for this cake?",
            imageUrl: "",
          },
          {
            word: "cook",
            pos: "Động từ (v)",
            ipa: "/kʊk/",
            definition: "nấu ăn",
            example: "She loves to cook for her family.",
            imageUrl: "",
          },
          {
            word: "cook",
            pos: "Danh từ (n)",
            ipa: "/kʊk/",
            definition: "đầu bếp",
            example: "She works as a cook at a local restaurant.",
            imageUrl: "",
          },
          {
            word: "cooking",
            pos: "Danh từ (n)",
            ipa: "/ˈkʊkɪŋ/",
            definition: "việc nấu ăn",
            example: "Cooking at home can save a lot of money.",
            imageUrl: "",
          },
          {
            word: "chef",
            pos: "Danh từ (n)",
            ipa: "/ʃef/",
            definition: "bếp trưởng",
            example: "The chef is preparing a special dish tonight.",
            imageUrl: "",
          },
          {
            word: "kitchen",
            pos: "Danh từ (n)",
            ipa: "/ˈkɪtʃɪn/",
            definition: "nhà bếp",
            example: "Please leave your dishes in the kitchen.",
            imageUrl: "",
          },
          {
            word: "restaurant",
            pos: "Danh từ (n)",
            ipa: "/ˈrest(ə)rɒnt/",
            definition: "nhà hàng",
            example: "We had dinner at a fancy restaurant.",
            imageUrl: "",
          },
          {
            word: "cafeteria",
            pos: "Danh từ (n)",
            ipa: "/ˌkæfəˈtɪəriə/",
            definition: "căng tin",
            example: "The office has a small cafeteria for staff.",
            imageUrl: "",
          },
          {
            word: "waiter",
            pos: "Danh từ (n)",
            ipa: "/ˈweɪtə(r)/",
            definition: "bồi bàn nam",
            example: "The waiter brought the menu to our table.",
            imageUrl: "",
          },
          {
            word: "waitress",
            pos: "Danh từ (n)",
            ipa: "/ˈweɪtrəs/",
            definition: "bồi bàn nữ",
            example: "The waitress was very friendly.",
            imageUrl: "",
          },
          {
            word: "serve",
            pos: "Động từ (v)",
            ipa: "/sɜːv/",
            definition: "phục vụ",
            example: "They serve breakfast until 10 a.m.",
            imageUrl: "",
          },
          {
            word: "service",
            pos: "Danh từ (n)",
            ipa: "/ˈsɜːvɪs/",
            definition: "dịch vụ",
            example: "The restaurant is known for its excellent service.",
            imageUrl: "",
          },
          {
            word: "menu",
            pos: "Danh từ (n)",
            ipa: "/ˈmenjuː/",
            definition: "thực đơn",
            example: "Could I see the menu, please?",
            imageUrl: "",
          },
          {
            word: "order",
            pos: "Động từ (v)",
            ipa: "/ˈɔːdə(r)/",
            definition: "gọi món",
            example: "I’d like to order a steak, please.",
            imageUrl: "",
          },
          {
            word: "order",
            pos: "Danh từ (n)",
            ipa: "/ˈɔːdə(r)/",
            definition: "đơn hàng",
            example: "The waiter took our order.",
            imageUrl: "",
          },
          {
            word: "beverage",
            pos: "Danh từ (n)",
            ipa: "/ˈbevərɪdʒ/",
            definition: "đồ uống",
            example: "What kind of beverages do you serve?",
            imageUrl: "",
          },
          {
            word: "drink",
            pos: "Động từ (v)",
            ipa: "/drɪŋk/",
            definition: "uống",
            example: "I drink coffee every morning.",
            imageUrl: "",
          },
          {
            word: "drink",
            pos: "Danh từ (n)",
            ipa: "/drɪŋk/",
            definition: "đồ uống",
            example: "Can I get you a drink?",
            imageUrl: "",
          },
          {
            word: "snack",
            pos: "Danh từ (n)",
            ipa: "/snæk/",
            definition: "đồ ăn nhẹ",
            example: "She bought some snacks for the trip.",
            imageUrl: "",
          },
          {
            word: "appetizer",
            pos: "Danh từ (n)",
            ipa: "/ˈæpɪtaɪzə(r)/",
            definition: "món khai vị",
            example: "We had soup as an appetizer.",
            imageUrl: "",
          },
          {
            word: "main course",
            pos: "Cụm danh từ",
            ipa: "/ˌmeɪn ˈkɔːs/",
            definition: "món chính",
            example: "The main course includes fish or chicken.",
            imageUrl: "",
          },
          {
            word: "dessert",
            pos: "Danh từ (n)",
            ipa: "/dɪˈzɜːt/",
            definition: "món tráng miệng",
            example: "What would you like for dessert?",
            imageUrl: "",
          },
          {
            word: "buffet",
            pos: "Danh từ (n)",
            ipa: "/ˈbʊfeɪ/",
            definition: "tiệc đứng",
            example: "The hotel offers a breakfast buffet.",
            imageUrl: "",
          },
          {
            word: "taste",
            pos: "Động từ (v)",
            ipa: "/teɪst/",
            definition: "nếm",
            example: "Please taste the sauce before serving.",
            imageUrl: "",
          },
          {
            word: "taste",
            pos: "Danh từ (n)",
            ipa: "/teɪst/",
            definition: "vị",
            example: "The soup has a great taste.",
            imageUrl: "",
          },
          {
            word: "tasty",
            pos: "Tính từ (adj)",
            ipa: "/ˈteɪsti/",
            definition: "ngon",
            example: "The pasta was really tasty.",
            imageUrl: "",
          },
          {
            word: "delicious",
            pos: "Tính từ (adj)",
            ipa: "/dɪˈlɪʃəs/",
            definition: "ngon tuyệt",
            example: "The food was absolutely delicious.",
            imageUrl: "",
          },
          {
            word: "flavor",
            pos: "Danh từ (n)",
            ipa: "/ˈfleɪvə(r)/",
            definition: "hương vị",
            example: "This ice cream has a rich chocolate flavor.",
            imageUrl: "",
          },
          {
            word: "spicy",
            pos: "Tính từ (adj)",
            ipa: "/ˈspaɪsi/",
            definition: "cay",
            example: "I like spicy food.",
            imageUrl: "",
          },
          {
            word: "sweet",
            pos: "Tính từ (adj)",
            ipa: "/swiːt/",
            definition: "ngọt",
            example: "The cake is too sweet for me.",
            imageUrl: "",
          },
          {
            word: "salty",
            pos: "Tính từ (adj)",
            ipa: "/ˈsɔːlti/",
            definition: "mặn",
            example: "The soup is a bit salty.",
            imageUrl: "",
          },
          {
            word: "sour",
            pos: "Tính từ (adj)",
            ipa: "/ˈsaʊə(r)/",
            definition: "chua",
            example: "Lemons have a sour taste.",
            imageUrl: "",
          },
          {
            word: "bitter",
            pos: "Tính từ (adj)",
            ipa: "/ˈbɪtə(r)/",
            definition: "đắng",
            example: "Coffee can be bitter without sugar.",
            imageUrl: "",
          },
          {
            word: "fresh",
            pos: "Tính từ (adj)",
            ipa: "/freʃ/",
            definition: "tươi",
            example: "I always buy fresh vegetables.",
            imageUrl: "",
          },
          {
            word: "freshness",
            pos: "Danh từ (n)",
            ipa: "/ˈfreʃnəs/",
            definition: "độ tươi",
            example: "The freshness of seafood is important.",
            imageUrl: "",
          },
          {
            word: "organic",
            pos: "Tính từ (adj)",
            ipa: "/ɔːˈɡænɪk/",
            definition: "hữu cơ",
            example: "Many people prefer organic food.",
            imageUrl: "",
          },
          {
            word: "grocery",
            pos: "Danh từ (n)",
            ipa: "/ˈɡrəʊsəri/",
            definition: "cửa hàng tạp hóa",
            example: "I stopped by the grocery store after work.",
            imageUrl: "",
          },
          {
            word: "supermarket",
            pos: "Danh từ (n)",
            ipa: "/ˈsuːpəmɑːkɪt/",
            definition: "siêu thị",
            example: "There’s a new supermarket near my house.",
            imageUrl: "",
          },
          {
            word: "book",
            pos: "Động từ (v)",
            ipa: "/bʊk/",
            definition: "đặt (bàn, vé)",
            example: "We booked a table for four people.",
            imageUrl: "",
          },
          {
            word: "booking",
            pos: "Danh từ (n)",
            ipa: "/ˈbʊkɪŋ/",
            definition: "sự đặt chỗ",
            example: "Your booking has been confirmed.",
            imageUrl: "",
          },
          {
            word: "dine",
            pos: "Động từ (v)",
            ipa: "/daɪn/",
            definition: "ăn tối",
            example: "They dined at a five-star hotel.",
            imageUrl: "",
          },
          {
            word: "diner",
            pos: "Danh từ (n)",
            ipa: "/ˈdaɪnə(r)/",
            definition: "thực khách",
            example: "The diner enjoyed his meal.",
            imageUrl: "",
          },
          {
            word: "dining",
            pos: "Danh từ (n)",
            ipa: "/ˈdaɪnɪŋ/",
            definition: "việc ăn uống",
            example: "Formal dining requires good manners.",
            imageUrl: "",
          },
          {
            word: "hospitality",
            pos: "Danh từ (n)",
            ipa: "/ˌhɒspɪˈtæləti/",
            definition: "lòng hiếu khách",
            example: "The hospitality at the restaurant was excellent.",
            imageUrl: "",
          },
          {
            word: "culinary",
            pos: "Tính từ (adj)",
            ipa: "/ˈkʌlɪnəri/",
            definition: "thuộc về ẩm thực",
            example: "She attended a famous culinary school in Paris.",
            imageUrl: "",
          },
          {
            word: "delicacy",
            pos: "Danh từ (n)",
            ipa: "/ˈdelɪkəsi/",
            definition: "món đặc sản, cao lương mỹ vị",
            example: "Truffles are considered a delicacy in many countries.",
            imageUrl: "",
          },
          {
            word: "portion",
            pos: "Danh từ (n)",
            ipa: "/ˈpɔːʃn/",
            definition: "khẩu phần ăn/ serving",
            example: "The portions are small but beautifully presented.",
            imageUrl: "",
          },
          {
            word: "refreshment",
            pos: "Danh từ (n)",
            ipa: "/rɪˈfreʃmənt/",
            definition: "đồ ăn, thức uống nhẹ",
            example: "Light refreshments will be served after the meeting.",
            imageUrl: "",
          },
          {
            word: "cater",
            pos: "Động từ (v)",
            ipa: "/ˈkeɪtər/",
            definition: "phục vụ",
            example: "He catered food for 20 people.",
            imageUrl: "",
          },
          {
            word: "caterer",
            pos: "Danh từ (n)",
            ipa: "/ˈkeɪtərə(r)/",
            definition: "nhà cung cấp thức ăn",
            example: "The caterer delivered the meals on time.",
            imageUrl: "",
          },
          {
            word: "catering",
            pos: "Danh từ (n)",
            ipa: "/ˈkeɪtərɪŋ/",
            definition: "dịch vụ cung cấp thức ăn",
            example: "The company provides catering for corporate events.",
            imageUrl: "",
          },
          {
            word: "host",
            pos: "Danh từ (n)",
            ipa: "/həʊst/",
            definition: "chủ nhà",
            example: "The host welcomed everyone warmly.",
            imageUrl: "",
          },
          {
            word: "host",
            pos: "Động từ (v)",
            ipa: "/həʊst/",
            definition: "tổ chức",
            example: "The manager hosted a dinner for the clients.",
            imageUrl: "",
          },
          {
            word: "guest",
            pos: "Danh từ (n)",
            ipa: "/ɡest/",
            definition: "khách",
            example: "Each guest received a complimentary drink.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-7",
        title: "Lesson 7: Dining Details & Ambiance",
        words: [
          {
            word: "reserve",
            pos: "Động từ (v)",
            ipa: "/rɪˈzɜːv/",
            definition: "đặt trước",
            example: "I reserved a table for two at 8 p.m.",
            imageUrl: "",
          },
          {
            word: "reservation",
            pos: "Danh từ (n)",
            ipa: "/ˌrezəˈveɪʃn/",
            definition: "sự đặt chỗ",
            example: "Please confirm your reservation by email.",
            imageUrl: "",
          },
          {
            word: "atmosphere",
            pos: "Danh từ (n)",
            ipa: "/ˈætməsfɪə(r)/",
            definition: "không khí (quán ăn, nhà hàng)",
            example: "The restaurant has a cozy atmosphere.",
            imageUrl: "",
          },
          {
            word: "ambiance",
            pos: "Danh từ (n)",
            ipa: "/ˈæmbiəns/",
            definition: "không gian, bầu không khí",
            example: "The soft lighting creates a romantic ambiance.",
            imageUrl: "",
          },
          {
            word: "establishment",
            pos: "Danh từ (n)",
            ipa: "/ɪˈstæblɪʃmənt/",
            definition: "cơ sở (kinh doanh)",
            example:
              "The dining establishment has been operating for 20 years.",
            imageUrl: "",
          },
          {
            word: "franchise",
            pos: "Danh từ (n)",
            ipa: "/ˈfræntʃaɪz/",
            definition: "nhượng quyền thương hiệu",
            example: "The company owns several restaurant franchises.",
            imageUrl: "",
          },
          {
            word: "chain",
            pos: "Danh từ (n)",
            ipa: "/tʃeɪn/",
            definition: "chuỗi",
            example: "It’s a popular fast-food chain.",
            imageUrl: "",
          },
          {
            word: "outlet",
            pos: "Danh từ (n)",
            ipa: "/ˈaʊtlet/",
            definition: "cửa hàng, chi nhánh",
            example: "There’s a new coffee outlet downtown.",
            imageUrl: "",
          },
          {
            word: "inventory",
            pos: "Danh từ (n)",
            ipa: "/ˈɪnvəntri/",
            definition: "hàng tồn kho",
            example: "The manager checked the food inventory daily.",
            imageUrl: "",
          },
          {
            word: "supply",
            pos: "Danh từ (n)",
            ipa: "/səˈplaɪ/",
            definition: "nguồn cung",
            example: "The supply of fresh ingredients is limited.",
            imageUrl: "",
          },
          {
            word: "supply",
            pos: "Động từ (v)",
            ipa: "/səˈplaɪ/",
            definition: "cung cấp",
            example: "Local farmers supply vegetables to the restaurant.",
            imageUrl: "",
          },
          {
            word: "supplier",
            pos: "Danh từ (n)",
            ipa: "/səˈplaɪə(r)/",
            definition: "nhà cung cấp",
            example: "The supplier delivered the ingredients late.",
            imageUrl: "",
          },
          {
            word: "hygiene",
            pos: "Danh từ (n)",
            ipa: "/ˈhaɪdʒiːn/",
            definition: "vệ sinh",
            example: "Kitchen hygiene is strictly monitored.",
            imageUrl: "",
          },
          {
            word: "sanitary",
            pos: "Tính từ (adj)",
            ipa: "/ˈsænɪtəri/",
            definition: "sạch sẽ, hợp vệ sinh",
            example: "All staff must wear sanitary gloves.",
            imageUrl: "",
          },
          {
            word: "contamination",
            pos: "Danh từ (n)",
            ipa: "/kənˌtæmɪˈneɪʃn/",
            definition: "sự ô nhiễm, nhiễm khuẩn",
            example: "The restaurant was closed due to contamination.",
            imageUrl: "",
          },
          {
            word: "contaminate",
            pos: "Động từ (v)",
            ipa: "/kənˈtæmɪneɪt/",
            definition: "làm ô nhiễm",
            example: "Raw meat can contaminate other foods.",
            imageUrl: "",
          },
          {
            word: "nutritious",
            pos: "Tính từ (adj)",
            ipa: "/njuːˈtrɪʃəs/",
            definition: "bổ dưỡng",
            example: "This soup is both tasty and nutritious.",
            imageUrl: "",
          },
          {
            word: "nutrition",
            pos: "Danh từ (n)",
            ipa: "/njuːˈtrɪʃn/",
            definition: "dinh dưỡng",
            example: "Proper nutrition is essential for good health.",
            imageUrl: "",
          },
          {
            word: "diet",
            pos: "Danh từ (n)",
            ipa: "/ˈdaɪət/",
            definition: "chế độ ăn",
            example: "He’s on a vegetarian diet.",
            imageUrl: "",
          },
          {
            word: "dietary",
            pos: "Tính từ (adj)",
            ipa: "/ˈdaɪətəri/",
            definition: "thuộc chế độ ăn",
            example: "The restaurant offers dietary options.",
            imageUrl: "",
          },
          {
            word: "consume",
            pos: "Động từ (v)",
            ipa: "/kənˈsjuːm/",
            definition: "tiêu thụ",
            example: "Customers consume large amounts of coffee daily.",
            imageUrl: "",
          },
          {
            word: "consumption",
            pos: "Danh từ (n)",
            ipa: "/kənˈsʌmpʃn/",
            definition: "sự tiêu thụ",
            example: "The consumption of fast food is increasing.",
            imageUrl: "",
          },
          {
            word: "calorie",
            pos: "Danh từ (n)",
            ipa: "/ˈkæləri/",
            definition: "calo",
            example: "The salad has fewer calories than the burger.",
            imageUrl: "",
          },
          {
            word: "seasoning",
            pos: "Danh từ (n)",
            ipa: "/ˈsiːzənɪŋ/",
            definition: "gia vị",
            example: "Add some seasoning to enhance the flavor.",
            imageUrl: "",
          },
          {
            word: "condiment",
            pos: "Danh từ (n)",
            ipa: "/ˈkɒndɪmənt/",
            definition: "nước chấm, đồ gia vị",
            example: "Soy sauce is a common condiment in Asia.",
            imageUrl: "",
          },
          {
            word: "utensil",
            pos: "Danh từ (n)",
            ipa: "/juːˈtensl/",
            definition: "dụng cụ nhà bếp",
            example: "Use clean utensils for cooking.",
            imageUrl: "",
          },
          {
            word: "cutlery",
            pos: "Danh từ (n)",
            ipa: "/ˈkʌtləri/",
            definition: "dao, nĩa, muỗng",
            example: "Please place the cutlery neatly on the table.",
            imageUrl: "",
          },
          {
            word: "napkin",
            pos: "Danh từ (n)",
            ipa: "/ˈnæpkɪn/",
            definition: "khăn ăn",
            example: "He wiped his mouth with a napkin.",
            imageUrl: "",
          },
          {
            word: "portion",
            pos: "Danh từ (n)",
            ipa: "/ˈpɔːʃn/",
            definition: "phần ăn",
            example: "They shared a large portion of pasta.",
            imageUrl: "",
          },
          {
            word: "leftover",
            pos: "Danh từ (n)",
            ipa: "/ˈleftəʊvə(r)/",
            definition: "đồ ăn thừa",
            example: "Please store the leftovers in the fridge.",
            imageUrl: "",
          },
          {
            word: "make a reservation",
            pos: "Cụm động từ",
            ipa: "/ˌrez.əˈveɪ.ʃən/",
            definition: "đặt chỗ trước",
            example: "I made a reservation for 8 p.m.",
            imageUrl: "",
          },
          {
            word: "fully booked",
            pos: "Tính từ (adj)",
            ipa: "/ˈfʊl.i bʊkt/",
            definition: "kín chỗ",
            example: "The restaurant is fully booked tonight.",
            imageUrl: "",
          },
          {
            word: "place an order",
            pos: "Cụm động từ",
            ipa: "/pleɪs ˈɔː.dər/",
            definition: "đặt món",
            example: "He placed an order for pasta.",
            imageUrl: "",
          },
          {
            word: "take an order",
            pos: "Cụm động từ",
            ipa: "/teɪk ˈɔː.dər/",
            definition: "ghi nhận món",
            example: "The waiter is taking our order.",
            imageUrl: "",
          },
          {
            word: "complimentary drink",
            pos: "Cụm danh từ",
            ipa: "/ˌkɒmplɪˈmen.tər.i/",
            definition: "đồ uống miễn phí",
            example: "Guests receive a complimentary drink.",
            imageUrl: "",
          },
          {
            word: "dine in",
            pos: "Cụm động từ",
            ipa: "/daɪn ɪn/",
            definition: "ăn tại chỗ",
            example: "We decided to dine in tonight.",
            imageUrl: "",
          },
          {
            word: "take out / take away",
            pos: "Cụm động từ",
            ipa: "/ˈteɪk.aʊt/",
            definition: "mang đi",
            example: "She ordered noodles to take away.",
            imageUrl: "",
          },
          {
            word: "appetizing",
            pos: "Tính từ (adj)",
            ipa: "/ˈæp.ə.taɪ.zɪŋ/",
            definition: "trông ngon miệng",
            example: "The meal looks appetizing.",
            imageUrl: "",
          },
          {
            word: "savory",
            pos: "Tính từ (adj)",
            ipa: "/ˈseɪ.vər.i/",
            definition: "mặn mà, đậm đà",
            example: "I love savory snacks.",
            imageUrl: "",
          },
          {
            word: "bland",
            pos: "Tính từ (adj)",
            ipa: "/blænd/",
            definition: "nhạt nhẽo",
            example: "The soup is bland.",
            imageUrl: "",
          },
          {
            word: "tender",
            pos: "Tính từ (adj)",
            ipa: "/ˈten.dər/",
            definition: "mềm (thịt)",
            example: "The meat is very tender.",
            imageUrl: "",
          },
          {
            word: "crispy",
            pos: "Tính từ (adj)",
            ipa: "/ˈkrɪs.pi/",
            definition: "giòn",
            example: "The fried chicken is crispy.",
            imageUrl: "",
          },
          {
            word: "crunchy",
            pos: "Tính từ (adj)",
            ipa: "/ˈkrʌn.tʃi/",
            definition: "giòn rụm",
            example: "I like crunchy snacks.",
            imageUrl: "",
          },
          {
            word: "greasy",
            pos: "Tính từ (adj)",
            ipa: "/ˈɡriː.si/",
            definition: "nhiều dầu mỡ",
            example: "The fries are too greasy.",
            imageUrl: "",
          },
          {
            word: "nutritious",
            pos: "Tính từ (adj)",
            ipa: "/njuːˈtrɪʃ.əs/",
            definition: "bổ dưỡng",
            example: "Vegetables are nutritious.",
            imageUrl: "",
          },
          {
            word: "balanced diet",
            pos: "Cụm danh từ",
            ipa: "/ˈbæl.ənst ˈdaɪ.ət/",
            definition: "chế độ ăn cân bằng",
            example: "He follows a balanced diet.",
            imageUrl: "",
          },
          {
            word: "fine dining",
            pos: "Cụm danh từ",
            ipa: "/faɪn ˈdaɪ.nɪŋ/",
            definition: "ăn uống sang trọng",
            example: "We enjoyed fine dining at a luxury hotel.",
            imageUrl: "",
          },
          {
            word: "fast food",
            pos: "Cụm danh từ",
            ipa: "/ˌfæst ˈfuːd/",
            definition: "đồ ăn nhanh",
            example: "Fast food is convenient but unhealthy.",
            imageUrl: "",
          },
          {
            word: "home-cooked meal",
            pos: "Cụm danh từ",
            ipa: "/həʊm kʊkt/",
            definition: "bữa ăn nhà nấu",
            example: "I prefer a home-cooked meal.",
            imageUrl: "",
          },
          {
            word: "street food",
            pos: "Cụm danh từ",
            ipa: "/striːt fuːd/",
            definition: "đồ ăn đường phố",
            example: "Street food is cheap and tasty.",
            imageUrl: "",
          },
          {
            word: "food delivery service",
            pos: "Cụm danh từ",
            ipa: "/dɪˈlɪv.ər.i/",
            definition: "dịch vụ giao đồ ăn",
            example: "Food delivery service is very popular.",
            imageUrl: "",
          },
          {
            word: "food poisoning",
            pos: "Cụm danh từ",
            ipa: "/ˈpɔɪ.zən.ɪŋ/",
            definition: "ngộ độc thực phẩm",
            example: "He had food poisoning last week.",
            imageUrl: "",
          },
          {
            word: "food court",
            pos: "Cụm danh từ",
            ipa: "/fuːd kɔːt/",
            definition: "khu ẩm thực",
            example: "Let’s meet at the food court.",
            imageUrl: "",
          },
          {
            word: "self-service",
            pos: "Tính từ (adj)",
            ipa: "/ˌself ˈsɜː.vɪs/",
            definition: "tự phục vụ",
            example: "This is a self-service restaurant.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-8",
        title: "Lesson 8",
        words: [
          {
            word: "health",
            pos: "Danh từ (n)",
            ipa: "/helθ/",
            definition: "sức khỏe",
            example: "Regular exercise improves your health.",
            imageUrl: "",
          },
          {
            word: "healthy",
            pos: "Tính từ (adj)",
            ipa: "/ˈhelθi/",
            definition: "khỏe mạnh",
            example: "Eating vegetables helps you stay healthy.",
            imageUrl: "",
          },
          {
            word: "unhealthy",
            pos: "Tính từ (adj)",
            ipa: "/ʌnˈhelθi/",
            definition: "không khỏe mạnh",
            example: "Junk food is considered unhealthy.",
            imageUrl: "",
          },
          {
            word: "hospital",
            pos: "Danh từ (n)",
            ipa: "/ˈhɒspɪtl/",
            definition: "bệnh viện",
            example: "She works at a large city hospital.",
            imageUrl: "",
          },
          {
            word: "clinic",
            pos: "Danh từ (n)",
            ipa: "/ˈklɪnɪk/",
            definition: "phòng khám",
            example: "The new clinic offers free consultations.",
            imageUrl: "",
          },
          {
            word: "patient",
            pos: "Danh từ (n)",
            ipa: "/ˈpeɪʃnt/",
            definition: "bệnh nhân",
            example: "The patient is waiting to see the doctor.",
            imageUrl: "",
          },
          {
            word: "patient",
            pos: "Tính từ (adj)",
            ipa: "/ˈpeɪʃnt/",
            definition: "kiên nhẫn",
            example: "You need to be patient when teaching children.",
            imageUrl: "",
          },
          {
            word: "physician",
            pos: "Danh từ (n)",
            ipa: "/fɪˈzɪʃn/",
            definition: "bác sĩ (trị liệu)",
            example: "You should consult a physician about your symptoms.",
            imageUrl: "",
          },
          {
            word: "nurse",
            pos: "Danh từ (n)",
            ipa: "/nɜːs/",
            definition: "y tá",
            example: "The nurse checked my blood pressure.",
            imageUrl: "",
          },
          {
            word: "pharmacy",
            pos: "Danh từ (n)",
            ipa: "/ˈfɑːməsi/",
            definition: "nhà thuốc",
            example: "You can buy vitamins at any pharmacy.",
            imageUrl: "",
          },
          {
            word: "pharmacist",
            pos: "Danh từ (n)",
            ipa: "/ˈfɑːməsɪst/",
            definition: "dược sĩ",
            example: "The pharmacist gave me the correct medicine.",
            imageUrl: "",
          },
          {
            word: "prescribe",
            pos: "Động từ (v)",
            ipa: "/prɪˈskraɪb/",
            definition: "kê toa",
            example: "The doctor prescribed painkillers for her.",
            imageUrl: "",
          },
          {
            word: "prescription",
            pos: "Danh từ (n)",
            ipa: "/prɪˈskrɪpʃn/",
            definition: "đơn thuốc",
            example: "The doctor wrote a prescription for antibiotics.",
            imageUrl: "",
          },
          {
            word: "medicine",
            pos: "Danh từ (n)",
            ipa: "/ˈmedsn/",
            definition: "thuốc",
            example: "Take this medicine twice a day.",
            imageUrl: "",
          },
          {
            word: "medical",
            pos: "Tính từ (adj)",
            ipa: "/ˈmedɪkl/",
            definition: "thuộc y học",
            example: "She needs a medical examination.",
            imageUrl: "",
          },
          {
            word: "drug",
            pos: "Danh từ (n)",
            ipa: "/drʌɡ/",
            definition: "thuốc, dược phẩm",
            example: "This drug helps lower blood pressure.",
            imageUrl: "",
          },
          {
            word: "drugstore",
            pos: "Danh từ (n)",
            ipa: "/ˈdrʌɡstɔː(r)/",
            definition: "hiệu thuốc",
            example: "I stopped by the drugstore to buy aspirin.",
            imageUrl: "",
          },
          {
            word: "pill",
            pos: "Danh từ (n)",
            ipa: "/pɪl/",
            definition: "viên thuốc",
            example: "Don’t forget to take your pills after meals.",
            imageUrl: "",
          },
          {
            word: "tablet",
            pos: "Danh từ (n)",
            ipa: "/ˈtæblət/",
            definition: "viên nén",
            example: "The doctor told me to take one tablet daily.",
            imageUrl: "",
          },
          {
            word: "inject",
            pos: "Động từ (v)",
            ipa: "/ɪnˈdʒekt/",
            definition: "tiêm",
            example: "The doctor injected the vaccine into the patient.",
            imageUrl: "",
          },
          {
            word: "injection",
            pos: "Danh từ (n)",
            ipa: "/ɪnˈdʒekʃn/",
            definition: "mũi tiêm",
            example: "The nurse gave him an injection in the arm.",
            imageUrl: "",
          },
          {
            word: "vaccine",
            pos: "Danh từ (n)",
            ipa: "/ˈvæksiːn/",
            definition: "vắc-xin",
            example: "The vaccine protects children from diseases.",
            imageUrl: "",
          },
          {
            word: "vaccination",
            pos: "Danh từ (n)",
            ipa: "/ˌvæksɪˈneɪʃn/",
            definition: "sự tiêm chủng",
            example: "Vaccination helps prevent serious illnesses.",
            imageUrl: "",
          },
          {
            word: "operate",
            pos: "Động từ (v)",
            ipa: "/ˈɒpəreɪt/",
            definition: "phẫu thuật, vận hành",
            example: "The surgeon operated on the patient’s knee.",
            imageUrl: "",
          },
          {
            word: "operate on",
            pos: "Cụm động từ",
            ipa: "/ˈɒpəreɪt ɒn/",
            definition: "phẫu thuật cho (ai đó)",
            example: "The surgeon operated on his heart yesterday.",
            imageUrl: "",
          },
          {
            word: "operation",
            pos: "Danh từ (n)",
            ipa: "/ˌɒpəˈreɪʃn/",
            definition: "ca phẫu thuật, sự vận hành",
            example: "The operation lasted for three hours.",
            imageUrl: "",
          },
          {
            word: "surgery",
            pos: "Danh từ (n)",
            ipa: "/ˈsɜːdʒəri/",
            definition: "phẫu thuật",
            example: "He had heart surgery last month.",
            imageUrl: "",
          },
          {
            word: "surgeon",
            pos: "Danh từ (n)",
            ipa: "/ˈsɜːdʒən/",
            definition: "bác sĩ phẫu thuật",
            example: "The surgeon performed a heart operation.",
            imageUrl: "",
          },
          {
            word: "treat",
            pos: "Động từ (v)",
            ipa: "/triːt/",
            definition: "điều trị, chữa bệnh",
            example: "The doctor treated her for a fever.",
            imageUrl: "",
          },
          {
            word: "treatment",
            pos: "Danh từ (n)",
            ipa: "/ˈtriːtmənt/",
            definition: "sự điều trị",
            example: "He received treatment for his back pain.",
            imageUrl: "",
          },
          {
            word: "cure",
            pos: "Động từ (v)",
            ipa: "/kjʊə(r)/",
            definition: "chữa khỏi",
            example: "The new drug can cure many infections.",
            imageUrl: "",
          },
          {
            word: "cure",
            pos: "Danh từ (n)",
            ipa: "/kjʊə(r)/",
            definition: "phương thuốc",
            example: "The new drug can cure many infections.",
            imageUrl: "",
          },
          {
            word: "recover",
            pos: "Động từ (v)",
            ipa: "/rɪˈkʌvə(r)/",
            definition: "hồi phục",
            example: "She recovered quickly after the operation.",
            imageUrl: "",
          },
          {
            word: "recovery",
            pos: "Danh từ (n)",
            ipa: "/rɪˈkʌvəri/",
            definition: "sự hồi phục",
            example: "His recovery took several weeks.",
            imageUrl: "",
          },
          {
            word: "disease",
            pos: "Danh từ (n)",
            ipa: "/dɪˈziːz/",
            definition: "bệnh tật",
            example: "Heart disease is a common health problem.",
            imageUrl: "",
          },
          {
            word: "sick",
            pos: "Tính từ (adj)",
            ipa: "/sɪk/",
            definition: "ốm, bệnh",
            example: "She felt sick after eating too much.",
            imageUrl: "",
          },
          {
            word: "illness",
            pos: "Danh từ (n)",
            ipa: "/ˈɪlnəs/",
            definition: "bệnh, tình trạng ốm",
            example: "He missed work due to illness.",
            imageUrl: "",
          },
          {
            word: "symptom",
            pos: "Danh từ (n)",
            ipa: "/ˈsɪmptəm/",
            definition: "triệu chứng",
            example: "A cough is a common symptom of a cold.",
            imageUrl: "",
          },
          {
            word: "diagnose",
            pos: "Động từ (v)",
            ipa: "/ˈdaɪəɡnəʊz/",
            definition: "chẩn đoán",
            example: "The doctor diagnosed him with pneumonia.",
            imageUrl: "",
          },
          {
            word: "diagnosis",
            pos: "Danh từ (n)",
            ipa: "/ˌdaɪəɡˈnəʊsɪs/",
            definition: "sự chẩn đoán",
            example: "The diagnosis was confirmed after several tests.",
            imageUrl: "",
          },
          {
            word: "examine",
            pos: "Động từ (v)",
            ipa: "/ɪɡˈzæmɪn/",
            definition: "khám, kiểm tra",
            example: "The physician examined the patient’s throat.",
            imageUrl: "",
          },
          {
            word: "examination",
            pos: "Danh từ (n)",
            ipa: "/ɪɡˌzæmɪˈneɪʃn/",
            definition: "cuộc kiểm tra, khám",
            example: "A full medical examination is required.",
            imageUrl: "",
          },
          {
            word: "check-up",
            pos: "Danh từ (n)",
            ipa: "/ˈtʃek ʌp/",
            definition: "kiểm tra sức khỏe định kỳ",
            example: "She has an annual health check-up.",
            imageUrl: "",
          },
          {
            word: "emergency",
            pos: "Danh từ (n)",
            ipa: "/ɪˈmɜːdʒənsi/",
            definition: "tình huống khẩn cấp",
            example: "Call 115 in case of an emergency.",
            imageUrl: "",
          },
          {
            word: "ambulance",
            pos: "Danh từ (n)",
            ipa: "/ˈæmbjələns/",
            definition: "xe cứu thương",
            example: "The ambulance arrived within minutes.",
            imageUrl: "",
          },
          {
            word: "insure",
            pos: "Động từ (v)",
            ipa: "/ɪnˈʃʊə(r)/",
            definition: "bảo hiểm",
            example: "The company insures all its staff against accidents.",
            imageUrl: "",
          },
          {
            word: "insurance",
            pos: "Danh từ (n)",
            ipa: "/ɪnˈʃʊərəns/",
            definition: "bảo hiểm",
            example: "You must have insurance to cover medical costs.",
            imageUrl: "",
          },
          {
            word: "medical insurance",
            pos: "Cụm danh từ",
            ipa: "/ˈmedɪkl ɪnˈʃʊərəns/",
            definition: "bảo hiểm y tế",
            example:
              "The company provides medical insurance for all employees.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-9",
        title: "Lesson 9",
        words: [
          {
            word: "abide by",
            pos: "Cụm động từ",
            ipa: "/əˈbaɪd baɪ/",
            definition: "tuân theo, tuân thủ",
            example: "All members must abide by the company’s rules.",
            imageUrl: "",
          },
          {
            word: "agree",
            pos: "Động từ (v)",
            ipa: "/əˈɡriː/",
            definition: "đồng ý",
            example: "We all agreed to sign the contract.",
            imageUrl: "",
          },
          {
            word: "agreement",
            pos: "Danh từ (n)",
            ipa: "/əˈɡriːmənt/",
            definition: "hợp đồng, thỏa thuận",
            example:
              "They finally reached an agreement after long discussions.",
            imageUrl: "",
          },
          {
            word: "agreeable",
            pos: "Tính từ (adj)",
            ipa: "/əˈɡriːəbl/",
            definition: "dễ chịu, có thể chấp nhận",
            example: "The terms of the contract were agreeable to both sides.",
            imageUrl: "",
          },
          {
            word: "assure",
            pos: "Động từ (v)",
            ipa: "/əˈʃʊə(r)/",
            definition: "cam đoan, đảm bảo",
            example: "I assure you that everything will be ready by Friday.",
            imageUrl: "",
          },
          {
            word: "assured",
            pos: "Tính từ (adj)",
            ipa: "/əˈʃʊəd/",
            definition: "chắc chắn, được đảm bảo",
            example: "You can feel assured of our best service.",
            imageUrl: "",
          },
          {
            word: "assurance",
            pos: "Danh từ (n)",
            ipa: "/əˈʃʊərəns/",
            definition: "sự cam đoan, đảm bảo",
            example:
              "She gave her assurance that the project would finish on time.",
            imageUrl: "",
          },
          {
            word: "cancel",
            pos: "Động từ (v)",
            ipa: "/ˈkænsl/",
            definition: "hủy bỏ",
            example: "They had to cancel the meeting because of bad weather.",
            imageUrl: "",
          },
          {
            word: "cancellation",
            pos: "Danh từ (n)",
            ipa: "/ˌkænsəˈleɪʃn/",
            definition: "sự hủy bỏ",
            example: "The event was postponed due to the flight cancellation.",
            imageUrl: "",
          },
          {
            word: "cancellable",
            pos: "Tính từ (adj)",
            ipa: "/ˈkænsələbl/",
            definition: "có thể hủy bỏ",
            example:
              "The reservation is cancellable up to 24 hours in advance.",
            imageUrl: "",
          },
          {
            word: "determine",
            pos: "Động từ (v)",
            ipa: "/dɪˈtɜːmɪn/",
            definition: "quyết định, xác định",
            example: "The manager will determine the project’s budget.",
            imageUrl: "",
          },
          {
            word: "determined",
            pos: "Tính từ (adj)",
            ipa: "/dɪˈtɜːmɪnd/",
            definition: "kiên định, quyết tâm",
            example: "He is determined to finish the report on time.",
            imageUrl: "",
          },
          {
            word: "determination",
            pos: "Danh từ (n)",
            ipa: "/dɪˌtɜːmɪˈneɪʃn/",
            definition: "sự quyết tâm",
            example: "Her determination helped her achieve success.",
            imageUrl: "",
          },
          {
            word: "engage in",
            pos: "Cụm động từ",
            ipa: "/ɪnˈɡeɪdʒ/",
            definition: "tham gia vào",
            example: "His organization engage in a variety of activities",
            imageUrl: "",
          },
          {
            word: "engagement",
            pos: "Danh từ (n)",
            ipa: "/ɪnˈɡeɪdʒmənt/",
            definition: "sự tham gia",
            example:
              "He was known for his engagement with the problems of the most difficult students.",
            imageUrl: "",
          },
          {
            word: "establish",
            pos: "Động từ (v)",
            ipa: "/ɪˈstæblɪʃ/",
            definition: "thành lập",
            example: "The company was established in 1998.",
            imageUrl: "",
          },
          {
            word: "establishment",
            pos: "Danh từ (n)",
            ipa: "/ɪˈstæblɪʃmənt/",
            definition: "tổ chức, cơ sở, sự thành lập",
            example: "The new establishment opened downtown last month.",
            imageUrl: "",
          },
          {
            word: "obligate",
            pos: "Động từ (v)",
            ipa: "/ˈɒblɪɡeɪt/",
            definition: "bắt buộc",
            example: "The contract obligates the company to meet the deadline.",
            imageUrl: "",
          },
          {
            word: "obligatory",
            pos: "Tính từ (adj)",
            ipa: "/ˈɒblɪɡeɪtɪd/",
            definition: "bắt buộc",
            example:
              "The medical examination before you start work is obligatory.",
            imageUrl: "",
          },
          {
            word: "obligation",
            pos: "Danh từ (n)",
            ipa: "/ˌɒblɪˈɡeɪʃn/",
            definition: "nghĩa vụ, bổn phận",
            example: "You have a legal obligation to pay your taxes.",
            imageUrl: "",
          },
          {
            word: "party",
            pos: "Danh từ (n)",
            ipa: "/ˈpɑːti/",
            definition: "bên (trong hợp đồng), nhóm",
            example: "Both parties agreed to the terms of the deal.",
            imageUrl: "",
          },
          {
            word: "provision",
            pos: "Danh từ (n)",
            ipa: "/prəˈvɪʒn/",
            definition: "điều khoản",
            example: "The contract includes a provision for late delivery.",
            imageUrl: "",
          },
          {
            word: "resolve",
            pos: "Động từ (v)",
            ipa: "/rɪˈzɒlv/",
            definition: "giải quyết",
            example: "They hope to resolve the issue by next week.",
            imageUrl: "",
          },
          {
            word: "resolution",
            pos: "Danh từ (n)",
            ipa: "/ˌrezəˈluːʃn/",
            definition: "sự giải quyết, quyết định",
            example: "The committee passed a resolution to increase pay.",
            imageUrl: "",
          },
          {
            word: "specify",
            pos: "Động từ (v)",
            ipa: "/ˈspesɪfaɪ/",
            definition: "chỉ rõ, ghi rõ",
            example: "Please specify your preferred delivery date.",
            imageUrl: "",
          },
          {
            word: "specific",
            pos: "Tính từ (adj)",
            ipa: "/spəˈsɪfɪk/",
            definition: "cụ thể, rõ ràng",
            example: "The report gives specific details about the project.",
            imageUrl: "",
          },
          {
            word: "specification",
            pos: "Danh từ (n)",
            ipa: "/ˌspesɪfɪˈkeɪʃn/",
            definition: "bản chi tiết kỹ thuật",
            example: "The product meets the required specifications.",
            imageUrl: "",
          },
          {
            word: "attract",
            pos: "Động từ (v)",
            ipa: "/əˈtrækt/",
            definition: "thu hút",
            example: "The campaign aims to attract more customers.",
            imageUrl: "",
          },
          {
            word: "attractive",
            pos: "Tính từ (adj)",
            ipa: "/əˈtræktɪv/",
            definition: "hấp dẫn, lôi cuốn",
            example: "The store offers attractive discounts.",
            imageUrl: "",
          },
          {
            word: "attraction",
            pos: "Danh từ (n)",
            ipa: "/əˈtrækʃn/",
            definition: "sự thu hút",
            example: "Price is a key attraction for most consumers.",
            imageUrl: "",
          },
          {
            word: "compare",
            pos: "Động từ (v)",
            ipa: "/kəmˈpeə(r)/",
            definition: "so sánh",
            example: "Compare prices before you buy.",
            imageUrl: "",
          },
          {
            word: "comparison",
            pos: "Danh từ (n)",
            ipa: "/kəmˈpærɪsn/",
            definition: "sự so sánh",
            example:
              "A comparison of the two products shows clear differences.",
            imageUrl: "",
          },
          {
            word: "compete",
            pos: "Động từ (v)",
            ipa: "/kəmˈpiːt/",
            definition: "chiến đấu, cạnh tranh",
            example:
              "It's difficult for a small shop to compete against the big supermarkets.",
            imageUrl: "",
          },
          {
            word: "competitor",
            pos: "Danh từ (n)",
            ipa: "/kəmˈpetɪtə(r)/",
            definition: "đối thủ",
            example: "Our main competitor just released a new product.",
            imageUrl: "",
          },
          {
            word: "competitive",
            pos: "Tính từ (adj)",
            ipa: "/kəmˈpetətɪv/",
            definition: "có tính cạnh tranh",
            example: "The company offers competitive prices.",
            imageUrl: "",
          },
          {
            word: "competition",
            pos: "Danh từ (n)",
            ipa: "/ˌkɒmpəˈtɪʃn/",
            definition: "sự cạnh tranh",
            example: "There’s a lot of competition in the car industry.",
            imageUrl: "",
          },
          {
            word: "consume",
            pos: "Động từ (v)",
            ipa: "/kənˈsjuːm/",
            definition: "tiêu thụ",
            example: "Americans consume a lot of coffee every day.",
            imageUrl: "",
          },
          {
            word: "consumer",
            pos: "Danh từ (n)",
            ipa: "/kənˈsjuːmə(r)/",
            definition: "người tiêu dùng",
            example: "The new law protects consumers from fraud.",
            imageUrl: "",
          },
          {
            word: "consumption",
            pos: "Danh từ (n)",
            ipa: "/kənˈsʌmpʃn/",
            definition: "sự tiêu thụ",
            example: "Energy consumption has increased recently.",
            imageUrl: "",
          },
          {
            word: "convince",
            pos: "Động từ (v)",
            ipa: "/kənˈvɪns/",
            definition: "thuyết phục",
            example: "She convinced the client to sign the deal.",
            imageUrl: "",
          },
          {
            word: "convincing",
            pos: "Tính từ (adj)",
            ipa: "/kənˈvɪnsɪŋ/",
            definition: "có sức thuyết phục",
            example: "His argument was very convincing.",
            imageUrl: "",
          },
          {
            word: "persuasion",
            pos: "Danh từ (n)",
            ipa: "/pəˈsweɪʒn/",
            definition: "sự thuyết phục",
            example: "After much persuasion, he finally agreed.",
            imageUrl: "",
          },
          {
            word: "current",
            pos: "Tính từ (adj)",
            ipa: "/ˈkʌrənt/",
            definition: "hiện tại, phổ biến",
            example: "Current trends show a rise in online sales.",
            imageUrl: "",
          },
          {
            word: "currently",
            pos: "Trạng từ (adv)",
            ipa: "/ˈkʌrəntli/",
            definition: "hiện tại, hiện nay",
            example: "The company is currently expanding overseas.",
            imageUrl: "",
          },
          {
            word: "inspire",
            pos: "Động từ (v)",
            ipa: "/ɪnˈspaɪə(r)/",
            definition: "truyền cảm hứng",
            example: "His success inspired many others.",
            imageUrl: "",
          },
          {
            word: "inspiring",
            pos: "Tính từ (adj)",
            ipa: "/ɪnˈspaɪərɪŋ/",
            definition: "đầy cảm hứng",
            example: "She gave an inspiring speech.",
            imageUrl: "",
          },
          {
            word: "inspiration",
            pos: "Danh từ (n)",
            ipa: "/ˌɪnspəˈreɪʃn/",
            definition: "nguồn cảm hứng",
            example: "Her story is an inspiration to young people.",
            imageUrl: "",
          },
          {
            word: "market",
            pos: "Danh từ (n)",
            ipa: "/ˈmɑːkɪt/",
            definition: "thị trường",
            example: "Our target market is young professionals.",
            imageUrl: "",
          },
          {
            word: "marketing",
            pos: "Danh từ (n)",
            ipa: "/ˈmɑːkɪtɪŋ/",
            definition: "tiếp thị",
            example: "She works in the marketing department.",
            imageUrl: "",
          },
          {
            word: "marketer",
            pos: "Danh từ (n)",
            ipa: "/ˈmɑːkɪtə(r)/",
            definition: "người làm tiếp thị",
            example: "A skilled marketer knows how to reach customers.",
            imageUrl: "",
          },
          {
            word: "produce",
            pos: "Động từ (v)",
            ipa: "/prəˈduːs/",
            definition: "sản xuất",
            example: "France produces a great deal of wine for export.",
            imageUrl: "",
          },
          {
            word: "producer",
            pos: "Danh từ (n)",
            ipa: "/prəˈdjuːsə(r)/",
            definition: "nhà sản xuất",
            example: "He is a film producer in Hollywood.",
            imageUrl: "",
          },
          {
            word: "productive",
            pos: "Tính từ (adj)",
            ipa: "/prəˈdʌktɪv/",
            definition: "năng suất, hiệu quả",
            example: "The meeting was very productive.",
            imageUrl: "",
          },
          {
            word: "production",
            pos: "Danh từ (n)",
            ipa: "/prəˈdʌkʃn/",
            definition: "sự sản xuất",
            example: "Car production increased by 20%.",
            imageUrl: "",
          },
          {
            word: "satisfy",
            pos: "Động từ (v)",
            ipa: "/ˈsætɪsfaɪ/",
            definition: "làm hài lòng",
            example: "The results satisfied the board of directors.",
            imageUrl: "",
          },
          {
            word: "satisfaction",
            pos: "Danh từ (n)",
            ipa: "/ˌsætɪsˈfækʃn/",
            definition: "sự hài lòng",
            example: "Customer satisfaction is our top priority.",
            imageUrl: "",
          },
          {
            word: "satisfactory",
            pos: "Tính từ (adj)",
            ipa: "/ˌsætɪsˈfæktəri/",
            definition: "đạt yêu cầu, thỏa đáng",
            example: "The service was satisfactory but could improve.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-10",
        title: "Lesson 10",
        words: [
          {
            word: "characteristic",
            pos: "Danh từ (n)",
            ipa: "/ˌkærəktəˈrɪstɪk/",
            definition: "đặc điểm, tính chất",
            example: "Honesty is one of her best characteristics.",
            imageUrl: "",
          },
          {
            word: "characterize",
            pos: "Động từ (v)",
            ipa: "/ˈkærəktəraɪz/",
            definition: "mô tả đặc trưng",
            example: "The novel is characterized by vivid descriptions.",
            imageUrl: "",
          },
          {
            word: "consequence",
            pos: "Danh từ (n)",
            ipa: "/ˈkɒnsɪkwəns/",
            definition: "hậu quả, kết quả",
            example: "His mistake had serious consequences.",
            imageUrl: "",
          },
          {
            word: "consequent",
            pos: "Tính từ (adj)",
            ipa: "/ˈkɒnsɪkwənt/",
            definition: "là hậu quả của",
            example: "The damage was consequent to the storm.",
            imageUrl: "",
          },
          {
            word: "consequently",
            pos: "Trạng từ (adv)",
            ipa: "/ˈkɒnsɪkwəntli/",
            definition: "vì vậy, do đó",
            example:
              "The company didn’t meet the deadline; consequently, they lost the contract.",
            imageUrl: "",
          },
          {
            word: "consider",
            pos: "Động từ (v)",
            ipa: "/kənˈsɪdə(r)/",
            definition: "xem xét, cân nhắc",
            example: "Please consider all factors before deciding.",
            imageUrl: "",
          },
          {
            word: "consideration",
            pos: "Danh từ (n)",
            ipa: "/kənˌsɪdəˈreɪʃn/",
            definition: "sự cân nhắc",
            example: "After careful consideration, we accepted the offer.",
            imageUrl: "",
          },
          {
            word: "considerate",
            pos: "Tính từ (adj)",
            ipa: "/kənˈsɪdərət/",
            definition: "chu đáo, ân cần",
            example: "He’s always considerate toward his coworkers.",
            imageUrl: "",
          },
          {
            word: "considerable",
            pos: "Tính từ (adj)",
            ipa: "/kənˈsɪdərəbl/",
            definition: "đáng kể",
            example: "The project required considerable time and effort.",
            imageUrl: "",
          },
          {
            word: "take into consideration",
            pos: "Cụm từ",
            ipa: "/teɪk ˈɪntuː kənˌsɪdəˈreɪʃn/",
            definition: "xem xét đến",
            example: "Please take into consideration the client’s feedback.",
            imageUrl: "",
          },
          {
            word: "cover",
            pos: "Động từ (v)",
            ipa: "/ˈkʌvə(r)/",
            definition: "bao gồm, bảo hiểm, che phủ",
            example: "The warranty covers all manufacturing defects.",
            imageUrl: "",
          },
          {
            word: "coverage",
            pos: "Danh từ (n)",
            ipa: "/ˈkʌvərɪdʒ/",
            definition: "phạm vi bảo hiểm, tin tức",
            example: "The insurance provides full coverage for accidents.",
            imageUrl: "",
          },
          {
            word: "expire",
            pos: "Động từ (v)",
            ipa: "/ɪkˈspaɪə(r)/",
            definition: "hết hạn, kết thúc",
            example: "The warranty will expire next month.",
            imageUrl: "",
          },
          {
            word: "expiration",
            pos: "Danh từ (n)",
            ipa: "/ˌekspəˈreɪʃn/",
            definition: "sự hết hạn",
            example: "Check the expiration date before using the medicine.",
            imageUrl: "",
          },
          {
            word: "expiration date",
            pos: "Cụm danh từ",
            ipa: "/ˌekspəˈreɪʃn deɪt/",
            definition: "ngày hết hạn",
            example: "Always check the expiration date on food products.",
            imageUrl: "",
          },
          {
            word: "frequent",
            pos: "Tính từ (adj)",
            ipa: "/ˈfriːkwənt/",
            definition: "thường xuyên",
            example: "He is a frequent customer at this café.",
            imageUrl: "",
          },
          {
            word: "frequently",
            pos: "Trạng từ (adv)",
            ipa: "/ˈfriːkwəntli/",
            definition: "thường xuyên",
            example: "The staff frequently check the inventory.",
            imageUrl: "",
          },
          {
            word: "frequency",
            pos: "Danh từ (n)",
            ipa: "/ˈfriːkwənsi/",
            definition: "tần suất",
            example: "The frequency of updates has increased recently.",
            imageUrl: "",
          },
          {
            word: "imply",
            pos: "Động từ (v)",
            ipa: "/ɪmˈplaɪ/",
            definition: "ngụ ý, ám chỉ",
            example: "His tone implied that he was not happy.",
            imageUrl: "",
          },
          {
            word: "implication",
            pos: "Danh từ (n)",
            ipa: "/ˌɪmplɪˈkeɪʃn/",
            definition: "hàm ý, tác động",
            example: "The manager explained the implications of the change.",
            imageUrl: "",
          },
          {
            word: "promise",
            pos: "Động từ (v)",
            ipa: "/ˈprɒmɪs/",
            definition: "hứa",
            example: "He promised to finish the task by Friday.",
            imageUrl: "",
          },
          {
            word: "promise",
            pos: "Danh từ (n)",
            ipa: "/ˈprɒmɪs/",
            definition: "lời hứa",
            example: "He promised to finish the task by Friday.",
            imageUrl: "",
          },
          {
            word: "promising",
            pos: "Tính từ (adj)",
            ipa: "/ˈprɒmɪsɪŋ/",
            definition: "đầy hứa hẹn",
            example: "She is a promising young designer.",
            imageUrl: "",
          },
          {
            word: "protect",
            pos: "Động từ (v)",
            ipa: "/prəˈtekt/",
            definition: "bảo vệ",
            example: "Sunscreen helps protect your skin from UV rays.",
            imageUrl: "",
          },
          {
            word: "protection",
            pos: "Danh từ (n)",
            ipa: "/prəˈtekʃn/",
            definition: "sự bảo vệ",
            example: "This policy provides protection against loss.",
            imageUrl: "",
          },
          {
            word: "protective",
            pos: "Tính từ (adj)",
            ipa: "/prəˈtektɪv/",
            definition: "mang tính bảo vệ",
            example: "He wore protective gear during the experiment.",
            imageUrl: "",
          },
          {
            word: "reputation",
            pos: "Danh từ (n)",
            ipa: "/ˌrepjuˈteɪʃn/",
            definition: "danh tiếng",
            example: "The company has a good reputation for quality.",
            imageUrl: "",
          },
          {
            word: "reputable",
            pos: "Tính từ (adj)",
            ipa: "/ˈrepjətəbl/",
            definition: "có danh tiếng",
            example: "We only buy from reputable suppliers.",
            imageUrl: "",
          },
          {
            word: "require",
            pos: "Động từ (v)",
            ipa: "/rɪˈkwaɪə(r)/",
            definition: "yêu cầu, đòi hỏi",
            example: "The job requires excellent communication skills.",
            imageUrl: "",
          },
          {
            word: "required",
            pos: "Tính từ (adj)",
            ipa: "/rɪˈkwaɪəd/",
            definition: "bắt buộc",
            example: "Attendance at the meeting is required.",
            imageUrl: "",
          },
          {
            word: "requirement",
            pos: "Danh từ (n)",
            ipa: "/rɪˈkwaɪəmənt/",
            definition: "yêu cầu, điều kiện",
            example: "The main requirement is a college degree.",
            imageUrl: "",
          },
          {
            word: "vary",
            pos: "Động từ (v)",
            ipa: "/ˈveəri/",
            definition: "thay đổi, khác nhau",
            example: "Prices vary depending on the season.",
            imageUrl: "",
          },
          {
            word: "various",
            pos: "Tính từ (adj)",
            ipa: "/ˈveəriəs/",
            definition: "khác nhau, đa dạng",
            example: "We tried dishes from various countries.",
            imageUrl: "",
          },
          {
            word: "a variety of",
            pos: "Cụm từ",
            ipa: "/ə vəˈraɪəti əv/",
            definition: "nhiều loại, đa dạng",
            example: "There is a variety of options to choose from.",
            imageUrl: "",
          },
          {
            word: "address",
            pos: "Động từ (v)",
            ipa: "/əˈdres/",
            definition: "giải quyết, hướng đến; diễn thuyết",
            example: "The manager addressed the issue during the meeting.",
            imageUrl: "",
          },
          {
            word: "address",
            pos: "Danh từ (n)",
            ipa: "/əˈdres/",
            definition: "địa chỉ",
            example: "The manager addressed the issue during the meeting.",
            imageUrl: "",
          },
          {
            word: "address a problem",
            pos: "Cụm động từ",
            ipa: "/əˈdres ə ˈprɒbləm/",
            definition: "giải quyết vấn đề",
            example: "We need to address this problem immediately.",
            imageUrl: "",
          },
          {
            word: "avoid",
            pos: "Động từ (v)",
            ipa: "/əˈvɔɪd/",
            definition: "tránh, ngăn ngừa",
            example: "Try to avoid making the same mistake again.",
            imageUrl: "",
          },
          {
            word: "avoidable",
            pos: "Tính từ (adj)",
            ipa: "/əˈvɔɪdəbl/",
            definition: "có thể tránh được",
            example: "Many accidents are avoidable with proper care.",
            imageUrl: "",
          },
          {
            word: "avoidance",
            pos: "Danh từ (n)",
            ipa: "/əˈvɔɪdəns/",
            definition: "sự tránh né",
            example: "His avoidance of responsibility caused delays.",
            imageUrl: "",
          },
          {
            word: "unavoidable",
            pos: "Tính từ (adj)",
            ipa: "/ˌʌnəˈvɔɪdəbl/",
            definition: "không thể tránh được",
            example: "The delay was unavoidable due to bad weather.",
            imageUrl: "",
          },
          {
            word: "demonstrate",
            pos: "Động từ (v)",
            ipa: "/ˈdemənstreɪt/",
            definition: "chứng minh, trình bày",
            example: "The trainer demonstrated how to use the new software.",
            imageUrl: "",
          },
          {
            word: "demonstration",
            pos: "Danh từ (n)",
            ipa: "/ˌdemənˈstreɪʃn/",
            definition: "sự minh họa, trình diễn",
            example: "The product demonstration attracted many customers.",
            imageUrl: "",
          },
          {
            word: "develop",
            pos: "Động từ (v)",
            ipa: "/dɪˈveləp/",
            definition: "phát triển",
            example: "The company is developing a new product line.",
            imageUrl: "",
          },
          {
            word: "developer",
            pos: "Danh từ (n)",
            ipa: "/dɪˈveləpmənt/",
            definition: "nhà phát triển",
            example: "The app developers fixed the bugs quickly.",
            imageUrl: "",
          },
          {
            word: "development",
            pos: "Danh từ (n)",
            ipa: "/dɪˈveləpmənt/",
            definition: "sự phát triển",
            example: "Recent developments have improved productivity.",
            imageUrl: "",
          },
          {
            word: "developing",
            pos: "Tính từ (adj)",
            ipa: "/dɪˈveləpɪŋ/",
            definition: "đang phát triển",
            example: "Many developing countries rely on tourism.",
            imageUrl: "",
          },
          {
            word: "well-developed",
            pos: "Tính từ (adj)",
            ipa: "/wel dɪˈveləpt/",
            definition: "được phát triển tốt",
            example: "Japan has a well-developed transportation system.",
            imageUrl: "",
          },
          {
            word: "evaluate",
            pos: "Động từ (v)",
            ipa: "/ɪˈvæljueɪt/",
            definition: "đánh giá",
            example: "We need to evaluate the performance of our employees.",
            imageUrl: "",
          },
          {
            word: "re-evaluate",
            pos: "Động từ (v)",
            ipa: "/ˌriː ɪˈvæljueɪt/",
            definition: "đánh giá lại",
            example: "They decided to re-evaluate the project plan.",
            imageUrl: "",
          },
          {
            word: "evaluation",
            pos: "Danh từ (n)",
            ipa: "/ɪˌvæljuˈeɪʃn/",
            definition: "sự đánh giá",
            example: "The teacher’s evaluation helped students improve.",
            imageUrl: "",
          },
          {
            word: "gather",
            pos: "Động từ (v)",
            ipa: "/ˈɡæðə(r)/",
            definition: "thu thập, tập hợp",
            example: "We gathered data from several sources.",
            imageUrl: "",
          },
          {
            word: "gathering",
            pos: "Danh từ (n)",
            ipa: "/ˈɡæðərɪŋ/",
            definition: "cuộc họp, sự tụ họp",
            example: "There was a small gathering at the office.",
            imageUrl: "",
          },
          {
            word: "gather information",
            pos: "Cụm động từ",
            ipa: "/ˈɡæðə ˌɪnfəˈmeɪʃn/",
            definition: "thu thập thông tin",
            example: "The analyst gathered information from multiple reports.",
            imageUrl: "",
          },
          {
            word: "offer",
            pos: "Động từ (v)",
            ipa: "/ˈɒfə(r)/",
            definition: "đề nghị, cung cấp",
            example: "The company offered her a higher position.",
            imageUrl: "",
          },
          {
            word: "offer",
            pos: "Danh từ (n)",
            ipa: "/ˈɒfə(r)/",
            definition: "lời đề nghị, ưu đãi",
            example: "The company offered her a higher position.",
            imageUrl: "",
          },
          {
            word: "special offer",
            pos: "Cụm danh từ",
            ipa: "/ˈspeʃl ˈɒfə(r)/",
            definition: "ưu đãi đặc biệt",
            example: "The store has a special offer this week.",
            imageUrl: "",
          },
          {
            word: "primary",
            pos: "Tính từ (adj)",
            ipa: "/ˈpraɪməri/",
            definition: "chính, chủ yếu",
            example: "Our primary goal is customer satisfaction.",
            imageUrl: "",
          },
          {
            word: "primarily",
            pos: "Trạng từ (adv)",
            ipa: "/praɪˈmerəli/",
            definition: "chủ yếu, chính yếu",
            example:
              "The company’s success depends primarily on its employees.",
            imageUrl: "",
          },
          {
            word: "risk",
            pos: "Danh từ (n)",
            ipa: "/rɪsk/",
            definition: "rủi ro",
            example: "There’s always a risk in investing in new markets.",
            imageUrl: "",
          },
          {
            word: "risk",
            pos: "Động từ (v)",
            ipa: "/rɪsk/",
            definition: "mạo hiểm",
            example: "There’s always a risk in investing in new markets.",
            imageUrl: "",
          },
          {
            word: "risky",
            pos: "Tính từ (adj)",
            ipa: "/ˈrɪski/",
            definition: "đầy rủi ro",
            example: "It’s a risky investment, but it could pay off.",
            imageUrl: "",
          },
          {
            word: "take a risk",
            pos: "Cụm từ",
            ipa: "/teɪk ə rɪsk/",
            definition: "chấp nhận rủi ro",
            example: "Sometimes you have to take a risk to succeed.",
            imageUrl: "",
          },
          {
            word: "strategy",
            pos: "Danh từ (n)",
            ipa: "/ˈstrætədʒi/",
            definition: "chiến lược",
            example: "The company developed a new marketing strategy.",
            imageUrl: "",
          },
          {
            word: "strategic",
            pos: "Tính từ (adj)",
            ipa: "/strəˈtiːdʒɪk/",
            definition: "mang tính chiến lược",
            example: "Strategic planning is essential for long-term success.",
            imageUrl: "",
          },
          {
            word: "strategically",
            pos: "Trạng từ (adv)",
            ipa: "/strəˈtiːdʒɪkli/",
            definition: "một cách chiến lược",
            example: "The company was strategically positioned in the market.",
            imageUrl: "",
          },
          {
            word: "strong",
            pos: "Tính từ (adj)",
            ipa: "/strɒŋ/",
            definition: "mạnh mẽ, vững chắc",
            example: "The company has a strong reputation in the industry.",
            imageUrl: "",
          },
          {
            word: "strength",
            pos: "Danh từ (n)",
            ipa: "/streŋkθ/",
            definition: "sức mạnh, điểm mạnh",
            example: "Teamwork is the company’s greatest strength.",
            imageUrl: "",
          },
          {
            word: "strengthen",
            pos: "Động từ (v)",
            ipa: "/ˈstreŋkθn/",
            definition: "củng cố, tăng cường",
            example: "The training program strengthened staff skills.",
            imageUrl: "",
          },
          {
            word: "substitute (for)",
            pos: "Động từ (v)",
            ipa: "/ˈsʌbstɪtjuːt/",
            definition: "thay thế (cho)",
            example: "You can substitute milk for cream in this recipe.",
            imageUrl: "",
          },
          {
            word: "substitute",
            pos: "Danh từ (n)",
            ipa: "/ˈsʌbstɪtjuːt/",
            definition: "người / vật thay thế",
            example: "Soy milk is a good substitute for dairy milk.",
            imageUrl: "",
          },
          {
            word: "substitution",
            pos: "Danh từ (n)",
            ipa: "/ˌsʌbstɪˈtjuːʃn/",
            definition: "sự thay thế",
            example: "There’s no substitution for real experience.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-11",
        title: "Lesson 11",
        words: [
          {
            word: "accommodate",
            pos: "Động từ (v)",
            ipa: "/əˈkɒmədeɪt/",
            definition: "cung cấp chỗ ở, chứa được",
            example: "The hotel can accommodate up to 300 guests.",
            imageUrl: "",
          },
          {
            word: "accommodation",
            pos: "Danh từ (n)",
            ipa: "/əˌkɒməˈdeɪʃn/",
            definition: "chỗ ở",
            example: "We found cheap accommodation near the city center.",
            imageUrl: "",
          },
          {
            word: "arrange",
            pos: "Động từ (v)",
            ipa: "/əˈreɪndʒ/",
            definition: "sắp xếp, thu xếp",
            example: "She arranged the meeting for Monday morning.",
            imageUrl: "",
          },
          {
            word: "arrangement",
            pos: "Danh từ (n)",
            ipa: "/əˈreɪndʒmənt/",
            definition: "sự sắp xếp, thỏa thuận",
            example: "We made arrangements to meet at 6 p.m.",
            imageUrl: "",
          },
          {
            word: "associate",
            pos: "Động từ (v)",
            ipa: "/əˈsəʊʃieɪt/",
            definition: "liên kết",
            example: "I don't want to be associated with that project.",
            imageUrl: "",
          },
          {
            word: "associate",
            pos: "Danh từ (n)",
            ipa: "/əˈsəʊʃieɪt/",
            definition: "người cộng sự",
            example: "I don't want to be associated with that project.",
            imageUrl: "",
          },
          {
            word: "association",
            pos: "Danh từ (n)",
            ipa: "/əˌsəʊsiˈeɪʃn/",
            definition: "hiệp hội, sự liên kết",
            example: "She joined a professional teachers' association.",
            imageUrl: "",
          },
          {
            word: "associated",
            pos: "Tính từ (adj)",
            ipa: "/əˈsəʊʃieɪtɪd/",
            definition: "có liên quan, kết hợp",
            example: "The risks associated with smoking are well known.",
            imageUrl: "",
          },
          {
            word: "attend",
            pos: "Động từ (v)",
            ipa: "/əˈtend/",
            definition: "tham dự, có mặt",
            example: "He attended the seminar on business strategy.",
            imageUrl: "",
          },
          {
            word: "attendee",
            pos: "Danh từ (n)",
            ipa: "/əˌtenˈdiː/",
            definition: "người tham dự",
            example: "There were more than 500 attendees at the conference.",
            imageUrl: "",
          },
          {
            word: "attendance",
            pos: "Danh từ (n)",
            ipa: "/əˈtendəns/",
            definition: "sự có mặt, tham dự",
            example: "Attendance at the workshop is mandatory.",
            imageUrl: "",
          },
          {
            word: "get in touch (with)",
            pos: "Cụm động từ",
            ipa: "/ɡet ɪn tʌtʃ/",
            definition: "liên lạc (với)",
            example: "Please get in touch with me if you have any questions.",
            imageUrl: "",
          },
          {
            word: "stay in touch (with)",
            pos: "Cụm động từ",
            ipa: "/steɪ ɪn tʌtʃ/",
            definition: "giữ liên lạc (với)",
            example: "We still stay in touch after many years.",
            imageUrl: "",
          },
          {
            word: "hold",
            pos: "Động từ (v)",
            ipa: "/həʊld/",
            definition: "tổ chức, cầm, giữ",
            example: "The company holds meetings every Monday.",
            imageUrl: "",
          },
          {
            word: "holder",
            pos: "Danh từ (n)",
            ipa: "/ˈhəʊldə(r)/",
            definition: "người giữ, chủ sở hữu",
            example: "Only ticket holders are allowed to enter.",
            imageUrl: "",
          },
          {
            word: "locate",
            pos: "Động từ (v)",
            ipa: "/ləʊˈkeɪt/",
            definition: "định vị, đặt ở",
            example: "The hotel is located near the airport.",
            imageUrl: "",
          },
          {
            word: "located in",
            pos: "Cụm từ",
            ipa: "/ləʊˈkeɪtɪd ɪn/",
            definition: "nằm ở",
            example: "The office is located in the city center.",
            imageUrl: "",
          },
          {
            word: "location",
            pos: "Danh từ (n)",
            ipa: "/ləʊˈkeɪʃn/",
            definition: "địa điểm, vị trí",
            example: "This restaurant is in a convenient location.",
            imageUrl: "",
          },
          {
            word: "crowded",
            pos: "Tính từ (adj)",
            ipa: "/kraʊdɪd/",
            definition: "đông đúc",
            example: "This city is always crowded with people.",
            imageUrl: "",
          },
          {
            word: "overcrowded",
            pos: "Tính từ (adj)",
            ipa: "/ˌəʊvəˈkraʊdɪd/",
            definition: "quá đông, chật chội",
            example: "The train was overcrowded during rush hour.",
            imageUrl: "",
          },
          {
            word: "register",
            pos: "Động từ (v)",
            ipa: "/ˈredʒɪstə(r)/",
            definition: "đăng ký",
            example: "You need to register online for the event.",
            imageUrl: "",
          },
          {
            word: "registration",
            pos: "Danh từ (n)",
            ipa: "/ˌredʒɪˈstreɪʃn/",
            definition: "sự đăng ký",
            example: "Registration for the class closes tomorrow.",
            imageUrl: "",
          },
          {
            word: "select",
            pos: "Động từ (v)",
            ipa: "/sɪˈlekt/",
            definition: "chọn lựa",
            example: "Please select your preferred payment method.",
            imageUrl: "",
          },
          {
            word: "selection",
            pos: "Danh từ (n)",
            ipa: "/sɪˈlekʃn/",
            definition: "sự lựa chọn, tuyển chọn",
            example: "The final selection will be announced next week.",
            imageUrl: "",
          },
          {
            word: "selective",
            pos: "Tính từ (adj)",
            ipa: "/sɪˈlektɪv/",
            definition: "có chọn lọc",
            example: "The company is very selective in hiring staff.",
            imageUrl: "",
          },
          {
            word: "session",
            pos: "Danh từ (n)",
            ipa: "/ˈseʃn/",
            definition: "buổi, phiên (họp, học,...)",
            example: "The morning session starts at 9 a.m.",
            imageUrl: "",
          },
          {
            word: "take part in",
            pos: "Cụm động từ",
            ipa: "/teɪk pɑːt ɪn/",
            definition: "tham gia vào",
            example:
              "Employees are encouraged to take part in training programs.",
            imageUrl: "",
          },
          {
            word: "participate in",
            pos: "Cụm động từ",
            ipa: "/pɑːˈtɪsɪpeɪt ɪn/",
            definition: "tham gia",
            example: "Many students participate in community projects.",
            imageUrl: "",
          },
          {
            word: "access",
            pos: "Danh từ (n)",
            ipa: "/ˈækses/",
            definition: "quyền truy cập",
            example: "You need a password to access the database.",
            imageUrl: "",
          },
          {
            word: "access",
            pos: "Động từ (v)",
            ipa: "/ˈækses/",
            definition: "truy cập",
            example: "You need a password to access the database.",
            imageUrl: "",
          },
          {
            word: "accessible",
            pos: "Tính từ (adj)",
            ipa: "/əkˈsesəbl/",
            definition: "có thể truy cập, dễ tiếp cận",
            example: "The website is accessible on all devices.",
            imageUrl: "",
          },
          {
            word: "accessibility",
            pos: "Danh từ (n)",
            ipa: "/əkˌsesəˈbɪləti/",
            definition: "tính khả dụng, khả năng truy cập",
            example: "Accessibility is important for all users.",
            imageUrl: "",
          },
          {
            word: "allocate",
            pos: "Động từ (v)",
            ipa: "/ˈæləkeɪt/",
            definition: "phân bổ, chỉ định",
            example: "The manager allocated funds for new equipment.",
            imageUrl: "",
          },
          {
            word: "allocation",
            pos: "Danh từ (n)",
            ipa: "/ˌæləˈkeɪʃn/",
            definition: "sự phân bổ",
            example: "The allocation of resources was carefully planned.",
            imageUrl: "",
          },
          {
            word: "reallocate",
            pos: "Động từ (v)",
            ipa: "/ˌriːˈæləkeɪt/",
            definition: "phân bổ lại",
            example: "The company decided to reallocate its budget.",
            imageUrl: "",
          },
          {
            word: "compatible",
            pos: "Tính từ (adj)",
            ipa: "/kəmˈpætəbl/",
            definition: "tương thích",
            example: "This software is compatible with Windows 11.",
            imageUrl: "",
          },
          {
            word: "compatibility",
            pos: "Danh từ (n)",
            ipa: "/kəmˌpætəˈbɪləti/",
            definition: "tính tương thích",
            example: "Always check the compatibility of the hardware.",
            imageUrl: "",
          },
          {
            word: "incompatible",
            pos: "Tính từ (adj)",
            ipa: "/ˌɪnkəmˈpætəbl/",
            definition: "không tương thích",
            example: "The new app is incompatible with older phones.",
            imageUrl: "",
          },
          {
            word: "delete",
            pos: "Động từ (v)",
            ipa: "/dɪˈliːt/",
            definition: "xóa",
            example: "Please delete unnecessary files to save space.",
            imageUrl: "",
          },
          {
            word: "deletion",
            pos: "Danh từ (n)",
            ipa: "/dɪˈliːʃn/",
            definition: "sự xóa bỏ",
            example: "The accidental deletion caused data loss.",
            imageUrl: "",
          },
          {
            word: "display",
            pos: "Động từ (v)",
            ipa: "/dɪˈspleɪ/",
            definition: "hiển thị, trưng bày",
            example: "The results are displayed on the screen.",
            imageUrl: "",
          },
          {
            word: "display",
            pos: "Danh từ (n)",
            ipa: "/dɪˈspleɪ/",
            definition: "màn hình, bản trình bày",
            example: "The results are displayed on the screen.",
            imageUrl: "",
          },
          {
            word: "on display",
            pos: "Cụm từ",
            ipa: "/ɒn dɪˈspleɪ/",
            definition: "được trưng bày",
            example: "The artwork is now on display at the museum.",
            imageUrl: "",
          },
          {
            word: "duplicate",
            pos: "Động từ (v)",
            ipa: "/ˈdjuːplɪkeɪt/",
            definition: "sao chép",
            example: "Please duplicate this document for all members.",
            imageUrl: "",
          },
          {
            word: "duplicate",
            pos: "Danh từ (n)",
            ipa: "/ˈdjuːplɪkeɪt/",
            definition: "bản sao",
            example: "Please duplicate this document for all members.",
            imageUrl: "",
          },
          {
            word: "duplicate",
            pos: "Tính từ (adj)",
            ipa: "/ˈdjuːplɪkeɪt/",
            definition: "trùng lặp",
            example: "Please duplicate this document for all members.",
            imageUrl: "",
          },
          {
            word: "duplication",
            pos: "Danh từ (n)",
            ipa: "/ˌdjuːplɪˈkeɪʃn/",
            definition: "sự sao chép",
            example: "Data duplication should be avoided in reports.",
            imageUrl: "",
          },
          {
            word: "duplicate copy",
            pos: "Cụm danh từ",
            ipa: "/ˈdjuːplɪkət ˈkɒpi/",
            definition: "bản sao",
            example: "Keep a duplicate copy for your records.",
            imageUrl: "",
          },
          {
            word: "fail",
            pos: "Động từ (v)",
            ipa: "/feɪl/",
            definition: "thất bại, hỏng",
            example: "The device failed to start due to low battery.",
            imageUrl: "",
          },
          {
            word: "failure",
            pos: "Danh từ (n)",
            ipa: "/ˈfeɪljə(r)/",
            definition: "sự thất bại, hư hỏng",
            example: "The system failure caused a major delay.",
            imageUrl: "",
          },
          {
            word: "figure out",
            pos: "Cụm động từ",
            ipa: "/ˈfɪɡər aʊt/",
            definition: "tìm ra, hiểu ra",
            example: "I can't figure out how to fix this error.",
            imageUrl: "",
          },
          {
            word: "ignore",
            pos: "Động từ (v)",
            ipa: "/ɪɡˈnɔː(r)/",
            definition: "phớt lờ",
            example: "Don't ignore the warning message on your screen.",
            imageUrl: "",
          },
          {
            word: "ignorance",
            pos: "Danh từ (n)",
            ipa: "/ˈɪɡnərəns/",
            definition: "sự thiếu hiểu biết",
            example: "His ignorance of technology caused many mistakes.",
            imageUrl: "",
          },
          {
            word: "ignorant",
            pos: "Tính từ (adj)",
            ipa: "/ˈɪɡnərənt/",
            definition: "thiếu hiểu biết",
            example: "He was ignorant about computer systems.",
            imageUrl: "",
          },
          {
            word: "search",
            pos: "Động từ (v)",
            ipa: "/sɜːtʃ/",
            definition: "tìm kiếm",
            example: "You can search for files using this tool.",
            imageUrl: "",
          },
          {
            word: "search",
            pos: "Danh từ (n)",
            ipa: "/sɜːtʃ/",
            definition: "cuộc tìm kiếm",
            example: "You can search for files using this tool.",
            imageUrl: "",
          },
          {
            word: "search engine",
            pos: "Cụm danh từ",
            ipa: "/ˈsɜːtʃ ˌendʒɪn/",
            definition: "công cụ tìm kiếm",
            example: "Google is the most popular search engine.",
            imageUrl: "",
          },
          {
            word: "search result",
            pos: "Cụm danh từ",
            ipa: "/ˈsɜːtʃ rɪˌzʌlt/",
            definition: "kết quả tìm kiếm",
            example: "The search results appear in seconds.",
            imageUrl: "",
          },
          {
            word: "shut down",
            pos: "Cụm động từ",
            ipa: "/ʃʌt daʊn/",
            definition: "tắt, đóng cửa",
            example: "Please shut down the computer before leaving.",
            imageUrl: "",
          },
          {
            word: "shutdown",
            pos: "Danh từ (n)",
            ipa: "/ˈʃʌtdaʊn/",
            definition: "sự tắt máy, đóng cửa",
            example: "The factory shutdown lasted for two days.",
            imageUrl: "",
          },
          {
            word: "warn",
            pos: "Động từ (v)",
            ipa: "/wɔːn/",
            definition: "cảnh báo",
            example: "The technician warned us about possible issues.",
            imageUrl: "",
          },
          {
            word: "warning",
            pos: "Danh từ (n)",
            ipa: "/ˈwɔːnɪŋ/",
            definition: "cảnh báo",
            example: "The system issued a warning about low memory.",
            imageUrl: "",
          },
          {
            word: "warning sign",
            pos: "Cụm danh từ",
            ipa: "/ˈwɔːnɪŋ saɪn/",
            definition: "dấu hiệu cảnh báo",
            example: "Smoke is a warning sign of overheating.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-12",
        title: "Lesson 12",
        words: [
          {
            word: "afford",
            pos: "Động từ (v)",
            ipa: "/əˈfɔː/",
            definition: "chi trả được",
            example: "I don't know how he can afford a new car.",
            imageUrl: "",
          },
          {
            word: "affordable",
            pos: "Tính từ (adj)",
            ipa: "/əˈfɔːdəbl/",
            definition: "có thể chi trả được, hợp túi tiền",
            example:
              "The hotel offers affordable rooms for business travelers.",
            imageUrl: "",
          },
          {
            word: "as needed",
            pos: "Trạng từ cụm từ",
            ipa: "/æz ˈniːdɪd/",
            definition: "khi cần thiết",
            example: "Please refill the printer paper as needed.",
            imageUrl: "",
          },
          {
            word: "be in charge of",
            pos: "Cụm động từ",
            ipa: "/bi ɪn ˈtʃɑːdʒ əv/",
            definition: "chịu trách nhiệm, phụ trách",
            example: "She is in charge of managing the customer service team.",
            imageUrl: "",
          },
          {
            word: "capacity",
            pos: "Danh từ (n)",
            ipa: "/kəˈpæsəti/",
            definition: "sức chứa, năng suất, năng lực",
            example: "The stadium has a seating capacity of 50,000.",
            imageUrl: "",
          },
          {
            word: "full capacity",
            pos: "Cụm danh từ",
            ipa: "/fʊl kəˈpæsəti/",
            definition: "công suất tối đa",
            example: "The factory is operating at full capacity.",
            imageUrl: "",
          },
          {
            word: "durable",
            pos: "Tính từ (adj)",
            ipa: "/ˈdjʊərəbl/",
            definition: "bền, lâu dài",
            example: "This phone is made of durable materials.",
            imageUrl: "",
          },
          {
            word: "durability",
            pos: "Danh từ (n)",
            ipa: "/ˌdjʊərəˈbɪləti/",
            definition: "độ bền",
            example:
              "Durability is one of the main selling points of this product.",
            imageUrl: "",
          },
          {
            word: "initiative",
            pos: "Danh từ (n)",
            ipa: "/ɪˈnɪʃətɪv/",
            definition: "sáng kiến, chủ động",
            example: "The company launched a new marketing initiative.",
            imageUrl: "",
          },
          {
            word: "take the initiative",
            pos: "Cụm động từ",
            ipa: "/teɪk ði ɪˈnɪʃətɪv/",
            definition: "chủ động làm gì",
            example: "Employees are encouraged to take the initiative at work.",
            imageUrl: "",
          },
          {
            word: "physical",
            pos: "Tính từ (adj)",
            ipa: "/ˈfɪzɪkl/",
            definition: "thuộc thể chất, vật lý",
            example: "He has a physical job that requires strength.",
            imageUrl: "",
          },
          {
            word: "physically",
            pos: "Trạng từ (adv)",
            ipa: "/ˈfɪzɪkli/",
            definition: "về thể chất",
            example: "The work is physically demanding.",
            imageUrl: "",
          },
          {
            word: "provide",
            pos: "Động từ (v)",
            ipa: "/prəˈvaɪd/",
            definition: "cung cấp",
            example: "The company provides health insurance to all employees.",
            imageUrl: "",
          },
          {
            word: "provider",
            pos: "Danh từ (n)",
            ipa: "/prəˈvaɪdə(r)/",
            definition: "nhà cung cấp, người cung ứng",
            example: "The internet provider offers 24-hour support.",
            imageUrl: "",
          },
          {
            word: "provision",
            pos: "Danh từ (n)",
            ipa: "/prəˈvɪʒn/",
            definition: "điều khoản, sự cung cấp",
            example: "The contract includes a provision for early termination.",
            imageUrl: "",
          },
          {
            word: "recur",
            pos: "Động từ (v)",
            ipa: "/rɪˈkɜː(r)/",
            definition: "tái diễn, lặp lại",
            example: "The issue may recur if not properly fixed.",
            imageUrl: "",
          },
          {
            word: "recurring",
            pos: "Tính từ (adj)",
            ipa: "/rɪˈkɜːrɪŋ/",
            definition: "lặp đi lặp lại",
            example: "We have a recurring problem with the air conditioner.",
            imageUrl: "",
          },
          {
            word: "recurrence",
            pos: "Danh từ (n)",
            ipa: "/rɪˈkʌrəns/",
            definition: "sự tái diễn",
            example: "The recurrence of the problem caused frustration.",
            imageUrl: "",
          },
          {
            word: "reduce",
            pos: "Động từ (v)",
            ipa: "/rɪˈdjuːs/",
            definition: "giảm, hạ xuống",
            example: "We must reduce expenses to stay within budget.",
            imageUrl: "",
          },
          {
            word: "reduced",
            pos: "Tính từ (adj)",
            ipa: "/rɪˈdjuːst/",
            definition: "bị giảm, được giảm",
            example: "The store is offering reduced prices this week.",
            imageUrl: "",
          },
          {
            word: "reduction",
            pos: "Danh từ (n)",
            ipa: "/rɪˈdʌkʃn/",
            definition: "sự giảm bớt, thu nhỏ",
            example: "The company announced a reduction in staff.",
            imageUrl: "",
          },
          {
            word: "stock",
            pos: "Danh từ (n)",
            ipa: "/stɒk/",
            definition: "hàng tồn kho, dự trữ",
            example: "The store stocks a wide range of electronic goods.",
            imageUrl: "",
          },
          {
            word: "stock",
            pos: "Động từ (v)",
            ipa: "/stɒk/",
            definition: "cung cấp hàng hóa",
            example: "The store stocks a wide range of electronic goods.",
            imageUrl: "",
          },
          {
            word: "in stock",
            pos: "Cụm từ",
            ipa: "/ɪn stɒk/",
            definition: "còn hàng",
            example: "This product is currently in stock.",
            imageUrl: "",
          },
          {
            word: "out of stock",
            pos: "Cụm từ",
            ipa: "/aʊt əv stɒk/",
            definition: "hết hàng",
            example: "The laptop is out of stock right now.",
            imageUrl: "",
          },
          {
            word: "restock",
            pos: "Động từ (v)",
            ipa: "/ˌriːˈstɒk/",
            definition: "bổ sung hàng",
            example: "The manager will restock the shelves this afternoon.",
            imageUrl: "",
          },
          {
            word: "stockroom",
            pos: "Danh từ (n)",
            ipa: "/ˈstɒkruːm/",
            definition: "kho hàng",
            example: "The stockroom is full of office supplies.",
            imageUrl: "",
          },
          {
            word: "appreciation",
            pos: "Danh từ (n)",
            ipa: "/əˌpriːʃiˈeɪʃn/",
            definition: "sự cảm kích, sự đánh giá cao",
            example:
              "We would like to express our appreciation for your hard work.",
            imageUrl: "",
          },
          {
            word: "appreciate",
            pos: "Động từ (v)",
            ipa: "/əˈpriːʃieɪt/",
            definition: "đánh giá cao, trân trọng",
            example: "I really appreciate your help with this project.",
            imageUrl: "",
          },
          {
            word: "be made of",
            pos: "Cụm từ",
            ipa: "/biː meɪd əv/",
            definition: "được làm bằng (chất liệu)",
            example: "This table is made of solid wood.",
            imageUrl: "",
          },
          {
            word: "bring in",
            pos: "Cụm động từ",
            ipa: "/brɪŋ ɪn/",
            definition: "mang lại, tuyển vào, giới thiệu",
            example: "The company brought in new safety regulations.",
            imageUrl: "",
          },
          {
            word: "casual",
            pos: "Tính từ (adj)",
            ipa: "/ˈkæʒuəl/",
            definition: "thoải mái, bình thường",
            example: "Fridays are casual dress days at our office.",
            imageUrl: "",
          },
          {
            word: "casually",
            pos: "Trạng từ (adv)",
            ipa: "/ˈkæʒuəli/",
            definition: "một cách thoải mái, không trang trọng",
            example: "Employees are allowed to dress casually on Fridays.",
            imageUrl: "",
          },
          {
            word: "code",
            pos: "Danh từ (n)",
            ipa: "/kəʊd/",
            definition: "quy tắc, mã",
            example: "Please follow the company's dress code.",
            imageUrl: "",
          },
          {
            word: "code",
            pos: "Động từ (v)",
            ipa: "/kəʊd/",
            definition: "mã hóa",
            example: "Please follow the company's dress code.",
            imageUrl: "",
          },
          {
            word: "expose",
            pos: "Động từ (v)",
            ipa: "/ɪkˈspəʊz/",
            definition: "phơi bày, tiết lộ",
            example: "The investigation exposed serious safety issues.",
            imageUrl: "",
          },
          {
            word: "exposure",
            pos: "Danh từ (n)",
            ipa: "/ɪkˈspəʊʒə(r)/",
            definition: "sự phơi bày, sự tiếp xúc",
            example: "Too much exposure to sunlight can be harmful.",
            imageUrl: "",
          },
          {
            word: "glimpse",
            pos: "Danh từ (n)",
            ipa: "/ɡlɪmps/",
            definition: "cái nhìn thoáng qua",
            example: "She caught a glimpse of the CEO in the hallway.",
            imageUrl: "",
          },
          {
            word: "glimpse",
            pos: "Động từ (v)",
            ipa: "/ɡlɪmps/",
            definition: "thoáng thấy",
            example: "She caught a glimpse of the CEO in the hallway.",
            imageUrl: "",
          },
          {
            word: "out of",
            pos: "Giới từ cụm từ",
            ipa: "/aʊt əv/",
            definition: "ngoài, hết (cái gì đó)",
            example: "We are out of stock on that item.",
            imageUrl: "",
          },
          {
            word: "out of date",
            pos: "Cụm từ",
            ipa: "/aʊt əv deɪt/",
            definition: "lỗi thời",
            example: "Your passport is out of date.",
            imageUrl: "",
          },
          {
            word: "out of order",
            pos: "Cụm từ",
            ipa: "/aʊt əv ˈɔːdə(r)/",
            definition: "hư, không hoạt động",
            example: "The coffee machine is out of order.",
            imageUrl: "",
          },
          {
            word: "outdated",
            pos: "Tính từ (adj)",
            ipa: "/ˌaʊtˈdeɪtɪd/",
            definition: "lỗi thời, lạc hậu",
            example: "The company needs to replace its outdated equipment.",
            imageUrl: "",
          },
          {
            word: "practice",
            pos: "Danh từ (n)",
            ipa: "/ˈpræktɪs/",
            definition: "luyện tập, thực hành",
            example:
              "You should practice your presentation before the meeting.",
            imageUrl: "",
          },
          {
            word: "practice",
            pos: "Động từ (v)",
            ipa: "/ˈpræktɪs/",
            definition: "luyện tập",
            example:
              "You should practice your presentation before the meeting.",
            imageUrl: "",
          },
          {
            word: "practical",
            pos: "Tính từ (adj)",
            ipa: "/ˈpræktɪkl/",
            definition: "thực tế, thiết thực",
            example: "She has a practical approach to solving problems.",
            imageUrl: "",
          },
          {
            word: "reinforce",
            pos: "Động từ (v)",
            ipa: "/ˌriːɪnˈfɔːs/",
            definition: "củng cố, tăng cường",
            example: "The manager reinforced the importance of teamwork.",
            imageUrl: "",
          },
          {
            word: "reinforcement",
            pos: "Danh từ (n)",
            ipa: "/ˌriːɪnˈfɔːsmənt/",
            definition: "sự củng cố, hỗ trợ",
            example: "The teacher used games as a reinforcement tool.",
            imageUrl: "",
          },
          {
            word: "verbal",
            pos: "Tính từ (adj)",
            ipa: "/ˈvɜːbl/",
            definition: "bằng lời, thuộc ngôn ngữ nói",
            example: "They had a verbal agreement, not a written one.",
            imageUrl: "",
          },
          {
            word: "verbally",
            pos: "Trạng từ (adv)",
            ipa: "/ˈvɜːbəli/",
            definition: "bằng lời nói",
            example: "The supervisor gave instructions verbally.",
            imageUrl: "",
          },
          {
            word: "verbalize",
            pos: "Động từ (v)",
            ipa: "/ˈvɜːbəlaɪz/",
            definition: "diễn đạt bằng lời",
            example: "It's hard to verbalize how grateful I am.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-13",
        title: "Lesson 13",
        words: [
          {
            word: "disk",
            pos: "Danh từ (n)",
            ipa: "/dɪsk/",
            definition: "đĩa (lưu trữ, CD, ổ cứng)",
            example: "Save the file on your hard disk.",
            imageUrl: "",
          },
          {
            word: "hard disk",
            pos: "Cụm danh từ",
            ipa: "/ˈhɑːd dɪsk/",
            definition: "ổ cứng",
            example: "The hard disk is full; we need to delete some files.",
            imageUrl: "",
          },
          {
            word: "facilitate",
            pos: "Động từ (v)",
            ipa: "/fəˈsɪlɪteɪt/",
            definition: "tạo điều kiện, làm cho dễ dàng",
            example: "The new software facilitates faster communication.",
            imageUrl: "",
          },
          {
            word: "facilitation",
            pos: "Danh từ (n)",
            ipa: "/fəˌsɪlɪˈteɪʃn/",
            definition: "sự tạo điều kiện, sự hỗ trợ",
            example: "Effective facilitation is essential for teamwork.",
            imageUrl: "",
          },
          {
            word: "facilitator",
            pos: "Danh từ (n)",
            ipa: "/fəˈsɪlɪteɪtə(r)/",
            definition: "người hướng dẫn, người hỗ trợ",
            example: "The facilitator guided the discussion efficiently.",
            imageUrl: "",
          },
          {
            word: "network",
            pos: "Danh từ (n)",
            ipa: "/ˈnetwɜːk/",
            definition: "mạng lưới, kết nối",
            example: "All computers in the office are networked.",
            imageUrl: "",
          },
          {
            word: "network",
            pos: "Động từ (v)",
            ipa: "/ˈnetwɜːk/",
            definition: "kết nối, xây dựng mối quan hệ",
            example: "All computers in the office are networked.",
            imageUrl: "",
          },
          {
            word: "networking",
            pos: "Danh từ (n)",
            ipa: "/ˈnetwɜːkɪŋ/",
            definition: "việc kết nối, xây dựng mối quan hệ",
            example:
              "Business networking helps professionals expand opportunities.",
            imageUrl: "",
          },
          {
            word: "popular",
            pos: "Tính từ (adj)",
            ipa: "/ˈpɒpjələ(r)/",
            definition: "phổ biến, được yêu thích",
            example: "This restaurant is very popular with tourists.",
            imageUrl: "",
          },
          {
            word: "popularize",
            pos: "Động từ (v)",
            ipa: "/ˈpɒpjʊləraɪz/",
            definition: "làm cho phổ biến",
            example: "The campaign aims to popularize healthy eating habits.",
            imageUrl: "",
          },
          {
            word: "popularity",
            pos: "Danh từ (n)",
            ipa: "/ˌpɒpjuˈlærəti/",
            definition: "sự phổ biến, được ưa chuộng",
            example: "The app gained popularity among young users.",
            imageUrl: "",
          },
          {
            word: "process",
            pos: "Danh từ (n)",
            ipa: "/ˈprəʊses/",
            definition: "quá trình",
            example: "It takes time to process customer feedback.",
            imageUrl: "",
          },
          {
            word: "process",
            pos: "Động từ (v)",
            ipa: "/prəˈses/",
            definition: "xử lý",
            example: "It takes time to process customer feedback.",
            imageUrl: "",
          },
          {
            word: "processing",
            pos: "Danh từ (n)",
            ipa: "/ˈprəʊsesɪŋ/",
            definition: "sự xử lý (dữ liệu, thông tin)",
            example: "Data processing requires powerful computers.",
            imageUrl: "",
          },
          {
            word: "replace",
            pos: "Động từ (v)",
            ipa: "/rɪˈpleɪs/",
            definition: "thay thế",
            example: "We need to replace the old printer with a new one.",
            imageUrl: "",
          },
          {
            word: "replacement",
            pos: "Danh từ (n)",
            ipa: "/rɪˈpleɪsmənt/",
            definition: "sự thay thế, vật thay thế",
            example:
              "The company provided a free replacement for the faulty item.",
            imageUrl: "",
          },
          {
            word: "revolution",
            pos: "Danh từ (n)",
            ipa: "/ˌrevəˈluːʃn/",
            definition: "cuộc cách mạng, sự đổi mới lớn",
            example: "The Internet caused a revolution in communication.",
            imageUrl: "",
          },
          {
            word: "revolutionary",
            pos: "Tính từ (adj)",
            ipa: "/ˌrevəˈluːʃənəri/",
            definition: "mang tính cách mạng",
            example: "Smartphones were a revolutionary invention.",
            imageUrl: "",
          },
          {
            word: "sharp",
            pos: "Tính từ (adj)",
            ipa: "/ʃɑːp/",
            definition: "sắc bén, rõ nét, thông minh",
            example: "She has a sharp mind and learns things quickly.",
            imageUrl: "",
          },
          {
            word: "skill",
            pos: "Danh từ (n)",
            ipa: "/skɪl/",
            definition: "kỹ năng",
            example: "Communication skill is essential for success.",
            imageUrl: "",
          },
          {
            word: "skilled",
            pos: "Tính từ (adj)",
            ipa: "/skɪld/",
            definition: "có tay nghề, lành nghề",
            example: "The company hires only skilled technicians.",
            imageUrl: "",
          },
          {
            word: "skillful",
            pos: "Tính từ (adj)",
            ipa: "/ˈskɪlfl/",
            definition: "khéo léo, tài giỏi",
            example: "She is a skillful negotiator.",
            imageUrl: "",
          },
          {
            word: "software",
            pos: "Danh từ (n)",
            ipa: "/ˈsɒftweə(r)/",
            definition: "phần mềm",
            example: "The new software improves data security.",
            imageUrl: "",
          },
          {
            word: "store",
            pos: "Động từ (v)",
            ipa: "/stɔː(r)/",
            definition: "lưu trữ",
            example: "You can store your files in the cloud.",
            imageUrl: "",
          },
          {
            word: "store",
            pos: "Danh từ (n)",
            ipa: "/stɔː(r)/",
            definition: "cửa hàng",
            example: "You can store your files in the cloud.",
            imageUrl: "",
          },
          {
            word: "storage",
            pos: "Danh từ (n)",
            ipa: "/ˈstɔːrɪdʒ/",
            definition: "sự lưu trữ, kho lưu trữ",
            example: "Cloud storage allows access from anywhere.",
            imageUrl: "",
          },
          {
            word: "storefront",
            pos: "Danh từ (n)",
            ipa: "/ˈstɔːfrʌnt/",
            definition: "mặt tiền cửa hàng",
            example: "The storefront was redesigned to attract more customers.",
            imageUrl: "",
          },
          {
            word: "technology",
            pos: "Danh từ (n)",
            ipa: "/tekˈnɒlədʒi/",
            definition: "công nghệ",
            example: "Advances in technology make work more efficient.",
            imageUrl: "",
          },
          {
            word: "technological",
            pos: "Tính từ (adj)",
            ipa: "/ˌteknəˈlɒdʒɪkl/",
            definition: "thuộc về công nghệ",
            example: "The firm invests heavily in technological innovation.",
            imageUrl: "",
          },
          {
            word: "technical",
            pos: "Tính từ (adj)",
            ipa: "/ˈteknɪkl/",
            definition: "thuộc kỹ thuật",
            example: "He gave a detailed technical explanation.",
            imageUrl: "",
          },
          {
            word: "technically",
            pos: "Trạng từ (adv)",
            ipa: "/ˈteknɪkli/",
            definition: "về mặt kỹ thuật",
            example: "Technically, the system is ready for launch.",
            imageUrl: "",
          },
          {
            word: "technician",
            pos: "Danh từ (n)",
            ipa: "/tekˈnɪʃn/",
            definition: "kỹ thuật viên",
            example: "The technician repaired the network system.",
            imageUrl: "",
          },
          {
            word: "assemble",
            pos: "Động từ (v)",
            ipa: "/əˈsembl/",
            definition: "tập hợp, lắp ráp",
            example: "The manager assembled the team for a quick meeting.",
            imageUrl: "",
          },
          {
            word: "assembly",
            pos: "Danh từ (n)",
            ipa: "/əˈsembli/",
            definition: "cuộc họp, sự lắp ráp",
            example:
              "The parts are manufactured abroad and put together during assembly.",
            imageUrl: "",
          },
          {
            word: "beforehand",
            pos: "Trạng từ (adv)",
            ipa: "/bɪˈfɔːhænd/",
            definition: "trước, sẵn sàng trước",
            example: "Make sure you prepare all materials beforehand.",
            imageUrl: "",
          },
          {
            word: "complicate",
            pos: "Động từ (v)",
            ipa: "/ˈkɒmplɪkeɪt/",
            definition: "làm phức tạp",
            example: "Adding too many steps will only complicate the process.",
            imageUrl: "",
          },
          {
            word: "complicated",
            pos: "Tính từ (adj)",
            ipa: "/ˈkɒmplɪkeɪtɪd/",
            definition: "phức tạp, rắc rối",
            example: "The new tax system is very complicated.",
            imageUrl: "",
          },
          {
            word: "complication",
            pos: "Danh từ (n)",
            ipa: "/ˌkɒmplɪˈkeɪʃn/",
            definition: "sự phức tạp, rắc rối",
            example: "The project was delayed due to unexpected complications.",
            imageUrl: "",
          },
          {
            word: "courier",
            pos: "Danh từ (n)",
            ipa: "/ˈkʊriə(r)/",
            definition: "người giao hàng, dịch vụ chuyển phát",
            example: "The courier delivered the package this morning.",
            imageUrl: "",
          },
          {
            word: "express",
            pos: "Động từ (v)",
            ipa: "/ɪkˈspres/",
            definition: "diễn đạt",
            example: "She expressed her concerns clearly.",
            imageUrl: "",
          },
          {
            word: "express",
            pos: "Tính từ (adj)",
            ipa: "/ɪkˈspres/",
            definition: "nhanh, hỏa tốc",
            example: "We need express delivery.",
            imageUrl: "",
          },
          {
            word: "express",
            pos: "Danh từ (n)",
            ipa: "/ɪkˈspres/",
            definition: "dịch vụ giao hàng nhanh",
            example: "We need express delivery.",
            imageUrl: "",
          },
          {
            word: "expression",
            pos: "Danh từ (n)",
            ipa: "/ɪkˈspreʃn/",
            definition: "sự diễn đạt, biểu cảm",
            example: "His facial expression showed surprise.",
            imageUrl: "",
          },
          {
            word: "fold",
            pos: "Động từ (v)",
            ipa: "/fəʊld/",
            definition: "gấp",
            example: "Please fold the letter neatly before mailing it.",
            imageUrl: "",
          },
          {
            word: "fold",
            pos: "Danh từ (n)",
            ipa: "/fəʊld/",
            definition: "nếp gấp",
            example: "Please fold the letter neatly before mailing it.",
            imageUrl: "",
          },
          {
            word: "folder",
            pos: "Danh từ (n)",
            ipa: "/ˈfəʊldə(r)/",
            definition: "bìa hồ sơ, thư mục",
            example: "Save all your documents in one folder.",
            imageUrl: "",
          },
          {
            word: "layout",
            pos: "Danh từ (n)",
            ipa: "/ˈleɪaʊt/",
            definition: "bố cục, cách sắp xếp",
            example: "The new office layout encourages collaboration.",
            imageUrl: "",
          },
          {
            word: "mention",
            pos: "Động từ (v)",
            ipa: "/ˈmenʃn/",
            definition: "đề cập, nhắc đến",
            example: "He didn't mention the meeting in his email.",
            imageUrl: "",
          },
          {
            word: "mention",
            pos: "Danh từ (n)",
            ipa: "/ˈmenʃn/",
            definition: "việc đề cập",
            example: "He didn't mention the meeting in his email.",
            imageUrl: "",
          },
          {
            word: "mentioned",
            pos: "Tính từ (adj)",
            ipa: "/ˈmenʃənd/",
            definition: "được đề cập",
            example: "The mentioned document must be reviewed first.",
            imageUrl: "",
          },
          {
            word: "petition",
            pos: "Danh từ (n)",
            ipa: "/pəˈtɪʃn/",
            definition: "kiến nghị, đơn thỉnh cầu",
            example: "The employees signed a petition for better benefits.",
            imageUrl: "",
          },
          {
            word: "petition",
            pos: "Động từ (v)",
            ipa: "/pəˈtɪʃn/",
            definition: "gửi đơn kiến nghị",
            example: "The employees signed a petition for better benefits.",
            imageUrl: "",
          },
          {
            word: "proof",
            pos: "Danh từ (n)",
            ipa: "/pruːf/",
            definition: "bằng chứng",
            example: "The editor asked me to proof the final draft.",
            imageUrl: "",
          },
          {
            word: "proof",
            pos: "Động từ (v)",
            ipa: "/pruːf/",
            definition: "kiểm tra lỗi",
            example: "The editor asked me to proof the final draft.",
            imageUrl: "",
          },
          {
            word: "proofread",
            pos: "Động từ (v)",
            ipa: "/ˈpruːfriːd/",
            definition: "đọc và sửa lỗi",
            example: "Please proofread the document before printing.",
            imageUrl: "",
          },
          {
            word: "register",
            pos: "Động từ (v)",
            ipa: "/ˈredʒɪstə(r)/",
            definition: "đăng ký",
            example: "You must register for the seminar online.",
            imageUrl: "",
          },
          {
            word: "registration",
            pos: "Danh từ (n)",
            ipa: "/ˌredʒɪˈstreɪʃn/",
            definition: "sự đăng ký",
            example: "The registration process only takes a few minutes.",
            imageUrl: "",
          },
          {
            word: "revise",
            pos: "Động từ (v)",
            ipa: "/rɪˈvaɪz/",
            definition: "chỉnh sửa, ôn tập",
            example: "We need to revise the report before submission.",
            imageUrl: "",
          },
          {
            word: "revised",
            pos: "Tính từ (adj)",
            ipa: "/rɪˈvaɪzd/",
            definition: "được chỉnh sửa",
            example: "The revised version includes new data.",
            imageUrl: "",
          },
          {
            word: "revision",
            pos: "Danh từ (n)",
            ipa: "/rɪˈvɪʒn/",
            definition: "sự sửa đổi, ôn tập",
            example: "The teacher asked for a second revision of the essay.",
            imageUrl: "",
          },
          {
            word: "reviser",
            pos: "Danh từ (n)",
            ipa: "/rɪˈvaɪzə(r)/",
            definition: "người chỉnh sửa",
            example: "The reviser worked carefully on the final manuscript.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-14",
        title: "Lesson 14",
        words: [
          {
            word: "abundant",
            pos: "Tính từ (adj)",
            ipa: "/əˈbʌndənt/",
            definition: "dồi dào, phong phú",
            example: "The region is abundant in natural resources.",
            imageUrl: "",
          },
          {
            word: "abundance",
            pos: "Danh từ (n)",
            ipa: "/əˈbʌndəns/",
            definition: "sự phong phú",
            example: "There is an abundance of food at the festival.",
            imageUrl: "",
          },
          {
            word: "abundantly",
            pos: "Trạng từ (adv)",
            ipa: "/əˈbʌndəntli/",
            definition: "một cách dồi dào",
            example: "The team was abundantly rewarded for its success.",
            imageUrl: "",
          },
          {
            word: "accomplish",
            pos: "Động từ (v)",
            ipa: "/əˈkʌmplɪʃ/",
            definition: "hoàn thành, đạt được",
            example: "She accomplished all her goals before the deadline.",
            imageUrl: "",
          },
          {
            word: "accomplished",
            pos: "Tính từ (adj)",
            ipa: "/əˈkʌmplɪʃt/",
            definition: "tài năng, xuất sắc",
            example: "He is an accomplished pianist.",
            imageUrl: "",
          },
          {
            word: "accomplishment",
            pos: "Danh từ (n)",
            ipa: "/əˈkʌmplɪʃmənt/",
            definition: "thành tựu",
            example: "Winning the award was a major accomplishment.",
            imageUrl: "",
          },
          {
            word: "bring together",
            pos: "Cụm động từ",
            ipa: "/brɪŋ təˈɡɛðə(r)/",
            definition: "gom lại, tụ họp, kết nối",
            example:
              "The conference will bring together experts from around the world.",
            imageUrl: "",
          },
          {
            word: "candidate",
            pos: "Danh từ (n)",
            ipa: "/ˈkændɪdət/",
            definition: "ứng viên",
            example: "Each candidate must submit a résumé and cover letter.",
            imageUrl: "",
          },
          {
            word: "candidacy",
            pos: "Danh từ (n)",
            ipa: "/ˈkændɪdəsi/",
            definition: "tư cách ứng cử",
            example: "His candidacy was officially approved yesterday.",
            imageUrl: "",
          },
          {
            word: "come up with",
            pos: "Cụm động từ",
            ipa: "/kʌm ʌp wɪð/",
            definition: "nghĩ ra, đưa ra (ý tưởng, kế hoạch)",
            example:
              "She came up with a great idea for the marketing campaign.",
            imageUrl: "",
          },
          {
            word: "commensurate",
            pos: "Tính từ (adj)",
            ipa: "/kəˈmenʃərət/",
            definition: "tương xứng (với)",
            example:
              "Salary will be commensurate with experience and qualifications.",
            imageUrl: "",
          },
          {
            word: "match",
            pos: "Động từ (v)",
            ipa: "/mætʃ/",
            definition: "phù hợp, kết hợp",
            example:
              "This position matches your skills and background perfectly.",
            imageUrl: "",
          },
          {
            word: "match",
            pos: "Danh từ (n)",
            ipa: "/mætʃ/",
            definition: "trận đấu, cặp phù hợp",
            example:
              "This position matches your skills and background perfectly.",
            imageUrl: "",
          },
          {
            word: "matching",
            pos: "Tính từ (adj)",
            ipa: "/ˈmætʃɪŋ/",
            definition: "phù hợp, đồng bộ",
            example: "She wore a matching hat and scarf.",
            imageUrl: "",
          },
          {
            word: "mismatch",
            pos: "Danh từ (n)",
            ipa: "/ˌmɪsˈmætʃ/",
            definition: "sự không phù hợp",
            example: "There was a mismatch between demand and supply.",
            imageUrl: "",
          },
          {
            word: "mismatch",
            pos: "Động từ (v)",
            ipa: "/ˌmɪsˈmætʃ/",
            definition: "không phù hợp",
            example: "There was a mismatch between demand and supply.",
            imageUrl: "",
          },
          {
            word: "profile",
            pos: "Danh từ (n)",
            ipa: "/ˈprəʊfaɪl/",
            definition: "hồ sơ, tiểu sử, mô tả sơ lược",
            example:
              "The job requires a candidate with a high professional profile.",
            imageUrl: "",
          },
          {
            word: "profile",
            pos: "Động từ (v)",
            ipa: "/ˈprəʊfaɪl/",
            definition: "mô tả sơ lược",
            example:
              "The job requires a candidate with a high professional profile.",
            imageUrl: "",
          },
          {
            word: "qualify",
            pos: "Động từ (v)",
            ipa: "/ˈkwɒlɪfaɪ/",
            definition: "đủ điều kiện, đạt tiêu chuẩn",
            example: "He qualified for the management position.",
            imageUrl: "",
          },
          {
            word: "qualified",
            pos: "Tính từ (adj)",
            ipa: "/ˈkwɒlɪfaɪd/",
            definition: "đủ tiêu chuẩn",
            example: "She is highly qualified for the role.",
            imageUrl: "",
          },
          {
            word: "qualifications",
            pos: "Danh từ (n)",
            ipa: "/ˌkwɒlɪfɪˈkeɪʃnz/",
            definition: "bằng cấp, năng lực",
            example: "The job requires strong academic qualifications.",
            imageUrl: "",
          },
          {
            word: "recruit",
            pos: "Động từ (v)",
            ipa: "/rɪˈkruːt/",
            definition: "tuyển dụng",
            example: "The company plans to recruit more staff this year.",
            imageUrl: "",
          },
          {
            word: "recruit",
            pos: "Danh từ (n)",
            ipa: "/rɪˈkruːt/",
            definition: "lính mới, người vừa tuyển dụng",
            example: "The company plans to recruit more staff this year.",
            imageUrl: "",
          },
          {
            word: "recruiter",
            pos: "Danh từ (n)",
            ipa: "/rɪˈkruːtə(r)/",
            definition: "người tuyển dụng",
            example: "The recruiter will contact shortlisted candidates soon.",
            imageUrl: "",
          },
          {
            word: "recruitment",
            pos: "Danh từ (n)",
            ipa: "/rɪˈkruːtmənt/",
            definition: "quá trình tuyển dụng",
            example: "Recruitment takes place twice a year.",
            imageUrl: "",
          },
          {
            word: "submit",
            pos: "Động từ (v)",
            ipa: "/səbˈmɪt/",
            definition: "nộp, trình",
            example: "Please submit your application by Friday.",
            imageUrl: "",
          },
          {
            word: "submission",
            pos: "Danh từ (n)",
            ipa: "/səbˈmɪʃn/",
            definition: "sự nộp, sự đệ trình",
            example: "Late submissions will not be accepted.",
            imageUrl: "",
          },
          {
            word: "time-consuming",
            pos: "Tính từ (adj)",
            ipa: "/ˈtaɪm kənˌsjuːmɪŋ/",
            definition: "tốn thời gian",
            example: "Checking each report manually is very time-consuming.",
            imageUrl: "",
          },
          {
            word: "able",
            pos: "Tính từ (adj)",
            ipa: "/ˈeɪbl/",
            definition: "có khả năng",
            example: "She is able to handle multiple projects at once.",
            imageUrl: "",
          },
          {
            word: "ability",
            pos: "Danh từ (n)",
            ipa: "/əˈbɪləti/",
            definition: "khả năng, năng lực",
            example: "The job requires strong communication abilities.",
            imageUrl: "",
          },
          {
            word: "disable",
            pos: "Động từ (v)",
            ipa: "/dɪsˈeɪbl/",
            definition: "làm cho vô hiệu hóa, mất năng lực",
            example: "The account was disabled due to security issues.",
            imageUrl: "",
          },
          {
            word: "unable",
            pos: "Tính từ (adj)",
            ipa: "/ʌnˈeɪbl/",
            definition: "không thể",
            example: "He was unable to attend the meeting.",
            imageUrl: "",
          },
          {
            word: "apply",
            pos: "Động từ (v)",
            ipa: "/əˈplaɪ/",
            definition: "nộp đơn, áp dụng",
            example: "She applied for a position at the company.",
            imageUrl: "",
          },
          {
            word: "applicant",
            pos: "Danh từ (n)",
            ipa: "/ˈæplɪkənt/",
            definition: "người nộp đơn",
            example: "Each applicant must include a cover letter.",
            imageUrl: "",
          },
          {
            word: "application",
            pos: "Danh từ (n)",
            ipa: "/ˌæplɪˈkeɪʃn/",
            definition: "đơn xin, sự ứng dụng",
            example: "Your application has been received.",
            imageUrl: "",
          },
          {
            word: "background",
            pos: "Danh từ (n)",
            ipa: "/ˈbækɡraʊnd/",
            definition: "nền tảng, tiểu sử, lý lịch",
            example: "His educational background is impressive.",
            imageUrl: "",
          },
          {
            word: "be ready for",
            pos: "Cụm động từ",
            ipa: "/bi ˈredi fɔːr/",
            definition: "sẵn sàng cho",
            example: "She is ready for the interview tomorrow.",
            imageUrl: "",
          },
          {
            word: "call in",
            pos: "Cụm động từ",
            ipa: "/kɔːl ɪn/",
            definition: "gọi vào, mời đến",
            example: "The manager called in the technician to fix the printer.",
            imageUrl: "",
          },
          {
            word: "confident",
            pos: "Tính từ (adj)",
            ipa: "/ˈkɒnfɪdənt/",
            definition: "tự tin",
            example: "He feels confident about his exam results.",
            imageUrl: "",
          },
          {
            word: "confidently",
            pos: "Trạng từ (adv)",
            ipa: "/ˈkɒnfɪdəntli/",
            definition: "một cách tự tin",
            example: "She confidently answered all the questions.",
            imageUrl: "",
          },
          {
            word: "confidence",
            pos: "Danh từ (n)",
            ipa: "/ˈkɒnfɪdəns/",
            definition: "sự tự tin",
            example: "She spoke with confidence during the presentation.",
            imageUrl: "",
          },
          {
            word: "constant",
            pos: "Tính từ (adj)",
            ipa: "/ˈkɒnstənt/",
            definition: "liên tục, không đổi",
            example: "The company is under constant pressure to innovate.",
            imageUrl: "",
          },
          {
            word: "constantly",
            pos: "Trạng từ (adv)",
            ipa: "/ˈkɒnstəntli/",
            definition: "liên tục, thường xuyên",
            example: "He is constantly improving his skills.",
            imageUrl: "",
          },
          {
            word: "expert",
            pos: "Danh từ (n)",
            ipa: "/ˈekspɜːt/",
            definition: "chuyên gia",
            example: "She is a marketing expert with 10 years of experience.",
            imageUrl: "",
          },
          {
            word: "expert",
            pos: "Tính từ (adj)",
            ipa: "/ˈekspɜːt/",
            definition: "thành thạo",
            example: "She is a marketing expert with 10 years of experience.",
            imageUrl: "",
          },
          {
            word: "expertise",
            pos: "Danh từ (n)",
            ipa: "/ˌekspɜːˈtiːz/",
            definition: "chuyên môn, sự thành thạo",
            example: "His technical expertise is highly valued.",
            imageUrl: "",
          },
          {
            word: "follow up",
            pos: "Cụm động từ",
            ipa: "/ˈfɒləʊ ʌp/",
            definition: "theo dõi, tiếp tục",
            example: "Please follow up with the client next week.",
            imageUrl: "",
          },
          {
            word: "follow-up",
            pos: "Danh từ (n)",
            ipa: "/ˈfɒləʊ ʌp/",
            definition: "việc tiếp theo, sự theo dõi",
            example: "We arranged a follow-up meeting after the interview.",
            imageUrl: "",
          },
          {
            word: "follow-up",
            pos: "Tính từ (adj)",
            ipa: "/ˈfɒləʊ ʌp/",
            definition: "liên quan đến việc tiếp theo",
            example: "We arranged a follow-up meeting after the interview.",
            imageUrl: "",
          },
          {
            word: "hesitate",
            pos: "Động từ (v)",
            ipa: "/ˈhezɪteɪt/",
            definition: "do dự, ngập ngừng",
            example: "Don't hesitate to contact us if you need help.",
            imageUrl: "",
          },
          {
            word: "hesitant",
            pos: "Tính từ (adj)",
            ipa: "/ˈhezɪtənt/",
            definition: "do dự",
            example: "She was hesitant to accept the offer.",
            imageUrl: "",
          },
          {
            word: "hesitation",
            pos: "Danh từ (n)",
            ipa: "/ˌhezɪˈteɪʃn/",
            definition: "sự do dự",
            example: "After a brief hesitation, he answered the question.",
            imageUrl: "",
          },
          {
            word: "present",
            pos: "Động từ (v)",
            ipa: "/prɪˈzent/",
            definition: "trình bày",
            example: "She will present her project tomorrow.",
            imageUrl: "",
          },
          {
            word: "present",
            pos: "Danh từ (n)",
            ipa: "/ˈprezənt/",
            definition: "hiện tại, quà tặng",
            example: "She will present her project tomorrow.",
            imageUrl: "",
          },
          {
            word: "present",
            pos: "Tính từ (adj)",
            ipa: "/ˈprezənt/",
            definition: "có mặt, hiện tại",
            example: "She will present her project tomorrow.",
            imageUrl: "",
          },
          {
            word: "presentation",
            pos: "Danh từ (n)",
            ipa: "/ˌpreznˈteɪʃn/",
            definition: "bài thuyết trình",
            example: "The team gave an excellent presentation.",
            imageUrl: "",
          },
          {
            word: "weak",
            pos: "Tính từ (adj)",
            ipa: "/wiːk/",
            definition: "yếu, kém",
            example: "The company's profits were weak this quarter.",
            imageUrl: "",
          },
          {
            word: "weakness",
            pos: "Danh từ (n)",
            ipa: "/ˈwiːknəs/",
            definition: "điểm yếu",
            example: "Her main weakness is public speaking.",
            imageUrl: "",
          },
          {
            word: "weaken",
            pos: "Động từ (v)",
            ipa: "/ˈwiːkən/",
            definition: "làm yếu đi",
            example: "The storm weakened before reaching the coast.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-15",
        title: "Lesson 15",
        words: [
          {
            word: "conduct",
            pos: "Động từ (v)",
            ipa: "/kənˈdʌkt/",
            definition: "tiến hành",
            example:
              "The manager will conduct an interview with each applicant.",
            imageUrl: "",
          },
          {
            word: "conduct",
            pos: "Danh từ (n)",
            ipa: "/ˈkɒndʌkt/",
            definition: "cách cư xử",
            example:
              "The manager will conduct an interview with each applicant.",
            imageUrl: "",
          },
          {
            word: "conductor",
            pos: "Danh từ (n)",
            ipa: "/kənˈdʌktə(r)/",
            definition: "người chỉ huy, người điều khiển",
            example: "The conductor led the orchestra beautifully.",
            imageUrl: "",
          },
          {
            word: "generate",
            pos: "Động từ (v)",
            ipa: "/ˈdʒenəreɪt/",
            definition: "tạo ra, sản xuất",
            example: "This campaign generated a lot of public interest.",
            imageUrl: "",
          },
          {
            word: "generation",
            pos: "Danh từ (n)",
            ipa: "/ˌdʒenəˈreɪʃn/",
            definition: "thế hệ, sự phát sinh",
            example: "The younger generation is more tech-savvy.",
            imageUrl: "",
          },
          {
            word: "generator",
            pos: "Danh từ (n)",
            ipa: "/ˈdʒenəreɪtə(r)/",
            definition: "máy phát, người tạo ra",
            example: "The backup generator provides power during outages.",
            imageUrl: "",
          },
          {
            word: "hire",
            pos: "Động từ (v)",
            ipa: "/ˈhaɪə(r)/",
            definition: "thuê, tuyển dụng",
            example: "The firm hired five new engineers last month.",
            imageUrl: "",
          },
          {
            word: "hire",
            pos: "Danh từ (n)",
            ipa: "/ˈhaɪə(r)/",
            definition: "việc thuê, tiền thuê",
            example: "The firm hired five new engineers last month.",
            imageUrl: "",
          },
          {
            word: "hiring",
            pos: "Danh từ (n)",
            ipa: "/ˈhaɪərɪŋ/",
            definition: "việc tuyển dụng",
            example: "The company's hiring process is very selective.",
            imageUrl: "",
          },
          {
            word: "keep up with",
            pos: "Cụm động từ",
            ipa: "/kiːp ʌp wɪð/",
            definition: "theo kịp, bắt kịp",
            example: "It's hard to keep up with the latest technology trends.",
            imageUrl: "",
          },
          {
            word: "look up to",
            pos: "Cụm động từ",
            ipa: "/lʊk ʌp tuː/",
            definition: "ngưỡng mộ, tôn trọng",
            example: "Many employees look up to their manager as a mentor.",
            imageUrl: "",
          },
          {
            word: "mentor",
            pos: "Danh từ (n)",
            ipa: "/ˈmentɔː(r)/",
            definition: "người hướng dẫn, cố vấn",
            example: "She mentors new employees to help them adjust quickly.",
            imageUrl: "",
          },
          {
            word: "mentor",
            pos: "Động từ (v)",
            ipa: "/ˈmentɔː(r)/",
            definition: "hướng dẫn, cố vấn",
            example: "She mentors new employees to help them adjust quickly.",
            imageUrl: "",
          },
          {
            word: "mentorship",
            pos: "Danh từ (n)",
            ipa: "/ˈmentɔːʃɪp/",
            definition: "mối quan hệ hướng dẫn",
            example: "Mentorship programs improve employee retention.",
            imageUrl: "",
          },
          {
            word: "on track",
            pos: "Cụm từ",
            ipa: "/ɒn træk/",
            definition: "đúng tiến độ, đi đúng hướng",
            example: "The project is on track to finish by June.",
            imageUrl: "",
          },
          {
            word: "off track",
            pos: "Cụm từ",
            ipa: "/ɒf træk/",
            definition: "chệch hướng, lệch kế hoạch",
            example: "The team went off track due to poor communication.",
            imageUrl: "",
          },
          {
            word: "reject",
            pos: "Động từ (v)",
            ipa: "/rɪˈdʒekt/",
            definition: "từ chối, loại bỏ",
            example: "The company rejected his job application.",
            imageUrl: "",
          },
          {
            word: "rejection",
            pos: "Danh từ (n)",
            ipa: "/rɪˈdʒekʃn/",
            definition: "sự từ chối, loại bỏ",
            example: "She handled the rejection gracefully.",
            imageUrl: "",
          },
          {
            word: "set up",
            pos: "Cụm động từ",
            ipa: "/set ʌp/",
            definition: "thiết lập, thành lập",
            example: "They set up a new branch in Singapore last year.",
            imageUrl: "",
          },
          {
            word: "setup",
            pos: "Danh từ (n)",
            ipa: "/ˈsetʌp/",
            definition: "sự bố trí, cấu hình",
            example: "The office setup is simple and efficient.",
            imageUrl: "",
          },
          {
            word: "succeed",
            pos: "Động từ (v)",
            ipa: "/səkˈsiːd/",
            definition: "thành công, kế nhiệm",
            example: "He succeeded his father as CEO.",
            imageUrl: "",
          },
          {
            word: "success",
            pos: "Danh từ (n)",
            ipa: "/səkˈses/",
            definition: "sự thành công",
            example: "Her success came after years of hard work.",
            imageUrl: "",
          },
          {
            word: "successful",
            pos: "Tính từ (adj)",
            ipa: "/səkˈsesfl/",
            definition: "thành công",
            example: "The company was successful in launching the new product.",
            imageUrl: "",
          },
          {
            word: "unsuccessful",
            pos: "Tính từ (adj)",
            ipa: "/ˌʌnsəkˈsesfl/",
            definition: "không thành công",
            example: "The first attempt was unsuccessful.",
            imageUrl: "",
          },
          {
            word: "train",
            pos: "Động từ (v)",
            ipa: "/treɪn/",
            definition: "đào tạo, huấn luyện",
            example: "She trains new interns every summer.",
            imageUrl: "",
          },
          {
            word: "train",
            pos: "Danh từ (n)",
            ipa: "/treɪn/",
            definition: "đoàn tàu",
            example: "She trains new interns every summer.",
            imageUrl: "",
          },
          {
            word: "training",
            pos: "Danh từ (n)",
            ipa: "/ˈtreɪnɪŋ/",
            definition: "sự đào tạo",
            example: "All employees must attend safety training.",
            imageUrl: "",
          },
          {
            word: "trainer",
            pos: "Danh từ (n)",
            ipa: "/ˈtreɪnə(r)/",
            definition: "huấn luyện viên",
            example: "The trainer guided us through the new software.",
            imageUrl: "",
          },
          {
            word: "trainee",
            pos: "Danh từ (n)",
            ipa: "/ˌtreɪˈniː/",
            definition: "người được đào tạo",
            example: "Each trainee receives a mentor.",
            imageUrl: "",
          },
          {
            word: "update",
            pos: "Động từ (v)",
            ipa: "/ʌpˈdeɪt/",
            definition: "cập nhật",
            example: "Please update your password regularly.",
            imageUrl: "",
          },
          {
            word: "update",
            pos: "Danh từ (n)",
            ipa: "/ˈʌpdeɪt/",
            definition: "bản cập nhật",
            example: "Please update your password regularly.",
            imageUrl: "",
          },
          {
            word: "updated",
            pos: "Tính từ (adj)",
            ipa: "/ʌpˈdeɪtɪd/",
            definition: "được cập nhật",
            example: "The updated report includes new data.",
            imageUrl: "",
          },
          {
            word: "up-to-date",
            pos: "Tính từ (adj)",
            ipa: "/ˌʌp tə ˈdeɪt/",
            definition: "cập nhật, hiện đại",
            example: "Make sure your records are up-to-date.",
            imageUrl: "",
          },
          {
            word: "basis",
            pos: "Danh từ (n)",
            ipa: "/ˈbeɪsɪs/",
            definition: "nền tảng, cơ sở",
            example: "Decisions are made on the basis of performance.",
            imageUrl: "",
          },
          {
            word: "basic",
            pos: "Tính từ (adj)",
            ipa: "/ˈbeɪsɪk/",
            definition: "cơ bản",
            example: "We provide basic training for all new employees.",
            imageUrl: "",
          },
          {
            word: "basically",
            pos: "Trạng từ (adv)",
            ipa: "/ˈbeɪsɪkli/",
            definition: "về cơ bản",
            example: "Basically, the idea is to improve productivity.",
            imageUrl: "",
          },
          {
            word: "be aware of",
            pos: "Cụm động từ",
            ipa: "/bi əˈweər əv/",
            definition: "nhận thức về, ý thức được",
            example: "Employees should be aware of company policies.",
            imageUrl: "",
          },
          {
            word: "awareness",
            pos: "Danh từ (n)",
            ipa: "/əˈweənəs/",
            definition: "sự nhận thức",
            example: "Public awareness of health issues has increased.",
            imageUrl: "",
          },
          {
            word: "benefit",
            pos: "Danh từ (n)",
            ipa: "/ˈbenɪfɪt/",
            definition: "lợi ích",
            example: "The new policy benefits all employees.",
            imageUrl: "",
          },
          {
            word: "benefit",
            pos: "Động từ (v)",
            ipa: "/ˈbenɪfɪt/",
            definition: "mang lại lợi ích",
            example: "The new policy benefits all employees.",
            imageUrl: "",
          },
          {
            word: "beneficial",
            pos: "Tính từ (adj)",
            ipa: "/ˌbenɪˈfɪʃl/",
            definition: "có lợi, có ích",
            example: "Regular exercise is beneficial to your health.",
            imageUrl: "",
          },
          {
            word: "beneficiary",
            pos: "Danh từ (n)",
            ipa: "/ˌbenɪˈfɪʃəri/",
            definition: "người thụ hưởng",
            example: "The employee's spouse is listed as the beneficiary.",
            imageUrl: "",
          },
          {
            word: "compensate",
            pos: "Động từ (v)",
            ipa: "/ˈkɒmpenseɪt/",
            definition: "đền bù, bồi thường",
            example: "The company will compensate you for travel expenses.",
            imageUrl: "",
          },
          {
            word: "compensation",
            pos: "Danh từ (n)",
            ipa: "/ˌkɒmpenˈseɪʃn/",
            definition: "sự bồi thường, tiền đền bù",
            example: "She received compensation for her overtime work.",
            imageUrl: "",
          },
          {
            word: "delicate",
            pos: "Tính từ (adj)",
            ipa: "/ˈdelɪkət/",
            definition: "tinh tế, nhạy cảm, dễ vỡ",
            example: "This is a delicate issue that requires careful handling.",
            imageUrl: "",
          },
          {
            word: "delicately",
            pos: "Trạng từ (adv)",
            ipa: "/ˈdelɪkətli/",
            definition: "một cách tinh tế",
            example: "She handled the situation delicately.",
            imageUrl: "",
          },
          {
            word: "delicacy",
            pos: "Danh từ (n)",
            ipa: "/ˈdelɪkəsi/",
            definition: "món ngon, sự tinh tế",
            example: "The restaurant is known for local delicacies.",
            imageUrl: "",
          },
          {
            word: "eligible",
            pos: "Tính từ (adj)",
            ipa: "/ˈelɪdʒəbl/",
            definition: "đủ điều kiện",
            example: "Only full-time employees are eligible for bonuses.",
            imageUrl: "",
          },
          {
            word: "ineligible",
            pos: "Tính từ (adj)",
            ipa: "/ɪnˈelɪdʒəbl/",
            definition: "không đủ điều kiện",
            example: "Temporary workers are ineligible for paid leave.",
            imageUrl: "",
          },
          {
            word: "flexible",
            pos: "Tính từ (adj)",
            ipa: "/ˈfleksəbl/",
            definition: "linh hoạt",
            example: "We offer flexible working hours.",
            imageUrl: "",
          },
          {
            word: "flexibility",
            pos: "Danh từ (n)",
            ipa: "/ˌfleksəˈbɪləti/",
            definition: "sự linh hoạt",
            example: "Flexibility is important in customer service roles.",
            imageUrl: "",
          },
          {
            word: "inflexible",
            pos: "Tính từ (adj)",
            ipa: "/ɪnˈfleksəbl/",
            definition: "cứng nhắc",
            example: "The company's policy is too inflexible.",
            imageUrl: "",
          },
          {
            word: "negotiate",
            pos: "Động từ (v)",
            ipa: "/nɪˈɡəʊʃieɪt/",
            definition: "đàm phán, thương lượng",
            example: "They are negotiating a new contract.",
            imageUrl: "",
          },
          {
            word: "negotiation",
            pos: "Danh từ (n)",
            ipa: "/nɪˌɡəʊʃiˈeɪʃn/",
            definition: "cuộc đàm phán",
            example: "The negotiation lasted for several hours.",
            imageUrl: "",
          },
          {
            word: "negotiable",
            pos: "Tính từ (adj)",
            ipa: "/nɪˈɡəʊʃəbl/",
            definition: "có thể thương lượng",
            example: "The terms of the contract are negotiable.",
            imageUrl: "",
          },
          {
            word: "raise",
            pos: "Động từ (v)",
            ipa: "/reɪz/",
            definition: "nâng lên, tăng lương",
            example: "The company raised salaries last year.",
            imageUrl: "",
          },
          {
            word: "raise",
            pos: "Danh từ (n)",
            ipa: "/reɪz/",
            definition: "sự tăng lương",
            example: "The company raised salaries last year.",
            imageUrl: "",
          },
          {
            word: "pay raise",
            pos: "Cụm danh từ",
            ipa: "/peɪ reɪz/",
            definition: "sự tăng lương",
            example: "All staff received a pay raise in July.",
            imageUrl: "",
          },
          {
            word: "retire",
            pos: "Động từ (v)",
            ipa: "/rɪˈtaɪə(r)/",
            definition: "nghỉ hưu",
            example: "She plans to retire at the age of 60.",
            imageUrl: "",
          },
          {
            word: "retirement",
            pos: "Danh từ (n)",
            ipa: "/rɪˈtaɪəmənt/",
            definition: "sự nghỉ hưu",
            example: "Many employees look forward to a comfortable retirement.",
            imageUrl: "",
          },
          {
            word: "retiree",
            pos: "Danh từ (n)",
            ipa: "/ˌrɪtaɪəˈriː/",
            definition: "người nghỉ hưu",
            example: "The company organized a party for its retirees.",
            imageUrl: "",
          },
          {
            word: "vested",
            pos: "Tính từ (adj)",
            ipa: "/ˈvestɪd/",
            definition: "được trao quyền, được bảo đảm",
            example: "Employees have vested rights to their pensions.",
            imageUrl: "",
          },
          {
            word: "vest",
            pos: "Động từ (v)",
            ipa: "/vest/",
            definition: "trao quyền, ban quyền",
            example: "Ownership of the land is vested in the company.",
            imageUrl: "",
          },
          {
            word: "wage",
            pos: "Danh từ (n)",
            ipa: "/weɪdʒ/",
            definition: "tiền lương (thường theo giờ/tuần)",
            example: "Factory workers are paid hourly wages.",
            imageUrl: "",
          },
          {
            word: "wage earner",
            pos: "Cụm danh từ",
            ipa: "/ˈweɪdʒ ˌɜːnə(r)/",
            definition: "người làm công ăn lương",
            example: "Most wage earners receive pay every Friday.",
            imageUrl: "",
          },
          {
            word: "minimum wage",
            pos: "Cụm danh từ",
            ipa: "/ˈmɪnɪməm weɪdʒ/",
            definition: "mức lương tối thiểu",
            example: "The government increased the minimum wage last year.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-16",
        title: "Lesson 16",
        words: [
          {
            word: "achieve",
            pos: "Động từ (v)",
            ipa: "/əˈtʃiːv/",
            definition: "đạt được, giành được",
            example: "She achieved all her sales targets last quarter.",
            imageUrl: "",
          },
          {
            word: "achievement",
            pos: "Danh từ (n)",
            ipa: "/əˈtʃiːvmənt/",
            definition: "thành tựu",
            example: "Winning the award was a great achievement for the team.",
            imageUrl: "",
          },
          {
            word: "contribute",
            pos: "Động từ (v)",
            ipa: "/kənˈtrɪbjuːt/",
            definition: "đóng góp",
            example: "Each member contributes to the project's success.",
            imageUrl: "",
          },
          {
            word: "contribution",
            pos: "Danh từ (n)",
            ipa: "/ˌkɒntrɪˈbjuːʃn/",
            definition: "sự đóng góp",
            example: "Her contribution to the company has been invaluable.",
            imageUrl: "",
          },
          {
            word: "contributor",
            pos: "Danh từ (n)",
            ipa: "/kənˈtrɪbjətə(r)/",
            definition: "người đóng góp",
            example:
              "Regular contributors to the magazine receive free copies.",
            imageUrl: "",
          },
          {
            word: "dedicate",
            pos: "Động từ (v)",
            ipa: "/ˈdedɪkeɪt/",
            definition: "cống hiến, dành cho",
            example: "She dedicated her career to helping others.",
            imageUrl: "",
          },
          {
            word: "dedication",
            pos: "Danh từ (n)",
            ipa: "/ˌdedɪˈkeɪʃn/",
            definition: "sự cống hiến, tận tâm",
            example: "The manager praised his dedication to the company.",
            imageUrl: "",
          },
          {
            word: "dedicated",
            pos: "Tính từ (adj)",
            ipa: "/ˈdedɪkeɪtɪd/",
            definition: "tận tụy, tận tâm",
            example: "Our team consists of dedicated professionals.",
            imageUrl: "",
          },
          {
            word: "look forward to",
            pos: "Cụm động từ",
            ipa: "/lʊk ˈfɔːwəd tuː/",
            definition: "mong đợi",
            example: "We look forward to hearing from you soon.",
            imageUrl: "",
          },
          {
            word: "look to",
            pos: "Cụm động từ",
            ipa: "/lʊk tuː/",
            definition: "trông cậy, kỳ vọng vào",
            example: "Employees look to their managers for guidance.",
            imageUrl: "",
          },
          {
            word: "loyal",
            pos: "Tính từ (adj)",
            ipa: "/ˈlɔɪəl/",
            definition: "trung thành",
            example: "The company rewards loyal customers with discounts.",
            imageUrl: "",
          },
          {
            word: "loyalty",
            pos: "Danh từ (n)",
            ipa: "/ˈlɔɪəlti/",
            definition: "lòng trung thành",
            example: "Employee loyalty is highly valued here.",
            imageUrl: "",
          },
          {
            word: "merit",
            pos: "Danh từ (n)",
            ipa: "/ˈmerɪt/",
            definition: "công lao, giá trị, sự xuất sắc",
            example: "Promotions are based on merit, not seniority.",
            imageUrl: "",
          },
          {
            word: "obvious",
            pos: "Tính từ (adj)",
            ipa: "/ˈɒbviəs/",
            definition: "rõ ràng, hiển nhiên",
            example: "It was obvious that the project needed more time.",
            imageUrl: "",
          },
          {
            word: "obviously",
            pos: "Trạng từ (adv)",
            ipa: "/ˈɒbviəsli/",
            definition: "một cách rõ ràng",
            example: "Obviously, good teamwork improves productivity.",
            imageUrl: "",
          },
          {
            word: "produce",
            pos: "Động từ (v)",
            ipa: "/prəˈdjuːs/",
            definition: "sản xuất, tạo ra",
            example: "The factory produces electronic components.",
            imageUrl: "",
          },
          {
            word: "productive",
            pos: "Tính từ (adj)",
            ipa: "/prəˈdʌktɪv/",
            definition: "năng suất, hiệu quả",
            example: "The staff meeting was very productive.",
            imageUrl: "",
          },
          {
            word: "productivity",
            pos: "Danh từ (n)",
            ipa: "/ˌprɒdʌkˈtɪvəti/",
            definition: "năng suất lao động",
            example: "The new system increased productivity by 20%.",
            imageUrl: "",
          },
          {
            word: "promote",
            pos: "Động từ (v)",
            ipa: "/prəˈməʊt/",
            definition: "thăng chức, quảng bá",
            example: "The company promotes employees based on merit.",
            imageUrl: "",
          },
          {
            word: "promotion",
            pos: "Danh từ (n)",
            ipa: "/prəˈməʊʃn/",
            definition: "sự thăng chức, khuyến mãi",
            example: "She received a promotion to sales manager.",
            imageUrl: "",
          },
          {
            word: "recognize",
            pos: "Động từ (v)",
            ipa: "/ˈrekəɡnaɪz/",
            definition: "công nhận, nhận ra",
            example: "The company recognized her efforts with an award.",
            imageUrl: "",
          },
          {
            word: "recognition",
            pos: "Danh từ (n)",
            ipa: "/ˌrekəɡˈnɪʃn/",
            definition: "sự công nhận, ghi nhận",
            example: "She received recognition for her outstanding work.",
            imageUrl: "",
          },
          {
            word: "value",
            pos: "Danh từ (n)",
            ipa: "/ˈvæljuː/",
            definition: "giá trị",
            example: "We highly value teamwork and communication.",
            imageUrl: "",
          },
          {
            word: "value",
            pos: "Động từ (v)",
            ipa: "/ˈvæljuː/",
            definition: "coi trọng",
            example: "We highly value teamwork and communication.",
            imageUrl: "",
          },
          {
            word: "valuable",
            pos: "Tính từ (adj)",
            ipa: "/ˈvæljuəbl/",
            definition: "có giá trị, hữu ích",
            example: "Her advice was extremely valuable to the project.",
            imageUrl: "",
          },
          {
            word: "valuation",
            pos: "Danh từ (n)",
            ipa: "/ˌvæljuˈeɪʃn/",
            definition: "sự định giá",
            example: "The valuation of the company increased this year.",
            imageUrl: "",
          },
          {
            word: "bargain",
            pos: "Danh từ (n)",
            ipa: "/ˈbɑːɡɪn/",
            definition: "món hời, giá rẻ",
            example: "We found some great bargains during the clearance sale.",
            imageUrl: "",
          },
          {
            word: "bargain",
            pos: "Động từ (v)",
            ipa: "/ˈbɑːɡɪn/",
            definition: "mặc cả, thương lượng giá",
            example: "Customers often bargain at local markets.",
            imageUrl: "",
          },
          {
            word: "bear",
            pos: "Động từ (v)",
            ipa: "/beə(r)/",
            definition: "chịu đựng, gánh chịu (trách nhiệm, chi phí)",
            example: "The company cannot bear the cost of another delay.",
            imageUrl: "",
          },
          {
            word: "behave",
            pos: "Động từ (v)",
            ipa: "/bɪˈheɪv/",
            definition: "cư xử",
            example: "The employee always behaves professionally.",
            imageUrl: "",
          },
          {
            word: "behavior",
            pos: "Danh từ (n)",
            ipa: "/bɪˈheɪvjə(r)/",
            definition: "hành vi, cách cư xử",
            example: "Good customer behavior is encouraged in all stores.",
            imageUrl: "",
          },
          {
            word: "checkout",
            pos: "Danh từ (n)",
            ipa: "/ˈtʃekaʊt/",
            definition: "quầy thanh toán",
            example: "Please proceed to the checkout counter with your items.",
            imageUrl: "",
          },
          {
            word: "check out",
            pos: "Cụm động từ",
            ipa: "/tʃek aʊt/",
            definition: "thanh toán, trả phòng",
            example: "Guests must check out by noon.",
            imageUrl: "",
          },
          {
            word: "comfort",
            pos: "Danh từ (n)",
            ipa: "/ˈkʌmfət/",
            definition: "sự thoải mái",
            example: "The new chairs offer extra comfort to customers.",
            imageUrl: "",
          },
          {
            word: "comfortable",
            pos: "Tính từ (adj)",
            ipa: "/ˈkʌmfətəbl/",
            definition: "thoải mái",
            example:
              "This hotel provides a comfortable environment for guests.",
            imageUrl: "",
          },
          {
            word: "comfortably",
            pos: "Trạng từ (adv)",
            ipa: "/ˈkʌmfətəbli/",
            definition: "một cách thoải mái",
            example: "The visitors were seated comfortably in the lounge.",
            imageUrl: "",
          },
          {
            word: "discomfort",
            pos: "Danh từ (n)",
            ipa: "/dɪsˈkʌmfət/",
            definition: "sự khó chịu",
            example:
              "Some customers reported slight discomfort after the change.",
            imageUrl: "",
          },
          {
            word: "expand",
            pos: "Động từ (v)",
            ipa: "/ɪkˈspænd/",
            definition: "mở rộng, phát triển",
            example: "The company plans to expand its market to Asia.",
            imageUrl: "",
          },
          {
            word: "expansion",
            pos: "Danh từ (n)",
            ipa: "/ɪkˈspænʃn/",
            definition: "sự mở rộng",
            example: "The expansion of the business created 100 new jobs.",
            imageUrl: "",
          },
          {
            word: "explore",
            pos: "Động từ (v)",
            ipa: "/ɪkˈsplɔː(r)/",
            definition: "khám phá",
            example: "The team will explore new marketing strategies.",
            imageUrl: "",
          },
          {
            word: "explorer",
            pos: "Danh từ (n)",
            ipa: "/ɪkˈsplɔːrə(r)/",
            definition: "người thám hiểm",
            example: "The explorer discovered a new trade route.",
            imageUrl: "",
          },
          {
            word: "exploration",
            pos: "Danh từ (n)",
            ipa: "/ˌekspləˈreɪʃn/",
            definition: "sự khám phá",
            example:
              "Market exploration helps companies find new opportunities.",
            imageUrl: "",
          },
          {
            word: "exploratory",
            pos: "Tính từ (adj)",
            ipa: "/ɪkˈsplɒrətri/",
            definition: "có tính thăm dò, khám phá",
            example:
              "They conducted exploratory research on consumer behavior.",
            imageUrl: "",
          },
          {
            word: "item",
            pos: "Danh từ (n)",
            ipa: "/ˈaɪtəm/",
            definition: "mặt hàng, món đồ",
            example: "Each item on the list must be checked carefully.",
            imageUrl: "",
          },
          {
            word: "itemize",
            pos: "Động từ (v)",
            ipa: "/ˈaɪtəmaɪz/",
            definition: "liệt kê từng món",
            example: "Please itemize all expenses on the invoice.",
            imageUrl: "",
          },
          {
            word: "mandatory",
            pos: "Tính từ (adj)",
            ipa: "/ˈmændətəri/",
            definition: "bắt buộc",
            example: "Wearing an ID badge is mandatory in the building.",
            imageUrl: "",
          },
          {
            word: "mandate",
            pos: "Danh từ (n)",
            ipa: "/ˈmændeɪt/",
            definition: "sự ủy quyền, lệnh",
            example: "The new safety mandates apply to all employees.",
            imageUrl: "",
          },
          {
            word: "mandate",
            pos: "Động từ (v)",
            ipa: "/ˈmændeɪt/",
            definition: "ủy quyền",
            example: "The new safety mandates apply to all employees.",
            imageUrl: "",
          },
          {
            word: "merchandise",
            pos: "Danh từ (n)",
            ipa: "/ˈmɜːtʃəndaɪs/",
            definition: "hàng hóa",
            example: "The store displays new merchandise every week.",
            imageUrl: "",
          },
          {
            word: "merchant",
            pos: "Danh từ (n)",
            ipa: "/ˈmɜːtʃənt/",
            definition: "thương nhân",
            example: "Local merchants gathered for the trade fair.",
            imageUrl: "",
          },
          {
            word: "commerce",
            pos: "Danh từ (n)",
            ipa: "/ˈkɒmɜːs/",
            definition: "thương mại",
            example: "Online commerce has grown rapidly in recent years.",
            imageUrl: "",
          },
          {
            word: "commercial",
            pos: "Tính từ (adj)",
            ipa: "/kəˈmɜːʃl/",
            definition: "thuộc thương mại",
            example: "The company specializes in commercial real estate.",
            imageUrl: "",
          },
          {
            word: "commercial",
            pos: "Danh từ (n)",
            ipa: "/kəˈmɜːʃl/",
            definition: "quảng cáo",
            example: "The company specializes in commercial real estate.",
            imageUrl: "",
          },
          {
            word: "strict",
            pos: "Tính từ (adj)",
            ipa: "/strɪkt/",
            definition: "nghiêm khắc",
            example: "The school has a strict dress code.",
            imageUrl: "",
          },
          {
            word: "trend",
            pos: "Danh từ (n)",
            ipa: "/trend/",
            definition: "xu hướng",
            example: "The latest trend in dining is healthy fast food.",
            imageUrl: "",
          },
          {
            word: "trendy",
            pos: "Tính từ (adj)",
            ipa: "/ˈtrendi/",
            definition: "hợp thời trang, theo xu hướng",
            example: "Trendy restaurants attract many young people.",
            imageUrl: "",
          },
          {
            word: "trending",
            pos: "Tính từ (adj)",
            ipa: "/ˈtrendɪŋ/",
            definition: "đang thịnh hành",
            example: "The app lists all trending products of the week.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-17",
        title: "Lesson 17",
        words: [
          {
            word: "diverse",
            pos: "Tính từ (adj)",
            ipa: "/daɪˈvɜːs/",
            definition: "đa dạng",
            example: "The company employs a diverse group of professionals.",
            imageUrl: "",
          },
          {
            word: "diversify",
            pos: "Động từ (v)",
            ipa: "/daɪˈvɜːsɪfaɪ/",
            definition: "đa dạng hóa",
            example:
              "The company plans to diversify its product lines next year.",
            imageUrl: "",
          },
          {
            word: "diversity",
            pos: "Danh từ (n)",
            ipa: "/daɪˈvɜːsəti/",
            definition: "sự đa dạng",
            example:
              "Workplace diversity improves creativity and productivity.",
            imageUrl: "",
          },
          {
            word: "enterprise",
            pos: "Danh từ (n)",
            ipa: "/ˈentəpraɪz/",
            definition: "doanh nghiệp, công ty",
            example: "Small enterprises play an important role in the economy.",
            imageUrl: "",
          },
          {
            word: "essence",
            pos: "Danh từ (n)",
            ipa: "/ˈesns/",
            definition: "bản chất, tinh túy",
            example: "Honesty is the essence of good leadership.",
            imageUrl: "",
          },
          {
            word: "essential",
            pos: "Tính từ (adj)",
            ipa: "/ɪˈsenʃl/",
            definition: "cần thiết, thiết yếu",
            example: "Good communication is essential for teamwork.",
            imageUrl: "",
          },
          {
            word: "everyday",
            pos: "Tính từ (adj)",
            ipa: "/ˈevrideɪ/",
            definition: "hàng ngày, thông thường",
            example: "These shoes are designed for everyday use.",
            imageUrl: "",
          },
          {
            word: "function",
            pos: "Danh từ (n)",
            ipa: "/ˈfʌŋkʃn/",
            definition: "chức năng",
            example: "The main function of this machine is to print documents.",
            imageUrl: "",
          },
          {
            word: "function",
            pos: "Động từ (v)",
            ipa: "/ˈfʌŋkʃn/",
            definition: "hoạt động, vận hành",
            example: "The main function of this machine is to print documents.",
            imageUrl: "",
          },
          {
            word: "functional",
            pos: "Tính từ (adj)",
            ipa: "/ˈfʌŋkʃənl/",
            definition: "có chức năng, hoạt động tốt",
            example: "The new office furniture is both stylish and functional.",
            imageUrl: "",
          },
          {
            word: "malfunction",
            pos: "Danh từ (n)",
            ipa: "/ˌmælˈfʌŋkʃn/",
            definition: "sự trục trặc, hư hỏng",
            example: "A software malfunction caused a delay in the project.",
            imageUrl: "",
          },
          {
            word: "maintain",
            pos: "Động từ (v)",
            ipa: "/meɪnˈteɪn/",
            definition: "duy trì, bảo dưỡng",
            example: "Technicians maintain the system every week.",
            imageUrl: "",
          },
          {
            word: "maintenance",
            pos: "Danh từ (n)",
            ipa: "/ˈmeɪntənəns/",
            definition: "việc bảo trì, bảo dưỡng",
            example: "Regular maintenance keeps machines in good condition.",
            imageUrl: "",
          },
          {
            word: "obtain",
            pos: "Động từ (v)",
            ipa: "/əbˈteɪn/",
            definition: "đạt được, thu được",
            example: "You must obtain permission before entering the building.",
            imageUrl: "",
          },
          {
            word: "obtainable",
            pos: "Tính từ (adj)",
            ipa: "/əbˈteɪnəbl/",
            definition: "có thể đạt được",
            example: "The information is easily obtainable from our website.",
            imageUrl: "",
          },
          {
            word: "prerequisite",
            pos: "Danh từ (n)",
            ipa: "/ˌpriːˈrekwəzɪt/",
            definition: "điều kiện tiên quyết",
            example:
              "A degree in business is a prerequisite for this position.",
            imageUrl: "",
          },
          {
            word: "quality",
            pos: "Danh từ (n)",
            ipa: "/ˈkwɒləti/",
            definition: "chất lượng",
            example: "The company is known for producing high-quality goods.",
            imageUrl: "",
          },
          {
            word: "qualify",
            pos: "Động từ (v)",
            ipa: "/ˈkwɒlɪfaɪ/",
            definition: "đủ điều kiện",
            example: "Applicants must qualify for financial aid.",
            imageUrl: "",
          },
          {
            word: "qualification",
            pos: "Danh từ (n)",
            ipa: "/ˌkwɒlɪfɪˈkeɪʃn/",
            definition: "bằng cấp, trình độ",
            example: "He has the right qualifications for this job.",
            imageUrl: "",
          },
          {
            word: "smooth",
            pos: "Tính từ (adj)",
            ipa: "/smuːð/",
            definition: "trôi chảy, mượt mà",
            example: "The transition to the new system was smooth.",
            imageUrl: "",
          },
          {
            word: "smoothly",
            pos: "Trạng từ (adv)",
            ipa: "/ˈsmuːðli/",
            definition: "suôn sẻ",
            example: "Everything ran smoothly during the presentation.",
            imageUrl: "",
          },
          {
            word: "smoothness",
            pos: "Danh từ (n)",
            ipa: "/ˈsmuːðnəs/",
            definition: "sự trôi chảy",
            example: "The smoothness of the process impressed the manager.",
            imageUrl: "",
          },
          {
            word: "source",
            pos: "Danh từ (n)",
            ipa: "/sɔːs/",
            definition: "nguồn, nơi cung cấp",
            example: "The Internet is a good source of information.",
            imageUrl: "",
          },
          {
            word: "outsource",
            pos: "Động từ (v)",
            ipa: "/ˈaʊtsɔːs/",
            definition: "thuê ngoài",
            example:
              "The company decided to outsource IT services to reduce costs.",
            imageUrl: "",
          },
          {
            word: "sourcing",
            pos: "Danh từ (n)",
            ipa: "/ˈsɔːsɪŋ/",
            definition: "việc tìm nguồn cung ứng",
            example: "Global sourcing has become common in modern business.",
            imageUrl: "",
          },
          {
            word: "stationery",
            pos: "Danh từ (n)",
            ipa: "/ˈsteɪʃənəri/",
            definition: "đồ dùng văn phòng phẩm",
            example: "The secretary ordered new stationery for the office.",
            imageUrl: "",
          },
          {
            word: "accurate",
            pos: "Tính từ (adj)",
            ipa: "/ˈækjərət/",
            definition: "chính xác",
            example: "The report must be accurate and up to date.",
            imageUrl: "",
          },
          {
            word: "accurately",
            pos: "Trạng từ (adv)",
            ipa: "/ˈækjərətli/",
            definition: "một cách chính xác",
            example: "Please record the results accurately in the log.",
            imageUrl: "",
          },
          {
            word: "accuracy",
            pos: "Danh từ (n)",
            ipa: "/ˈækjərəsi/",
            definition: "độ chính xác",
            example: "The accuracy of the data is essential for analysis.",
            imageUrl: "",
          },
          {
            word: "carry",
            pos: "Động từ (v)",
            ipa: "/ˈkæri/",
            definition: "mang, vận chuyển, có sẵn hàng",
            example: "The store carries a wide range of office supplies.",
            imageUrl: "",
          },
          {
            word: "carrier",
            pos: "Danh từ (n)",
            ipa: "/ˈkæriə(r)/",
            definition: "hãng vận chuyển, người giao hàng",
            example: "The package was delivered by a local carrier.",
            imageUrl: "",
          },
          {
            word: "carriage",
            pos: "Danh từ (n)",
            ipa: "/ˈkærɪdʒ/",
            definition: "sự chuyên chở, cước phí vận tải",
            example: "The carriage of goods must comply with safety rules.",
            imageUrl: "",
          },
          {
            word: "catalog",
            pos: "Danh từ (n)",
            ipa: "/ˈkætəlɒɡ/",
            definition: "danh mục hàng hóa",
            example: "Please refer to the catalog for the latest prices.",
            imageUrl: "",
          },
          {
            word: "fulfill",
            pos: "Động từ (v)",
            ipa: "/fʊlˈfɪl/",
            definition: "hoàn thành, đáp ứng",
            example: "We must fulfill all customer requests promptly.",
            imageUrl: "",
          },
          {
            word: "fulfillment",
            pos: "Danh từ (n)",
            ipa: "/fʊlˈfɪlmənt/",
            definition: "sự thực hiện, hoàn tất đơn hàng",
            example: "The company guarantees fast order fulfillment.",
            imageUrl: "",
          },
          {
            word: "integral",
            pos: "Tính từ (adj)",
            ipa: "/ˈɪntɪɡrəl/",
            definition: "không thể thiếu, cần thiết",
            example: "Teamwork is an integral part of our success.",
            imageUrl: "",
          },
          {
            word: "integrate",
            pos: "Động từ (v)",
            ipa: "/ˈɪntɪɡreɪt/",
            definition: "hợp nhất, tích hợp",
            example: "The software integrates easily with existing systems.",
            imageUrl: "",
          },
          {
            word: "integration",
            pos: "Danh từ (n)",
            ipa: "/ˌɪntɪˈɡreɪʃn/",
            definition: "sự tích hợp",
            example: "System integration improves communication efficiency.",
            imageUrl: "",
          },
          {
            word: "integrity",
            pos: "Danh từ (n)",
            ipa: "/ɪnˈteɡrəti/",
            definition: "tính chính trực, toàn vẹn",
            example: "The manager is respected for his integrity.",
            imageUrl: "",
          },
          {
            word: "inventory",
            pos: "Danh từ (n)",
            ipa: "/ˈɪnvəntri/",
            definition: "hàng tồn kho, bản kiểm kê",
            example: "The store conducts an inventory every month.",
            imageUrl: "",
          },
          {
            word: "inventor",
            pos: "Danh từ (n)",
            ipa: "/ɪnˈventə(r)/",
            definition: "nhà phát minh",
            example: "The inventor received a patent for his new product.",
            imageUrl: "",
          },
          {
            word: "invention",
            pos: "Danh từ (n)",
            ipa: "/ɪnˈvenʃn/",
            definition: "phát minh",
            example: "The latest invention helps save energy.",
            imageUrl: "",
          },
          {
            word: "minimize",
            pos: "Động từ (v)",
            ipa: "/ˈmɪnɪmaɪz/",
            definition: "giảm thiểu",
            example: "The company aims to minimize delivery delays.",
            imageUrl: "",
          },
          {
            word: "minimum",
            pos: "Danh từ (n)",
            ipa: "/ˈmɪnɪməm/",
            definition: "tối thiểu",
            example: "The minimum order quantity is 50 units.",
            imageUrl: "",
          },
          {
            word: "minimum",
            pos: "Tính từ (adj)",
            ipa: "/ˈmɪnɪməm/",
            definition: "tối thiểu",
            example: "The minimum order quantity is 50 units.",
            imageUrl: "",
          },
          {
            word: "minimization",
            pos: "Danh từ (n)",
            ipa: "/ˌmɪnɪmaɪˈzeɪʃn/",
            definition: "sự giảm thiểu",
            example: "The minimization of waste is part of our policy.",
            imageUrl: "",
          },
          {
            word: "on hand",
            pos: "Cụm từ",
            ipa: "/ɒn hænd/",
            definition: "có sẵn, trong tay",
            example: "We always have extra stock on hand.",
            imageUrl: "",
          },
          {
            word: "remember",
            pos: "Động từ (v)",
            ipa: "/rɪˈmembə(r)/",
            definition: "nhớ, ghi nhớ",
            example: "Please remember to submit your inventory report.",
            imageUrl: "",
          },
          {
            word: "remembrance",
            pos: "Danh từ (n)",
            ipa: "/rɪˈmembrəns/",
            definition: "sự tưởng nhớ",
            example: "The day was held in remembrance of the founder.",
            imageUrl: "",
          },
          {
            word: "memorable",
            pos: "Tính từ (adj)",
            ipa: "/ˈmemərəbl/",
            definition: "đáng nhớ",
            example: "The company party was a memorable event.",
            imageUrl: "",
          },
          {
            word: "ship",
            pos: "Động từ (v)",
            ipa: "/ʃɪp/",
            definition: "giao hàng, vận chuyển",
            example: "Orders are shipped within two business days.",
            imageUrl: "",
          },
          {
            word: "shipment",
            pos: "Danh từ (n)",
            ipa: "/ˈʃɪpmənt/",
            definition: "lô hàng, việc giao hàng",
            example: "The latest shipment arrived yesterday.",
            imageUrl: "",
          },
          {
            word: "shipping",
            pos: "Danh từ (n)",
            ipa: "/ˈʃɪpɪŋ/",
            definition: "việc vận chuyển, phí vận chuyển",
            example: "Free shipping is available on orders over $50.",
            imageUrl: "",
          },
          {
            word: "shipper",
            pos: "Danh từ (n)",
            ipa: "/ˈʃɪpə(r)/",
            definition: "người/đơn vị giao hàng",
            example: "The shipper confirmed the delivery date.",
            imageUrl: "",
          },
          {
            word: "sufficient",
            pos: "Tính từ (adj)",
            ipa: "/səˈfɪʃnt/",
            definition: "đủ, đầy đủ",
            example: "We have sufficient stock to meet current demand.",
            imageUrl: "",
          },
          {
            word: "sufficiently",
            pos: "Trạng từ (adv)",
            ipa: "/səˈfɪʃntli/",
            definition: "đủ, một cách đầy đủ",
            example: "The goods were sufficiently packed for transport.",
            imageUrl: "",
          },
          {
            word: "sufficiency",
            pos: "Danh từ (n)",
            ipa: "/səˈfɪʃnsi/",
            definition: "sự đầy đủ",
            example:
              "There is concern over the sufficiency of plans to tackle the problem.",
            imageUrl: "",
          },
          {
            word: "insufficiency",
            pos: "Danh từ (n)",
            ipa: "/ˌɪnsəˈfɪʃnsi/",
            definition: "sự thiếu hụt",
            example: "An insufficiency of funds delayed the project.",
            imageUrl: "",
          },
          {
            word: "supply",
            pos: "Danh từ (n)",
            ipa: "/səˈplaɪ/",
            definition: "nguồn cung, hàng cung cấp",
            example: "The water supply was interrupted by the storm.",
            imageUrl: "",
          },
          {
            word: "supply",
            pos: "Động từ (v)",
            ipa: "/səˈplaɪ/",
            definition: "cung cấp, tiếp tế",
            example: "The company supplies raw materials to factories.",
            imageUrl: "",
          },
          {
            word: "supplier",
            pos: "Danh từ (n)",
            ipa: "/səˈplaɪə(r)/",
            definition: "nhà cung cấp",
            example: "We need a reliable supplier for office equipment.",
            imageUrl: "",
          },
          {
            word: "supplementary",
            pos: "Tính từ (adj)",
            ipa: "/ˌsʌplɪˈmentri/",
            definition: "bổ sung",
            example: "Supplementary data is included in the appendix.",
            imageUrl: "",
          },
          {
            word: "supply chain",
            pos: "Cụm danh từ",
            ipa: "/səˈplaɪ tʃeɪn/",
            definition: "chuỗi cung ứng",
            example: "The global supply chain faced disruptions last year.",
            imageUrl: "",
          },
        ],
      },
      {
        id: "lesson-18",
        title: "Lesson 18",
        words: [
          {
            word: "charge",
            pos: "Động từ (v)",
            ipa: "/tʃɑːdʒ/",
            definition: "tính phí",
            example: "We won't charge extra for express delivery.",
            imageUrl: "",
          },
          {
            word: "charge",
            pos: "Danh từ (n)",
            ipa: "/tʃɑːdʒ/",
            definition: "khoản phí",
            example: "The service charge was added to the bill.",
            imageUrl: "",
          },
          {
            word: "charging",
            pos: "Danh từ (n)",
            ipa: "/ˈtʃɑːdʒɪŋ/",
            definition: "việc tính phí",
            example: "The charging policy will change next month.",
            imageUrl: "",
          },
          {
            word: "overcharge",
            pos: "Động từ (v)",
            ipa: "/ˌəʊvəˈtʃɑːdʒ/",
            definition: "tính quá giá",
            example: "The restaurant accidentally overcharged us.",
            imageUrl: "",
          },
          {
            word: "compile",
            pos: "Động từ (v)",
            ipa: "/kəmˈpaɪl/",
            definition: "biên soạn, tổng hợp",
            example: "The report was compiled from several sources.",
            imageUrl: "",
          },
          {
            word: "compilation",
            pos: "Danh từ (n)",
            ipa: "/ˌkɒmpɪˈleɪʃn/",
            definition: "sự biên soạn",
            example: "The compilation of data took several weeks.",
            imageUrl: "",
          },
          {
            word: "customer",
            pos: "Danh từ (n)",
            ipa: "/ˈkʌstəmə(r)/",
            definition: "khách hàng",
            example: "Our regular customers receive special discounts.",
            imageUrl: "",
          },
          {
            word: "clientele",
            pos: "Danh từ (n)",
            ipa: "/ˌkliːənˈtel/",
            definition: "nhóm khách hàng",
            example: "The hotel has an international clientele.",
            imageUrl: "",
          },
          {
            word: "discount",
            pos: "Danh từ (n)",
            ipa: "/ˈdɪskaʊnt/",
            definition: "giảm giá",
            example: "The store offers a 10% discount on all items.",
            imageUrl: "",
          },
          {
            word: "discount",
            pos: "Động từ (v)",
            ipa: "/ˈdɪskaʊnt/",
            definition: "chiết khấu",
            example: "We can discount your order if you buy in bulk.",
            imageUrl: "",
          },
          {
            word: "discounted",
            pos: "Tính từ (adj)",
            ipa: "/dɪsˈkaʊntɪd/",
            definition: "được giảm giá",
            example: "All discounted goods are non-refundable.",
            imageUrl: "",
          },
          {
            word: "efficiency",
            pos: "Danh từ (n)",
            ipa: "/ɪˈfɪʃnsi/",
            definition: "hiệu quả",
            example: "The new system improves work efficiency.",
            imageUrl: "",
          },
          {
            word: "efficient",
            pos: "Tính từ (adj)",
            ipa: "/ɪˈfɪʃnt/",
            definition: "có hiệu suất cao",
            example: "She is an efficient employee who meets deadlines.",
            imageUrl: "",
          },
          {
            word: "efficiently",
            pos: "Trạng từ (adv)",
            ipa: "/ɪˈfɪʃntli/",
            definition: "một cách hiệu quả",
            example: "The orders were processed efficiently.",
            imageUrl: "",
          },
          {
            word: "estimate",
            pos: "Động từ (v)",
            ipa: "/ˈestɪmeɪt/",
            definition: "ước lượng, dự tính",
            example: "We estimate delivery within three days.",
            imageUrl: "",
          },
          {
            word: "estimate",
            pos: "Danh từ (n)",
            ipa: "/ˈestɪmət/",
            definition: "ước tính, giá dự tính",
            example: "The cost estimate exceeded our budget.",
            imageUrl: "",
          },
          {
            word: "estimated",
            pos: "Tính từ (adj)",
            ipa: "/ˈestɪmeɪtɪd/",
            definition: "được ước tính",
            example: "The estimated cost exceeds our budget.",
            imageUrl: "",
          },
          {
            word: "estimation",
            pos: "Danh từ (n)",
            ipa: "/ˌestɪˈmeɪʃn/",
            definition: "sự ước lượng",
            example: "In my estimation, the project will succeed.",
            imageUrl: "",
          },
          {
            word: "impose",
            pos: "Động từ (v)",
            ipa: "/ɪmˈpəʊz/",
            definition: "áp đặt",
            example: "The government imposed new import taxes.",
            imageUrl: "",
          },
          {
            word: "imposition",
            pos: "Danh từ (n)",
            ipa: "/ˌɪmpəˈzɪʃn/",
            definition: "sự áp đặt",
            example: "The imposition of higher fees angered customers.",
            imageUrl: "",
          },
          {
            word: "self-imposed",
            pos: "Tính từ (adj)",
            ipa: "/ˌself ɪmˈpəʊzd/",
            definition: "tự đặt ra",
            example: "He followed a self-imposed deadline.",
            imageUrl: "",
          },
          {
            word: "mistake",
            pos: "Danh từ (n)",
            ipa: "/mɪˈsteɪk/",
            definition: "lỗi, sai lầm",
            example: "There was a mistake in the invoice.",
            imageUrl: "",
          },
          {
            word: "mistaken",
            pos: "Tính từ (adj)",
            ipa: "/mɪˈsteɪkən/",
            definition: "nhầm lẫn, sai",
            example: "You are mistaken about the delivery date.",
            imageUrl: "",
          },
          {
            word: "mistakenly",
            pos: "Trạng từ (adv)",
            ipa: "/mɪˈsteɪkənli/",
            definition: "một cách nhầm lẫn",
            example: "The order was mistakenly sent to another branch.",
            imageUrl: "",
          },
          {
            word: "order",
            pos: "Danh từ (n)",
            ipa: "/ˈɔːdə(r)/",
            definition: "đơn hàng",
            example: "We received your order yesterday.",
            imageUrl: "",
          },
          {
            word: "order",
            pos: "Động từ (v)",
            ipa: "/ˈɔːdə(r)/",
            definition: "đặt hàng",
            example: "Please place an order online.",
            imageUrl: "",
          },
          {
            word: "reorder",
            pos: "Động từ (v)",
            ipa: "/ˌriːˈɔːdə(r)/",
            definition: "đặt lại hàng",
            example: "Please reorder if stock runs low.",
            imageUrl: "",
          },
          {
            word: "pre-order",
            pos: "Động từ (v)",
            ipa: "/ˈpriːˌɔːdə(r)/",
            definition: "đặt trước",
            example: "You can pre-order the new model online.",
            imageUrl: "",
          },
          {
            word: "pre-order",
            pos: "Danh từ (n)",
            ipa: "/ˈpriːˌɔːdə(r)/",
            definition: "đơn đặt trước",
            example: "Pre-order options are available for new releases.",
            imageUrl: "",
          },
          {
            word: "promptly",
            pos: "Trạng từ (adv)",
            ipa: "/ˈprɒmptli/",
            definition: "nhanh chóng, đúng giờ",
            example: "Please reply promptly to customer inquiries.",
            imageUrl: "",
          },
          {
            word: "rectify",
            pos: "Động từ (v)",
            ipa: "/ˈrektɪfaɪ/",
            definition: "sửa chữa, khắc phục",
            example: "The technician will rectify the error immediately.",
            imageUrl: "",
          },
          {
            word: "rectification",
            pos: "Danh từ (n)",
            ipa: "/ˌrektɪfɪˈkeɪʃn/",
            definition: "sự sửa sai",
            example: "Rectification of the invoice took one day.",
            imageUrl: "",
          },
          {
            word: "terms",
            pos: "Danh từ (n)",
            ipa: "/tɜːmz/",
            definition: "điều khoản, điều kiện",
            example: "Please read the terms and conditions carefully.",
            imageUrl: "",
          },
          {
            word: "term",
            pos: "Danh từ (n)",
            ipa: "/tɜːm/",
            definition: "kỳ hạn, thuật ngữ",
            example: "The payment term is 30 days.",
            imageUrl: "",
          },
          {
            word: "terminate",
            pos: "Động từ (v)",
            ipa: "/ˈtɜːmɪneɪt/",
            definition: "chấm dứt, kết thúc",
            example: "The contract may be terminated with prior notice.",
            imageUrl: "",
          },
          {
            word: "termination",
            pos: "Danh từ (n)",
            ipa: "/ˌtɜːmɪˈneɪʃn/",
            definition: "sự chấm dứt",
            example: "Early termination of the lease is not allowed.",
            imageUrl: "",
          },
          {
            word: "adjust",
            pos: "Động từ (v)",
            ipa: "/əˈdʒʌst/",
            definition: "điều chỉnh, thích nghi",
            example: "You should adjust the settings before printing.",
            imageUrl: "",
          },
          {
            word: "adjustment",
            pos: "Danh từ (n)",
            ipa: "/əˈdʒʌstmənt/",
            definition: "sự điều chỉnh",
            example: "The final bill includes a small price adjustment.",
            imageUrl: "",
          },
          {
            word: "adjustable",
            pos: "Tính từ (adj)",
            ipa: "/əˈdʒʌstəbl/",
            definition: "có thể điều chỉnh được",
            example: "The chair height is adjustable.",
            imageUrl: "",
          },
          {
            word: "automatic",
            pos: "Tính từ (adj)",
            ipa: "/ˌɔːtəˈmætɪk/",
            definition: "tự động",
            example: "The machine has an automatic shutdown function.",
            imageUrl: "",
          },
          {
            word: "automatically",
            pos: "Trạng từ (adv)",
            ipa: "/ˌɔːtəˈmætɪkli/",
            definition: "một cách tự động",
            example: "The data is saved automatically every 10 minutes.",
            imageUrl: "",
          },
          {
            word: "automation",
            pos: "Danh từ (n)",
            ipa: "/ˌɔːtəˈmeɪʃn/",
            definition: "sự tự động hóa",
            example: "Factory automation helps reduce costs.",
            imageUrl: "",
          },
          {
            word: "crucial",
            pos: "Tính từ (adj)",
            ipa: "/ˈkruːʃl/",
            definition: "cực kỳ quan trọng",
            example: "Accuracy is crucial in financial reports.",
            imageUrl: "",
          },
          {
            word: "crucially",
            pos: "Trạng từ (adv)",
            ipa: "/ˈkruːʃəli/",
            definition: "một cách quan trọng",
            example: "Time management is crucially important.",
            imageUrl: "",
          },
          {
            word: "discrepancy",
            pos: "Danh từ (n)",
            ipa: "/dɪˈskrepənsi/",
            definition: "sự sai lệch, chênh lệch",
            example: "There was a discrepancy between the two reports.",
            imageUrl: "",
          },
          {
            word: "disturb",
            pos: "Động từ (v)",
            ipa: "/dɪˈstɜːb/",
            definition: "làm phiền, quấy rầy",
            example: "Please do not disturb during the meeting.",
            imageUrl: "",
          },
          {
            word: "disturbance",
            pos: "Danh từ (n)",
            ipa: "/dɪˈstɜːbəns/",
            definition: "sự làm phiền, rối loạn",
            example: "Noise disturbance affects concentration.",
            imageUrl: "",
          },
          {
            word: "disturbed",
            pos: "Tính từ (adj)",
            ipa: "/dɪˈstɜːbd/",
            definition: "bị làm phiền, lo lắng",
            example: "She looked disturbed by the sudden noise.",
            imageUrl: "",
          },
          {
            word: "liable",
            pos: "Tính từ (adj)",
            ipa: "/ˈlaɪəbl/",
            definition: "chịu trách nhiệm pháp lý",
            example: "The supplier is liable for defective products.",
            imageUrl: "",
          },
          {
            word: "liability",
            pos: "Danh từ (n)",
            ipa: "/ˌlaɪəˈbɪləti/",
            definition: "trách nhiệm pháp lý, khoản nợ",
            example: "The company accepted full liability for damages.",
            imageUrl: "",
          },
          {
            word: "reflect",
            pos: "Động từ (v)",
            ipa: "/rɪˈflekt/",
            definition: "phản chiếu, phản ánh",
            example: "The results reflect the team's hard work.",
            imageUrl: "",
          },
          {
            word: "reflection",
            pos: "Danh từ (n)",
            ipa: "/rɪˈflekʃn/",
            definition: "sự phản chiếu, suy ngẫm",
            example: "The mirror gave a clear reflection.",
            imageUrl: "",
          },
          {
            word: "run",
            pos: "Động từ (v)",
            ipa: "/rʌn/",
            definition: "vận hành, chạy, điều hành",
            example: "The software runs smoothly.",
            imageUrl: "",
          },
          {
            word: "scan",
            pos: "Động từ (v)",
            ipa: "/skæn/",
            definition: "quét, xem lướt",
            example: "Please scan the document before sending.",
            imageUrl: "",
          },
          {
            word: "scan",
            pos: "Danh từ (n)",
            ipa: "/skæn/",
            definition: "sự quét, xem lướt",
            example: "The barcode scan took only a few seconds.",
            imageUrl: "",
          },
          {
            word: "scanner",
            pos: "Danh từ (n)",
            ipa: "/ˈskænə(r)/",
            definition: "máy quét",
            example: "The office has a high-speed scanner.",
            imageUrl: "",
          },
          {
            word: "scanned",
            pos: "Tính từ (adj)",
            ipa: "/skænd/",
            definition: "được quét",
            example: "All scanned copies must be stored safely.",
            imageUrl: "",
          },
          {
            word: "subtract",
            pos: "Động từ (v)",
            ipa: "/səbˈtrækt/",
            definition: "trừ đi",
            example: "Please subtract the discount from the total.",
            imageUrl: "",
          },
          {
            word: "subtraction",
            pos: "Danh từ (n)",
            ipa: "/səbˈtrækʃn/",
            definition: "phép trừ",
            example: "Subtraction is the opposite of addition.",
            imageUrl: "",
          },
          {
            word: "tedious",
            pos: "Tính từ (adj)",
            ipa: "/ˈtiːdiəs/",
            definition: "tẻ nhạt, buồn chán",
            example: "The data entry process can be tedious.",
            imageUrl: "",
          },
          {
            word: "tediously",
            pos: "Trạng từ (adv)",
            ipa: "/ˈtiːdiəsli/",
            definition: "một cách nhàm chán",
            example: "The task was tediously repeated each day.",
            imageUrl: "",
          },
          {
            word: "tedium",
            pos: "Danh từ (n)",
            ipa: "/ˈtiːdiəm/",
            definition: "sự buồn tẻ",
            example: "He quit the job due to its tedium.",
            imageUrl: "",
          },
          {
            word: "verify",
            pos: "Động từ (v)",
            ipa: "/ˈverɪfaɪ/",
            definition: "xác minh, kiểm chứng",
            example: "Please verify your email address.",
            imageUrl: "",
          },
          {
            word: "verified",
            pos: "Tính từ (adj)",
            ipa: "/ˈverɪfaɪd/",
            definition: "được xác nhận",
            example: "Only verified users can access this section.",
            imageUrl: "",
          },
          {
            word: "verification",
            pos: "Danh từ (n)",
            ipa: "/ˌverɪfɪˈkeɪʃn/",
            definition: "sự xác minh",
            example: "Verification is required before approval.",
            imageUrl: "",
          },
          {
            word: "verifier",
            pos: "Danh từ (n)",
            ipa: "/ˈverɪfaɪə(r)/",
            definition: "người kiểm chứng",
            example: "The verifier checked all the documents.",
            imageUrl: "",
          },
        ],
      },
    ],
  },
];

// === Quản lý Kho Từ Vựng bằng LocalStorage ===
let savedDecks = JSON.parse(localStorage.getItem("vocaDecks")) || [];
let currentDeckId = null;

// Lọc bỏ các course lessons bị save nhầm vào localStorage (fix bug)
savedDecks = savedDecks.filter((d) => !d.id.startsWith("course_"));
localStorage.setItem("vocaDecks", JSON.stringify(savedDecks));

document.addEventListener("DOMContentLoaded", () => {
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

  // 1. Render Khóa Học Chuẩn (Hardcode)
  let courseHtml = "";
  courseData.forEach((course) => {
    courseHtml += `<div style="margin-bottom: 25px;">
      <div onclick="toggleCourse('${course.id}')" style="cursor: pointer; background: linear-gradient(135deg, var(--primary) 0%, #2980b9 100%); color: white; padding: 18px 22px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3); user-select: none; transition: all 0.3s ease;">
        <h3 style="margin: 0; font-size: 19px; color: white; font-weight: 800;">${course.title}</h3>
        <span id="icon_${course.id}" style="font-size: 20px; transition: transform 0.3s; display: inline-block;">▼</span>
      </div>
      <div id="lessons_${course.id}" style="display: none; flex-direction: column; gap: 12px; margin-top: 18px; padding: 20px; border-radius: 15px; background: linear-gradient(135deg, rgba(52, 152, 219, 0.08) 0%, rgba(41, 128, 185, 0.05) 100%); border: 2px solid rgba(52, 152, 219, 0.2);">`;

    course.lessons.forEach((lesson) => {
      let wordCount = lesson.words.length;
      let btnColor = wordCount > 0 ? "var(--primary)" : "#95a5a6";
      let btnBg =
        wordCount > 0
          ? "linear-gradient(135deg, var(--primary) 0%, #2980b9 100%)"
          : "linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)";
      let cursor = wordCount > 0 ? "cursor: pointer;" : "cursor: not-allowed;";

      // Check if there are saved mistakes for this lesson
      let lessonMistakesKey = "lesson_mistakes_" + course.id + "_" + lesson.id;
      let savedMistakes = JSON.parse(
        localStorage.getItem(lessonMistakesKey) || "[]",
      );
      let mistakesBtn =
        savedMistakes.length > 0
          ? `<button class="main-btn" style="padding: 8px 14px; font-size: 12px; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3); font-weight: 700; white-space: nowrap; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(243, 156, 18, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(243, 156, 18, 0.3)';" onclick="playLessonMistakes('${course.id}', '${lesson.id}')">⚠️ Làm lại ${savedMistakes.length}</button>`
          : "";

      courseHtml += `
        <div style="background: white; border: 2px solid ${btnColor}; padding: 16px 18px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); ${wordCount > 0 ? "hover: box-shadow: 0 6px 16px rgba(52, 152, 219, 0.2);" : ""}">
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 800; color: #2c3e50; font-size: 15px; line-height: 1.4;">${lesson.title}</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${mistakesBtn}
            <button class="main-btn btn-primary" style="padding: 10px 18px; font-size: 14px; font-weight: 700; background: ${btnBg}; color: white; box-shadow: ${wordCount > 0 ? "0 4px 12px rgba(52, 152, 219, 0.3)" : "none"}; transition: all 0.3s ease; white-space: nowrap; ${cursor}" 
              onmouseover="if(${wordCount} > 0) this.style.transform='translateY(-2px)'; if(${wordCount} > 0) this.style.boxShadow='0 6px 16px rgba(52, 152, 219, 0.4)';"
              onmouseout="if(${wordCount} > 0) this.style.transform='translateY(0)'; if(${wordCount} > 0) this.style.boxShadow='0 4px 12px rgba(52, 152, 219, 0.3)';"
              onclick="if(${wordCount} > 0) playCourseLesson('${course.id}', '${lesson.id}')">
              ${wordCount > 0 ? `▶ Học (${wordCount} từ)` : `⏳ Sắp cập nhật`}
            </button>
          </div>
        </div>
      `;
    });
    courseHtml += `</div></div>`;
  });
  let courseListEl = document.getElementById("courseList");
  if (courseListEl) courseListEl.innerHTML = courseHtml;

  // 2. Render Tủ Từ Của Tôi (LocalStorage)
  let html = "";
  savedDecks.forEach((deck) => {
    html += `
            <div style="background: white; border: 2px solid var(--secondary); padding: 18px 20px; border-radius: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(155, 89, 182, 0.15); transition: all 0.3s ease;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 6px 0; color: var(--secondary-dark); font-size: 16px; font-weight: 800;">${deck.name || "Bộ từ chưa tên"}</h3>
                <p style="margin: 0; color: #7f8c8d; font-size: 13px; font-weight: 600;">📊 ${deck.words.length} từ vựng</p>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                ${deck.mistakes && deck.mistakes.length > 0 ? `<button class="main-btn btn-spell" style="padding: 10px 14px; font-size: 13px; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3); font-weight: 700; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(243, 156, 18, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(243, 156, 18, 0.3)';" onclick="playMistakesDeck('${deck.id}')">⚠️ Ôn ${deck.mistakes.length}</button>` : ""}
                <button class="main-btn btn-quiz" style="padding: 10px 14px; font-size: 13px; background: linear-gradient(135deg, var(--secondary) 0%, #8e44ad 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3); font-weight: 700; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(155, 89, 182, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(155, 89, 182, 0.3)';" onclick="playSelectedDeck('${deck.id}')">▶ Học</button>
                <button class="main-btn" style="padding: 10px 14px; font-size: 13px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3); font-weight: 700; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(231, 76, 60, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(231, 76, 60, 0.3)';" onclick="deleteDeck('${deck.id}')">🗑️</button>
              </div>
            </div>
          `;
  });
  if (savedDecks.length === 0)
    html = `<p style="text-align:center; color:#7f8c8d;">Bạn chưa có bộ từ vựng nào.</p>`;
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

// Kho từ mồi 500 từ
const dummyDistractors = [
  { word: "apple", definition: "quả táo" },
  { word: "banana", definition: "quả chuối" },
  { word: "orange", definition: "quả cam" },
  { word: "bread", definition: "bánh mì" },
  { word: "milk", definition: "sữa" },
  { word: "coffee", definition: "cà phê" },
  { word: "water", definition: "nước" },
  { word: "computer", definition: "máy tính" },
  { word: "phone", definition: "điện thoại" },
  { word: "house", definition: "ngôi nhà" },
  { word: "car", definition: "ô tô" },
  { word: "bicycle", definition: "xe đạp" },
  { word: "dog", definition: "con chó" },
  { word: "cat", definition: "con mèo" },
  { word: "bird", definition: "con chim" },
  { word: "teacher", definition: "giáo viên" },
  { word: "student", definition: "học sinh" },
  { word: "doctor", definition: "bác sĩ" },
  { word: "nurse", definition: "y tá" },
  { word: "engineer", definition: "kỹ sư" },
  { word: "worker", definition: "công nhân" },
  { word: "beautiful", definition: "xinh đẹp" },
  { word: "ugly", definition: "xấu xí" },
  { word: "happy", definition: "hạnh phúc" },
  { word: "sad", definition: "buồn bã" },
  { word: "angry", definition: "tức giận" },
  { word: "scared", definition: "sợ hãi" },
  { word: "big", definition: "to lớn" },
  { word: "small", definition: "nhỏ bé" },
  { word: "hot", definition: "nóng bức" },
  { word: "cold", definition: "lạnh lẽo" },
  { word: "fast", definition: "nhanh chóng" },
  { word: "slow", definition: "chậm chạp" },
  { word: "good", definition: "tốt bụng" },
  { word: "bad", definition: "tồi tệ" },
  { word: "run", definition: "chạy bộ" },
  { word: "walk", definition: "đi bộ" },
  { word: "swim", definition: "bơi lội" },
  { word: "jump", definition: "nhảy lên" },
  { word: "read", definition: "đọc sách" },
  { word: "write", definition: "viết chữ" },
  { word: "speak", definition: "nói chuyện" },
  { word: "listen", definition: "lắng nghe" },
  { word: "sleep", definition: "ngủ" },
  { word: "eat", definition: "ăn uống" },
  { word: "drink", definition: "uống nước" },
  { word: "laugh", definition: "cười lớn" },
  { word: "cry", definition: "khóc nhè" },
  { word: "book", definition: "quyển sách" },
  { word: "pen", definition: "bút mực" },
  { word: "pencil", definition: "bút chì" },
  { word: "paper", definition: "tờ giấy" },
  { word: "table", definition: "cái bàn" },
  { word: "chair", definition: "cái ghế" },
  { word: "window", definition: "cửa sổ" },
  { word: "door", definition: "cửa ra vào" },
  { word: "school", definition: "trường học" },
  { word: "class", definition: "lớp học" },
  { word: "office", definition: "văn phòng" },
  { word: "money", definition: "tiền bạc" },
  { word: "market", definition: "chợ" },
  { word: "shop", definition: "cửa hàng" },
  { word: "hospital", definition: "bệnh viện" },
  { word: "hotel", definition: "khách sạn" },
  { word: "restaurant", definition: "nhà hàng" },
  { word: "park", definition: "công viên" },
  { word: "street", definition: "con đường" },
  { word: "city", definition: "thành phố" },
  { word: "country", definition: "quốc gia" },
  { word: "world", definition: "thế giới" },
  { word: "sky", definition: "bầu trời" },
  { word: "sun", definition: "mặt trời" },
  { word: "moon", definition: "mặt trăng" },
  { word: "star", definition: "ngôi sao" },
  { word: "tree", definition: "cây cối" },
  { word: "flower", definition: "bông hoa" },
  { word: "river", definition: "con sông" },
  { word: "sea", definition: "biển cả" },
  { word: "mountain", definition: "ngọn núi" },
  { word: "rain", definition: "cơn mưa" },
  { word: "wind", definition: "cơn gió" },
  { word: "snow", definition: "tuyết rơi" },
  { word: "fire", definition: "ngọn lửa" },
  { word: "ice", definition: "băng đá" },
  { word: "time", definition: "thời gian" },
  { word: "day", definition: "ngày" },
  { word: "night", definition: "đêm" },
  { word: "morning", definition: "buổi sáng" },
  { word: "evening", definition: "buổi tối" },
  { word: "week", definition: "tuần" },
  { word: "month", definition: "tháng" },
  { word: "year", definition: "năm" },
  { word: "clock", definition: "đồng hồ" },
  { word: "shirt", definition: "áo sơ mi" },
  { word: "pants", definition: "quần dài" },
  { word: "shoes", definition: "đôi giày" },
  { word: "hat", definition: "cái mũ" },
  { word: "bag", definition: "cái túi" },
  { word: "gold", definition: "vàng" },
  { word: "silver", definition: "bạc" },
  { word: "iron", definition: "sắt" },
  { word: "wood", definition: "gỗ" },
  { word: "stone", definition: "đá" },
  { word: "glass", definition: "thủy tinh" },
  { word: "plastic", definition: "nhựa" },
  { word: "music", definition: "âm nhạc" },
  { word: "song", definition: "bài hát" },
  { word: "movie", definition: "bộ phim" },
  { word: "game", definition: "trò chơi" },
  { word: "sport", definition: "thể thao" },
  { word: "football", definition: "bóng đá" },
  { word: "tennis", definition: "quần vợt" },
  { word: "chess", definition: "cờ vua" },
  { word: "dance", definition: "nhảy múa" },
  { word: "sing", definition: "ca hát" },
  { word: "paint", definition: "vẽ tranh" },
  { word: "cook", definition: "nấu ăn" },
  { word: "travel", definition: "du lịch" },
  { word: "fly", definition: "bay lượn" },
  { word: "drive", definition: "lái xe" },
  { word: "ride", definition: "cưỡi xe" },
  { word: "buy", definition: "mua sắm" },
  { word: "sell", definition: "bán hàng" },
  { word: "pay", definition: "thanh toán" },
  { word: "cost", definition: "giá cả" },
  { word: "cheap", definition: "giá rẻ" },
  { word: "expensive", definition: "đắt đỏ" },
  { word: "rich", definition: "giàu có" },
  { word: "poor", definition: "nghèo khổ" },
  { word: "clean", definition: "sạch sẽ" },
  { word: "dirty", definition: "bẩn thỉu" },
  { word: "new", definition: "mới mẻ" },
  { word: "old", definition: "cũ kỹ" },
  { word: "young", definition: "trẻ tuổi" },
  { word: "strong", definition: "mạnh mẽ" },
  { word: "weak", definition: "yếu ớt" },
  { word: "brave", definition: "dũng cảm" },
  { word: "smart", definition: "thông minh" },
  { word: "clever", definition: "khéo léo" },
  { word: "stupid", definition: "ngốc nghếch" },
  { word: "lazy", definition: "lười biếng" },
  { word: "hardworking", definition: "chăm chỉ" },
  { word: "kind", definition: "tốt bụng" },
  { word: "cruel", definition: "độc ác" },
  { word: "sweet", definition: "ngọt ngào" },
  { word: "sour", definition: "chua chát" },
  { word: "bitter", definition: "đắng ngắt" },
  { word: "salty", definition: "mặn mà" },
  { word: "delicious", definition: "thơm ngon" },
  { word: "fresh", definition: "tươi sống" },
  { word: "healthy", definition: "khỏe mạnh" },
  { word: "sick", definition: "ốm đau" },
  { word: "doctor", definition: "bác sĩ" },
  { word: "medicine", definition: "thuốc men" },
  { word: "pain", definition: "đau đớn" },
  { word: "cure", definition: "chữa khỏi" },
  { word: "body", definition: "cơ thể" },
  { word: "head", definition: "cái đầu" },
  { word: "face", definition: "khuôn mặt" },
  { word: "eye", definition: "con mắt" },
  { word: "ear", definition: "cái tai" },
  { word: "nose", definition: "cái mũi" },
  { word: "mouth", definition: "cái miệng" },
  { word: "tooth", definition: "chiếc răng" },
  { word: "hair", definition: "mái tóc" },
  { word: "neck", definition: "cái cổ" },
  { word: "arm", definition: "cánh tay" },
  { word: "hand", definition: "bàn tay" },
  { word: "finger", definition: "ngón tay" },
  { word: "leg", definition: "cái chân" },
  { word: "foot", definition: "bàn chân" },
  { word: "heart", definition: "trái tim" },
  { word: "blood", definition: "máu" },
  { word: "brain", definition: "não bộ" },
  { word: "family", definition: "gia đình" },
  { word: "parents", definition: "cha mẹ" },
  { word: "father", definition: "người cha" },
  { word: "mother", definition: "người mẹ" },
  { word: "son", definition: "con trai" },
  { word: "daughter", definition: "con gái" },
  { word: "brother", definition: "anh em trai" },
  { word: "sister", definition: "chị em gái" },
  { word: "baby", definition: "em bé" },
  { word: "friend", definition: "bạn bè" },
  { word: "enemy", definition: "kẻ thù" },
  { word: "neighbor", definition: "hàng xóm" },
  { word: "marriage", definition: "hôn nhân" },
  { word: "love", definition: "tình yêu" },
  { word: "hate", definition: "căm ghét" },
  { word: "peace", definition: "hòa bình" },
  { word: "war", definition: "chiến tranh" },
  { word: "army", definition: "quân đội" },
  { word: "soldier", definition: "người lính" },
  { word: "weapon", definition: "vũ khí" },
  { word: "danger", definition: "nguy hiểm" },
  { word: "safety", definition: "an toàn" },
  { word: "secret", definition: "bí mật" },
  { word: "truth", definition: "sự thật" },
  { word: "lie", definition: "lời nói dối" },
  { word: "knowledge", definition: "kiến thức" },
  { word: "wisdom", definition: "trí tuệ" },
  { word: "history", definition: "lịch sử" },
  { word: "science", definition: "khoa học" },
  { word: "art", definition: "nghệ thuật" },
  { word: "nature", definition: "tự nhiên" },
  { word: "space", definition: "vũ trụ" },
  { word: "earth", definition: "trái đất" },
  { word: "animal", definition: "động vật" },
  { word: "plant", definition: "thực vật" },
  { word: "insect", definition: "côn trùng" },
  { word: "fish", definition: "con cá" },
  { word: "reptile", definition: "loài bò sát" },
  { word: "bird", definition: "loài chim" },
  { word: "lion", definition: "sư tử" },
  { word: "tiger", definition: "con hổ" },
  { word: "bear", definition: "con gấu" },
  { word: "elephant", definition: "con voi" },
  { word: "monkey", definition: "con khỉ" },
  { word: "horse", definition: "con ngựa" },
  { word: "cow", definition: "con bò" },
  { word: "sheep", definition: "con cừu" },
  { word: "pig", definition: "con lợn" },
  { word: "chicken", definition: "con gà" },
  { word: "duck", definition: "con vịt" },
  { word: "mouse", definition: "con chuột" },
  { word: "snake", definition: "con rắn" },
  { word: "frog", definition: "con ếch" },
  { word: "spider", definition: "con nhện" },
  { word: "bee", definition: "con ong" },
  { word: "ant", definition: "con kiến" },
  { word: "butterfly", definition: "con bướm" },
  { word: "forest", definition: "rừng rậm" },
  { word: "desert", definition: "sa mạc" },
  { word: "island", definition: "hòn đảo" },
  { word: "lake", definition: "hồ nước" },
  { word: "ocean", definition: "đại dương" },
  { word: "beach", definition: "bãi biển" },
  { word: "weather", definition: "thời tiết" },
  { word: "climate", definition: "khí hậu" },
  { word: "season", definition: "mùa" },
  { word: "spring", definition: "mùa xuân" },
  { word: "summer", definition: "mùa hè" },
  { word: "autumn", definition: "mùa thu" },
  { word: "winter", definition: "mùa đông" },
  { word: "cloud", definition: "đám mây" },
  { word: "fog", definition: "sương mù" },
  { word: "storm", definition: "giông bão" },
  { word: "thunder", definition: "sấm sét" },
  { word: "lightning", definition: "tia chớp" },
  { word: "temperature", definition: "nhiệt độ" },
  { word: "degree", definition: "độ" },
  { word: "heat", definition: "sức nóng" },
  { word: "shadow", definition: "bóng râm" },
  { word: "light", definition: "ánh sáng" },
  { word: "darkness", definition: "bóng tối" },
  { word: "color", definition: "màu sắc" },
  { word: "red", definition: "màu đỏ" },
  { word: "blue", definition: "màu xanh dương" },
  { word: "green", definition: "màu xanh lá" },
  { word: "yellow", definition: "màu vàng" },
  { word: "black", definition: "màu đen" },
  { word: "white", definition: "màu trắng" },
  { word: "gray", definition: "màu xám" },
  { word: "purple", definition: "màu tím" },
  { word: "pink", definition: "màu hồng" },
  { word: "brown", definition: "màu nâu" },
  { word: "shape", definition: "hình dáng" },
  { word: "circle", definition: "hình tròn" },
  { word: "square", definition: "hình vuông" },
  { word: "triangle", definition: "hình tam giác" },
  { word: "line", definition: "đường thẳng" },
  { word: "point", definition: "điểm" },
  { word: "size", definition: "kích cỡ" },
  { word: "weight", definition: "cân nặng" },
  { word: "height", definition: "chiều cao" },
  { word: "depth", definition: "chiều sâu" },
  { word: "width", definition: "chiều rộng" },
  { word: "length", definition: "chiều dài" },
  { word: "distance", definition: "khoảng cách" },
  { word: "number", definition: "con số" },
  { word: "zero", definition: "số không" },
  { word: "one", definition: "số một" },
  { word: "first", definition: "đầu tiên" },
  { word: "last", definition: "cuối cùng" },
  { word: "many", definition: "nhiều" },
  { word: "few", definition: "ít" },
  { word: "all", definition: "tất cả" },
  { word: "none", definition: "không ai" },
  { word: "half", definition: "một nửa" },
  { word: "whole", definition: "toàn bộ" },
  { word: "piece", definition: "mảnh vụn" },
  { word: "group", definition: "nhóm" },
  { word: "crowd", definition: "đám đông" },
  { word: "government", definition: "chính phủ" },
  { word: "law", definition: "luật pháp" },
  { word: "police", definition: "cảnh sát" },
  { word: "judge", definition: "thẩm phán" },
  { word: "court", definition: "tòa án" },
  { word: "crime", definition: "tội phạm" },
  { word: "prison", definition: "nhà tù" },
  { word: "thief", definition: "tên trộm" },
  { word: "murder", definition: "vụ giết người" },
  { word: "accident", definition: "tai nạn" },
  { word: "emergency", definition: "khẩn cấp" },
  { word: "help", definition: "sự giúp đỡ" },
  { word: "rescue", definition: "giải cứu" },
  { word: "disaster", definition: "thảm họa" },
  { word: "flood", definition: "lũ lụt" },
  { word: "earthquake", definition: "động đất" },
  { word: "building", definition: "tòa nhà" },
  { word: "factory", definition: "nhà máy" },
  { word: "station", definition: "nhà ga" },
  { word: "airport", definition: "sân bay" },
  { word: "bridge", definition: "cây cầu" },
  { word: "wall", definition: "bức tường" },
  { word: "roof", definition: "mái nhà" },
  { word: "floor", definition: "sàn nhà" },
  { word: "room", definition: "căn phòng" },
  { word: "kitchen", definition: "nhà bếp" },
  { word: "bathroom", definition: "phòng tắm" },
  { word: "bedroom", definition: "phòng ngủ" },
  { word: "bed", definition: "chiếc giường" },
  { word: "mirror", definition: "gương soi" },
  { word: "soap", definition: "xà phòng" },
  { word: "towel", definition: "khăn tắm" },
  { word: "blanket", definition: "chiếc chăn" },
  { word: "pillow", definition: "chiếc gối" },
  { word: "key", definition: "chìa khóa" },
  { word: "lock", definition: "ổ khóa" },
  { word: "tool", definition: "công cụ" },
  { word: "hammer", definition: "cái búa" },
  { word: "nail", definition: "chiếc đinh" },
  { word: "screw", definition: "đinh vít" },
  { word: "box", definition: "chiếc hộp" },
  { word: "bag", definition: "cái bao" },
  { word: "rope", definition: "dây thừng" },
  { word: "wire", definition: "dây điện" },
  { word: "machine", definition: "máy móc" },
  { word: "engine", definition: "động cơ" },
  { word: "wheel", definition: "bánh xe" },
  { word: "pump", definition: "máy bơm" },
  { word: "filter", definition: "bộ lọc" },
  { word: "energy", definition: "năng lượng" },
  { word: "power", definition: "sức mạnh" },
  { word: "electricity", definition: "điện" },
  { word: "fuel", definition: "nhiên liệu" },
  { word: "gas", definition: "khí ga" },
  { word: "oil", definition: "dầu ăn" },
  { word: "coal", definition: "than đá" },
  { word: "wood", definition: "gỗ củi" },
  { word: "waste", definition: "rác thải" },
  { word: "environment", definition: "môi trường" },
  { word: "pollution", definition: "ô nhiễm" },
  { word: "nature", definition: "thiên nhiên" },
  { word: "scenery", definition: "phong cảnh" },
  { word: "view", definition: "tầm nhìn" },
  { word: "horizon", definition: "đường chân trời" },
  { word: "island", definition: "hòn đảo" },
  { word: "continent", definition: "lục địa" },
  { word: "country", definition: "đất nước" },
  { word: "nation", definition: "quốc gia" },
  { word: "capital", definition: "thủ đô" },
  { word: "village", definition: "ngôi làng" },
  { word: "town", definition: "thị trấn" },
  { word: "suburb", definition: "ngoại ô" },
  { word: "border", definition: "biên giới" },
  { word: "language", definition: "ngôn ngữ" },
  { word: "word", definition: "từ ngữ" },
  { word: "sentence", definition: "câu" },
  { word: "meaning", definition: "ý nghĩa" },
  { word: "grammar", definition: "ngữ pháp" },
  { word: "pronunciation", definition: "phát âm" },
  { word: "accent", definition: "giọng điệu" },
  { word: "conversation", definition: "cuộc đối thoại" },
  { word: "speech", definition: "bài phát biểu" },
  { word: "voice", definition: "giọng nói" },
  { word: "sound", definition: "âm thanh" },
  { word: "silence", definition: "sự im lặng" },
  { word: "noise", definition: "tiếng ồn" },
  { word: "music", definition: "âm nhạc" },
  { word: "melody", definition: "giai điệu" },
  { word: "rhythm", definition: "nhịp điệu" },
  { word: "instrument", definition: "nhạc cụ" },
  { word: "guitar", definition: "đàn ghi-ta" },
  { word: "piano", definition: "đàn pi-a-no" },
  { word: "drum", definition: "cái trống" },
  { word: "art", definition: "nghệ thuật" },
  { word: "artist", definition: "nghệ sĩ" },
  { word: "picture", definition: "bức tranh" },
  { word: "photo", definition: "bức ảnh" },
  { word: "museum", definition: "bảo tàng" },
  { word: "gallery", definition: "triển lãm" },
  { word: "theater", definition: "nhà hát" },
  { word: "cinema", definition: "rạp phim" },
  { word: "show", definition: "buổi biểu diễn" },
  { word: "concert", definition: "buổi hòa nhạc" },
  { word: "celebration", definition: "lễ kỷ niệm" },
  { word: "party", definition: "bữa tiệc" },
  { word: "festival", definition: "lễ hội" },
  { word: "holiday", definition: "ngày lễ" },
  { word: "vacation", definition: "kỳ nghỉ" },
  { word: "weekend", definition: "cuối tuần" },
  { word: "calendar", definition: "lịch" },
  { word: "schedule", definition: "lịch trình" },
  { word: "appointment", definition: "cuộc hẹn" },
  { word: "meeting", definition: "cuộc họp" },
  { word: "event", definition: "sự kiện" },
  { word: "experience", definition: "kinh nghiệm" },
  { word: "memory", definition: "ký ức" },
  { word: "dream", definition: "giấc mơ" },
  { word: "hope", definition: "hy vọng" },
  { word: "wish", definition: "ước muốn" },
  { word: "goal", definition: "mục tiêu" },
  { word: "purpose", definition: "mục đích" },
  { word: "plan", definition: "kế hoạch" },
  { word: "idea", definition: "ý tưởng" },
  { word: "thought", definition: "suy nghĩ" },
  { word: "opinion", definition: "ý kiến" },
  { word: "belief", definition: "niềm tin" },
  { word: "religion", definition: "tôn giáo" },
  { word: "culture", definition: "văn hóa" },
  { word: "tradition", definition: "truyền thống" },
  { word: "custom", definition: "phong tục" },
  { word: "society", definition: "xã hội" },
  { word: "community", definition: "cộng đồng" },
  { word: "population", definition: "dân số" },
  { word: "member", definition: "thành viên" },
  { word: "leader", definition: "người lãnh đạo" },
  { word: "boss", definition: "sếp" },
  { word: "manager", definition: "quản lý" },
  { word: "employee", definition: "nhân viên" },
  { word: "colleague", definition: "đồng nghiệp" },
  { word: "partner", definition: "đối tác" },
  { word: "customer", definition: "khách hàng" },
  { word: "client", definition: "khách hàng" },
  { word: "business", definition: "kinh doanh" },
  { word: "company", definition: "công ty" },
  { word: "industry", definition: "ngành công nghiệp" },
  { word: "trade", definition: "thương mại" },
  { word: "commerce", definition: "thương mại" },
  { word: "market", definition: "thị trường" },
  { word: "sale", definition: "bán hàng" },
  { word: "purchase", definition: "mua sắm" },
  { word: "deal", definition: "giao dịch" },
  { word: "agreement", definition: "thỏa thuận" },
  { word: "contract", definition: "hợp đồng" },
  { word: "signature", definition: "chữ ký" },
  { word: "document", definition: "tài liệu" },
  { word: "report", definition: "báo cáo" },
  { word: "project", definition: "dự án" },
  { word: "task", definition: "nhiệm vụ" },
  { word: "duty", definition: "nghĩa vụ" },
  { word: "responsibility", definition: "trách nhiệm" },
  { word: "success", definition: "sự thành công" },
  { word: "failure", definition: "sự thất bại" },
  { word: "mistake", definition: "sai lầm" },
  { word: "error", definition: "lỗi" },
  { word: "fault", definition: "lỗi lầm" },
  { word: "problem", definition: "vấn đề" },
  { word: "solution", definition: "giải pháp" },
  { word: "answer", definition: "câu trả lời" },
  { word: "question", definition: "câu hỏi" },
  { word: "test", definition: "bài kiểm tra" },
  { word: "exam", definition: "kỳ thi" },
  { word: "result", definition: "kết quả" },
  { word: "score", definition: "điểm số" },
  { word: "grade", definition: "lớp/điểm" },
  { word: "mark", definition: "điểm dấu" },
];

function speakWord(word, accent) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  let utterance = new SpeechSynthesisUtterance(word);
  let voices = window.speechSynthesis.getVoices();
  let targetVoice = voices.find((v) =>
    accent === "uk"
      ? v.lang === "en-GB" || v.lang === "en_GB"
      : v.lang === "en-US" || v.lang === "en_US",
  );
  if (targetVoice) utterance.voice = targetVoice;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
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
          <button class="speaker-btn" style="width:100%; margin-top:15px; justify-content:center; color:var(--primary);" onclick="goBackToInput()">✍️ Quay lại nhập thêm từ</button>
          <button class="speaker-btn" style="width:100%; margin-top:10px; justify-content:center; color:var(--danger);" onclick="goBackToDashboard()">🏠 Về Tủ Từ Vựng</button>
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

window.goBackToDashboard = () => {
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("quizArea").innerHTML = "";
  document.getElementById("statsArea").style.display = "none";
  document.getElementById("progressContainer").style.display = "none";
  if (savedDecks.length > 0) {
    showDashboard();
  } else {
    showInputSection();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.goBackToInput = () => {
  document.getElementById("inputSection").style.display = "block";
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("quizArea").innerHTML = "";
  document.getElementById("statsArea").style.display = "none";
  document.getElementById("progressContainer").style.display = "none";
  document.getElementById("dashboardSection").style.display = "none";
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

    // Thêm cụm nút Điều hướng cuối trang
    let bottomControls = document.createElement("div");
    bottomControls.style =
      "display: flex; gap: 15px; margin-top: 30px; margin-bottom: 40px;";
    bottomControls.innerHTML = `
            <button class="main-btn" style="background:#4a5568; box-shadow: 0 4px 0 #2d3748; font-size:14px; flex: 1;" onclick="scrollToUnanswered()">🔍 Tìm câu chưa làm</button>
            <button class="main-btn btn-primary" style="font-size:14px; flex: 1;" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">⬆️ Lên đầu trang</button>
          `;
    quizArea.appendChild(bottomControls);
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

  document.getElementById("statsArea").style.display = "none";
  document.getElementById("quizArea").innerHTML = "";

  startApp(mode);
};
