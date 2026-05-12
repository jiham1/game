const CARD_POOL = {
    1: [
        { id: 1, name: "Firebolt", tier: 1, cost: 1, damage: 10, effect: "deals 10 damage" },
        { id: 2, name: "Ice Shield", tier: 1, cost: 1, shield: 15, effect: "gives 15 shield" },
        { id: 3, name: "Zap", tier: 1, cost: 1, damage: 5, mana: 5, effect: "deals 5 damage and restores 5 mana" }
    ],
    2: [
        { id: 4, name: "Fireball", tier: 2, cost: 2, damage: 25, effect: "deals 25 damage" },
        { id: 5, name: "Great Wall", tier: 2, cost: 2, shield: 40, effect: "gives 40 shield" },
        { id: 6, name: "Heal Pulse", tier: 2, cost: 2, heal: 20, effect: "heals 20 HP" }
    ],
    3: [
        { id: 7, name: "Meteor", tier: 3, cost: 3, damage: 60, effect: "deals 60 damage" },
        { id: 8, name: "Divine Protection", tier: 3, cost: 3, shield: 100, effect: "gives 100 shield" }
    ]
};

const PROBABILITIES = {
    1: { T1: 1.0, T2: 0.0, T3: 0.0 },
    2: { T1: 0.8, T2: 0.2, T3: 0.0 },
    3: { T1: 0.6, T2: 0.3, T3: 0.1 },
    4: { T1: 0.4, T2: 0.4, T3: 0.2 },
    5: { T1: 0.2, T2: 0.5, T3: 0.3 }
};

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hp = 100;
        this.gold = 10;
        this.level = 1;
        this.exp = 0;
        this.inventory = []; // Max 10 cards
        this.maxInventory = 10;
        this.ap = 1; // Action Points for combat
    }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.level * 4 && this.level < 5) {
            this.exp -= this.level * 4;
            this.level++;
        }
    }

    buyExp() {
        if (this.gold >= 4) {
            this.gold -= 4;
            this.addExp(4);
            return true;
        }
        return false;
    }

    rollShop() {
        const prob = PROBABILITIES[this.level];
        const shop = [];
        for (let i = 0; i < 5; i++) {
            const rand = Math.random();
            let tier = 1;
            if (rand > prob.T1 + prob.T2) tier = 3;
            else if (rand > prob.T1) tier = 2;
            
            const pool = CARD_POOL[tier];
            const card = pool[Math.floor(Math.random() * pool.length)];
            shop.push({ ...card, shopId: i });
        }
        return shop;
    }

    buyCard(card) {
        if (this.gold >= card.cost && this.inventory.length < this.maxInventory) {
            this.gold -= card.cost;
            this.inventory.push(card);
            return true;
        }
        return false;
    }

    useCard(cardIndex) {
        if (this.ap > 0 && cardIndex >= 0 && cardIndex < this.inventory.length) {
            const card = this.inventory.splice(cardIndex, 1)[0];
            this.ap--;
            return card;
        }
        return null;
    }

    resetAP() {
        this.ap = this.level;
    }
}

module.exports = { Player, CARD_POOL };
