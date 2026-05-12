import type express from 'express';
import SQLite3 from 'better-sqlite3';
import multer from 'multer';
import { JWTHandler } from './jwt';
import { UserRouter } from './routes/user';
import { GuestRouter } from './routes/guests';


export class RouterHandler {
    private userRouter = new UserRouter();
    private guestRouter = new GuestRouter();

    public constructor(private app: express.Application, private jsonWebToken: JWTHandler) { }

    public assignRouters(db: SQLite3.Database) {
        this.app.get("/", this.handleBase);
        this.app.use("/user", this.userRouter.setRouter(db, this.jsonWebToken));
        this.app.use("/guest", this.guestRouter.setRouter(db, this.jsonWebToken));
        this.app.use(this.handleMulterErrors);
    }

    private handleBase(request: express.Request, response: express.Response) {
        return response.status(403).json({ error: "Forbidden" });
    }

    private handleMulterErrors(error: unknown, request: express.Request, response: express.Response, next: express.NextFunction) {
        if (error instanceof multer.MulterError) {
            switch (error.code) {
                case "MISSING_FIELD_NAME":
                    response.status(400).json({
                        error: "File field name is missing.",
                    });
                    break;
                case "LIMIT_FILE_SIZE":
                    response.status(400).json({ error: "File too large." });
                    break;
                case "LIMIT_UNEXPECTED_FILE":
                    response.status(400).json({ error: `Unexpected field: ${error.field}` });
                    break;
                default:
                    response.status(400).json({ error: error.message });
                    break;
            }
            return;
        }

        next(error);
    }
}
