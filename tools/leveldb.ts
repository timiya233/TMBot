// import { Level } from "level";
import { FileClass } from "./file";
import { Logger } from "./logger";
// import { sleep } from "deasync";
import { GlobalEvent } from "../modules/Global";

let allLevelDB = new Set<LevelDB>();

let levelDBLogger = new Logger("LevelDB");

let Level = (() => {//支持LLSE
    if (typeof (ll) == "undefined") {
        return require("level").Level;
    }
})();

export class LevelDB {
    private level: KVDatabase | undefined;
    private level1: {
        "put": (k: string, v: string) => Promise<void>,
        "get": (l: string) => Promise<string | undefined>,
        "iterator": () => {
            "nextv": (count: number) => Promise<string[]>
        },
        "close": () => Promise<void>

    } | undefined;
    constructor(private location: string) {
        location = FileClass.getStandardPath(location)!;
        if (!location) { throw new Error("获取标准路径失败!"); }
        if (typeof (KVDatabase) != "undefined") {
            this.level = new KVDatabase(location);
            return;
        }
        this.level1 = new Level(location, { "createIfMissing": true });
    }
    get path() { return this.location; }
    async get<T>(key: string) {
        if (!!this.level) { return this.level.get(key) as T | undefined; }
        let res = await this.level1!.get(key);
        return (!res ? res : JSON.parse(res)) as T | undefined;
    }
    set(key: string, data: any) {
        if (!!this.level) { return new Promise<void>((r) => { this.level!.set(key, data); r(); }); }
        return this.level1!.put(key, JSON.stringify(data));
    }
    /**
     * @param count 一次next步进多少条数据
     * @note 没有数据了下一次步进将返回空数组
     */
    getKeyIterator(count: number) {
        if (!!this.level) {
            let keys = this.level.listKey();
            let i = 0;
            let res = async () => {
                let r = keys.slice(i, (i + count));
                i += count;
                return r;
            };
            return res;
        }
        let iter = this.level1!.iterator();
        let res = async () => {
            let now = await iter.nextv(count);
            let keys: string[] = [];
            let l = now.length, i = 0;
            while (i < l) {
                keys.push(now[i][0]);
                i++;
            }
            return keys;
        };
        return res;
    }
    async close() {
        allLevelDB.delete(this);
        if (!!this.level) { return this.level.close(); }
        await this.level1!.close();
        return true;
    }
}


GlobalEvent.onTMBotStop.on((f) => {
    f((async () => {
        let iter = allLevelDB.values();
        let now = iter.next();
        let list: Promise<any>[] = [];
        while (!now.done) {
            let db = now.value;
            list.push(db.close());
            now = iter.next();
        }
        await Promise.all(list);
        levelDBLogger.info(`数据库全部关闭完成!`);
    })());
});