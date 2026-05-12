export { };

declare global {
    type JWTPayload = { id: string };

    type Pagination = { limit?: number, offset?: number };

    type StandardResponse = {
        message: string,
        data: unknown
    };

    interface User {
        id?: number,
        email?: string,
        first_name?: string,
        last_name?: string,
        created_at: number,
        updated_at?: number,
        deleted_at?: number,
    }

    interface Guest {
        id: number,
        user_id: number,
        first_name: string,
        last_name: string,
        phone_number: string,
        id_card_no: string,
        id_card_image?: string,
        visit_purpose?: string,
        check_in: number,
        check_out?: number,
        created_at: number,
        updated_at?: number,
        deleted_at?: number,
    }

}