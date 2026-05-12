const socket = io();

let myMatchId = null;
let myRole = null;
let myInventory = [];

// DOM Elements
const hpEl = document.getElementById('player-hp');
const goldEl = document.getElementById('player-gold');
const lvEl = document.getElementById('player-lv');
const apEl = document.getElementById('player-ap');
const nameEl = document.getElementById('player-name');
const shopCardsEl = document.getElementById('shop-cards');
const inventoryCardsEl = document.getElementById('inventory-cards');
const combatArea = document.getElementById('combat-area');
const combatLog = document.getElementById('combat-log');
const opponentNameEl = document.getElementById('opponent-name');
const opponentHpEl = document.getElementById('opponent-hp');

// Init
const playerName = prompt("Enter your name:", "Player") || "Player";
socket.emit('join_game', playerName);

// Buttons
document.getElementById('roll-btn').onclick = () => socket.emit('roll_shop');
document.getElementById('exp-btn').onclick = () => socket.emit('buy_exp');
document.getElementById('find-match-btn').onclick = (e) => {
    socket.emit('find_match');
    e.target.innerText = "Searching...";
    e.target.disabled = true;
};

// Socket Events
socket.on('player_data', (data) => {
    updateUI(data);
    nameEl.innerText = data.name;
});

socket.on('update_player', (data) => {
    updateUI(data);
    renderInventory(data.inventory);
});

socket.on('shop_data', ({ shop, gold }) => {
    goldEl.innerText = gold;
    renderShop(shop);
});

socket.on('match_found', ({ matchId, opponent, role }) => {
    myMatchId = matchId;
    myRole = role;
    opponentNameEl.innerText = opponent;
    combatArea.classList.remove('hidden');
    combatLog.innerHTML = `<p>Match started against ${opponent}!</p>`;
});

socket.on('update_combat', ({ ap }) => {
    apEl.innerText = ap;
});

socket.on('update_opponent', ({ hp }) => {
    opponentHpEl.innerText = hp;
});

socket.on('combat_log', (msg) => {
    const p = document.createElement('p');
    p.innerText = msg;
    combatLog.appendChild(p);
    combatLog.scrollTop = combatLog.scrollHeight;
});

socket.on('game_over', ({ winner }) => {
    alert(`Game Over! Winner: ${winner}`);
    location.reload();
});

// Helper Functions
function updateUI(data) {
    hpEl.innerText = data.hp;
    goldEl.innerText = data.gold;
    lvEl.innerText = data.level;
    apEl.innerText = data.ap;
}

function renderShop(shop) {
    shopCardsEl.innerHTML = '';
    shop.forEach(card => {
        const div = document.createElement('div');
        div.className = `card tier-${card.tier}`;
        div.innerHTML = `
            <h3>${card.name}</h3>
            <p>Cost: ${card.cost}G</p>
            <p>${card.effect}</p>
        `;
        div.onclick = () => socket.emit('buy_card', card);
        shopCardsEl.appendChild(div);
    });
}

function renderInventory(inventory) {
    myInventory = inventory;
    inventoryCardsEl.innerHTML = '';
    inventory.forEach((card, index) => {
        const div = document.createElement('div');
        div.className = `card tier-${card.tier}`;
        div.innerHTML = `
            <h3>${card.name}</h3>
            <p>${card.effect}</p>
        `;
        div.onclick = () => {
            if (myMatchId) {
                socket.emit('use_card', { matchId: myMatchId, cardIndex: index });
            } else {
                alert("Find a match to use cards!");
            }
        };
        inventoryCardsEl.appendChild(div);
    });
}
