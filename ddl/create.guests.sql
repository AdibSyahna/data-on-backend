CREATE TABLE IF NOT EXISTS "guests" (
    "id"             INTEGER NOT NULL UNIQUE,
    "user_id"        INTEGER NOT NULL,
    "first_name"     VARCHAR(50) NOT NULL,
    "last_name"	     VARCHAR(50) NOT NULL,
    "phone_number"   VARCHAR(15) NOT NULL,
    "id_card_no"     VARCHAR(50) NOT NULL,
    "id_card_image"  VARCHAR(50),
    "visit_purpose"  VARCHAR(255),
    "check_in"       INTEGER NOT NULL,
    "check_out"      INTEGER,
    "created_at"     INTEGER NOT NULL,
    "updated_at"     INTEGER,
    "deleted_at"     INTEGER,
    PRIMARY KEY("id" AUTOINCREMENT)
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);