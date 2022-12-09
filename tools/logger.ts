import * as process from "process";
import * as fs from "fs";
import * as path from "path";
// import { ServerPlayer } from "bdsx/bds/player";
// import { bedrockServer } from "bdsx/launcher";
// import { TextPacket } from "bdsx/bds/packets";


let Colors: { [key: string]: string } = {
    "§0": "\x1b[38;2;000;000;000m", // BLACK
    "§1": "\x1b[38;2;000;000;170m", // DARK_BLUE
    "§2": "\x1b[38;2;000;170;000m", // DARK_GREEN
    "§3": "\x1b[38;2;000;170;170m", // DARK_AQUA
    "§4": "\x1b[38;2;170;000;000m", // DARK_RED
    "§5": "\x1b[38;2;170;000;170m", // DARK_PURPLE
    "§6": "\x1b[38;2;255;170;000m", // GOLD
    "§7": "\x1b[38;2;170;170;170m", // GRAY
    "§8": "\x1b[38;2;085;085;085m", // DARK_GRAY
    "§9": "\x1b[38;2;085;085;255m", // BLUE
    "§a": "\x1b[38;2;085;255;085m", // GREEN
    "§b": "\x1b[38;2;085;255;255m", // AQUA
    "§c": "\x1b[38;2;255;085;085m", // RED
    "§d": "\x1b[38;2;255;085;255m", // LIGHT_PURPLE
    "§e": "\x1b[38;2;255;255;085m", // YELLOW
    "§f": "\x1b[38;2;255;255;255m", // WHITE
    "§g": "\x1b[38;2;221;214;005m", // MINECOIN_GOLD
    "§l": "\x1b[1m", // BOLD
    "§o": "\x1b[3m", // ITALIC
    "§k": "",        // OBFUSCATED
    "§r": "\x1b[0m", // RESET
    "§": "",         //ESCAPE
};


function getColor(...args: string[]): string {
    return "\u001b[" + args.join(";") + "m";
}

function AutoReplace(OriText: string, ...args: string[]): string {
    while (args.length != 0) {
        let thisArg: string | undefined = args.shift();
        if (thisArg != undefined) {
            OriText = OriText.replace("{}", thisArg);
        }
    }
    return OriText;
}


function DateToString(date: Date): string {
    let toFull = (val: number): string => {
        if (val > 9) {
            return val.toString();
        } else {
            return `0${val.toString()}`;
        }
    };
    return AutoReplace("{}-{}-{} {}:{}:{}",
        date.getFullYear().toString(), toFull(date.getMonth() + 1), toFull(date.getDate()),
        toFull(date.getHours()), toFull(date.getMinutes()), toFull(date.getSeconds())
    );
}

function mkdirSync(dirname: string) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
        } else {
            fs.mkdirSync(path.dirname(dirname));
        }
        return true;
    }
}

export enum LoggerLevel {
    Slient, Fatal, Error, Warn, Info, Debug
}


export class Logger {
    #Title: string; #isSyncOutput: boolean;
    #Config: { "Console": { "level": LoggerLevel, "Enable": Boolean }, "File": { "level": LoggerLevel, "path": string }, "Player": { "level": LoggerLevel, "xuid": string } | null | undefined };
    #UsePlayer: boolean = true; #LogOp: (type: LoggerLevel, text: string) => void;
    constructor(title: string = "", level: number = 4, isSyncOutput: boolean = true) {
        this.#Title = "";
        this.setTitle(title);
        this.#isSyncOutput = isSyncOutput;
        this.#Config = { "Console": { "Enable": true, "level": level }, "File": { "path": "", "level": level }, "Player": null };
        if (this.#UsePlayer) {
            this.#Config.Player = { "level": level, "xuid": "" };
        }
        this.#Config.Console = { "level": level, "Enable": true };
        this.#Config.File = { "level": level, "path": "" };
        this.#LogOp = (type: LoggerLevel, text: string) => {
            var NowDateStr = DateToString(new Date());
            var color: string = "38;2;255;255;255";
            var plColor: string = "";
            var typeStr: string = "";
            switch (type) {
                case LoggerLevel.Slient: typeStr = "Slient"; return;//不可能
                case LoggerLevel.Fatal: typeStr = "FATAL"; color = "38;2;255;0;0"; plColor = "§4"; break;
                case LoggerLevel.Error: typeStr = "ERROR"; color = "38;2;239;46;46"; plColor = "§c"; break;
                case LoggerLevel.Warn: typeStr = "WARN"; color = "38;2;255;255;0"; plColor = "§e"; break;
                case LoggerLevel.Info: typeStr = "INFO"; color = "38;2;255;255;255"; plColor = "§f"; break;
                case LoggerLevel.Debug: typeStr = "DEBUG"; color = "1;38;2;0;255;255"; plColor = "§o"; break;
            }
            var NoColorLogStr: string = AutoReplace("[{} {}] {} {}",
                NowDateStr, typeStr,
                (this.#Title == "" ? "" : AutoReplace("[{}]", this.#Title)),
                text
            );
            var ColorLogStr: string = AutoReplace("{}{} {}{} {}{} {}{}",
                getColor("38", "2", "173", "216", "230"),//TimeColor
                NowDateStr.split(" ")[1],//Time
                getColor((type == LoggerLevel.Info ? "38;2;0;170;170" : color)),//TypeColor
                typeStr,//Type
                getColor(color),//Msg Color
                (this.#Title != "" ? `[${this.#Title}]` : ""),//Title
                text,//Msg
                getColor("0")//Clear
            );
            var OutputConsoleFunc: () => void = () => {
                if (type <= this.#Config.Console.level) {
                    let consoleLog = ColorLogStr;
                    let keys = Object.keys(Colors), l = keys.length, i = 0;
                    while (i < l) {
                        let nowKey = keys[i];
                        let nowVal = Colors[nowKey];
                        while (consoleLog.indexOf(nowKey) != -1) {
                            consoleLog = consoleLog.replace(nowKey, nowVal);
                        }
                        i++;
                    }
                    console.log(consoleLog);
                }
            };
            if (this.#isSyncOutput) {
                OutputConsoleFunc();
            } else {
                process.nextTick(OutputConsoleFunc);
            }
            if (this.#Config.File.path != "" && type <= this.#Config.File.level) {
                mkdirSync(path.dirname(this.#Config.File.path));
                fs.appendFileSync(this.#Config.File.path, NoColorLogStr + "\n");
            }
            if (this.#UsePlayer) {
                // if (this.#Config.Player != null) {
                //     if (this.#Config.Player.xuid != "" && type <= this.#Config.Player.level) {


                //         let sp = bedrockServer.level.getPlayerByXuid(this.#Config.Player.xuid);
                //         if (sp != null) {
                //             let pkt = TextPacket.allocate();
                //             pkt.type = TextPacket.Types.Raw;
                //             pkt.message = plColor + NoColorLogStr;
                //             sp.sendPacket(pkt);
                //             pkt.destruct();
                //         } else { this.#Config.Player.xuid = ""; }
                //     }
                // }
            }
        };
    };
    setTitle(title: string = ""): boolean {
        this.#Title = title;
        return true;
    };
    setLogLevel(level: number | LoggerLevel = 4): boolean {
        if (this.#UsePlayer) {
            if (this.#Config.Player != null) {
                this.#Config.Player.level = level;
            }
        }
        this.#Config.Console.level = level;
        this.#Config.File.level = level;
        return true;
    };
    setConsole(enable: boolean, level: number | LoggerLevel = 4): boolean {
        this.#Config.Console.Enable = enable;
        this.#Config.Console.level = level;
        return true;
    };
    setFile(path: string, level: number | LoggerLevel = 4): boolean {
        this.#Config.File.path = path;
        this.#Config.File.level = level;
        return true;
    };
    // setPlayer(pl: ServerPlayer, level: number = 4): boolean {
    //     if (pl == null) {
    //         return false;
    //     }
    //     if (this.#Config.Player == null) { return false; }
    //     this.#Config.Player.xuid = pl.getXuid();
    //     this.#Config.Player.level = level;
    //     return true;
    // };
    log(...args: any[]): boolean {
        this.#LogOp(LoggerLevel.Info, args.join(""));
        return true;
    };
    info(...args: any[]): boolean {
        this.#LogOp(LoggerLevel.Info, args.join(""));
        return true;
    };
    debug(...args: any[]): boolean {
        this.#LogOp(LoggerLevel.Debug, args.join(""));
        return true;
    };
    warn(...args: any[]): boolean {
        this.#LogOp(LoggerLevel.Warn, args.join(""));
        return true;
    };
    error(...args: any[]): boolean {
        this.#LogOp(LoggerLevel.Error, args.join(""));
        return true;
    };
    fatal(...args: any[]): boolean {
        this.#LogOp(LoggerLevel.Fatal, args.join(""));
        return true;
    };
}