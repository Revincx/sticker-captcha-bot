import "source-map-support/register";

import npmlog from "npmlog";
import { Redis } from "ioredis";

import config from "./config";

function log(level: npmlog.LogLevels, msg: string, ...args: any[]): void {
    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] == "string" && args[i].length > 50) {
            args[i] = "(...)";
        }
        if (args[i] instanceof Error) {
            args[i] = args[i].message;
        }
    }
    npmlog[level]("redis", msg, ...args);
}

let client: Redis;

async function init(): Promise<void> {
    client = new Redis(config.get("REDIS_URL"));
    if (!await ping()) {
        process.exit(1);
    }
}

async function ping(): Promise<boolean> {
    let r;
    try {
        r = await client.ping();
    } catch (e) {
        log("error", "ping(): err %s", e);
        return false;
    }
    log("silly", "ping(): ok");
    return true;
}

async function get(k: string): Promise<string | undefined> {
    let r: string | null;
    try {
        r = await client.get(k);
    } catch (e) {
        log("silly", "get(%s): err %s", k, e);
        return undefined;
    }
    const v = r === null ? undefined : r;
    log("silly", "get(%s): ok %j", k, v);
    return v;
}

async function getRandomSticker(): Promise<string | undefined> {
    const welcome_sticker_key = "welcome_stickers"
    const exist_sticker = await exists(welcome_sticker_key);

    if(!exist_sticker) { return undefined }

    let file_id: string | undefined;

    try {
        file_id = await client.srandmember(welcome_sticker_key) || undefined;
    }
    catch (e) {
        log("silly", "getRandomSticker(): err %s", e);
        return undefined;
    }
    return file_id;
}

async function set(k: string, v: string, ttl?: number): Promise<void> {
    try {
        if (ttl === undefined) {
            client.set(k, v);
        } else {
            client.set(k, v, "EX", ttl);
        }
    } catch (e) {
        log("silly", "set(%s, %j, ttl=%j): err %s", k, v, ttl, e);
        return;
    }
    log("silly", "set(%s, %j, ttl=%j): ok", k, v, ttl);
}

async function del(k: string): Promise<void> {
    let r;
    try {
        r = await client.del(k);
    } catch (e) {
        log("silly", "del(%s): err %s", k, e);
        return;
    }
    log("silly", "del(%s): ok %j", k, r > 0);
}

async function exists(k: string): Promise<boolean> {
    let r;
    try {
        r = await client.exists(k);
    } catch (e) {
        log("silly", "exists(%s): err %s", k, e);
        return false;
    }
    const v = r > 0;
    log("silly", "exists(%s): ok %j", k, v);
    return v;
}

export = {
    init,
    ping,
    get,
    set,
    getRandomSticker,
    del,
    exists,
};
