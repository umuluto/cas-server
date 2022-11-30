/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('observations').del();
  const oneDay = 24 * 3600 * 1000;
  const date = Date.now() - 10 * oneDay;
  await knex('observations').insert([
    {location_id: 1, date: new Date(date), stage: 'larva_2' },
    {location_id: 2, date: new Date(date), stage: 'larva_2' },
    {location_id: 3, date: new Date(date), stage: 'larva_2' }
  ]);
};
