import { Router, Request, Response } from "express";
import validator from 'validator';
import md5 from 'md5';
import { BaseRouterHandler } from "./base";

export class UserRouter extends BaseRouterHandler {
    private readonly PROFILE_DIR: string = process.env.PROFILE_DIR || "profiles";
    private readonly STATIC_PATH: string = `${process.env.EXPRESS_STATIC_PATH || "/public"}/${this.PROFILE_DIR}`;
    private readonly DEFAULT_PROFILE_IMAGE: string = process.env.PROFILE_DEFAULT_IMAGE || "default.png";

    public constructor() {
        super();
        this.router.post('/registration', this.registration.bind(this));
        this.router.post('/login', this.login.bind(this));

        const ProfileRouter = Router();
        ProfileRouter.use(this.authenticationHandler.bind(this));
        ProfileRouter.get("/", this.profile.bind(this));

        this.router.use("/profile", ProfileRouter);
    }

    private profile(request: Request, response: Response): void {
        if (!this.ensureDeps(response)) return;

        const Reply: StandardResponse = { message: "", data: null };
        const UID: number = parseInt(response.locals.user.id);

        const User = this.getUser(UID, request);
        if (!User) {
            this.internalError(response);
            console.warn(`User with UID: "${UID}" not found.`);
            return;
        }

        Reply.message = "Sukses.";
        Reply.data = User;
        response.json(Reply);
    }

    private login(request: Request, response: Response): void {
        if (!this.ensureDeps(response)) return;

        const Reply: StandardResponse = { message: "", data: null };
        const Fail = this.getFail(Reply, response);

        const Body = request.body;
        if (!Body) {
            return Fail("Parameter tidak ditemukan.", 411);
        }

        const Email: string = Body["email"];
        const Password: string = Body["password"];

        if (!Email || !Password) {
            return Fail("Parameter tidak lengkap.", 411);
        }

        if (!validator.isEmail(Email)) {
            return Fail("Parameter email tidak sesuai format.");
        }

        if (Password.length < 8) {
            return Fail("Parameter password minimal 8 karakter.");
        }

        const SQLLogin = /*sql*/`
                SELECT
                    "id"
                FROM
                    "users"
                WHERE
                    "email" = ?
                AND
                    "password" = ?
                LIMIT 1
        `;

        const User = <JWTPayload>this.db!.prepare(SQLLogin).get(Email, Password);
        console.log(Email, Password);
        
        if (!User || !User.id) {
            return Fail(`Username atau password salah.`, 401);
        }

        const Token = this.jsonWebToken!.getAccessToken(String(User.id));
        Reply.data = { token: Token };
        Reply.message = "Login Sukses.";
        response.json(Reply);
    }

    private registration(request: Request, response: Response): void {
        if (!this.ensureDeps(response)) return;

        const Reply: StandardResponse = { message: "", data: null };
        const Fail = this.getFail(Reply, response);

        const Body = request.body;
        if (!Body) {
            return Fail("Parameter tidak ditemukan.", 411);
        }

        const Email: string = Body["email"];
        const FirstName: string = Body["first_name"];
        const LastName: string = Body["last_name"];
        const Password: string = Body["password"];

        if (!Email || !FirstName || !LastName || !Password) {
            return Fail("Parameter tidak lengkap.", 411);
        }

        if (!validator.isEmail(Email)) {
            return Fail("Parameter email tidak sesuai format.");
        }

        if (Password.length < 8) {
            return Fail("Parameter password minimal 8 karakter.");
        }

        if (FirstName.length > 50 || LastName.length > 50) {
            return Fail("Parameter first_name dan last_name tidak boleh lebih dari 50 karakter.");
        }

        const SQLCheckEmail = /*sql*/`SELECT "id" FROM "users" WHERE "email" = ?`;
        const ExistingEmail = <{ id: number }>this.db!.prepare(SQLCheckEmail).get(Email);
        if (ExistingEmail && ExistingEmail.id) {
            return Fail(`Email "${Email}" sudah terdaftar.`);
        }

        const RegisterTime = Date.now();
        const SQLRegisterUser = /*sql*/`
            INSERT INTO "users" ("email", "first_name", "last_name", "password", "created_at")
            VALUES (?, ?, ?, ?, ?)
        `;

        this.db!.exec("BEGIN");
        try {
            this.db!.prepare(SQLRegisterUser).run(Email, FirstName, LastName, md5(Password), RegisterTime);
            this.db!.exec("COMMIT");
            Reply.message = "Registrasi berhasil silahkan login";
            response.json(Reply);
        } catch (err: unknown) {
            this.db!.exec("ROLLBACK");
            console.error(err);
            this.internalError(response);
            return;
        }
    }

    private getUser(uid: number, request: Request): User | null {
        if (!this.ensureDeps()) throw new Error(`Tried to get user, but dependencies are not injected.`);

        const SQLProfile = /*sql*/`
                SELECT
                    "email",
                    "first_name",
                    "last_name",
                    "profile_image"
                FROM
                    "users"
                WHERE
                    "id" = ?
        `;

        const User = <User>this.db!.prepare(SQLProfile).get(uid);
        if (!User) return null;
        return User;
    }

}