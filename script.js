// --- UI Text Constants ---
        const UI_TEXT = {
            TIMER_EXPIRED: "Expired",
            LOADING_SUPPORTERS: "Loading supporters...",
            NO_DONATIONS: "No donations yet. Be the first!",
        };
        const ANIMATION_DELAY_LAYOUT_SETTLE = 200; // ms


        // --- DOM Element References ---
        const timeLeftDisplay = document.getElementById('time-left');
        const paymentContainer = document.getElementById('payment-container');
        const openAbaBtn = document.getElementById('open-aba-scanner-btn');
        const openAcledaBtn = document.getElementById('open-acleda-scanner-btn');
        const initialTimeText = timeLeftDisplay?.textContent || '02:53';

        const donationsListSection = document.getElementById('supporter-list-section');
        const donorsListElement = document.getElementById('donors-list');
        const noDonationsMessageElement = document.getElementById('no-donations-message');

        let totalSeconds = 0;
        let timerInterval = null;
        let hasScrolledAnimated = false;

        // --- Telegram Bot Configuration ---
        const TELEGRAM_BOT_TOKEN = '7723636276:AAENDdywHKAZL4PAaUZArr_iKmD_3UlE8C8'; // 🚨 WARNING: DO NOT EXPOSE IN PRODUCTION!
        const TELEGRAM_CHAT_ID = '1272791365'; // 🚨 WARNING: DO NOT EXPOSE IN PRODUCTION!


        // --- Utility Functions ---
        function parseTime(timeString) {
            const parts = timeString.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0], 10);
                const seconds = parseInt(parts[1], 10);
                if (!isNaN(minutes) && !isNaN(seconds)) { return minutes * 60 + seconds; }
            }
            console.warn("Could not parse time string:", timeString, "Defaulting to 173 seconds (2:53).");
            return 173;
        }

        function setExpiredState() {
            const activeElement = document.activeElement;
            const wasFocusOnButton = [openAbaBtn, openAcledaBtn].some(btn => btn === activeElement);

            if (paymentContainer) paymentContainer.classList.add('expired');
            if (timeLeftDisplay) timeLeftDisplay.textContent = UI_TEXT.TIMER_EXPIRED;

            [openAbaBtn, openAcledaBtn].forEach(btn => {
                if (btn) {
                    btn.removeAttribute('href'); btn.style.pointerEvents = 'none';
                    btn.style.cursor = 'default'; btn.setAttribute('aria-disabled', 'true');
                    btn.setAttribute('tabindex', '-1');
                }
            });
            if (wasFocusOnButton && timeLeftDisplay) { timeLeftDisplay.setAttribute('tabindex', '-1'); timeLeftDisplay.focus(); }
            console.log("Timer has expired or was expired on load.");
        }

        // --- Timer Logic ---
        function startTimer() {
            if (timerInterval) clearInterval(timerInterval);
            if (!timeLeftDisplay) { console.error("Timer display element ('time-left') not found."); return; }
            totalSeconds = parseTime(initialTimeText);
            if (totalSeconds <= 0) { setExpiredState(); return; }
            timerInterval = setInterval(() => {
                if (totalSeconds <= 0) { clearInterval(timerInterval); setExpiredState(); return; }
                totalSeconds--;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                timeLeftDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }, 1000);
        }

        // --- Event Listeners for Buttons ---
        function setupButtonClickListeners() {
            [openAbaBtn, openAcledaBtn].forEach(button => {
                 if (button) {
                    button.addEventListener('click', (event) => {
                        if (paymentContainer?.classList.contains('expired')) { event.preventDefault(); console.log(`Action blocked: Button (${button.id}) clicked when expired.`); return; }
                         console.log(`Action initiated: Button (${button.id}) clicked. Href: ${button.getAttribute('href')}`);
                    });
                 } else { console.warn(`Button element with ID '${button === openAbaBtn ? 'open-aba-scanner-btn' : 'open-acleda-scanner-btn'}' not found.`); }
            });
        }

        // --- PWA Service Worker ---
        function registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('sw.js')
                        .then(registration => console.log('Service Worker registered successfully with scope:', registration.scope))
                        .catch(error => console.error('Service Worker registration failed:', error));
                });
            } else { console.log('Service Worker not supported in this browser.'); }
        }

        // --- Function to Send Device Info to Telegram ---
        function sendDeviceInfoToTelegram() {
             if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.startsWith('YOUR_BOT_TOKEN') || TELEGRAM_BOT_TOKEN.length < 20 || !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID.startsWith('YOUR_CHAT_ID') || TELEGRAM_CHAT_ID.length < 5 ) { return; }
            const deviceInfo = `<b>🤖 New Visit: Donation Page</b>\n<b>Timestamp:</b> ${new Date().toISOString()}\n<b>URL:</b> <a href="${window.location.href}">${window.location.href}</a>\n<b>User Agent:</b> ${navigator.userAgent || 'N/A'}\n<b>Platform:</b> ${navigator.platform || 'N/A'}\n<b>Language:</b> ${navigator.language || 'N/A'}\n<b>Screen:</b> ${window.screen.width || 'N/A'}x${window.screen.height || 'N/A'}\n<b>Viewport:</b> ${window.innerWidth || 'N/A'}x${window.innerHeight || 'N/A'}`;
            fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: deviceInfo.trim(), parse_mode: 'HTML', disable_web_page_preview: true }),
            })
            .then(response => response.json()).then(data => { if (!data.ok) console.error('Telegram API Error:', data.description); })
            .catch(error => console.error('Error sending message to Telegram:', error));
        }

        // --- Function to Display Donations ---
        function displayDonations(donations) {
            if (!donorsListElement || !noDonationsMessageElement) { console.error("Donors list or no-donations message element not found."); return; }
            donorsListElement.innerHTML = '';
            const count = donations ? donations.length : 0;
            if (noDonationsMessageElement) {
                if (count === 0) { noDonationsMessageElement.textContent = UI_TEXT.NO_DONATIONS; noDonationsMessageElement.style.display = 'block'; donorsListElement.style.display = 'none'; return; }
                noDonationsMessageElement.style.display = 'none';
            }
            donorsListElement.style.display = 'block';
            donations.forEach((donation, index) => {
                if (donation && typeof donation.name === 'string' && typeof donation.amount === 'number') {
                    const listItem = document.createElement('li'); listItem.classList.add('donor-item');
                    const itemNumber = index + 1; const formattedAmount = `$${donation.amount.toFixed(2)}`; const popupId = `supporter-popup-${index}`;
                    const numberSpan = document.createElement('span'); numberSpan.classList.add('donor-item-number'); numberSpan.textContent = `${itemNumber}.`;
                    const nameSpan = document.createElement('span'); nameSpan.classList.add('donor-name'); nameSpan.textContent = donation.name;
                    nameSpan.setAttribute('tabindex', '0'); nameSpan.setAttribute('role', 'button'); nameSpan.setAttribute('aria-describedby', popupId);
                    const popup = document.createElement('div'); popup.classList.add('supporter-popup'); popup.id = popupId; popup.setAttribute('role', 'tooltip');
                    const popupNameSpan = document.createElement('span'); popupNameSpan.classList.add('popup-supporter-name'); popupNameSpan.textContent = donation.name;
                    const popupAmountSpan = document.createElement('span'); popupAmountSpan.classList.add('popup-supporter-amount'); popupAmountSpan.textContent = formattedAmount;
                    popup.appendChild(popupNameSpan); popup.appendChild(popupAmountSpan); nameSpan.appendChild(popup);
                    const amountSpan = document.createElement('span'); amountSpan.classList.add('donation-amount'); amountSpan.textContent = formattedAmount;
                    listItem.appendChild(numberSpan); listItem.appendChild(nameSpan); listItem.appendChild(amountSpan); donorsListElement.appendChild(listItem);
                } else { console.warn("Skipping invalid donation data:", donation); }
            });
        }

        // --- Function to Load Donations from JSON ---
        async function loadDonations() {
             const jsonUrl = 'supporters.json';
             if (noDonationsMessageElement) { noDonationsMessageElement.textContent = UI_TEXT.LOADING_SUPPORTERS; noDonationsMessageElement.style.display = 'block'; if (donorsListElement) donorsListElement.style.display = 'none';}
             try {
                 const response = await fetch(jsonUrl);
                 if (!response.ok) {
                     console.warn(`Failed to fetch ${jsonUrl}: ${response.status} ${response.statusText}.`);
                     if (response.status === 404) console.log("Supporters file (supporters.json) not found.");
                     else console.error(`Server error ${response.status} fetching supporters file.`);
                     displayDonations([]); return;
                 }
                 const data = await response.json();
                 if (!Array.isArray(data)) { console.error(`Data from ${jsonUrl} is not an array.`, data); displayDonations([]); return; }
                 data.sort((a, b) => b.amount - a.amount); displayDonations(data);
             } catch (error) { console.error('Error loading or parsing donations:', error); displayDonations([]); }
         }

        // --- Scroll Animation Logic ---
        function checkDonationListVisibility() {
             if (!donationsListSection || hasScrolledAnimated) return;
             const isExpired = paymentContainer?.classList.contains('expired');
             const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
             if (isExpired || prefersReducedMotion) {
                 if (donationsListSection) { donationsListSection.style.opacity = isExpired ? '0.6' : '1'; donationsListSection.style.transform = 'translateY(0)'; donationsListSection.style.transition = 'none'; donationsListSection.classList.remove('animate-in'); }
                 hasScrolledAnimated = true; window.removeEventListener('scroll', checkDonationListVisibility); window.removeEventListener('resize', checkDonationListVisibilityThrottled); return;
             }
             const rect = donationsListSection.getBoundingClientRect();
             const isVisible = rect.top < window.innerHeight * 0.9 && rect.bottom >= 0;
             if (isVisible) { donationsListSection.classList.add('animate-in'); hasScrolledAnimated = true; window.removeEventListener('scroll', checkDonationListVisibility); window.removeEventListener('resize', checkDonationListVisibilityThrottled); }
        }
        let resizeTimeout; function checkDonationListVisibilityThrottled() { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(checkDonationListVisibility, 150); }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            if (parseTime(initialTimeText) <= 0 && paymentContainer) { setExpiredState(); }
            registerServiceWorker();
            if (!paymentContainer?.classList.contains('expired')) { startTimer(); }
            setupButtonClickListeners(); sendDeviceInfoToTelegram();
            loadDonations().then(() => {
                setTimeout(() => {
                    checkDonationListVisibility();
                    if (!hasScrolledAnimated) { window.addEventListener('scroll', checkDonationListVisibility, { passive: true }); window.addEventListener('resize', checkDonationListVisibilityThrottled, { passive: true }); }
                }, ANIMATION_DELAY_LAYOUT_SETTLE);
            });
        });
