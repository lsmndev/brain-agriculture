import { DataSource } from 'typeorm';

export async function clearDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    TRUNCATE TABLE
      plantings,
      crop_seasons,
      crops,
      farms,
      producers
    RESTART IDENTITY CASCADE
  `);
}