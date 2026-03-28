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
        const type = currentMode.toUpperCase();
        
        if (typeof Tawk_API !== 'undefined') {
            Tawk_API.maximize();
            // Optional: Send trade info as an attribute or event
            Tawk_API.addEvent('trade-intent', {
                'action': type,
                'amount': amount + 'M',
                'total': priceDisplay.textContent + ' USD'
            }, function(error){});
            
            // Note: Tawk.to doesn't allow sending a message AS the user directly via JS API 
            // but maximizing and adding an event/attribute alerts the agent.
        } else {
            alert(`Please use the chat bubble to ${type} ${amount}M gold!`);
        }
    });

    // Login & Admin Logic
    const loginModal = document.getElementById('login-modal');
    const openLogin = document.getElementById('open-login');
    const closeLogin = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');
    const adminBar = document.getElementById('admin-bar');
    const logoutBtn = document.getElementById('logout-btn');

    let isAdmin = localStorage.getItem('isAdmin') === 'true';

    function updateAdminUI() {
        if (isAdmin) {
            document.body.classList.add('admin-mode');
            adminBar.style.display = 'flex';
            openLogin.style.setProperty('display', 'none', 'important');
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
    window.revealAdmin = function() {
        openLogin.style.setProperty('display', 'block', 'important');
        console.log("Admin login revealed.");
    };
});
