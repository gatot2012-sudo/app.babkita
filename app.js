var firebaseConfig = {
  apiKey: "AIzaSyBi8mrD3OLZ3CM3Xgc6LMSbVs2WWKA6HXg",
  authDomain: "babkita-app" + ".firebaseapp.com",
  projectId: "babkita-app",
  storageBucket: "babkita-app.firebasestorage.app",
  messagingSenderId: "2848511454",
  appId: "1:2848511454:web:4bfb968f795608b29db94f"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

var cats = ["Semua", "Novel Romantis", "Novel Religi", "Novel Sejarah", "Novel Rumtang", "Biografi", "Novel Action", "Novel Horor", "Cerita Anak"];
var selCat = "Semua", curBook = null, curChapIdx = 0, fSize = 17, usr = localStorage.getItem("babkita_user") || null, books = [];

function updateAuthUI() {
  var btn = document.getElementById("authBtn");
  if (btn) btn.textContent = usr ? ("Halo, " + usr) : "Masuk / Daftar";
}

function renderCategories() {
  document.getElementById("catList").innerHTML = cats.map(function(c) {
    return '<button class="cat-pill ' + (selCat === c ? 'active' : '') + '" onclick="pickCat(\'' + c + '\')">' + c + '</button>';
  }).join("");
}

function getBookChapters(b) {
  if (b.chapterList && b.chapterList.length) return b.chapterList;
  return [{ title: "Bab 1", content: b.content || "<p>Belum ada isi cerita.</p>" }];
}

function startApp() {
  updateAuthUI();
  renderCategories();
  document.getElementById("statusMsg").textContent = "Menghubungkan ke server BabKita...";
  db.collection("books").orderBy("createdAt", "desc").onSnapshot(function(snap) {
    books = [];
    snap.forEach(function(doc) {
      var d = doc.data();
      d.docId = doc.id;
      if (!d.comments) d.comments = [];
      books.push(d);
    });
    document.getElementById("statusMsg").textContent = books.length ? ("Menampilkan " + books.length + " buku") : "Belum ada buku. Klik + Menulis untuk mulai menerbitkan!";
    drawBooks();
    if (curBook) {
      var updated = books.find(function(b) { return b.docId === curBook.docId; });
      if (updated) { curBook = updated; renderChapterList(); }
    }
  }, function(err) {
    document.getElementById("statusMsg").textContent = "Error database: " + err.message;
  });
}

function pickCat(c) {
  selCat = c;
  document.getElementById("shelfTitle").textContent = c === "Semua" ? "Buku Terbaru" : c;
  renderCategories();
  drawBooks();
}

function drawBooks() {
  var q = document.getElementById("searchInput").value.toLowerCase();
  var list = books.filter(function(b) {
    return (selCat === "Semua" || (b.category || "").toLowerCase().indexOf(selCat.toLowerCase()) !== -1) &&
           ((b.title || "").toLowerCase().indexOf(q) !== -1 || (b.author || "").toLowerCase().indexOf(q) !== -1);
  });
  document.getElementById("booksGrid").innerHTML = list.map(function(b) {
    var totalBab = b.chapterList ? b.chapterList.length : (b.chapters || 1);
    return '<div class="card" onclick="openDetail(\'' + b.docId + '\')">' +
      '<div class="card-cover" style="background:linear-gradient(160deg,#1e293b,#0f172a);position:relative;">' +
        (b.cover ? '<img src="' + b.cover + '" style="width:100%;height:100%;object-fit:cover;" />' : '<div style="position:absolute;inset:0;padding:10px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;"><div style="margin-top:22px;font-size:12px;font-weight:bold;">' + b.title + '</div><div style="font-size:10px;color:#fcd34d;">' + b.author + '</div></div>') +
        '<span class="badge-cat">' + b.category + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div><div class="card-title">' + b.title + '</div><div class="card-author">' + b.author + '</div></div>' +
        '<div class="card-stats"><span>Baca ' + (b.views || 0) + '</span><span>Bab ' + totalBab + '</span><span>Sub ' + (b.subs || 0) + '</span><span>Kom ' + (b.comments ? b.comments.length : 0) + '</span></div>' +
      '</div></div>';
  }).join("");
}
function showView(v) {
  ["homeView", "detailView", "readerView"].forEach(function(id) { document.getElementById(id).classList.add("hidden"); });
  document.getElementById(v + "View").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function renderChapterList() {
  var listEl = document.getElementById("chapterList");
  if (!listEl || !curBook) return;
  var chaps = getBookChapters(curBook);
  document.getElementById("dChaps").textContent = chaps.length;
  listEl.innerHTML = chaps.map(function(ch, idx) {
    return '<div onclick="openReader(' + idx + ')" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;cursor:pointer;">' +
      '<span style="font-size:13px;font-weight:700;color:#1e293b;">' + (idx + 1) + '. ' + ch.title + '</span>' +
      '<span style="font-size:11px;font-weight:700;color:#d97706;">Baca →</span>' +
    '</div>';
  }).join("");
}

function openDetail(docId) {
  curBook = books.find(function(b) { return b.docId === docId; });
  if (!curBook) return;
  var newViews = (curBook.views || 0) + 1;
  db.collection("books").doc(docId).update({ views: newViews });
  var coverEl = document.getElementById("dCover");
  if (curBook.cover) { coverEl.src = curBook.cover; coverEl.style.display = "block"; } else { coverEl.style.display = "none"; }
  document.getElementById("dCat").textContent = curBook.category;
  document.getElementById("dTitle").textContent = curBook.title;
  document.getElementById("dAuthor").textContent = curBook.author;
  document.getElementById("dViews").textContent = newViews;
  document.getElementById("dSubs").textContent = curBook.subs || 0;
  document.getElementById("dComms").textContent = (curBook.comments || []).length;
  document.getElementById("dExcerpt").textContent = curBook.excerpt || "";
  renderChapterList();
  showView("detail");
}

function openReader(idx) {
  if (!curBook) return;
  var chaps = getBookChapters(curBook);
  curChapIdx = (typeof idx === "number" && idx >= 0 && idx < chaps.length) ? idx : 0;
  var activeChap = chaps[curChapIdx];
  document.getElementById("rCat").textContent = curBook.category + " • " + curBook.title;
  document.getElementById("rTitle").textContent = activeChap.title;
  document.getElementById("rContent").innerHTML = activeChap.content;
  var prevBtn = document.getElementById("prevChapBtn");
  var nextBtn = document.getElementById("nextChapBtn");
  if (prevBtn) prevBtn.style.visibility = curChapIdx > 0 ? "visible" : "hidden";
  if (nextBtn) nextBtn.style.visibility = curChapIdx < chaps.length - 1 ? "visible" : "hidden";
  drawComs();
  showView("reader");
}

function changeChap(step) { openReader(curChapIdx + step); }
function resizeFont(d) { fSize = Math.min(24, Math.max(14, fSize + d)); document.getElementById("rContent").style.fontSize = fSize + "px"; }

function toggleSub() {
  if (!curBook) return;
  var newSubs = (curBook.subs || 0) + 1;
  db.collection("books").doc(curBook.docId).update({ subs: newSubs });
  document.getElementById("dSubs").textContent = newSubs;
  document.getElementById("subBtn").textContent = "Subscribed ✓";
}

function drawComs() {
  var listEl = document.getElementById("commList");
  if (!listEl || !curBook) return;
  var coms = curBook.comments || [];
  listEl.innerHTML = coms.length ? coms.map(function(c) { return '<div style="background:#fffbeb;padding:10px;border-radius:10px;font-size:13px;"><strong>' + c.user + ':</strong> ' + c.text + '</div>'; }).join("") : '<p style="font-size:12px;color:#64748b;">Belum ada komentar.</p>';
}

function postComment() {
  var i = document.getElementById("commInput");
  if (!i || !i.value.trim() || !curBook) return;
  var updatedComs = [{ user: usr || "Pembaca", text: i.value.trim() }].concat(curBook.comments || []);
  i.value = "";
  curBook.comments = updatedComs;
  drawComs();
  db.collection("books").doc(curBook.docId).update({ comments: updatedComs });
}

function openModal(id) {
  var el = document.getElementById(id);
  if (el) { el.classList.remove("hidden"); if (id === "writeModal" && usr) document.getElementById("nAuthor").value = usr; }
}
function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.add("hidden"); }

function doLogin(e) {
  e.preventDefault();
  var nameVal = document.getElementById("uName").value.trim();
  if (!nameVal) return;
  usr = nameVal;
  localStorage.setItem("babkita_user", usr);
  updateAuthUI();
  closeModal("authModal");
  alert("Selamat datang, " + usr + "!");
}

function compressCover(file, cb) {
  var r = new FileReader();
  r.onload = function(evt) {
    var img = new Image();
    img.onload = function() {
      var c = document.createElement("canvas"), maxW = 360, s = maxW / img.width;
      c.width = maxW; c.height = img.height * s;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL("image/jpeg", 0.72));
    };
    img.src = evt.target.result;
  };
  r.readAsDataURL(file);
}

function formatParagraphs(text) {
  return text.split("\n").map(function(p) { return p.trim() ? "<p style='margin-bottom:14px;'>" + p + "</p>" : ""; }).join("");
}

function addNewBook(e) {
  e.preventDefault();
  var btn = e.target.querySelector("button[type='submit']");
  btn.disabled = true; btn.textContent = "Menerbitkan...";
  var title = document.getElementById("nTitle").value.trim(), cat = document.getElementById("nCat").value, author = document.getElementById("nAuthor").value.trim(), rawText = document.getElementById("nContent").value.trim(), fileInput = document.getElementById("nCoverFile");
  var bab1Html = formatParagraphs(rawText);
  function save(coverData) {
    db.collection("books").add({
      title: title, author: author, category: cat, views: 1, chapters: 1, subs: 0,
      cover: coverData || "", excerpt: rawText.slice(0, 180) + "...", content: bab1Html,
      chapterList: [{ title: "Bab 1", content: bab1Html }], comments: [], createdAt: Date.now()
    })
    .then(function() { e.target.reset(); closeModal("writeModal"); btn.disabled = false; btn.textContent = "Terbitkan Sekarang"; alert("Buku berhasil diterbitkan!"); })
    .catch(function(err) { btn.disabled = false; btn.textContent = "Terbitkan Sekarang"; alert("Gagal: " + err.message); });
  }
  var pickedFile = (fileInput && fileInput.files && fileInput.files.length) ? fileInput.files.item(0) : null;
  if (pickedFile) { compressCover(pickedFile, save); } else { save(""); }
}

function addChapter(e) {
  e.preventDefault();
  if (!curBook) return;
  var btn = e.target.querySelector("button[type='submit']");
  btn.disabled = true; btn.textContent = "Menyimpan...";
  var cTitle = document.getElementById("cTitle").value.trim(), cContent = document.getElementById("cContent").value.trim();
  var currentChaps = getBookChapters(curBook).slice();
  currentChaps.push({ title: cTitle, content: formatParagraphs(cContent) });
  db.collection("books").doc(curBook.docId).update({
    chapterList: currentChaps, chapters: currentChaps.length
  }).then(function() {
    e.target.reset(); closeModal("chapModal"); btn.disabled = false; btn.textContent = "Simpan Bab";
    alert("Bab baru berhasil ditambahkan ke Daftar Bab!");
  }).catch(function(err) {
    btn.disabled = false; btn.textContent = "Simpan Bab"; alert("Gagal menyimpan bab: " + err.message);
  });
}

startApp();
