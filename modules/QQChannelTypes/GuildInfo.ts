import { GuildSystem } from "../OneBotDocking";
import { Msg_Info } from "../QQDataTypes/MsgInfo";
import { ChannelInfo } from "./ChannelInfo";

export class GuildInfo {
    private ChannelMap = new Map<string, ChannelInfo>();
    constructor(private obj: {
        "guild_id": string,
        "guild_name": string,
        "guild_display_id": number
    }) { }
    async _init(_this: GuildSystem) {
        let log = _this.OneBotDocking.logger;
        log.info(`初始化频道 ${this.obj.guild_name} 子频道信息...`);
        let cls = await _this.getGuildChannelListEx(this.obj.guild_id, true);
        if (!cls) { log.error(`获取频道 ${this.obj.guild_name} 子频道信息失败!`); return false; }
        let l = cls.length, i = 0;
        while (i < l) {
            let cl = cls[i];
            this.ChannelMap.set(cl.channel_id, cl);
            i++;
        }
        return true;
    }
    _updateChannelInfo(type: "update" | "del" | "add", channelInfo: ChannelInfo) {
        switch (type) {
            case "add":
            case "update": {
                this.ChannelMap.set(channelInfo.channel_id, channelInfo);
                break;
            }
            case "del": {
                this.ChannelMap.delete(channelInfo.channel_id);
                break;
            }
        }
    }
    /** 频道ID */
    get guild_id() { return this.obj.guild_id; }
    /** 频道名称 */
    get guild_name() { return this.obj.guild_name; }
    /** 频道显示ID */
    get guild_display_id() { return this.obj.guild_display_id; }
    /** 获取子频道信息 */
    getChannel(channel_id: string) { return this.ChannelMap.get(channel_id); }
    /**
     * ```
     * 方便函数,快捷发送消息
     * @returns 消息ID
     * ```
     */
    async sendMsg(_this: GuildSystem, channel_id: string, msg: Msg_Info[] | string) {
        return await _this.sendGuildChannelMsg(this.obj.guild_id, channel_id, msg);
    }
}