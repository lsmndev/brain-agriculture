import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { createValidationPipe } from '../../src/common/config/validation-pipe.config.js';

import { createCrop, createCropSeason, createFarm, createProducer } from './factories/e2e.factory.js';
import { clearDatabase } from './helpers/database.helper.js';

describe('Plantings (e2e)', () => {
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

  it('should create a planting', async () => {
    const producer = await createProducer(app);
    const farm = await createFarm(app, producer.id);
    const cropSeason = await createCropSeason(app, farm.id);
    const crop = await createCrop(app);

    const response = await request(app.getHttpServer())
      .post('/plantings')
      .send({
        cropSeasonId: cropSeason.id,
        cropId: crop.id,
        plantedAreaHa: '500.0000',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.cropSeasonId).toBe(cropSeason.id);
    expect(response.body.cropId).toBe(crop.id);
    expect(response.body.plantedAreaHa).toBe('500.0000');
  });

  it('should reject the same crop twice in the same crop season', async () => {
    const producer = await createProducer(app);
    const farm = await createFarm(app, producer.id);
    const cropSeason = await createCropSeason(app, farm.id);
    const crop = await createCrop(app);

    const payload = {
      cropSeasonId: cropSeason.id,
      cropId: crop.id,
      plantedAreaHa: '250.0000',
    };

    await request(app.getHttpServer()).post('/plantings').send(payload).expect(201);
    await request(app.getHttpServer()).post('/plantings').send(payload).expect(409);
  });

  it('should reject when total planted area exceeds the farm arable area', async () => {
    const producer = await createProducer(app);
    const farm = await createFarm(app, producer.id);
    const cropSeason = await createCropSeason(app, farm.id);
    const soybean = await createCrop(app, 'Soybean');
    const corn = await createCrop(app, 'Corn');

    await request(app.getHttpServer())
      .post('/plantings')
      .send({
        cropSeasonId: cropSeason.id,
        cropId: soybean.id,
        plantedAreaHa: '500.0000',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/plantings')
      .send({
        cropSeasonId: cropSeason.id,
        cropId: corn.id,
        plantedAreaHa: '300.0000',
      })
      .expect(400);
  });
});