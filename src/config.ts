import express from 'express';
import path from 'path';
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import type { JWTHandler } from './jwt';

export class Config {
    private readonly UPLOAD_PATH: string = path.resolve("./", process.env.UPLOAD_DIR || "uploads");
    private readonly STATIC_PATH: string = process.env.EXPRESS_STATIC_PATH || "/public";
    private readonly apiLimiter: RateLimitRequestHandler = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60000)),
        max: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(100))
    });

    public constructor(private app: express.Application, private jsonWebToken: JWTHandler) { }

    public apply(): void {
        /** JSON Body parser */
        this.app.use(express.json());

        /** Rate limiter */
        this.app.use(this.apiLimiter);

        /** CORS */
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

            // Handle the 'preflight' request
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }

            return next();
        });

        /** Authorization */
        this.app.use(this.handleAuthorization.bind(this));

        /** Request logger */
        this.app.use(this.requestLogger.bind(this));

        /** Static path */
        this.app.use(this.STATIC_PATH, express.static(this.UPLOAD_PATH));

        /** Trust proxy for cloud deployment */
        if (process.env.EXPRESS_TRUST_PROXY === "true") this.app.set("trust proxy", 1);
    }

    private handleAuthorization: express.Handler = (request, response, next) => {
        const accessToken = request.headers.authorization;

        if (!accessToken) return next();
        const Token = accessToken.replaceAll("Bearer", "").trim();
        const Payload: JWTPayload | null = this.jsonWebToken.verifyToken(Token);
        if (Payload === null) return next();

        response.locals.user = Payload;
        next();
    }

    private requestLogger: express.Handler = (req, res, next) => {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.url;
        const ip = req.ip;

        console.log(`[${timestamp}] ${method} ${url} - Request from: ${ip}`);

        next();
    };
}