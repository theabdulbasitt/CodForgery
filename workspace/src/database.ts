import db from "./db";

// VULNERABLE: string concatenation with user input
export async function getUser(req: any) {
    const username = req.query.username;

    const query = "SELECT * FROM users WHERE username = '" + username + "'";

    return db.query(query);
}

// VULNERABLE: template literal with user input
export async function searchUsers(req: any) {
    const search = req.query.search;

    const query = "SELECT * FROM users WHERE name LIKE ?";

    return db.query(query);
}

// SAFE: parameterized query
export async function getUserSafe(req: any) {
    const username = req.query.username;

    return db.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
    );
}

// SAFE: hardcoded query
export async function getAdmin() {
    return db.query("SELECT * FROM users WHERE role = 'admin'");
}