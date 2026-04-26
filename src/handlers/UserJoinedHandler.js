import { parseUser } from "../utils/helpers.js";
import { User } from "../core/User.js";

export default {
    name: "u", // Packet name

    async execute(bot, packet) {
        const userId = parseUser(packet.u);
        if (userId >= 1900000000) return;

        // Felhasználó hozzáadása a bot memóriájához
        const user = new User(packet);
        bot.state.addUser(userId, user);

        // --- HELYI "OKOS" TROLL VÉDELEM (API ÉS LISTA NÉLKÜL) ---
        if (bot.state.settings.impersonationDetect && !user.isMod() && !user.isOwner() && !user.isMain()) {
            const newNick = user.getNick().toLowerCase();
            
            // 1. Megtisztítjuk a nevet: csak betűk és számok maradnak
            let cleanNewNick = newNick.replace(/[^a-z0-9]/g, '');
            
            // 2. Trükkös karakterek ("Leet speak") visszaalakítása normál betűkre
            cleanNewNick = cleanNewNick
                .replace(/4/g, 'a')
                .replace(/3/g, 'e')
                .replace(/1/g, 'i')
                .replace(/0/g, 'o')
                .replace(/5/g, 's')
                .replace(/7/g, 't');

            // 3. Helyi trágár/troll szótár (Ezt bármikor bővítheted!)
            const trollWords = [
                "meghalt", "halott", "hulye", "hulyee", "buzi", "szar", "geci", 
                "kocsog", "csicska", "kurva", "anyad", "kutyaja", "nyomor", "luzer", 
                "nyomi", "kutya", "szop", "csicskaja", "fogyatek"
            ];

            let isTroll = false;

            // 4. Végignézzük az ÖSSZES embert, aki jelenleg bent van a chaten
            for (const [existingId, existingUser] of bot.state.users.entries()) {
                if (existingId === userId) continue; // Önmagát nem vizsgálja

                // Lekérjük a bent lévő ember regisztrált nevét és a kijelzőnevét is
                const regName = existingUser.getRegname() ? existingUser.getRegname().toLowerCase() : "";
                const existingNick = existingUser.getNick().toLowerCase().replace(/[^a-z0-9]/g, '');

                // Hogy elkerüljük a véletlen egyezéseket, csak 3 vagy több karakteres neveket védünk
                const namesToCheck = [];
                if (regName.length >= 3) namesToCheck.push(regName);
                if (existingNick.length >= 3) namesToCheck.push(existingNick);

                for (const name of namesToCheck) {
                    // HA az új belépő nevében benne van egy bent lévő ember neve...
                    if (cleanNewNick.includes(name)) {
                        
                        // Akkor megnézzük, hogy van-e benne valami sértő/troll szó a helyi szótárunkból
                        for (const word of trollWords) {
                            if (cleanNewNick.includes(word)) {
                                isTroll = true;
                                break;
                            }
                        }

                        // Megnézzük a bot alap káromkodás szűrőjét is (badwords.json)
                        if (!isTroll && bot.state.badwords && bot.state.badwords.length > 0) {
                            for (const badword of bot.state.badwords) {
                                if (badword && cleanNewNick.includes(badword.replace(/[^a-z0-9]/g, ''))) {
                                    isTroll = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (isTroll) break;
                }
                if (isTroll) break;
            }

            if (isTroll) {
                // Ha a Helyi Algoritmus felismerte a gúnyolódást, azonnal kirúgja
                await bot.kick(userId, `Helyi védelem: Gúnyolódás / Jelenlévő felhasználó nevének sértő használata tilos!`);
                return; // Kilépünk a funkcióból, a bot nem küld üdvözlő üzenetet a trollnak
            }
        }
        // ------------------------------------------------------------------

        // Üdvözlő üzenet küldése (ha a belépő normális névvel jött)
        if (bot.state.settings.welcome_msg && bot.state.settings.welcome_msg != "off" && !user.hasBeenHere()) {
            const welcomeMessage = bot.state.settings.welcome_msg
                .replace("{chatname}", bot.state.chatInfo.name)
                .replace("{chatid}", bot.state.chatInfo.id)
                .replace("{user}", user.getRegname() || "Unregistered")
                .replace("{name}", user.getNick())
                .replace("{uid}", userId);

            await bot.reply(welcomeMessage, userId, bot.state.settings.welcome_type);
        }
    },
};
