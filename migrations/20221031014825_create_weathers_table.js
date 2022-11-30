/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("weathers", table => {
    table.date("date");
    table.integer("location_id").unsigned();
    table.float("temperature");
    
    table.primary(["date", "location_id"]);
    table.foreign("location_id").references("locations.location_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("weathers");
};
