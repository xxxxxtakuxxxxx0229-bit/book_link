document.addEventListener('DOMContentLoaded', () => {
  let timerInterval;
  let startTime;
  let elapsedSeconds = 0;

  // --- ヘルパー関数: 時間フォーマット ---
  const formatTime = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // --- タイマー機能 ---
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-timer-btn'); // 追加
  const display = document.getElementById('timer-display');
  const form = document.getElementById('book-form');

  if (startBtn) {
    // 開始
    startBtn.addEventListener('click', () => {
      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
      if(resetBtn) resetBtn.style.display = 'inline-block'; // 表示
      form.style.display = 'none';
      
      startTime = Date.now() - (elapsedSeconds * 1000);
      timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        display.textContent = formatTime(elapsedSeconds);
      }, 1000);
    });

    // 終了（一時停止して記録フォーム表示）
    stopBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      stopBtn.style.display = 'none';
      if(resetBtn) resetBtn.style.display = 'none';
      startBtn.style.display = 'inline-block';
      startBtn.textContent = "再開";
      
      form.style.display = 'flex';
      document.getElementById('hidden-duration').value = elapsedSeconds;
    });

    // 【機能3】中止ボタン（タイマーリセット）
    if(resetBtn) {
      resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        elapsedSeconds = 0;
        display.textContent = "00:00:00";
        startBtn.style.display = 'inline-block';
        startBtn.textContent = "読書開始";
        stopBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        form.style.display = 'none';
      });
    }

    // 【機能2】記録送信（合算はサーバー側で行う想定）
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      try {
        const response = await fetch('/books', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          // タイマーとフォームを完全リセット
          clearInterval(timerInterval);
          elapsedSeconds = 0;
          display.textContent = "00:00:00";
          startBtn.textContent = "読書開始";
          form.reset();
          form.style.display = 'none';
          
          window.location.reload(); 
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // --- 【機能1・3】モーダル機能 ---
  const modal = document.getElementById('book-modal');
  if (modal) {
    const viewMode = document.getElementById('modal-view-mode');
    const editForm = document.getElementById('modal-edit-form');
    
    // カードクリックでモーダルを開く
    document.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', () => {
        const data = card.dataset;
        
        // 表示用データセット
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-author').textContent = data.author;
        document.getElementById('modal-pages').textContent = data.pages;
        document.getElementById('modal-time').textContent = formatTime(data.time);
        document.getElementById('modal-impression').textContent = data.impression || "なし";
        document.getElementById('modal-recommend').textContent = data.recommend || "なし";

        // 編集用フォーム初期値セット
        document.getElementById('edit-book-id').value = data.id;
        document.getElementById('edit-title').value = data.title;
        document.getElementById('edit-author').value = data.author;
        document.getElementById('edit-impression').value = data.impression || "";
        document.getElementById('edit-recommend').value = data.recommend || "";
        document.getElementById('edit-itibun').value = data.itibun || "";

        // モード初期化（閲覧モード）
        viewMode.style.display = 'block';
        editForm.style.display = 'none';
        modal.style.display = 'flex';
      });
    });

    // 閉じるボタン
    document.getElementById('close-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // 編集ボタン
    const editBtn = document.getElementById('edit-btn');
    if(editBtn) {
      editBtn.addEventListener('click', () => {
        viewMode.style.display = 'none';
        editForm.style.display = 'block';
      });
    }

    // 【機能1】編集保存処理
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-book-id').value;
      const formData = new FormData(editForm);
      // PUTメソッドなどで送信（サーバー側の実装に合わせて調整）
      await fetch(`/books/${id}`, { method: 'PUT', body: formData });
      window.location.reload();
    });

    // 【機能3】削除処理
    const deleteBtn = document.getElementById('delete-book-btn');
    if(deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if(confirm("本当にこの本の記録を削除しますか？")) {
          const id = document.getElementById('edit-book-id').value;
          await fetch(`/books/${id}`, { method: 'DELETE' });
          window.location.reload();
        }
      });
    }
  }
  
   document.querySelectorAll('.user-item').forEach(item => {
    item.addEventListener('click', async () => {
      const userId = item.dataset.id;
      
      try {
        const response = await fetch(`/users/${userId}/profile`);
        const html = await response.text();
        
        const mainArea = document.getElementById('main-profile-area');
        mainArea.innerHTML = html;
        
        // DOMが書き換わったのでタイマーイベントなどを再設定する必要があるが、
        // 他人のプロファイルにはタイマーがないため今回は不要。
        // もし自分のアイコンをクリックして戻る機能を実装する場合は再セットアップが必要。
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    });
  });

  // --- 【機能5】フォロー機能 ---
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#follow-btn');

    if (btn) {
      e.preventDefault();
      const userId = btn.dataset.userId;

      try {
        const res = await fetch(`/users/${userId}/follow`, { method: 'POST' });
        const data = await res.json();

        // 1. ハートボタンの見た目を変える
        if (data.followed) {
          btn.textContent = '❤️';
          
          // ★ここが追加：お気に入りリストに追加する処理
          addToSidebar(data.user); 

        } else {
          btn.textContent = '🤍';
          
          // ★ここが追加：お気に入りリストから削除する処理
          removeFromSidebar(userId);
        }

      } catch (err) {
        console.error("フォロー処理に失敗しました", err);
      }
    }
  });

  // --- サイドバー操作用の便利関数 ---

  // リストに追加する関数
  function addToSidebar(user) {
    const list = document.querySelector('.favorites .user-list');
    const emptyMsg = list.querySelector('.empty-msg');
    
    // 「まだお気に入りはいません」の文字があれば消す
    if (emptyMsg) emptyMsg.remove();

    // 新しいリストアイテム(HTML)を作る
    const li = document.createElement('li');
    li.className = 'user-item';
    li.dataset.id = user.id;
    li.innerHTML = `
      <img src="${user.icon_url}" alt="icon">
      <span>${user.name}</span>
    `;

    // クリックしたらその人のプロフに飛ぶ機能もつけておく（既存機能の再現）
    li.addEventListener('click', () => loadUserProfile(user.id));

    // リストの一番最後に追加
    list.appendChild(li);
  }

  // リストから削除する関数
  function removeFromSidebar(userId) {
    const list = document.querySelector('.favorites .user-list');
    // data-id が一致する要素を探して削除
    const item = list.querySelector(`.user-item[data-id="${userId}"]`);
    if (item) {
      item.remove();
    }

    // もし誰もいなくなったら「まだお気に入りはいません」を復活させる（お好みで）
    if (list.children.length === 0) {
      list.innerHTML = '<li class="empty-msg">まだお気に入りはいません</li>';
    }
  }

  // ユーザープロフ読み込み関数（既存のコードから切り出し）
  // ※既存の `document.querySelectorAll('.user-item').forEach...` の中身と同じ処理です
  async function loadUserProfile(userId) {
    try {
        const response = await fetch(`/users/${userId}/profile`);
        const html = await response.text();
        const mainArea = document.getElementById('main-profile-area');
        mainArea.innerHTML = html;
    } catch (err) {
        console.error("Failed to load profile", err);
    }
  }
});