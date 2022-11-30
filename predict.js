import fetch from "node-fetch";

const ddayModel = [
    { stage: "egg"     , dday: 0      , t0: 15.142 },
    { stage: "instar_1", dday: 37.64  , t0: 14.000 },
    { stage: "instar_2", dday: 74.542 , t0: 13.577 },
    { stage: "instar_3", dday: 94.302 , t0: 14.000 },
    { stage: "instar_4", dday: 117.262, t0: 14.000 },
    { stage: "instar_5", dday: 141.757, t0: 14.000 },
    { stage: "instar_6", dday: 181.837, t0: 14.000 },
    { stage: "pupa"    , dday: 232.757, t0: 12.934 },
    { stage: "imago"   , dday: 346.812, t0: 14.000 },
];

function roundUpDate(date) {
    const result = new Date(date);
    if (result.getHours() + result.getMinutes() + result.getSeconds() + result.getMilliseconds() > 0) {
        result.setHours(24);
    }

    result.setHours(0, 0, 0, 0);
    return result;
}

function queryWeathers(begin, end, location, pool) {
    const pivot = `
        SELECT date FROM observations
        WHERE location_id = ?
        AND date <= ?
        ORDER BY date DESC
        LIMIT 1`;
        // AND DATEDIFF(?, date) BETWEEN 0 AND 30`;

    const query = `
        SELECT w.*, o.stage
        FROM weathers w LEFT JOIN observations o
        USING (date, location_id)
        WHERE
            location_id = ?
            AND date >= COALESCE((${pivot}), ?)
            AND date < ?`;

    begin = roundUpDate(begin * 1000);
    end = new Date(end * 1000);

    return pool.query(query, [location, location, begin, begin, end]);
}

function accumulate(data) {
    data.forEach((day, idx, arr) => {
        if (day.stage != null) {
            const dday = ddayModel.find(e => e.stage === day.stage).dday;
            day.dday = dday;
        } else if (arr[idx - 3]?.stage === "imago" && arr[idx - 2]?.stage === "imago" && arr[idx - 1]?.stage === "imago") {
            day.dday = 0;
            day.stage = "egg";
        } else if (arr[idx - 1]?.stage) {
            const prev = arr[idx - 1];
            const model = ddayModel.find(e => e.stage === prev.stage);
            const dday = prev.dday + Math.max(prev.temperature - model.t0, 0);
            const stage = ddayModel.slice().reverse().find(e => e.dday <= dday).stage;
            day.stage = stage;
            day.dday = dday;
        }
    });

    return data;
}

export default async function predict(begin, end, location, pool) {
    const data = await queryWeathers(begin, end, location, pool);

    const result = accumulate(data);

    const startIdx = result.findIndex(day => day.date >= new Date(begin * 1000));

    return result.slice(startIdx);
}

async function fetchForecast([lat, lon]) {
    const params = new URLSearchParams({
        appid: '245120d8d54155e620f8d22c9a739791',
        lat,
        lon,
    });

    const res = await fetch("https://pro.openweathermap.org/data/2.5/forecast/climate?" + params);
    if (!res.ok) throw Error("Failed to fetch week's weathers");
    return res.json();
}

export async function forecast(location, pool) {
    let yesterday = new Date();
    yesterday.setHours(-1);
    yesterday.setHours(0, 0, 0, 0);
    const history = await queryWeathers(Math.floor(yesterday / 1000), Math.floor(Date.now() / 1000), location.location_id, pool);
    let forecasts = await fetchForecast(location.coordinates);
    forecasts = forecasts.list.map(e => ({ date: new Date(e.dt * 1000), temperature: e.temp.day - 273.15}));

    const data = history.concat(forecasts);
    const result = accumulate(data);
    const startIdx = result.findIndex(day => day.date > yesterday);

    return result.slice(startIdx);
}