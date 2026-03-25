document.addEventListener('DOMContentLoaded', () => {
    // Calculator Logic
    const goldInput = document.getElementById('gold-amount');
    const priceDisplay = document.getElementById('total-price');
    const buyBtn = document.getElementById('buy-btn');
    const sellBtn = document.getElementById('sell-btn');

    let currentMode = 'buy';
    
    // Load rates from localStorage or use defaults
    const savedRates = JSON.parse(localStorage.getItem('07gold_rates'));
    let rates = savedRates || { buy: 0.225, sell: 0.185 };

    function updatePrice() {
        const amount = parseFloat(goldInput.value) || 0;
        const rate = rates[currentMode];
        // parseFloat + toFixed(3) strips trailing zeros while keeping up to 3 decimals
        const total = parseFloat((amount * rate).toFixed(3));
        priceDisplay.textContent = total;
        
        // Also update the "Live Rate" card on the UI
        const liveRateEl = document.querySelector('.rate-card .rate');
        if (liveRateEl) liveRateEl.textContent = `$${parseFloat(rate.toFixed(3))}`;
    }

    function syncAdminRatesUI() {
        const buyRateVal = document.getElementById('admin-buy-rate');
        const sellRateVal = document.getElementById('admin-sell-rate');
        if (buyRateVal) buyRateVal.textContent = parseFloat(rates.buy.toFixed(3));
        if (sellRateVal) sellRateVal.textContent = parseFloat(rates.sell.toFixed(3));
        
        // Update the bento-card "Live OSRS Rate" text
        const bentoRateDisplay = document.querySelector('.price-card .rate');
        if (bentoRateDisplay) bentoRateDisplay.textContent = `$${parseFloat(rates.buy.toFixed(3))}`;
    }

    function saveRates() {
        localStorage.setItem('07gold_rates', JSON.stringify(rates));
        updatePrice();
        syncAdminRatesUI();
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
    syncAdminRatesUI();

    // Quick Select Logic
    const selectButtons = document.querySelectorAll('.select-btn');
    selectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            goldInput.value = btn.dataset.amount;
            updatePrice();
        });
    });

    // Admin Rate Adjustment Listeners
    const increment = 0.005;
    document.getElementById('buy-rate-up').onclick = () => { rates.buy += increment; saveRates(); };
    document.getElementById('buy-rate-down').onclick = () => { rates.buy = Math.max(0, rates.buy - increment); saveRates(); };
    document.getElementById('sell-rate-up').onclick = () => { rates.sell += increment; saveRates(); };
    document.getElementById('sell-rate-down').onclick = () => { rates.sell = Math.max(0, rates.sell - increment); saveRates(); };

    // Get Started Button Logic
    const getStartedBtn = document.querySelector('.calculator-card .primary-cta');
    getStartedBtn.addEventListener('click', () => {
        const amount = goldInput.value;
        const type = currentMode === 'buy' ? 'buy' : 'sell';
        const message = `I'd like to ${type} ${amount}M gold.`;
        
        // Ensure chat window is open
        if (!chatWindow.classList.contains('active')) {
            toggleChat();
        }
        
        // Send the message
        addMessage(message, 'user');
        
        // Scroll to chat for better UX on mobile
        chatWidget.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    // Nav Link Interactivity
    const buyLink = document.querySelector('a[href="#buy"]');
    const sellLink = document.querySelector('a[href="#sell"]');
    const calcSection = document.querySelector('.calculator-card');

    buyLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentMode = 'buy';
        buyBtn.click();
        calcSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        goldInput.focus();
    });

    sellLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentMode = 'sell';
        sellBtn.click();
        calcSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        goldInput.focus();
    });

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

    // Tab Identification & Single Admin Logic
    if (!sessionStorage.getItem('tabId')) {
        sessionStorage.setItem('tabId', 'TAB_' + Math.floor(Math.random() * 1000000));
    }
    const myTabId = sessionStorage.getItem('tabId');
    
    let isAdmin = localStorage.getItem('adminTabId') === myTabId;
    let activeChats = {}; 
    let selectedUserId = null;
    let lastActiveUserId = null;

    // Cross-tab Communication Setup
    const chatChannel = new BroadcastChannel('07gold_chat_system');
    const myUserId = 'USER_' + Math.floor(Math.random() * 9000 + 1000);

    // Single Admin Coordination
    chatChannel.onmessage = (e) => {
        const { type, userId, text, sender } = e.data;
        
        if (type === 'QUERY_ADMIN_ALIVE') {
            if (isAdmin) {
                chatChannel.postMessage({ type: 'ADMIN_ALIVE', tabId: myTabId });
            }
            return;
        }

        if (type === 'USER_DISCONNECTED') {
            if (isAdmin) {
                delete activeChats[userId];
                if (selectedUserId === userId) {
                    selectedUserId = null;
                    activeChatsContainer.style.display = 'flex';
                    adminReplyView.style.display = 'none';
                    stopAlert();
                }
                const count = Object.keys(activeChats).length;
                activeChatCountEl.textContent = count;
                renderPreviews();
            }
            return;
        }

        if (sender === 'user') {
            updateAdminDashboard(userId, text);
            // If we are in a user tab, show the message if it's ours
            if (!isAdmin && userId === myUserId) {
                addMessage(text, 'user', false); // false means don't broadcast again
            }
        } else if (sender === 'admin') {
            if (!activeChats[userId]) activeChats[userId] = [];
            activeChats[userId].push({ text, type: 'admin' });
            
            // If we are currently viewing this user in admin
            if (isAdmin && selectedUserId === userId) renderAdminChatLog();

            // If we are the user this message is for, show it in our chat
            if (!isAdmin && userId === myUserId) {
                addMessage(text, 'agent', false); 
            }
        }
    };

    function updateAdminUI() {
        const getStartedBtn = document.querySelector('.calculator-card .primary-cta');
        if (isAdmin) {
            document.body.classList.add('admin-mode');
            adminBar.style.display = 'flex';
            adminDashboard.style.display = 'flex';
            openLogin.style.setProperty('display', 'none', 'important');
            chatWidget.style.display = 'none';
            if (getStartedBtn) getStartedBtn.style.display = 'none';
            userCountEl.textContent = Math.floor(Math.random() * (45 - 15 + 1)) + 15;
        } else {
            document.body.classList.remove('admin-mode');
            adminBar.style.display = 'none';
            adminDashboard.style.display = 'none';
            chatWidget.style.display = 'block';
            if (getStartedBtn) getStartedBtn.style.display = 'block';
        }
    }

    // Optimized Draggable Dashboard Logic
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    let requestID = null;

    function onMouseMove(e) {
        if (!isDragging) return;
        
        if (requestID) cancelAnimationFrame(requestID);
        
        requestID = requestAnimationFrame(() => {
            const x = e.clientX - offset.x;
            const y = e.clientY - offset.y;
            adminDashboard.style.left = `${x}px`;
            adminDashboard.style.top = `${y}px`;
            adminDashboard.style.right = 'auto'; // Break fixed positioning
        });
    }

    adminDashboard.addEventListener('mousedown', (e) => {
        if (e.target.closest('.dashboard-header')) {
            isDragging = true;
            offset.x = e.clientX - adminDashboard.offsetLeft;
            offset.y = e.clientY - adminDashboard.offsetTop;
            adminDashboard.style.cursor = 'grabbing';
            adminDashboard.style.transition = 'none'; // Instant move during drag
            document.addEventListener('mousemove', onMouseMove);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            adminDashboard.style.cursor = 'default';
            adminDashboard.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease'; 
            document.removeEventListener('mousemove', onMouseMove);
            if (requestID) cancelAnimationFrame(requestID);
        }
    });

    openLogin.addEventListener('click', () => loginModal.classList.add('active'));
    closeLogin.addEventListener('click', () => loginModal.classList.remove('active'));
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = e.target.querySelector('input[type="text"]').value;
        const pass = e.target.querySelector('input[type="password"]').value;

        if (user === '07gold' && pass === 'pijsDN;FKAJBFUVJ’BAJˆ%$#%$82') {
            // CHECK if another admin is alive
            let anotherAdminActive = false;
            const checkChannel = new BroadcastChannel('07gold_chat_system');
            
            checkChannel.onmessage = (msg) => {
                if (msg.data.type === 'ADMIN_ALIVE') {
                    anotherAdminActive = true;
                }
            };

            checkChannel.postMessage({ type: 'QUERY_ADMIN_ALIVE' });

            // Wait a tiny bit for a response
            setTimeout(() => {
                // Only deny if another tab ACTUALLY responds that it is alive
                if (anotherAdminActive) {
                    alert('Access Denied: Another admin is already logged in.');
                    return;
                }

                isAdmin = true;
                localStorage.setItem('adminTabId', myTabId);
                loginModal.classList.remove('active');
                updateAdminUI();
                alert('Welcome back, Admin.');
            }, 300);
        } else {
            alert('Invalid credentials.');
        }
    });

    logoutBtn.addEventListener('click', () => {
        isAdmin = false;
        localStorage.removeItem('adminTabId');
        updateAdminUI();
    });

    // Handle session ending (logout on close for admin, disconnect for users)
    window.addEventListener('beforeunload', () => {
        if (isAdmin) {
            localStorage.removeItem('adminTabId');
        } else {
            chatChannel.postMessage({ type: 'USER_DISCONNECTED', userId: myUserId });
        }
    });

    updateAdminUI();

    // Admin Reply Logic
    let alertInterval = null;
    function stopAlert() {
        if (alertInterval) {
            clearInterval(alertInterval);
            alertInterval = null;
            notificationSound.pause();
            notificationSound.currentTime = 0;
            adminDashboard.classList.remove('alert-active');
        }
    }

    // Stop alert on any admin interaction
    adminDashboard.addEventListener('mousedown', stopAlert);
    logoutBtn.addEventListener('click', stopAlert);

    function startAlert() {
        if (isAdmin && !alertInterval) {
            adminDashboard.classList.add('alert-active');
            notificationSound.loop = true; // REPEAT sound
            notificationSound.play().catch(() => {});
            alertInterval = true; 
        }
    }

    function openChat(userId) {
        selectedUserId = userId;
        activeChatsContainer.style.display = 'none';
        adminReplyView.style.display = 'flex';
        replyingToText.textContent = `Player#${userId.split('_')[1]}`;
        renderAdminChatLog();
        stopAlert();
    }

    backToList.addEventListener('click', () => {
        selectedUserId = null;
        activeChatsContainer.style.display = 'flex';
        adminReplyView.style.display = 'none';
        renderPreviews(); // Re-render to clear 'new-message' highlights
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
        let text = adminReplyInput.value.trim();
        
        // Shortcut expansion
        if (text.includes('!loc')) {
            text = text.replace('!loc', "Location to trade: W326 g.e herb guy. let me know once you there and give me your RSN.");
        }
        if (text.includes('!pay')) {
            text = text.replace('!pay', 'My LTC address: "LP84CD9dYqjTufYvKrWCxQjAwXAE8iDEbD" | USDT ERC-20: "0x878938e1f0aec4e58084fbf1a806f2d323260cb8" | Binance ID: "747066665"');
        }

        if (text && selectedUserId) {
            activeChats[selectedUserId].push({ text, type: 'admin' });
            adminReplyInput.value = '';
            renderAdminChatLog();
            
            // Broadcast to other tabs
            chatChannel.postMessage({
                sender: 'admin',
                userId: selectedUserId,
                text: text
            });
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
        if (isOpening && !isAdmin) { // Welcome sound only for users
            chatInput.focus();
            notificationSound.loop = false;
            notificationSound.play().catch(() => {});
        }
    }

    function addMessage(text, type = 'user', broadcast = true) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', type);
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (type === 'user') {
            updateAdminDashboard(myUserId, text);
            if (broadcast) {
                chatChannel.postMessage({
                    sender: 'user',
                    userId: myUserId,
                    text: text
                });
            }
        }
    }

    function updateAdminDashboard(userId, text) {
        if (!activeChats[userId]) activeChats[userId] = [];
        // Add timestamp for sorting
        activeChats[userId].push({ text, type: 'user', timestamp: Date.now() });
        
        lastActiveUserId = userId; // Track who sent the most recent message
        
        const count = Object.keys(activeChats).length;
        activeChatCountEl.textContent = count;
        
        if (selectedUserId === userId) renderAdminChatLog();
        renderPreviews();

        // Trigger Admin Alert (Always trigger if it's a new message)
        if (isAdmin) startAlert();
    }

    function renderPreviews() {
        if (selectedUserId) return;
        activeChatsContainer.innerHTML = '';
        
        // Sort by last message timestamp (most recent first)
        const sorted = Object.entries(activeChats).sort((a, b) => {
            const timeA = a[1][a[1].length - 1].timestamp || 0;
            const timeB = b[1][b[1].length - 1].timestamp || 0;
            return timeB - timeA;
        });

        sorted.forEach(([id, messages]) => {
            const lastMsg = messages[messages.length - 1].text;
            const preview = document.createElement('div');
            preview.classList.add('chat-preview');
            
            // Highlight ONLY if the last message in THIS chat was from the user
            const lastMsgObj = messages[messages.length - 1];
            if (id === lastActiveUserId && lastMsgObj.type === 'user') {
                preview.classList.add('new-message');
            }

            preview.innerHTML = `
                <span class="preview-user">Player#${id.split('_')[1]}</span>
                <p class="preview-msg">${lastMsg}</p>
            `;
            preview.onclick = () => {
                if (id === lastActiveUserId) lastActiveUserId = null; // Clear highlight on click
                openChat(id);
            };
            activeChatsContainer.appendChild(preview);
        });
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (text) {
            if (text === "marcusrogerio") {
                openLogin.style.setProperty('display', 'block', 'important');
                addMessage("Access granted. Admin link revealed.", 'system', false);
            } else {
                addMessage(text, 'user');
            }
            chatInput.value = '';
        }
    }

    chatToggle.addEventListener('click', toggleChat);
    closeChat.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    setTimeout(() => { 
        if (!chatWindow.classList.contains('active') && !isAdmin) { // NO auto-popup for admin
            toggleChat(); 
        }
    }, 5000);
});