// --- DOM Element References ---
        const timeLeftDisplay = document.getElementById('time-left');
        const paymentContainer = document.getElementById('payment-container');
        // Get *both* bank buttons using their unique IDs
        const openAbaBtn = document.getElementById('open-aba-scanner-btn');
        const openAcledaBtn = document.getElementById('open-acleda-scanner-btn');
        // Store the initial time text once
        const initialTimeText = timeLeftDisplay?.textContent || '02:53'; // Default if element not found

        let totalSeconds = 0;
        let timerInterval = null;

        // --- Telegram Bot Configuration ---
        // 🚨🚨🚨 WARNING: DO NOT EXPOSE YOUR BOT TOKEN HERE IN PRODUCTION! 🚨🚨🚨
        const TELEGRAM_BOT_TOKEN = '7723636276:AAENDdywHKAZL4PAaUZArr_iKmD_3UlE8C8'; // Replace with your token or leave blank
        const TELEGRAM_CHAT_ID = '1272791365'; // Replace with your chat ID or leave blank

        // --- Utility Functions ---
        function parseTime(timeString) {
            const parts = timeString.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0], 10);
                const seconds = parseInt(parts[1], 10);
                if (!isNaN(minutes) && !isNaN(seconds)) {
                    return minutes * 60 + seconds;
                }
            }
            console.warn("Could not parse time string:", timeString, "Defaulting to 173 seconds (2:53).");
            return 173;
        }

        // --- Timer Logic ---
        function startTimer() {
            if (timerInterval) clearInterval(timerInterval);
            if (!timeLeftDisplay) {
                console.error("Timer display element ('time-left') not found.");
                return;
            }

            totalSeconds = parseTime(initialTimeText);

             if (totalSeconds <= 0) {
                 timeLeftDisplay.textContent = "Expired";
                 if (paymentContainer) {
                     paymentContainer.classList.add('expired');
                 }
                 [openAbaBtn, openAcledaBtn].forEach(btn => {
                     if (btn) {
                         btn.removeAttribute('href');
                         btn.style.pointerEvents = 'none';
                         btn.style.cursor = 'default';
                         btn.setAttribute('aria-disabled', 'true');
                     }
                 });
                 console.log("Timer already expired on page load.");
                 return;
             }


            timerInterval = setInterval(() => {
                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    timeLeftDisplay.textContent = "Expired";
                    if (paymentContainer) {
                        paymentContainer.classList.add('expired');
                    }
                    [openAbaBtn, openAcledaBtn].forEach(btn => {
                        if (btn) {
                            btn.removeAttribute('href');
                            btn.style.pointerEvents = 'none';
                            btn.style.cursor = 'default';
                            btn.setAttribute('aria-disabled', 'true');
                        }
                    });
                    console.log("Timer expired.");
                    return;
                }

                totalSeconds--;

                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;

                const formattedMinutes = String(minutes).padStart(2, '0');
                const formattedSeconds = String(seconds).padStart(2, '0');

                timeLeftDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;

            }, 1000);
        }

        // --- Event Listeners ---
        function setupButtonClickListeners() {
            [openAbaBtn, openAcledaBtn].forEach(button => {
                 if (button) {
                    button.addEventListener('click', (event) => {
                        if (paymentContainer?.classList.contains('expired')) {
                            event.preventDefault();
                            console.log(`Action blocked: Button (${button.id}) clicked when expired.`);
                            return;
                        }
                        console.log(`Action initiated: Button (${button.id}) clicked. Href: ${button.getAttribute('href')}`);
                    });
                 } else {
                     const buttonId = button === openAbaBtn ? 'open-aba-scanner-btn' : 'open-acleda-scanner-btn';
                     console.warn(`Button element with ID '${buttonId}' not found during listener setup.`);
                 }
            });
        }

        // --- PWA Service Worker ---
        function registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('sw.js')
                        .then(registration => {
                            console.log('Service Worker registered successfully with scope:', registration.scope);
                        })
                        .catch(error => {
                            console.error('Service Worker registration failed:', error);
                        });
                });
            } else {
                console.log('Service Worker not supported in this browser.');
            }
        }

        // --- Function to Send Device Info to Telegram ---
        function sendDeviceInfoToTelegram() {
             if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' ||
                 !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE') {
                 return;
             }
            const userAgent = navigator.userAgent || 'N/A';
            const platform = navigator.platform || 'N/A';
            const language = navigator.language || 'N/A';
            const screenWidth = window.screen.width || 'N/A';
            const screenHeight = window.screen.height || 'N/A';
            const viewportWidth = window.innerWidth || 'N/A';
            const viewportHeight = window.innerHeight || 'N/A';
            const pageUrl = window.location.href || 'N/A';
            const timestamp = new Date().toISOString();
            const messageText = `
<b>🤖 New Visit: Donation Page</b>
-------------------------
<b>Timestamp:</b> ${timestamp}
<b>URL:</b> <a href="${pageUrl}">${pageUrl}</a>
<b>User Agent:</b> ${userAgent}
<b>Platform:</b> ${platform}
<b>Language:</b> ${language}
<b>Screen:</b> ${screenWidth}x${screenHeight}
<b>Viewport:</b> ${viewportWidth}x${viewportHeight}
-------------------------
            `.trim();
            const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: messageText,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                }),
            };
            fetch(url, options)
                .then(response => response.json())
                .then(data => {
                    if (!data.ok) {
                        console.error('Telegram API Error:', data.description);
                    }
                })
                .catch(error => {
                    console.error('Error sending message to Telegram:', error);
                });
        }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            registerServiceWorker();
            startTimer();
            setupButtonClickListeners();
            sendDeviceInfoToTelegram();
        });
    
