import { Router, Request, Response } from "express";
import { BaseRouterHandler } from "./base";

export class GuestRouter extends BaseRouterHandler {
    private readonly CARD_ID_DIR: string = process.env.CARD_ID_DIR || "card_id";
    private readonly STATIC_PATH: string = `${process.env.EXPRESS_STATIC_PATH || "/public"}/${this.CARD_ID_DIR}`;

    public constructor() {
        super();

        const Auth = this.authenticationHandler.bind(this);
        this.router.post("/registration", Auth, this.registration.bind(this));
        this.router.get("/all", Auth, this.getAll.bind(this));
        this.router.post("/checkout", Auth, this.checkOut.bind(this));
    }

    private checkOut(request: Request, response: Response): void {
        if (!this.ensureDeps(response)) return;

        const Body = request.body;
        const UID: number = parseInt(response.locals.user.id);
        const Reply: StandardResponse = { message: "", data: null };
        const Fail = this.getFail(Reply, response);

        if (!Body) {
            return Fail("Parameter tidak ditemukan.", 411);
        }

        const GuestID: string = Body["id"];
        if (!GuestID) {
            return Fail("Parameter tidak lengkap.", 411);
        }

        const CheckOutTime = Date.now();
        const SQLCheckOut = /*sql*/`
            UPDATE
                "guests"
            SET
                "check_out" = ?,
                "updated_at" = ?
            WHERE
                "id" = ? AND
                "deleted_at" IS NULL
        `;


        this.db!.exec("BEGIN");
        try {
            this.db!.prepare(SQLCheckOut).run(CheckOutTime, CheckOutTime, GuestID);
            this.db!.exec("COMMIT");
            Reply.message = "Tamu berhasil di-check out.";
            response.json(Reply);
        } catch (err: unknown) {
            this.db!.exec("ROLLBACK");
            console.error(err);
            this.internalError(response);
            return;
        }

    }

    private getAll(request: Request, response: Response): void {
        if (!this.ensureDeps(response)) return;

        const SQLSelect = /*sql*/`
            SELECT
                *
            FROM
                "guests"
            WHERE
                "deleted_at" IS NULL
            ;
        `;

        const Guest = <Guest[]>this.db!.prepare(SQLSelect).all();
        response.json(Guest);
    }

    private registration(request: Request, response: Response): void {
        if (!this.ensureDeps(response)) return;

        const UID: number = parseInt(response.locals.user.id);
        const Reply: StandardResponse = { message: "", data: null };
        const Fail = this.getFail(Reply, response);

        const Body = request.body;
        if (!Body) {
            return Fail("Parameter tidak ditemukan.", 411);
        }

        const FirstName: string = Body["first_name"];
        const LastName: string = Body["last_name"];
        const PhoneNumber: string = Body["phone_number"];
        const IDCardNumber: string = Body["id_card_no"];
        const CheckInTime: string = Body["check_in"];
        const VisitPurpose: string = Body["visit_purpose"];

        if (!FirstName || !LastName || !PhoneNumber || !IDCardNumber || !CheckInTime) {
            return Fail("Parameter tidak lengkap.", 411);
        }

        if (FirstName.length > 50 || LastName.length > 50) {
            return Fail("Parameter first_name dan last_name tidak boleh lebih dari 50 karakter.");
        }

        const RegisterTime = Date.now();
        const SQLRegisterGuest = /*sql*/`
            INSERT INTO "guests" ("user_id", "first_name", "last_name", "phone_number", "id_card_no", "visit_purpose", "check_in", "created_at")
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db!.exec("BEGIN");
        try {
            this.db!.prepare(SQLRegisterGuest).run(UID, FirstName, LastName, PhoneNumber, IDCardNumber, VisitPurpose, CheckInTime, RegisterTime);
            this.db!.exec("COMMIT");
            Reply.message = "Tamu berhasil didaftarkan.";
            response.json(Reply);
        } catch (err: unknown) {
            this.db!.exec("ROLLBACK");
            console.error(err);
            this.internalError(response);
            return;
        }
    }

    private getGuest(id: number, request: Request): User | null {
        if (!this.ensureDeps()) throw new Error(`Tried to get user, but dependencies are not injected.`);

        const SQLProfile = /*sql*/`
                SELECT
                    "email",
                    "first_name",
                    "last_name"
                FROM
                    "users"
                WHERE
                    "id" = ?
        `;

        const Guest = <Guest>this.db!.prepare(SQLProfile).get(id);
        if (!Guest) return null;
        return Guest;
    }

}