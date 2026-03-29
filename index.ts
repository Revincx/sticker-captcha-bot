import "source-map-support/register";

import npmlog from "npmlog";
import TelegramBotAPI from "node-telegram-bot-api";

import bot from "./bot";
import config from "./config";
import Group from "./group";
import redis from "./redis";

Error.stackTraceLimit = Infinity;

npmlog.stream = process.stdout;
npmlog.enableColor();

async function sleep(time: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time));
}

(async () => {
    await config.init();
    await sleep(config.get("init_after", 0));
    await redis.init();
    await bot.init();

    const api = bot.getAPI();

    api.on("message", (m: TelegramBotAPI.Message) => {
        const g = Group.get(m.chat.id);
        g.handleMessage(m).catch(() => undefined);
    });

    api.on("callback_query", (q: TelegramBotAPI.CallbackQuery) => {
        const chatId = q.message?.chat.id;
        if (chatId === undefined) {
            return;
        }
        const g = Group.get(chatId);
        g.handleCallbackQuery(q).catch(() => undefined);
    });

    api.on("polling_error", (e: Error) => {
        npmlog.warn("bot", "polling_error: %s", e.message);
    });
})();
