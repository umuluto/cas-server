import fetchDailyTemps from "../fetchWeathers.js";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('weathers').del();
  await knex('locations').del();
  
  for await (const { coords, weathers } of fetchDailyTemps()) {
    console.log(coords);
    const [location_id] = await knex('locations')
      .insert({ coordinates: knex.raw(`point(${coords[0]}, ${coords[1]})`) }, ['location_id']);

    const data = weathers.map(day => ({ location_id, date: new Date(day.time * 1000), temperature: day.temp }));
    await knex('weathers').insert(data);
  }
};
