import "source-map-support/register";

import npmlog from "npmlog";

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

    let lastUpdateID = -1;
    while (true) {
        try {
            const updates = await bot.getAPI().getUpdates({
                allowed_updates: ["message", "callback_query"],
                offset: lastUpdateID + 1,
                timeout: 50,
            });

            for (const upd of updates) {
                lastUpdateID = upd.update_id;
                if (upd.message !== undefined) {
                    const m = upd.message;
                    const g = Group.get(m.chat.id);
                    g.handleMessage(m).catch(() => undefined);
                }
                if (upd.callback_query?.message?.chat.id !== undefined) {
                    const q = upd.callback_query;
                    const qm = q.message as NonNullable<typeof q.message>;
                    const g = Group.get(qm.chat.id);
                    g.handleCallbackQuery(q).catch(() => undefined);
                }
            }
        } catch {}
    }
})();
