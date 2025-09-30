"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const express_session_1 = __importDefault(require("express-session"));
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
exports.authRouter = (0, express_1.Router)();
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield db_1.prismaClient.user.upsert({
            where: {
                email: profile.emails[0].value
            },
            update: {
                username: profile.name.givenName + " " + profile.name.familyName,
                provider: "Google",
                refreshToken: refreshToken
            },
            create: {
                email: profile.emails[0].value,
                username: profile.name.givenName + " " + profile.name.familyName,
                provider: "Google",
                refreshToken: refreshToken
            }
        });
        const jwtAccessToken = jsonwebtoken_1.default.sign({
            id: user.id
        }, config_1.JWT_SECRET_KEY, { expiresIn: '10m' });
        const jwtRefreshToken = jsonwebtoken_1.default.sign({
            id: user.id,
            refreshToken: refreshToken
        }, config_1.JWT_REFRESH_KEY, { expiresIn: '1d' });
        return done(null, {
            jwtToken: jwtAccessToken,
            refreshToken: jwtRefreshToken,
            userId: user.id
        });
    }
    catch (error) {
        console.log("Error while updating user: ", error);
        return done(error, null);
    }
})));
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
exports.authRouter.use((0, express_session_1.default)({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: true, // Set to true in production (with HTTPS)
        sameSite: 'none' // Allow cross-site cookies
    }
}));
exports.authRouter.use(passport_1.default.initialize());
exports.authRouter.use(passport_1.default.session());
exports.authRouter.get('/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
}));
exports.authRouter.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    const user = req.user;
    let now = new Date();
    res.status(200).cookie('accessToken', user.jwtToken, {
        sameSite: 'strict',
        path: '/',
        httpOnly: true,
        secure: true,
        expires: new Date(now.getTime() + (1000 * 60 * 10))
    }).cookie('refreshToken', user.refreshToken, {
        sameSite: 'strict',
        path: '/',
        httpOnly: true,
        secure: true,
        expires: new Date(now.getTime() + (1000 * 60 * 60 * 24))
    }).redirect(`${process.env.FRONTEND_URL}/temp?userId=${user.userId}`);
});
