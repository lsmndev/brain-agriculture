import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { createValidationPipe } from '../../src/common/config/validation-pipe.config.js';

import { clearDatabase } from '@tests/e2e/helpers/database.helper.js';
import { createFarm, createProducer } from './factories/e2e.factory.js';

describe('Crop Seasons (e2e)', () => {
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

  it('should create a crop season', async () => {
    const producer = await createProducer(app);
    const farm = await createFarm(app, producer.id);

    const response = await request(app.getHttpServer())
      .post('/crop-seasons')
      .send({
        farmId: farm.id,
        name: '2026 Harvest',
        year: 2026,
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.farmId).toBe(farm.id);
    expect(response.body.name).toBe('2026 Harvest');
    expect(response.body.year).toBe(2026);
  });

  it('should reject a duplicated crop season for the same farm and year', async () => {
    const producer = await createProducer(app);
    const farm = await createFarm(app, producer.id);

    const payload = {
      farmId: farm.id,
      name: '2026 Harvest',
      year: 2026,
    };

    await request(app.getHttpServer()).post('/crop-seasons').send(payload).expect(201);

    await request(app.getHttpServer())
      .post('/crop-seasons')
      .send({
        ...payload,
        name: 'Another Harvest',
      })
      .expect(409);
  });
});