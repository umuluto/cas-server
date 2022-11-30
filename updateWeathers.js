import { fetchUpdate } from "./fetchWeathers.js";

export async function update(conn) {
    const locations = await conn.query(`
        SELECT *
        FROM locations
        JOIN(
            SELECT w.date, w.location_id
            FROM weathers w
            LEFT JOIN weathers ww ON
                w.location_id = ww.location_id AND w.date < ww.date
            WHERE ww.date IS NULL
        ) t USING(location_id);`);

    for (const location of locations) {
        const newData = await fetchUpdate(location.coordinates.coordinates, Math.floor(new Date(location.date) / 1000) + 86400);
        for (const day of newData) {
            await conn.query(`INSERT INTO weathers(location_id, temperature, date) VALUES(?, ?, ?)`, [location.location_id, day.temp, new Date(day.time * 1000)]);
        }
    }
}