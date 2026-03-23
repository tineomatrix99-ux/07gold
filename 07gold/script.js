document.addEventListener('DOMContentLoaded', () => {
    // Calculator Logic
    const goldInput = document.getElementById('gold-amount');
    const priceDisplay = document.getElementById('total-price');
    const buyBtn = document.getElementById('buy-btn');
    const sellBtn = document.getElementById('sell-btn');

    let currentMode = 'buy';
    const rates = {
        buy: 0.35,
        sell: 0.28
    };

    function updatePrice() {
        const amount = parseFloat(goldInput.value) || 0;
        const rate = rates[currentMode];
        const total = (amount * rate).toFixed(2);
        priceDisplay.textContent = total;
    }

    buyBtn.addEventListener('click', () => {
        currentMode = 'buy';
        buyBtn.classList.add('active');
        sellBtn.classList.remove('active');
        updatePrice();
    });

    sellBtn.addEventListener('click', () => {
        currentMode = 'sell';
        sellBtn.classList.add('active');
        buyBtn.classList.remove('active');
        updatePrice();
    });

    goldInput.addEventListener('input', updatePrice);
    updatePrice();

    // Login & Admin Logic
    const loginModal = document.getElementById('login-modal');
    const openLogin = document.getElementById('open-login');
    const closeLogin = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');
    const adminBar = document.getElementById('admin-bar');
    const adminDashboard = document.getElementById('admin-dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const activeChatsContainer = document.getElementById('admin-active-chats');
    const userCountEl = document.getElementById('user-count');
    const activeChatCountEl = document.getElementById('active-chat-count');
    const chatWidget = document.getElementById('chat-widget');

    // Admin Reply View Elements
    const adminReplyView = document.getElementById('admin-reply-view');
    const backToList = document.getElementById('back-to-list');
    const replyingToText = document.getElementById('replying-to');
    const adminChatLog = document.getElementById('admin-chat-log');
    const adminReplyInput = document.getElementById('admin-reply-input');
    const adminSendReply = document.getElementById('admin-send-reply');

    let isAdmin = localStorage.getItem('isAdmin') === 'true';
    let activeChats = {}; // Stores { userId: [messages] }
    let selectedUserId = null;

    function updateAdminUI() {
        if (isAdmin) {
            adminBar.style.display = 'flex';
            adminDashboard.style.display = 'block';
            openLogin.style.display = 'none';
            chatWidget.style.display = 'none'; // REMOVE live chat for admin
            userCountEl.textContent = Math.floor(Math.random() * (45 - 15 + 1)) + 15;
        } else {
            adminBar.style.display = 'none';
            adminDashboard.style.display = 'none';
            openLogin.style.display = 'block';
            chatWidget.style.display = 'block';
        }
    }

    openLogin.addEventListener('click', () => loginModal.classList.add('active'));
    closeLogin.addEventListener('click', () => loginModal.classList.remove('active'));
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = e.target.querySelector('input[type="text"]').value;
        const pass = e.target.querySelector('input[type="password"]').value;

        if (user === '07gold' && pass === 'pijsDN;FKAJBFUVJ’BAJˆ%$#%$82') {
            isAdmin = true;
            localStorage.setItem('isAdmin', 'true');
            loginModal.classList.remove('active');
            updateAdminUI();
            alert('Welcome back, Admin.');
        } else {
            alert('Invalid credentials.');
        }
    });

    logoutBtn.addEventListener('click', () => {
        isAdmin = false;
        localStorage.removeItem('isAdmin');
        updateAdminUI();
    });

    updateAdminUI();

    // Admin Reply Logic
    function openChat(userId) {
        selectedUserId = userId;
        activeChatsContainer.style.display = 'none';
        adminReplyView.style.display = 'flex';
        replyingToText.textContent = `Player#${userId}`;
        renderAdminChatLog();
    }

    backToList.addEventListener('click', () => {
        selectedUserId = null;
        activeChatsContainer.style.display = 'flex';
        adminReplyView.style.display = 'none';
    });

    function renderAdminChatLog() {
        if (!selectedUserId) return;
        adminChatLog.innerHTML = '';
        activeChats[selectedUserId].forEach(m => {
            const div = document.createElement('div');
            div.classList.add('msg', m.type);
            div.textContent = m.text;
            adminChatLog.appendChild(div);
        });
        adminChatLog.scrollTop = adminChatLog.scrollHeight;
    }

    adminSendReply.addEventListener('click', sendAdminReply);
    adminReplyInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendAdminReply(); });

    function sendAdminReply() {
        const text = adminReplyInput.value.trim();
        if (text && selectedUserId) {
            activeChats[selectedUserId].push({ text, type: 'admin' });
            adminReplyInput.value = '';
            renderAdminChatLog();
            // In a real app, this would push to the user's browser.
        }
    }

    // Chat Logic (User Side)
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-msg');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    const notificationSound = new Audio('pingsound.mp3');
    let audioUnlocked = false;

    const unlockAudio = () => {
        if (!audioUnlocked) {
            notificationSound.play().then(() => {
                notificationSound.pause();
                notificationSound.currentTime = 0;
                audioUnlocked = true;
            }).catch(() => {});
            document.removeEventListener('click', unlockAudio);
        }
    };
    document.addEventListener('click', unlockAudio);

    function toggleChat() {
        const isOpening = !chatWindow.classList.contains('active');
        chatWindow.classList.toggle('active');
        if (isOpening) {
            chatInput.focus();
            notificationSound.play().catch(() => {});
        }
    }

    function addMessage(text, type = 'user') {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', type);
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (type === 'user') {
            updateAdminDashboard("USER_1", text); // Simulate one user session
        }
    }

    function updateAdminDashboard(userId, text) {
        if (!activeChats[userId]) activeChats[userId] = [];
        activeChats[userId].push({ text, type: 'user' });
        
        const count = Object.keys(activeChats).length;
        activeChatCountEl.textContent = count;
        
        if (selectedUserId === userId) renderAdminChatLog();
        renderPreviews();
    }

    function renderPreviews() {
        if (selectedUserId) return;
        activeChatsContainer.innerHTML = '';
        Object.entries(activeChats).forEach(([id, messages]) => {
            const lastMsg = messages[messages.length - 1].text;
            const preview = document.createElement('div');
            preview.classList.add('chat-preview');
            preview.innerHTML = `
                <span class="preview-user">Player#${id.split('_')[1]}</span>
                <p class="preview-msg">${lastMsg}</p>
            `;
            preview.onclick = () => openChat(id);
            activeChatsContainer.appendChild(preview);
        });
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (text) {
            addMessage(text, 'user');
            chatInput.value = '';
            // Auto-reply removed or kept as system placeholder
        }
    }

    chatToggle.addEventListener('click', toggleChat);
    closeChat.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    setTimeout(() => { if (!chatWindow.classList.contains('active')) toggleChat(); }, 5000);
});
