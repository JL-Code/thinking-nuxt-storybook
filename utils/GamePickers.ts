import { dayjs } from 'element-plus';
/**
 * 打印日志
 * @param args 日志内容
 */
function log(...args: any[]) {
    const fixedPrefix = [`🎉%cGamePicker%c`,
        "color: black; border-radius: 3px 0 0 3px; padding: 2px 2px 1px 10px; background: #00DC82",
        "border-radius: 0 3px 3px 0; padding: 2px 10px 1px 2px; background: #00DC8220"];
    console.info(...[...fixedPrefix, ...args], dayjs().format("YYYY-MM-DD HH:mm:ss.SSS"));
}

export default {
    log
}