require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { Player } = require('./game/GameLogic');
const db = require('./db/neon');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));

const players = new Map();
const waitingQueue = [];
const matches = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_game', (name) => {
        const player = new Player(socket.id, name || 'Anonymous');
        players.set(socket.id, player);
        socket.emit('player_data', player);
        console.log(`${player.name} joined.`);
    });

    socket.on('find_match', () => {
        if (!waitingQueue.includes(socket.id)) {
            waitingQueue.push(socket.id);
            console.log(`${socket.id} is waiting for a match.`);
        }

        if (waitingQueue.length >= 2) {
            const p1Id = waitingQueue.shift();
            const p2Id = waitingQueue.shift();
            const matchId = `match_${p1Id}_${p2Id}`;

            matches.set(matchId, {
                p1: p1Id,
                p2: p2Id,
                turn: p1Id,
                stage: 1
            });

            io.to(p1Id).emit('match_found', { matchId, opponent: players.get(p2Id).name, role: 'p1' });
            io.to(p2Id).emit('match_found', { matchId, opponent: players.get(p1Id).name, role: 'p2' });
            
            players.get(p1Id).resetAP();
            players.get(p2Id).resetAP();
            
            io.to(p1Id).emit('update_combat', { ap: players.get(p1Id).ap });
            io.to(p2Id).emit('update_combat', { ap: players.get(p2Id).ap });

            console.log(`Match started: ${matchId}`);
        }
    });

    socket.on('roll_shop', () => {
        const player = players.get(socket.id);
        if (player && player.gold >= 2) {
            player.gold -= 2;
            const shop = player.rollShop();
            socket.emit('shop_data', { shop, gold: player.gold });
        }
    });

    socket.on('buy_card', (card) => {
        const player = players.get(socket.id);
        if (player && player.buyCard(card)) {
            socket.emit('update_player', player);
        }
    });

    socket.on('buy_exp', () => {
        const player = players.get(socket.id);
        if (player && player.buyExp()) {
            socket.emit('update_player', player);
        }
    });

    socket.on('use_card', ({ matchId, cardIndex }) => {
        const player = players.get(socket.id);
        const match = matches.get(matchId);
        
        if (player && match && player.ap > 0) {
            const card = player.useCard(cardIndex);
            if (card) {
                const opponentId = match.p1 === socket.id ? match.p2 : match.p1;
                const opponent = players.get(opponentId);

                // Simple combat logic
                if (card.damage) opponent.hp -= card.damage;
                if (card.heal) player.hp += card.heal;
                if (card.shield) player.shield = (player.shield || 0) + card.shield;

                io.to(socket.id).emit('update_player', player);
                io.to(opponentId).emit('update_opponent', { hp: opponent.hp });
                io.to(matchId).emit('combat_log', `${player.name} used ${card.name}!`);

                if (opponent.hp <= 0) {
                    io.to(matchId).emit('game_over', { winner: player.name });
                    db.savePlayer(player).catch(console.error);
                    db.savePlayer(opponent).catch(console.error);
                    matches.delete(matchId);
                }
            }
        }
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        const player = players.get(socket.id);
        if (player) {
            await db.savePlayer(player).catch(console.error);
            players.delete(socket.id);
        }
        const index = waitingQueue.indexOf(socket.id);
        if (index > -1) waitingQueue.splice(index, 1);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
