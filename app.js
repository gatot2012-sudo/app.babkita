var cats = ["Semua", "Novel Romantis", "Novel Religi", "Novel Sejarah", "Novel Rumtang", "Biografi", "Novel Action", "Novel Horor", "Cerita Anak"];
var selCat = "Semua", curBook = null, fSize = 17, usr = null;

var books = [
  { id: 1, title: "Ukas, Mbah Yut, Dan HP yang Bisa Ngomong Sendiri", author: "Ummu Kamilah", category: "Cerita Anak", views: 420, chapters: 2, subs: 45, comments: [], cover: "https://pexels.com", excerpt: "Kisah Ukas dan Mbah Yut menemukan HP jadul yang bisa berbicara.", content: "<p><b>Bab 1:</b> Sore itu di rumah Mbah Yut, Ukas menemukan ponsel tua di dalam laci kayu...</p>" },
  { id: 2, title: "Tak Ada Raihan, Gibran Pun Jadi", author: "Gatot Susanto", category: "Novel Romantis", views: 890, chapters: 5, subs: 112, comments: [], cover: "https://pexels.com", excerpt: "Komedi romantis penuh kejutan dalam perjalanan mencari cinta sejati.", content: "<p><b>Bab 1:</b> Takdir memang sering datang di waktu yang tak terduga...</p>" },
  ];
function startApp() {
  document.getElementById("catList").innerHTML = cats.map(function(c) {
    return '<button class="cat-pill ' + (selCat === c ? 'active' : '') + '" onclick="pickCat(\'' + c + '\')">' + c + '</button>';
  }).join("");
  drawBooks();

  fetch("https://babkita.com").then(function(r) { return r.json(); }).then(function(d) {
    if (d && d.length) {
      books = d.map(function(it, i) {
        return { id: it.id, title: it.title, author: it.author, category: it.category, views: 150 + i * 21, chapters: 1, subs: 15 + i * 2, comments: [], cover: it.cover, excerpt: it.excerpt, content: it.content };
      });
      document.getElementById("statusMsg").textContent = "Terhubung BabKita.com (" + books.length + " buku)";
      drawBooks();
    }
  }).catch(function() {});
}

function pickCat(c) { selCat = c; document.getElementById("shelfTitle").textContent = c === "Semua" ? "Buku Terbaru" : c; startApp(); }
function drawBooks() {
  var q = document.getElementById("searchInput").value.toLowerCase();
  var list = books.filter(function(b) {
    return (selCat === "Semua" || b.category.toLowerCase().indexOf(selCat.toLowerCase()) !== -1) &&
           (b.title.toLowerCase().indexOf(q) !== -1 || b.author.toLowerCase().indexOf(q) !== -1);
  });
  document.getElementById("booksGrid").innerHTML = list.map(function(b) {
    var fallback = "this.style.display='none';this.nextElementSibling.style.display='flex';";
    return '<div class="card" onclick="openDetail(' + b.id + ')">' +
      '<div class="card-cover" style="background:linear-gradient(160deg,#1e293b,#0f172a);position:relative;">' +
        '<img src="' + b.cover + '" onerror="' + fallback + '" style="width:100%;height:100%;object-fit:cover;" />' +
        '<div style="display:none;position:absolute;inset:0;padding:16px;flex-direction:column;justify-content:space-between;color:#fef3c7;border-bottom:3px solid #f59e0b;">' +
          '<div style="margin-top:26px;font-family:Georgia,serif;font-size:15px;font-weight:bold;line-height:1.35;">' + b.title + '</div>' +
          '<div style="font-size:11px;color:#fcd34d;border-top:1px solid #334155;padding-top:6px;">✍️ ' + b.author + '</div>' +
        '</div>' +
        '<span class="badge-cat">' + b.category + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div><div class="card-title">' + b.title + '</div><div class="card-author">' + b.author + '</div></div>' +
        '<div class="card-stats"><span>Baca ' + b.views + '</span><span>Bab ' + b.chapters + '</span><span>Sub ' + b.subs + '</span><span>Kom ' + b.comments.length + '</span></div>' +
      '</div></div>';
  }).join("");
}
function showView(v) {
  ["homeView", "detailView", "readerView"].forEach(function(id) { document.getElementById(id).classList.add("hidden"); });
  document.getElementById(v + "View").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function openDetail(id) {
  curBook = books.find(function(b) { return b.id === id; }); curBook.views++;
  document.getElementById("dCover").src = curBook.cover;
  document.getElementById("dCat").textContent = curBook.category;
  document.getElementById("dTitle").innerHTML = curBook.title;
  document.getElementById("dAuthor").textContent = curBook.author;
  document.getElementById("dViews").textContent = curBook.views;
  document.getElementById("dChaps").textContent = curBook.chapters;
  document.getElementById("dSubs").textContent = curBook.subs;
  document.getElementById("dComms").textContent = curBook.comments.length;
  document.getElementById("dExcerpt").textContent = curBook.excerpt;
  showView("detail");
}

function openReader() {
  document.getElementById("rCat").textContent = curBook.category;
  document.getElementById("rTitle").innerHTML = curBook.title;
  document.getElementById("rContent").innerHTML = curBook.content;
  drawComm(); showView("reader");
}

function resizeFont(d) { fSize = Math.min(24, Math.max(14, fSize + d)); document.getElementById("rContent").style.fontSize = fSize + "px"; }
function toggleSub() { curBook.subs++; document.getElementById("dSubs").textContent = curBook.subs; document.getElementById("subBtn").textContent = "Disubscribe"; }
function drawComm() {
  document.getElementById("commList").innerHTML = curBook.comments.length
    ? curBook.comments.map(function(c) { return '<div style="background:#fffbeb;padding:10px;border-radius:10px;font-size:13px;"><b>' + c.user + ':</b> ' + c.text + '</div>'; }).join("")
    : '<p style="font-size:12px;color:#64748b;">Belum ada komentar.</p>';
}
function postComment() {
  var i = document.getElementById("commInput"); if (!i.value.trim()) return;
  curBook.comments.unshift({ user: usr || "Pembaca", text: i.value.trim() });
  i.value = ""; drawComm();
}
function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }
function doLogin(e) { e.preventDefault(); usr = document.getElementById("uName").value; document.getElementById("authBtn").textContent = usr; closeModal("authModal"); }

function addNewBook(e) {
  e.preventDefault();
  var fileInput = document.getElementById("nCoverFile");
  var defaultCover = "https://pexels.com";
  var saveBook = function(imgUrl) {
    books.unshift({
      id: Date.now(), title: document.getElementById("nTitle").value, category: document.getElementById("nCat").value,
      author: document.getElementById("nAuthor").value, views: 1, chapters: 1, subs: 0, comments: [], cover: imgUrl,
      excerpt: document.getElementById("nContent").value.slice(0, 120) + "...", content: "<p>" + document.getElementById("nContent").value + "</p>"
    });
    e.target.reset(); closeModal("writeModal"); drawBooks();
  };
  if (fileInput && fileInput.files && fileInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function(ev) { saveBook(ev.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    saveBook(defaultCover);
  }
}

function addChapter(e) {
  e.preventDefault();
  curBook.chapters++;
  curBook.content += "<hr style='margin:24px 0;border-color:#fde68a;'/><h3>" + document.getElementById("cTitle").value + "</h3><p>" + document.getElementById("cContent").value + "</p>";
  e.target.reset(); closeModal("chapModal"); openDetail(curBook.id);
}

startApp();
