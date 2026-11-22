// BAGIAN 1: Deklarasi variabel awal, data buku contoh, fungsi utilitas, dan fungsi inisialisasi startApp()
var cats = ["Semua", "Novel Romantis", "Novel Religi", "Novel Sejarah", "Novel Rumtang", "Biografi", "Novel Action", "Novel Horor", "Cerita Anak"];
var selCat = "Semua", curBook = null, fSize = 17, usr = localStorage.getItem("babkita_user") || null;

var manualCovers = { 1: "", 2: "" };

var books = [
  { id: 1, title: "Ukas, Mbah Yut, Dan HP yang Bisa Ngomong Sendiri", author: "Ummu Kamilah", category: "Cerita Anak", views: 890, chapters: 1, subs: 42, cover: manualCovers[1] || "", excerpt: "Kisah seru petualangan Ukas dan Mbah Yut bersama ponsel ajaib.", content: "<p>Silakan baca selengkapnya di BabKita.com</p>", comments: [] },
  { id: 2, title: "Tak Ada Raihan, Gibran Pun Jadi", author: "Gatot Susanto", category: "Novel Romantis", views: 1240, chapters: 1, subs: 85, cover: manualCovers[2] || "", excerpt: "Sebuah kisah cinta penuh kejutan dan takdir yang tak terduga.", content: "<p>Silakan baca selengkapnya di BabKita.com</p>", comments: [] }
];

function stripHtml(html) { var tmp = document.createElement("div"); tmp.innerHTML = html || ""; return tmp.textContent || tmp.innerText || ""; }
function updateAuthUI() { var btn = document.getElementById("authBtn"); if (btn) { btn.textContent = usr ? ("Halo, " + usr) : "Masuk / Daftar"; } }
function renderCategories() { document.getElementById("catList").innerHTML = cats.map(function(c) { return '<button class="cat-pill ' + (selCat === c ? 'active' : '') + '" onclick="pickCat(\'' + c + '\')">' + c + '</button>'; }).join(""); }

function startApp() {
  updateAuthUI();
  renderCategories();
  var localBooks = JSON.parse(localStorage.getItem("babkita_local_books") || "[]");
  if (localBooks.length) { books = localBooks.concat(books); }
  drawBooks();
  fetch("https://babkita.com")
    .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(d) {
      if (d && d.length) {
        var apiBooks = d.map(function(it, i) {
          return {
            id: it.id,
            title: (it.title && it.title.rendered) ? it.title.rendered : (it.title || "Tanpa Judul"),
            author: (typeof it.author === "string" && it.author) ? it.author : "Penulis BabKita",
            category: (typeof it.category === "string" && it.category) ? it.category : "Novel Romantis",
            views: it.views || (150 + i * 21),
            chapters: it.chapters || 1,
            subs: it.subs || (12 + i * 3),
            cover: manualCovers[it.id] || it.cover || it.featured_media_url || "",
            excerpt: stripHtml((it.excerpt && it.excerpt.rendered) ? it.excerpt.rendered : (it.excerpt || "")).slice(0, 160) + "...",
            content: (it.content && it.content.rendered) ? it.content.rendered : (typeof it.content === "string" ? it.content : "<p>Buka BabKita.com untuk membaca bab ini.</p>"),
            comments: []
          };
        });
        books = localBooks.concat(apiBooks);
        document.getElementById("statusMsg").textContent = "Terhubung BabKita.com (" + books.length + " buku)";
        drawBooks();
      }
    })
    .catch(function(err) { document.getElementById("statusMsg").textContent = "Mode Offline/Lokal (" + err.message + ")"; });
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
    return (selCat === "Semua" || b.category.toLowerCase().indexOf(selCat.toLowerCase()) !== -1) &&
           (b.title.toLowerCase().indexOf(q) !== -1 || b.author.toLowerCase().indexOf(q) !== -1);
  });

  document.getElementById("booksGrid").innerHTML = list.map(function(b) {
    var fallback = "this.style.display='none';this.nextElementSibling.style.display='flex';";
    return '<div class="card" onclick="openDetail(' + b.id + ')">' +
      '<div class="card-cover" style="background:linear-gradient(160deg,#1e293b,#0f172a);position:relative;">' +
        (b.cover ? '<img src="' + b.cover + '" onerror="' + fallback + '" style="width:100%;height:100%;object-fit:cover;" />' : '') +
        '<div style="display:' + (b.cover ? 'none' : 'flex') + ';position:absolute;inset:0;padding:16px;flex-direction:column;justify-content:space-between;color:#fff;">' +
          '<div style="margin-top:26px;font-family:Georgia,serif;font-size:15px;font-weight:bold;line-height:1.35;">' + b.title + '</div>' +
          '<div style="font-size:11px;color:#fcd34d;border-top:1px solid #334155;padding-top:6px;">✍ ' + b.author + '</div>' +
        '</div>' +
        '<span class="badge-cat">' + b.category + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div><div class="card-title">' + b.title + '</div><div class="card-author">' + b.author + '</div></div>' +
        '<div class="card-stats"><span>Baca ' + b.views + '</span><span>Bab ' + b.chapters + '</span><span>Sub ' + b.subs + '</span><span>Kom ' + (b.comments ? b.comments.length : 0) + '</span></div>' +
      '</div>' +
    '</div>';
  }).join("");
}

function showView(v) {
  ["homeView", "detailView", "readerView"].forEach(function(id) {
    document.getElementById(id).classList.add("hidden");
  });
  document.getElementById(v + "View").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function openDetail(id) {
  curBook = books.find(function(b) { return b.id === id; });
  if (!curBook) return;
  curBook.views++;
  var coverEl = document.getElementById("dCover");
  if (curBook.cover) {
    coverEl.src = curBook.cover;
    coverEl.style.display = "block";
  } else {
    coverEl.style.display = "none";
  }
  document.getElementById("dCat").textContent = curBook.category;
  document.getElementById("dTitle").innerHTML = curBook.title;
  document.getElementById("dAuthor").textContent = curBook.author;
  document.getElementById("dViews").textContent = curBook.views;
  document.getElementById("dChaps").textContent = curBook.chapters;
  document.getElementById("dSubs").textContent = curBook.subs;
  document.getElementById("dComs").textContent = curBook.comments.length;
  document.getElementById("dExcerpt").textContent = curBook.excerpt;
  showView("detail");
}

function openReader() {
  if (!curBook) return;
  document.getElementById("rCat").textContent = curBook.category;
  document.getElementById("rTitle").innerHTML = curBook.title;
  document.getElementById("rContent").innerHTML = curBook.content;
  drawComs();
  showView("reader");
}

function resizeFont(d) {
  fSize = Math.min(24, Math.max(14, fSize + d));
  document.getElementById("rContent").style.fontSize = fSize + "px";
}

function toggleSub() {
  if (!curBook) return;
  curBook.subs++;
  document.getElementById("dSubs").textContent = curBook.subs;
  document.getElementById("subBtn").textContent = "Subscribed ✓";
}

function drawComs() {
  var listEl = document.getElementById("commList");
  if (!listEl || !curBook) return;
  listEl.innerHTML = curBook.comments.length
    ? curBook.comments.map(function(c) {
        return '<div style="background:#fffbeb;padding:10px;border-radius:10px;font-size:13px;"><strong>' + c.user + ':</strong> ' + c.text + '</div>';
      }).join("")
    : '<p style="font-size:12px;color:#64748b;">Belum ada komentar.</p>';
}

function postComment() {
  var i = document.getElementById("commInput");
  if (!i || !i.value.trim() || !curBook) return;
  curBook.comments.unshift({ user: usr || "Pembaca", text: i.value.trim() });
  i.value = "";
  drawComs();
}

function openModal(id) {
  var el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    if (id === "writeModal" && usr) {
      document.getElementById("nAuthor").value = usr;
    }
  }
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

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

function addNewBook(e) {
  e.preventDefault();
  var title = document.getElementById("nTitle").value.trim();
  var cat = document.getElementById("nCat").value;
  var author = document.getElementById("nAuthor").value.trim();
  var rawText = document.getElementById("nContent").value.trim();
  var fileInput = document.getElementById("nCoverFile");

  var formattedContent = "<h3>Bab 1</h3>" + rawText.split("\n").map(function(p) {
    return p.trim() ? "<p>" + p + "</p>" : "";
  }).join("");

  function saveBookData(coverDataUrl) {
    var newBook = {
      id: Date.now(),
      title: title,
      author: author,
      category: cat,
      views: 1,
      chapters: 1,
      subs: 0,
      cover: coverDataUrl || "",
      excerpt: rawText.slice(0, 160) + "...",
      content: formattedContent,
      comments: []
    };

    var localBooks = JSON.parse(localStorage.getItem("babkita_local_books") || "[]");
    localBooks.unshift(newBook);
    localStorage.setItem("babkita_local_books", JSON.stringify(localBooks));

    books.unshift(newBook);
    drawBooks();
    e.target.reset();
    closeModal("writeModal");
    alert("Buku berhasil diterbitkan!");
  }

  if (fileInput && fileInput.files && fileInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function(evt) {
      saveBookData(evt.target.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    saveBookData("");
  }
}

function addChapter(e) {
  e.preventDefault();
  if (!curBook) return;
  var cTitle = document.getElementById("cTitle").value.trim();
  var cContent = document.getElementById("cContent").value.trim();

  var newChapHtml = "<hr style='margin:24px 0;border:0;border-top:1px solid #fde68a;'/><h3>" + cTitle + "</h3>" +
    cContent.split("\n").map(function(p) {
      return p.trim() ? "<p>" + p + "</p>" : "";
    }).join("");

  curBook.content += newChapHtml;
  curBook.chapters = (curBook.chapters || 1) + 1;
  document.getElementById("dChaps").textContent = curBook.chapters;

  var localBooks = JSON.parse(localStorage.getItem("babkita_local_books") || "[]");
  var idx = localBooks.findIndex(function(b) { return b.id === curBook.id; });
  if (idx !== -1) {
    localBooks[idx] = curBook;
    localStorage.setItem("babkita_local_books", JSON.stringify(localBooks));
  }

  e.target.reset();
  closeModal("chapModal");
  drawBooks();
  alert("Bab baru berhasil ditambahkan!");
}

startApp();
