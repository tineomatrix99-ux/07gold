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
        const type = currentMode;

        if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
            window.Tawk_API.maximize();

            // 1. Change the visitor's name in your dashboard so you see it instantly
            window.Tawk_API.setAttributes({
                'name': `Player (${type.toUpperCase()} ${amount}M)`,
                'Order': `${type} ${amount}M`
            }, function(error){});

            // 2. Add a visible "Event" in your chat timeline
            window.Tawk_API.addEvent('order-info', {
                'intent': type,
                'amount': amount + 'M'
            }, function(error){});

            console.log("Order details sent to Tawk.to dashboard.");
        } else {
            alert("Chat is still loading. Please wait 2 seconds or click the bubble.");
        }
    });

    // Add Tawk.to event listener for better reliability
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = function(){
        console.log("Tawk.to API loaded!");
    };

    // Login & Admin Logic
    const loginModal = document.getElementById('login-modal');
    const openLogin = document.getElementById('open-login');
    const closeLogin = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');
    const adminBar = document.getElementById('admin-bar');
    const logoutBtn = document.getElementById('logout-btn');

    let isAdmin = localStorage.getItem('isAdmin') === 'true';

    function updateAdminUI() {
        const getStartedBtn = document.querySelector('.calculator-card .primary-cta');
        if (isAdmin) {
            document.body.classList.add('admin-mode');
            adminBar.style.display = 'flex';
            openLogin.style.setProperty('display', 'none', 'important');
            if (getStartedBtn) getStartedBtn.style.display = 'none';
        } else {
            document.body.classList.remove('admin-mode');
            adminBar.style.display = 'none';
        }
    }

    openLogin.addEventListener('click', () => loginModal.classList.add('active'));
    closeLogin.addEventListener('click', () => loginModal.classList.remove('active'));
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = e.target.querySelector('input[type="text"]').value;
        const pass = e.target.querySelector('input[type="password"]').value;

        if (user === '07gold' && pass === '123') {
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
        localStorage.setItem('isAdmin', 'false');
        updateAdminUI();
        location.reload(); 
    });

    updateAdminUI();

    // Secret "Reveal Login" trigger
    // You can reveal the login button by typing "marcusrogerio" in the browser console
    window.revealAdmin = function() {
        openLogin.style.setProperty('display', 'block', 'important');
        console.log("Admin login revealed.");
    };
});
