import fetch from 'node-fetch';

const coordsList = [
    [19.811698421143973, 105.77732140383071], // TH
    [21.077719603809555, 105.74855734044448], // HN
    [20.829412316389842, 106.56691695069273], // HP
];

const oneDay = 86400;
const oneWeek = 7 * oneDay;
const oneYear = 365 * oneDay;

async function fetchWeekWeathers([lat, lon], start) {
    const WEEK_HOURS = 168;
    const params = new URLSearchParams({
        type: 'hour',
        appid: '245120d8d54155e620f8d22c9a739791',
        cnt: WEEK_HOURS,
        lat,
        lon,
        start,
    });

    console.log("Fetching weathers, start:", start);
    const res = await fetch("https://history.openweathermap.org/data/2.5/history/city?" + params);
    if (!res.ok) throw Error("Failed to fetch week's weathers");
    return res.json();
}

function avgTemp(hours) {
    const time = hours[0].dt;
    let sum = 0;
    for (const hour of hours) {
        sum += hour.main.temp;
    }
    return { time, temp: sum / hours.length - 273.15 };
}

function roundUpDate(date) {
    const result = new Date(date);
    if (result.getHours() + result.getMinutes() + result.getSeconds() + result.getMilliseconds() > 0) {
        result.setHours(24);
    }

    result.setHours(0, 0, 0, 0);
    return result;
}

function* range(begin, end, step) {
    while (begin < end) {
        yield { begin, end: begin + step };
        begin += step;
    }
}

function* splitArray(array, chunkSize) {
    const ranges = range(0, array.length, chunkSize);
    for (const { begin, end } of ranges) {
        yield array.slice(begin, end);
    }
}

async function* fetchWeathers(coords) {
    const now = Math.floor(Date.now() / 1000);
    const start = roundUpDate(Date.now() - (oneYear - oneDay) * 1000) / 1000;
    const weeksIter = range(start, now, oneWeek);
    for (const week of weeksIter) {
        const res = await fetchWeekWeathers(coords, week.begin);
        yield res;
    }
}

export default async function* fetchDailyTemps() {
    for (const coords of coordsList) {
        const weeksIter = fetchWeathers(coords);
        const out = { coords, weathers: [] };
        for await (const week of weeksIter) {
            for (const day of splitArray(week.list, 24)) {
                if (day.length < 24) break;
                out.weathers.push(avgTemp(day));
            }
        }
        yield out;
    }
}

async function fetchWeathersRange([lat, lon], start, end) {
    const params = new URLSearchParams({
        type: 'hour',
        appid: '245120d8d54155e620f8d22c9a739791',
        lat,
        lon,
        start,
        end,
    });

    console.log("Fetching weathers, start:", start);
    const res = await fetch("https://history.openweathermap.org/data/2.5/history/city?" + params);
    if (!res.ok) throw Error("Failed to fetch week's weathers");
    return res.json();
}

export async function fetchUpdate(coords, start) {
    const data = await fetchWeathersRange(coords, start, Math.floor(Date.now() / 1000));
    const out = [];
    for (const day of splitArray(data.list, 24)) {
        if (day.length < 24) break;
        out.push(avgTemp(day));
    }

    return out;
}
