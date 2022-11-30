import { CronJob } from 'cron';
import { update } from "./updateWeathers.js"
import { createConnection } from "mariadb";

async function run() {
    const conn = createConnection({
        user: "root",
        database: "fall_army_worm",
    });

    await update(conn);
    await conn.end();
}

const job = new CronJob(
	'* 5 * * *',
	run,
);

job.start();