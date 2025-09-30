"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_1 = require("./routes/user");
const workspace_1 = require("./routes/workspace");
const channel_1 = require("./routes/channel");
const auth_1 = require("./routes/auth");
const message_1 = require("./routes/message");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    credentials: true,
    origin: 'http://localhost:5173'
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({ status: "Healthy" });
});
app.use('/api/user', user_1.userRouter);
app.use('/api/workspace', workspace_1.workspaceRouter);
app.use('/api/channel', channel_1.channelRouter);
app.use('/api/message', message_1.messageRouter);
app.use('/auth', auth_1.authRouter);
app.listen(config_1.PORT, () => console.log(`Server is listening on PORT ${config_1.PORT}`));
