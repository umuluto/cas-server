import { createPool } from "mariadb";

export default createPool({
    user: "root",
    database: "fall_army_worm",
    trace: true,
    // dateStrings: true,
})