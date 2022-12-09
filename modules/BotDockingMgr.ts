import { OneBotDocking } from "./OneBotDocking";
import { WebsocketClient } from "./WebSocket";
// import { sleep } from "deasync";


let allOneBotDockingInstance = new Map<string, OneBotDocking>();

export class BotDockingMgr {
    static _NewBot(name: string, conn: string, reConnectCount: number, reConnectTime: number) {
        return new Promise<boolean>((resF) => {
            reConnectCount = parseInt(reConnectCount + "");
            reConnectTime = parseInt(reConnectTime + "");
            let wsc = new WebsocketClient(conn);
            let d = new OneBotDocking(name, wsc);
            let logger = d.logger;
            let reConnectC = 0;
            let isFirst = true;
            let lock = true;
            let res = false;
            wsc.events.onClose.on(function reConnect(_code, _desc) {
                if (reConnectCount != 0) {
                    let time = (reConnectTime > 0 ? reConnectTime : 0);
                    logger.warn(`WS连接断开!根据配置文件所述,将在${time}秒后重连!(${(reConnectC + 1)}/${reConnectCount})`);
                    let timeout = (time * 1000) || 1;
                    console.log(timeout)
                    setTimeout(() => {
                        wsc.client.connect(conn);
                        let clear = () => {
                            wsc.events.onStart.un(s);
                            wsc.events.onError.un(e);
                        }
                        let s = wsc.events.onStart.on(() => {
                            logger.info(`重连成功!`);
                            clear();
                        });
                        let e = wsc.events.onError.on(() => {
                            clear();
                            if (reConnectC == reConnectCount) {
                                return logger.warn(`重连次数已耗尽!自动关闭...`);
                            }
                            if (reConnectCount > 0) {
                                reConnectC += 1;
                            }
                            reConnect(0, "");
                        });
                    }, timeout);
                } else {
                    logger.warn(`WS连接断开!根据配置文件所述,将不再重连!`);
                    allOneBotDockingInstance.delete(name);
                }
            });
            wsc.events.onStart.on(() => { isFirst = false; lock = false; res = true; });
            wsc.events.onError.on(() => {
                if (isFirst) {
                    logger.info(`首次连接失败!将放弃重连!`);
                    allOneBotDockingInstance.delete(name);
                    lock = false;
                }
            });
            allOneBotDockingInstance.set(name, d);
            let sid = setInterval(() => {
                if (!lock) { clearInterval(sid); resF(res); }
            });
        });
    }
    static getBot(name: string) {
        return allOneBotDockingInstance.get(name);
    }
}