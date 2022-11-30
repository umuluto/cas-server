/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.createTable("observations", table => {
        table.date("date");
        table.integer("location_id").unsigned();
        table.enum("stage", [
            'egg',
            'larva_1',
            'larva_2',
            'larva_3',
            'larva_4',
            'larva_5',
            'larva_6',
            'pupa',
            'imago',
        ]);
        
        table.primary(["date", "location_id"]);
        table.foreign("location_id").references("locations.location_id");
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
    return knex.schema.dropTable("observations");
};
