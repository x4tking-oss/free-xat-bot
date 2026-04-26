import { parseUser } from "../utils/helpers.js";
import { User } from "../core/User.js";

export default {
    name: "u", // Packet name

    /**
     * Someone joined chat
     * @param {object} bot - Bot instance
     * @param {object} packet - Packet data
     */
    async execute(bot, packet) {
        const userId = parseUser(packet.u);
        if (userId >= 1900000000) return;

        // Add user to cache
        const user = new User(packet);
        bot.state.addUser(userId, user);

        // --- NÉVLOPÁS / TROLL VÉDELEM ---
        if (bot.state.settings.impersonationDetect && !user.isMod() && !user.isOwner() && !user.isMain()) {
            const nick = user.getNick().toLowerCase();
            
            const protectedList = (bot.state.settings.protectedNames || '')
                .split(',')
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);

            for (const pName of protectedList) {
                if (nick.includes(pName)) {
                    await bot.kick(userId, `Névmásolás / Trollkodás nem engedélyezett!`);
                    return; // Megszakítjuk a folyamatot, nem köszönti a bot
                }
            }
        }
        // ------------------------------------

        // Fetch necessary values
        if (bot.state.settings.welcome_msg && bot.state.settings.welcome_msg != "off" && !user.hasBeenHere()) {
            const welcomeMessage = bot.state.settings.welcome_msg
                .replace("{chatname}", bot.state.chatInfo.name)
                .replace("{chatid}", bot.state.chatInfo.id)
                .replace("{user}", user.getRegname() || "Unregistered")
                .replace("{name}", user.getNick())
                .replace("{uid}", userId);

            // Send message via PM/PC
            await bot.reply(welcomeMessage, userId, bot.state.settings.welcome_type);
        }
    },
};
