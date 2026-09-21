import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { createValidationPipe } from '../../src/common/config/validation-pipe.config.js';

import {
  createCrop,
  createCropSeason,
  createFarm,
  createPlanting,
  createProducer,
} from './factories/e2e.factory.js';
import { clearDatabase } from './helpers/database.helper.js';

describe('Dashboards (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createValidationPipe());

    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return farm totals and land use', async () => {
    const producer = await createProducer(app);
    await createFarm(app, producer.id);

    const totals = await request(app.getHttpServer())
      .get('/dashboards/totals')
      .expect(200);

    const landUse = await request(app.getHttpServer())
      .get('/dashboards/land-use')
      .expect(200);

    expect(totals.body).toEqual({
      totalFarms: 1,
      totalHectares: '1000.0000',
    });
    expect(landUse.body).toEqual({
      arableAreaHa: '750.0000',
      vegetationAreaHa: '250.0000',
    });
  });

  it('should group farms by state and plantings by crop', async () => {
    const producer = await createProducer(app);
    const farm = await createFarm(app, producer.id);
    const cropSeason = await createCropSeason(app, farm.id);
    const soybean = await createCrop(app, 'Soybean');
    const corn = await createCrop(app, 'Corn');

    await createPlanting(app, cropSeason.id, soybean.id, '400.0000');
    await createPlanting(app, cropSeason.id, corn.id, '250.0000');

    const farmsByState = await request(app.getHttpServer())
      .get('/dashboards/by-state')
      .expect(200);

    const plantingsByCrop = await request(app.getHttpServer())
      .get('/dashboards/by-crop')
      .expect(200);

    expect(farmsByState.body).toEqual([
      {
        state: 'SP',
        total: 1,
      },
    ]);

    expect(plantingsByCrop.body).toEqual([
      {
        cropId: corn.id,
        cropName: 'Corn',
        totalPlantings: 1,
        plantedAreaHa: '250.0000',
      },
      {
        cropId: soybean.id,
        cropName: 'Soybean',
        totalPlantings: 1,
        plantedAreaHa: '400.0000',
      },
    ]);
  });
});