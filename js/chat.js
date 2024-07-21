let lastMessageTime = 0;
let messageCountInLastTenSeconds = 0;
let canSendMessage = true;

const discordWebhookUrl = 'https://discord.com/api/webhooks/1264370458304843796/x33GBVOaOtMIuns0xhANrpTvWmR316XuVm0SGMOyJ3JEbqql5GsZ60ZHRK0EZY-qn2EZ';

document.addEventListener('DOMContentLoaded', (event) => {
    loadMessages();
    fetchDiscordMessages();

    document.getElementById('chat-icon').addEventListener('click', () => {
        console.log('Chat icon clicked'); // Debug log
        const chatboxContainer = document.getElementById('chatbox-container');
        if (chatboxContainer) {
            chatboxContainer.classList.add('open');
            chatboxContainer.style.display = 'flex';
        } else {
            console.error('Chatbox container not found');
        }
    });

    document.getElementById('close-chatbox').addEventListener('click', () => {
        console.log('Close chatbox clicked'); // Debug log
        const chatboxContainer = document.getElementById('chatbox-container');
        if (chatboxContainer) {
            chatboxContainer.classList.remove('open');
            setTimeout(() => {
                chatboxContainer.style.display = 'none';
            }, 300);  // Match this to the duration of the animation
        } else {
            console.error('Chatbox container not found');
        }
    });

    document.getElementById('message-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleSendMessage(); // Call handleSendMessage() when "Enter" is pressed
        }
    });

    // Retrieve the state of canSendMessage from localStorage
    const sendMessageStatus = localStorage.getItem('canSendMessage');
    if (sendMessageStatus !== null) {
        canSendMessage = JSON.parse(sendMessageStatus);
    }

    // Check and extend the sanction if necessary
    checkAndExtendSanction();
});

    // Récupérer l'état de canSendMessage depuis le localStorage
    const sendMessageStatus = localStorage.getItem('canSendMessage');
    if (sendMessageStatus !== null) {
        canSendMessage = JSON.parse(sendMessageStatus);
    }

    // Vérifier et prolonger la sanction si nécessaire
    checkAndExtendSanction();
});

function handleSendMessage() {
    if (canSendMessage) {
        sendMessage();
    } else {
        alert("Envoi de messages désactivé pour le moment.");
    }
}

function sendMessage() {
    const now = new Date().getTime();
    const messageInput = document.getElementById('message-input');
    let message = messageInput.value.trim();

    if (message === '') return;

    // Vérification du spam
    if (now - lastMessageTime < 10000) { // Si moins de 10 secondes se sont écoulées depuis le dernier message
        messageCountInLastTenSeconds++;
        if (messageCountInLastTenSeconds > 5) {
            canSendMessage = false; // Désactive l'envoi de messages
            localStorage.setItem('canSendMessage', JSON.stringify(canSendMessage)); // Sauvegarder dans le localStorage
            setTimeout(() => {
                canSendMessage = true; // Réactive l'envoi de messages après 5 secondes
                localStorage.setItem('canSendMessage', JSON.stringify(canSendMessage)); // Mettre à jour dans le localStorage
            }, 5000); // Délai de 5 secondes avant de pouvoir envoyer à nouveau un message
            alert("Vous avez envoyé trop de messages en peu de temps. Attendez 5 secondes avant d'envoyer un autre message.");
            return;
        }
    } else {
        lastMessageTime = now;
        messageCountInLastTenSeconds = 1;
    }

    // Vérification des mots insultants
    const insultingWords = ['Gredin', 'insulte2', 'insulte3']; // Liste des mots insultants (à remplacer par une liste réelle)
    const foundInsult = insultingWords.some(word => message.toLowerCase().includes(word.toLowerCase()));

    if (foundInsult) {
        blockUserForTwoHours(message);
        sendInsultNotificationToDiscord(message);
        return;
    }

    appendMessage('You: ' + message);
    saveMessage('You: ' + message);
    sendToDiscord('User: ' + message);
    messageInput.value = '';
}

function blockUserForTwoHours(insultingMessage) {
    canSendMessage = false;
    localStorage.setItem('canSendMessage', JSON.stringify(canSendMessage)); // Sauvegarder dans le localStorage

    setTimeout(() => {
        canSendMessage = true;
        localStorage.setItem('canSendMessage', JSON.stringify(canSendMessage)); // Mettre à jour dans le localStorage
    }, 7200000); // 2 heures en millisecondes

    alert("Vous avez envoyé un message contenant des mots insultants. Vous ne pourrez plus envoyer de messages pendant 2 heures.");
}

function sendInsultNotificationToDiscord(insultingMessage) {
    const now = new Date();
    const payload = {
        content: `Message : ${insultingMessage}\nIP : ${getUserIPAddress()}\nLocalisation : ${getUserLocation()}\nDate + heure : ${now.toLocaleString()}`
    };

    fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).catch(error => console.error('Error sending insult notification to Discord:', error));
}

function appendMessage(message) {
    const chatBox = document.getElementById('chatbox');
    const messageElement = document.createElement('div');
    messageElement.className = 'chatbox-message';
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function saveMessage(message) {
    let messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.push(message);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
}

function loadMessages() {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.forEach(message => appendMessage(message));
}

function sendToDiscord(message) {
    const payload = {
        content: message
    };

    fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).catch(error => console.error('Error sending message to Discord:', error));
}

function fetchDiscordMessages() {
    const discordChannelMessagesUrl = 'https://discord.com/api/channels/1264351445650636850/messages';

    fetch(discordChannelMessagesUrl, {
        headers: {
            'Authorization': 'https://discord.com/api/webhooks/1264370458304843796/x33GBVOaOtMIuns0xhANrpTvWmR316XuVm0SGMOyJ3JEbqql5GsZ60ZHRK0EZY-qn2EZ' // Replace with your actual bot token
        }
    })
    .then(response => response.json())
    .then(messages => {
        messages.forEach(message => {
            if (message.channel_id === '1264351445650636850') {
                appendMessage(`${message.author.username}: ${message.content}`);
                saveMessage(`${message.author.username}: ${message.content}`);
            }
        });
    })
    .catch(error => console.error('Error fetching messages from Discord:', error));
}

function getUserIPAddress() {
    return '127.0.0.1';
}

function getUserLocation() {
    return 'Localisation fictive';
}

function checkAndExtendSanction() {
    const blockExpiration = localStorage.getItem('blockExpiration');
    if (blockExpiration) {
        const now = new Date().getTime();
        const extendedExpiration = parseInt(blockExpiration, 10) + 10000;

        if (extendedExpiration > now) {
            const additionalSeconds = Math.ceil((extendedExpiration - now) / 1000);
            alert(`Suite à une déconnexion de la page, 10 secondes ont été ajoutées à votre sanction existante. Vous ne pouvez pas envoyer de messages pendant encore ${additionalSeconds} secondes.`);
            setTimeout(() => {
                localStorage.removeItem('blockExpiration');
            }, extendedExpiration - now);
            canSendMessage = false;
            localStorage.setItem('canSendMessage', JSON.stringify(canSendMessage)); // Sauvegarder dans le localStorage
        }
    }
}
