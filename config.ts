import "source-map-support/register";

import fs from "fs/promises";

import npmlog from "npmlog";

let config: any = {};

async function init(): Promise<void> {
    if(process.env.token) {
        return npmlog.info("config", "load from env, skip file read")
    }
    if (process.argv.length < 3) {
        npmlog.error("sticker-captcha-bot", `Usage: %j <config>`, process.argv[1]);
        process.exit(1);
    }
    const filename = process.argv[2];
    try {
        const file = await fs.readFile(filename, "utf-8");
        config = JSON.parse(file);
    } catch (e: any) {
        npmlog.info("config", "load(%j): err %s", filename, e.message);
        process.exit(1);
    }
    npmlog.level = get("log_level", "silly");
    npmlog.info("config", "load(%j): ok", filename);
}

function get<T>(key: string, fallback?: T): T {
    if (process.env[key] !== undefined) {
        return process.env[key] as T;
    }
    return config[key] !== undefined ? config[key] : fallback;
}

export = {
    init,
    get,
};
