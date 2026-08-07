const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("benchReportDesktop", Object.freeze({ edition: "pro", platform: process.platform }));
