export interface DatabaseSchemaReset {
  execute(statement: string): Promise<void>;
}

export async function resetV2Database(database: DatabaseSchemaReset) {
  await database.execute("drop schema if exists drizzle cascade");
  await database.execute("drop schema public cascade");
  await database.execute("create schema public");
}
