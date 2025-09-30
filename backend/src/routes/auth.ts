import {Strategy as GoogleStrategy} from'passport-google-oauth20';
import session from 'express-session';
import { Router } from 'express';
import passport from 'passport';
import { prismaClient } from '../db';
import jwt from 'jsonwebtoken';
import { JWT_REFRESH_KEY, JWT_SECRET_KEY } from '../config';

export const authRouter = Router();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: '/auth/google/callback',
}, async(accessToken: any, refreshToken: any, profile: any, done: any) => {
    try {
        const user = await prismaClient.user.upsert({
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
        
        const jwtAccessToken = jwt.sign({
            id: user.id
        }, JWT_SECRET_KEY, { expiresIn: '10m' });

        const jwtRefreshToken = jwt.sign({
            id: user.id,
            refreshToken: refreshToken
        }, JWT_REFRESH_KEY, { expiresIn: '1d' });

        return done(null, {
            jwtToken: jwtAccessToken,
            refreshToken: jwtRefreshToken,
            userId: user.id
        });
    } catch (error) {
        console.log("Error while updating user: ", error);
        return done(error, null);
    }
}));

passport.serializeUser((user: any, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

authRouter.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,   // 24 hours
        httpOnly: true,
        secure: true,                 // Set to true in production (with HTTPS)
        sameSite: 'none'               // Allow cross-site cookies
    }
}));

authRouter.use(passport.initialize());
authRouter.use(passport.session());

authRouter.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
}));

authRouter.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req: any, res) => {
    const user: {jwtToken: string, refreshToken: string, userId: string} = req.user;
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
    }).redirect(`${process.env.FRONTEND_URL as string}/temp?userId=${user.userId}`);
});