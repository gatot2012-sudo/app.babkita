var firebaseConfig = {
  apiKey: "AIzaSyBi8mrD3OLZ3CM3Xgc6LMSbVs2WWKA6HXg",
  authDomain: "babkita-app.firebaseapp.com",
  projectId: "babkita-app",
  storageBucket: "babkita-app.firebasestorage.app",
  messagingSenderId: "2848511454",
  appId: "1:2848511454:web:4bfb968f795608b29db94f"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

var cats = [
  "Semua",
  "Novel Romantis",
  "Novel Religi",
  "Novel Sejarah",
  "Novel Rumtang",
  "Novel Remaja",
  "Novel Fantasi",
  "Novel Action",
  "Novel Horor",
  "Cerita Anak",
  "Biografi",
  "Inspirasi",
  "Non-Fiksi",
  "Berita",
  "Pengumuman"
];

var selCat = "Semua", curBook = null, curChapIdx = 0, fSize = 17, currentUser = null, books = [];
var autoOpenedFromUrl = false;

auth.onAuthStateChanged(function(user) {
  currentUser = user;
  updateAuthUI();
});

function updateAuthUI() {
  var btn = document.getElementById("authBtn");
  var loggedOutBox = document.getElementById("loggedOutBox");
  var loggedInBox = document.getElementById("loggedInBox");
  var modalTitle = document.getElementById("authModalTitle");
  var emailInfo = document.getElementById("userEmailInfo");

  if (currentUser) {
    var displayName = currentUser.displayName || currentUser.email.split("@")[0];
    if (btn) btn.textContent = "Halo, " + displayName;
    if (modalTitle) modalTitle.textContent = "Akun Penulis";
    if (emailInfo) emailInfo.innerHTML = "Masuk sebagai <strong>" + displayName + "</strong><br><span style='font-size:12px;'>" + currentUser.email + "</span>";
    if (loggedOutBox) loggedOutBox.classList.add("hidden");
    if (loggedInBox) loggedInBox.classList.remove("hidden");
  } else {
    if (btn) btn.textContent = "Masuk / Daftar";
    if (modalTitle) modalTitle.textContent = "Masuk ke BabKita";
    if (loggedOutBox) loggedOutBox.classList.remove("hidden");
    if (loggedInBox) loggedInBox.classList.add("hidden");
  }
}

function loginWithGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(function(result) {
      closeModal("authModal");
      var nama = result.user.displayName || result.user.email;
      alert("Selamat datang, " + nama + "!");
    })
    .catch(function(err) {
      alert("Gagal masuk dengan Google: " + err.message);
    });
}

function logoutGoogle() {
  auth.signOut().then(function() {
    closeModal("authModal");
    alert("Anda telah keluar dari akun.");
  });
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

    if (!autoOpenedFromUrl && books.length > 0) {
      var params = new URLSearchParams(window.location.search);
      var idDariUrl = params.get("id");
      if (idDariUrl) {
        autoOpenedFromUrl = true;
        openDetail(idDariUrl);
      }
    }

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
  var titleEl = document.getElementById("shelfTitle");
  if (c === "Semua") {
    titleEl.innerHTML = "Buku Terbaru";
  } else {
    titleEl.innerHTML = c + ' <button onclick="pickCat(\'Semua\')" style="margin-left:auto;font-size:11px;padding:4px 10px;border-radius:99px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;">← Semua Kategori</button>';
  }
  renderCategories();
  drawBooks();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildBookCard(b) {
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
}

function drawBooks() {
  var q = document.getElementById("searchInput").value.toLowerCase();
  var gridEl = document.getElementById("booksGrid");
  var list = books.filter(function(b) {
    return (selCat === "Semua" || (b.category || "").toLowerCase() === selCat.toLowerCase()) &&
           ((b.title || "").toLowerCase().indexOf(q) !== -1 || (b.author || "").toLowerCase().indexOf(q) !== -1);
  });

  if (selCat !== "Semua" && !list.length) {
    gridEl.innerHTML = '<p style="font-size:13px;color:#64748b;padding:16px 0;">Belum ada tulisan di kategori <strong>' + selCat + '</strong>. Jadilah yang pertama menulis!</p>';
  } else {
    gridEl.innerHTML = list.map(buildBookCard).join("");
  }

  var catShelvesEl = document.getElementById("categoryShelves");
  if (catShelvesEl) {
    if (selCat === "Semua" && !q) {
      var semuaKategori = cats.slice(1);
      catShelvesEl.innerHTML = semuaKategori.map(function(kat) {
        var bukuKategori = books.filter(function(b) {
          return (b.category || "").toLowerCase() === kat.toLowerCase();
        });

        var isiRak = bukuKategori.length
          ? bukuKategori.map(buildBookCard).join("")
          : '<p style="font-size:12px;color:#64748b;padding:8px 0;">Belum ada tulisan di kategori ' + kat + '.</p>';

        return '<div class="section-title" onclick="pickCat(\'' + kat + '\')" style="cursor:pointer;justify-content:space-between;">' +
                 '<span>' + kat + '</span>' +
                 '<span style="font-size:12px;color:#d97706;font-weight:700;">Lihat Semua (' + bukuKategori.length + ') →</span>' +
               '</div>' +
               '<div class="grid">' + isiRak + '</div>';
      }).join("");
    } else {
      catShelvesEl.innerHTML = "";
    }
  }
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
  var namaKomentator = currentUser ? (currentUser.displayName || currentUser.email.split("@")[0]) : "Pembaca";
  var updatedComs = [{ user: namaKomentator, text: i.value.trim() }].concat(curBook.comments || []);
  i.value = "";
  curBook.comments = updatedComs;
  drawComs();
  db.collection("books").doc(curBook.docId).update({ comments: updatedComs });
}

function openModal(id) {
  if ((id === "writeModal" || id === "chapModal") && !currentUser) {
    alert("Silakan Masuk dengan Google terlebih dahulu untuk menulis atau menambah bab.");
    var authEl = document.getElementById("authModal");
    if (authEl) authEl.classList.remove("hidden");
    return;
  }

  var el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    if (id === "writeModal" && currentUser) {
      var namaPenulis = currentUser.displayName || currentUser.email.split("@")[0];
      document.getElementById("nAuthor").value = namaPenulis;
    }
  }
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add("hidden");
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

var editingBookId = null;
function startEditBook() {
  if (!currentUser || !curBook) {
    alert("Silakan masuk kembali.");
    return;
  }

  if (curBook.authorUid !== currentUser.uid) {
    alert("Anda bukan pemilik novel ini.");
    return;
  }

  editingBookId = curBook.docId;

  document.getElementById("nTitle").value = curBook.title || "";
  document.getElementById("nCat").value = curBook.category || "";
  document.getElementById("nAuthor").value = curBook.author || "";

  var chapters = getBookChapters(curBook);
  var bab1 = chapters[0] || {};

  document.getElementById("nContent").innerHTML = bab1.content || "";

  document.getElementById("nSubmitBtn").textContent = "Simpan Perubahan";

  openModal("writeModal");
}

function addNewBook(e) {
  e.preventDefault();

  if (!currentUser) {
    alert("Silakan masuk dengan Google terlebih dahulu.");
    return;
  }

  var btn = document.getElementById("nSubmitBtn");
  var isEditing = !!editingBookId;

  if (isEditing && (!curBook || curBook.authorUid !== currentUser.uid)) {
    alert("Anda tidak berhak mengedit novel ini.");
    return;
  }

  btn.disabled = true;
  btn.textContent = isEditing ? "Menyimpan Perubahan..." : "Menerbitkan...";

  var title = document.getElementById("nTitle").value.trim();
  var cat = document.getElementById("nCat").value;
  var author = document.getElementById("nAuthor").value.trim();
  var editor = document.getElementById("nContent");
  var bab1Html = sanitizeEditorHtml(editor.innerHTML.trim());
  var rawText = editor.innerText.trim();
  var fileInput = document.getElementById("nCoverFile");

  if (!rawText) {
    alert("Isi cerita Bab 1 belum ditulis.");
    btn.disabled = false;
    btn.textContent = isEditing ? "Simpan Perubahan" : "Terbitkan Sekarang";
    return;
  }

  function save(coverData) {
    var coverFinal = coverData || (isEditing ? curBook.cover : "");

    if (isEditing) {
      var chapters = getBookChapters(curBook).slice();

      chapters[0] = {
        title: chapters[0] ? chapters[0].title : "Bab 1",
        content: bab1Html
      };

      db.collection("books").doc(editingBookId).update({
        title: title,
        author: author,
        category: cat,
        cover: coverFinal,
        excerpt: rawText.slice(0, 180) + "...",
        content: bab1Html,
        chapterList: chapters
      }).then(function() {
        editingBookId = null;
        e.target.reset();
        editor.innerHTML = "";
        closeModal("writeModal");
        btn.disabled = false;
        btn.textContent = "Terbitkan Sekarang";
        alert("Perubahan novel berhasil disimpan!");
      }).catch(function(err) {
        btn.disabled = false;
        btn.textContent = "Simpan Perubahan";
        alert("Gagal mengedit: " + err.message);
      });

    } else {
      db.collection("books").add({
        title: title,
        author: author,
        authorUid: currentUser.uid,
        authorEmail: currentUser.email,
        category: cat,
        views: 1,
        chapters: 1,
        subs: 0,
        cover: coverFinal,
        excerpt: rawText.slice(0, 180) + "...",
        content: bab1Html,
        chapterList: [{
          title: "Bab 1",
          content: bab1Html
        }],
        comments: [],
        createdAt: Date.now()
      }).then(function() {
        e.target.reset();
        editor.innerHTML = "";
        closeModal("writeModal");
        btn.disabled = false;
        btn.textContent = "Terbitkan Sekarang";
        alert("Buku berhasil diterbitkan!");
      }).catch(function(err) {
        btn.disabled = false;
        btn.textContent = "Terbitkan Sekarang";
        alert("Gagal: " + err.message);
      });
    }
  }

  var pickedFile =
    fileInput && fileInput.files && fileInput.files.length
      ? fileInput.files.item(0)
      : null;

  if (pickedFile) {
    compressCover(pickedFile, save);
  } else {
    save("");
  }
}



  function save(coverData) {
    db.collection("books").add({
      title: title,
      author: author,
      authorUid: currentUser.uid,
      authorEmail: currentUser.email,
      category: cat,
      views: 1,
      chapters: 1,
      subs: 0,
      cover: coverData || "",
      excerpt: rawText.slice(0, 180) + "...",
      content: bab1Html,
      chapterList: [{
        title: "Bab 1",
        content: bab1Html
      }],
      comments: [],
      createdAt: Date.now()
    })
    .then(function() {
      e.target.reset();
      editor.innerHTML = "";
      closeModal("writeModal");
      btn.disabled = false;
      btn.textContent = "Terbitkan Sekarang";
      alert("Buku berhasil diterbitkan!");
    })
    .catch(function(err) {
      btn.disabled = false;
      btn.textContent = "Terbitkan Sekarang";
      alert("Gagal: " + err.message);
    });
  }

  var pickedFile =
    fileInput && fileInput.files && fileInput.files.length
      ? fileInput.files.item(0)
      : null;

  if (pickedFile) {
    compressCover(pickedFile, save);
  } else {
    save("");
  }
}

function sanitizeEditorHtml(html) {
  var box = document.createElement("div");
  box.innerHTML = html;

  var allowed = [
    "P", "BR", "B", "STRONG", "I", "EM",
    "U", "UL", "OL", "LI", "H2", "H3",
    "BLOCKQUOTE", "DIV"
  ];

  function clean(node) {
    Array.from(node.children).forEach(function(el) {
      if (!allowed.includes(el.tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG"].includes(el.tagName)) {
          el.remove();
        } else {
          el.replaceWith(...Array.from(el.childNodes));
        }
        return;
      }

      var align = el.style.textAlign;
      Array.from(el.attributes).forEach(function(attr) {
        el.removeAttribute(attr.name);
      });

      if (["left", "center", "right", "justify"].includes(align)) {
        el.style.textAlign = align;
      }

      clean(el);
    });
  }

  clean(box);
  return box.innerHTML;
}

function addChapter(e) {
  e.preventDefault();

  if (!curBook || !currentUser) {
    alert("Silakan masuk kembali.");
    return;
  }

  if (curBook.authorUid !== currentUser.uid) {
    alert("Maaf, hanya penulis pemilik novel yang boleh menambahkan bab.");
    return;
  }

  var btn = e.target.querySelector("button[type='submit']");
  var editor = document.getElementById("cContent");
  var cTitle = document.getElementById("cTitle").value.trim();
  var cContent = editor.innerHTML.trim();
  var rawText = editor.innerText.trim();

  if (!cTitle || !rawText) {
    alert("Judul dan isi bab harus diisi.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Menyimpan...";

  var currentChaps = getBookChapters(curBook).slice();

  currentChaps.push({
    title: cTitle,
    content: sanitizeEditorHtml(cContent)
  });

  db.collection("books").doc(curBook.docId).update({
    chapterList: currentChaps,
    chapters: currentChaps.length
  }).then(function() {
    e.target.reset();
    editor.innerHTML = "";
    closeModal("chapModal");
    btn.disabled = false;
    btn.textContent = "Simpan Bab";
    alert("Bab baru berhasil ditambahkan!");
  }).catch(function(err) {
    btn.disabled = false;
    btn.textContent = "Simpan Bab";
    alert("Gagal menyimpan bab: " + err.message);
  });
}
function bagikanBuku() {
  if (!curBook || !curBook.docId) {
    alert("Silakan buka salah satu buku terlebih dahulu sebelum membagikan.");
    return;
  }

  var judul = curBook.title || "Cerita di BabKita";
  var urlShare = window.location.origin + "/baca?id=" + curBook.docId;

  if (navigator.share) {
    navigator.share({
      title: judul,
      text: 'Baca "' + judul + '" di BabKita:',
      url: urlShare
    }).catch(function(err) { console.log(err); });
  } else {
    navigator.clipboard.writeText(urlShare);
    alert("Link cerita berhasil disalin:\n" + urlShare);
  }
}

/* ===== TOOLBAR EDITOR BABKITA ===== */
function editorCommand(editorId, command) {
  var editor = document.getElementById(editorId);
  if (!editor) return;

  editor.focus();
  document.execCommand(command, false, null);
}

startApp();
