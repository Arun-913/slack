import { WebSocketServer} from 'ws';
import { User } from './User';
import jwt from 'jsonwebtoken';
import { JWT_PASSWORD } from './config';

const wss = new WebSocketServer({ port: 8080 });

function verifyToken(token: string){
    try {
        let decoded = jwt.verify(token, JWT_PASSWORD) as { id: string, username: string };
        return { verified: true, message: "success", ...decoded };
    } catch (err: any) {
        console.error('Invalid token:', err.message);
        return { verified: false, message: err.message, id: "", username: "" };
    }
}

wss.on('connection', function connection(ws, req){
    const cookieArr = req.headers.cookie?.split('; ') || [];
    let token;
    for(const item of cookieArr) {
        if(item.startsWith('accessToken=')){
            token = item.split('=')[1];
            break;
        }
    }

    const decoded = verifyToken(token || "");
    if(decoded.verified === false) {
        ws.send(JSON.stringify({ type: 'error', payload: decoded.message }));
        ws.close();
        return;
    }
    
    const user = new User(ws, decoded.id, decoded.username);
    ws.on('error', console.error);

    ws.on('close', () => {
        user?.destroy();
    })
})