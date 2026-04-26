import { config } from 'dotenv';
import { sequelize } from './core/Database.js';
import { Bot } from './core/Bot.js';
import http from 'http'; // <-- Ezt a sort hozzáadtuk

config();

// <-- Ezt a blokkot hozzáadtuk a webszerverhez -->
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('A xat bot sikeresen fut a Renderen!\n');
}).listen(port, () => {
    console.log(`Webszerver elindult a ${port}-es porton.`);
});
// <----------------------------------------------->

(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
    new Bot();
})();
