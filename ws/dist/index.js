"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const User_1 = require("./User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const wss = new ws_1.WebSocketServer({ port: 8080 });
function verifyToken(token) {
    try {
        let decoded = jsonwebtoken_1.default.verify(token, config_1.JWT_PASSWORD);
        return Object.assign({ verified: true, message: "success" }, decoded);
    }
    catch (err) {
        console.error('Invalid token:', err.message);
        return { verified: false, message: err.message, id: "", username: "" };
    }
}
wss.on('connection', function connection(ws, req) {
    var _a;
    const cookieArr = ((_a = req.headers.cookie) === null || _a === void 0 ? void 0 : _a.split('; ')) || [];
    let token;
    for (const item of cookieArr) {
        if (item.startsWith('accessToken=')) {
            token = item.split('=')[1];
            break;
        }
    }
    const decoded = verifyToken(token || "");
    if (decoded.verified === false) {
        ws.send(JSON.stringify({ type: 'error', payload: decoded.message }));
        ws.close();
        return;
    }
    const user = new User_1.User(ws, decoded.id, decoded.username);
    ws.on('error', console.error);
    ws.on('close', () => {
        user === null || user === void 0 ? void 0 : user.destroy();
    });
});
