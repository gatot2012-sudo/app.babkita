var cats = ["Semua", "Novel Romantis", "Novel Religi", "Novel Sejarah", "Novel Rumtang", "Biografi", "Novel Action", "Novel Horor", "Cerita Anak"];
var selCat = "Semua", curBook = null, fSize = 17, usr = null;

function makeCover(title, author, cat) {
  var t1 = title.slice(0, 22).replace(/&/g, "dan").replace(/</g, "");
  var t2 = title.slice(22, 44).replace(/&/g, "dan").replace(/</g, "");
  var au = author.slice(0, 25).replace(/&/g, "dan").replace(/</g, "");
  var svg = '<svg xmlns="http://w3.org" width="300" height="450" viewBox="0 0 300 450">' +
    '<rect width="300" height="450" fill="#1e293b"/>' +
    '<rect x="14" y="14" width="272" height="422" rx="10" fill="none" stroke="#f59e0b" stroke-width="2.5"/>' +
    '<rect x="30" y="55" width="70" height="5" rx="2" fill="#f59e0b"/>' +
    '<text x="30" y="105" fill="#fcd34d" font-family="sans-serif" font-size="13" font-weight="bold">' + cat.toUpperCase() + '</text>' +
    '<text x="30" y="155" fill="#ffffff" font-family="serif" font-size="21" font-weight="bold">' + t1 + '</text>' +
    '<text x="30" y="185" fill="#ffffff" font-family="serif" font-size="21" font-weight="bold">' + t2 + '</text>' +
    '<line x1="30" y1="365" x2="270" y2="365" stroke="#475569" stroke-width="1"/>' +
    '<text x="30" y="392" fill="#fde68a" font-family="sans-serif" font-size="13">Karya: ' + au + '</text>' +
    '<text x="30" y="415" fill="#94a3b8" font-family="sans-serif" font-size="11">BabKita.com</text>' +
    '</svg>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

var books = [
  { id: 1, title: "Ukas, Mbah Yut, Dan HP yang Bisa Ngomong Sendiri", author: "Ummu Kamilah", category: "Cerita Anak", views: 420, chapters: 2, subs: 45, comments: [], cover: "", excerpt: "Kisah Ukas dan Mbah Yut menemukan HP jadul yang bisa berbicara.", content: "<p><b>Bab 1:</b> Sore itu di rumah Mbah Yut, Ukas menemukan ponsel tua di dalam laci kayu...</p>" },
  { id: 2, title: "Tak Ada Raihan, Gibran Pun Jadi", author: "Gatot Susanto", category: "Novel Romantis", views: 890, chapters: 5, subs: 112, comments: [], cover: "", excerpt: "Komedi romantis penuh kejutan dalam perjalanan mencari cinta sejati.", content: "<p><b>Bab 1:</b> Takdir memang sering datang di waktu yang tak terduga...</p>" },
  { id: 3, title: "Haji Harjuna - Haji Jual Tanah", author: "Kanal Satu", category: "Novel Religi", views: 615, chapters: 4, subs: 74, comments: [], cover: "", excerpt: "Perjuangan penuh hikmah demi menunaikan rukun Islam kelima.", content: "<p><b>Bab 1:</b> Niat suci menuju Tanah Suci tak pernah surut...</p>" },
  { id: 4, title: "Api di Istana Majapahit", author: "Kanal Satu", category: "Novel Sejarah", views: 730, chapters: 7, subs: 98, comments: [], cover: "", excerpt: "Intrik politik dan perjuangan kesetiaan di masa kejayaan Nusantara.", content: "<p><b>Bab 1:</b> Malam di Trowulan terasa mencekam saat obor dinyalakan...</p>" },
  { id: 5, title: "Ketika Si Kembar Terbelah Takdir", author: "Kanal Satu", category: "Novel Rumtang", views: 540, chapters: 6, subs: 63, comments: [], cover: "", excerpt: "Drama keluarga penuh air mata dan pilihan hidup yang sulit.", content: "<p><b>Bab 1:</b> Dua wajah serupa namun jalan hidup keduanya berlawanan arah...</p>" },
  { id: 6, title: "Jejak Kaki di Dalam Kelas", author: "Adriono - Andriani", category: "Biografi", views: 390, chapters: 3, subs: 41, comments: [], cover: "", excerpt: "Sebuah mikrohistori perjalanan dunia pendidikan dan pengabdian.", content: "<p><b>Bab 1:</b> Papan tulis kapur itu menjadi saksi bisu ribuan langkah...</p>" },
  { id: 7, title: "Istriku Disleksia, Merangkai Kata", author: "Kanal Satu", category: "Novel Action", views: 480, chapters: 4, subs: 52, comments: [], cover: "", excerpt: "Perjuangan penuh ketegangan merangkai makna yang hilang.", content: "<p><b>Bab 1:</b> Huruf-huruf itu menari di matanya, menyimpan pesan rahasia...</p>" },
  { id: 8, title: "Ratu Koplo Taklukkan Raja Iblis", author: "Gatot Susanto", category: "Novel Horor", views: 670, chapters: 9, subs: 88, comments: [], cover: "", excerpt: "Kisah mistis bercampur ketegangan di balik panggung malam.", content: "<p><b>Bab 1:</b> Dentuman gendang malam itu mengundang sosok tak kasatmata...</p>" }
];

function startApp() {
  books.forEach(function(b) { if (!b.cover) b.cover = makeCover(b.title, b.author, b.category); });
  document.getElementById("catList").innerHTML = cats.map(function(c) {
    return '<button class="cat-pill ' + (selCat === c ? 'active' : '') + '" onclick="pickCat(\'' + c + '\')">' + c + '</button>';
  }).join("");
  drawBooks();

  fetch("https://babkita.com").then(function(r) { return r.json(); }).then(function(d) {
    if (d && d.length) {
      books = d.map(function(it, i) {
        var cv = (it.cover && it.cover.indexOf("unsplash") === -1) ? it.cover : makeCover(it.title, it.author, it.category);
        return { id: it.id, title: it.title, author: it.author, category: it.category, views: 150 + i * 21, chapters: 1, subs: 15 + i * 2, comments: [], cover: cv, excerpt: it.excerpt, content: it.content };
      });
      document.getElementById("statusMsg").textContent = "Terhubung BabKita.com (" + books.length + " buku)";
      drawBooks();
    }
  }).catch(function() {});
}

function pickCat(c) { selCat = c; document.getElementById("shelfTitle").textContent = c === "Semua" ? "Buku Terbaru" : c; startApp(); }
function drawBooks() {
  var q = document.getElementById("searchInput").value.toLowerCase();
  var list = books.filter(function(b) { return (selCat === "Semua" || b.category.toLowerCase().indexOf(selCat.toLowerCase()) !== -1) && (b.title.toLowerCase().indexOf(q) !== -1 || b.author.toLowerCase().indexOf(q) !== -1); });
  document.getElementById("booksGrid").innerHTML = list.map(function(b) {
    return '<div class="card" onclick="openDetail(' + b.id + ')"><div class="card-cover"><img src="' + b.cover + '" /><span class="badge-cat">' + b.category + '</span></div><div class="card-body"><div><div class="card-title">' + b.title + '</div><div class="card-author">' + b.author + '</div></div><div class="card-stats"><span>Baca ' + b.views + '</span><span>Bab ' + b.chapters + '</span><span>Sub ' + b.subs + '</span><span>Kom ' + b.comments.length + '</span></div></div></div>';
  }).join("");
}
function showView(v) { ["homeView", "detailView", "readerView"].forEach(function(id) { document.getElementById(id).classList.add("hidden"); }); document.getElementById(v + "View").classList.remove("hidden"); window.scrollTo(0, 0); }
function openDetail(id) {
  curBook = books.find(function(b) { return b.id === id; }); curBook.views++;
  document.getElementById("dCover").src = curBook.cover; document.getElementById("dCat").textContent = curBook.category; document.getElementById("dTitle").innerHTML = curBook.title; document.getElementById("dAuthor").textContent = curBook.author;
  document.getElementById("dViews").textContent = curBook.views; document.getElementById("dChaps").textContent = curBook.chapters; document.getElementById("dSubs").textContent = curBook.subs; document.getElementById("dComms").textContent = curBook.comments.length; document.getElementById("dExcerpt").textContent = curBook.excerpt;
  showView("detail");
}
function openReader() { document.getElementById("rCat").textContent = curBook.category; document.getElementById("rTitle").innerHTML = curBook.title; document.getElementById("rContent").innerHTML = curBook.content; drawComm(); showView("reader"); }
function resizeFont(d) { fSize = Math.min(24, Math.max(14, fSize + d)); document.getElementById("rContent").style.fontSize = fSize + "px"; }
function toggleSub() { curBook.subs++; document.getElementById("dSubs").textContent = curBook.subs; document.getElementById("subBtn").textContent = "Disubscribe"; }
function drawComm() { document.getElementById("commList").innerHTML = curBook.comments.length ? curBook.comments.map(function(c) { return '<div style="background:#fffbeb;padding:10px;border-radius:10px;font-size:13px;"><b>' + c.user + ':</b> ' + c.text + '</div>'; }).join("") : '<p style="font-size:12px;color:#64748b;">Belum ada komentar.</p>'; }
function postComment() { var i = document.getElementById("commInput"); if (!i.value.trim()) return; curBook.comments.unshift({ user: usr || "Pembaca", text: i.value.trim() }); i.value = ""; drawComm(); }
function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }
function doLogin(e) { e.preventDefault(); usr = document.getElementById("uName").value; document.getElementById("authBtn").textContent = usr; closeModal("authModal"); }
function addNewBook(e) { e.preventDefault(); var t = document.getElementById("nTitle").value, a = document.getElementById("nAuthor").value, c = document.getElementById("nCat").value; books.unshift({ id: Date.now(), title: t, category: c, author: a, views: 1, chapters: 1, subs: 0, comments: [], cover: makeCover(t, a, c), excerpt: document.getElementById("nContent").value.slice(0, 120) + "...", content: "<p>" + document.getElementById("nContent").value + "</p>" }); e.target.reset(); closeModal("writeModal"); drawBooks(); }
function addChapter(e) { e.preventDefault(); curBook.chapters++; curBook.content += "<hr style='margin:24px 0;border-color:#fde68a;'/><h3>" + document.getElementById("cTitle").value + "</h3><p>" + document.getElementById("cContent").value + "</p>"; e.target.reset(); closeModal("chapModal"); openDetail(curBook.id); }
startApp();
