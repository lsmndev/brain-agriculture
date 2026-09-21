import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { createValidationPipe } from '../../src/common/config/validation-pipe.config.js';

import { clearDatabase } from '@tests/e2e/helpers/database.helper.js';
import { createProducer } from './factories/e2e.factory.js';

describe('Farms (e2e)', () => {
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

  it('should create a farm', async () => {
    const producer = await createProducer(app);

    const response = await request(app.getHttpServer())
      .post('/farms')
      .send({
        producerId: producer.id,
        name: 'Green Valley Farm',
        city: 'São Paulo',
        state: 'SP',
        totalArea: '1000.5000',
        arableArea: '750.2500',
        vegetationArea: '250.2500',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.producerId).toBe(producer.id);
    expect(response.body.name).toBe('Green Valley Farm');
    expect(response.body.state).toBe('SP');
    expect(response.body.totalArea).toBe('1000.5000');
  });

  it('should reject a farm for a nonexistent producer', async () => {
    await request(app.getHttpServer())
      .post('/farms')
      .send({
        producerId: '11111111-1111-4111-8111-111111111111',
        name: 'Green Valley Farm',
        city: 'São Paulo',
        state: 'SP',
        totalArea: '1000.0000',
        arableArea: '750.0000',
        vegetationArea: '250.0000',
      })
      .expect(404);
  });

  it('should reject when arable and vegetation areas exceed total area', async () => {
    const producer = await createProducer(app);

    await request(app.getHttpServer())
      .post('/farms')
      .send({
        producerId: producer.id,
        name: 'Invalid Farm',
        city: 'São Paulo',
        state: 'SP',
        totalArea: '100.0000',
        arableArea: '80.0000',
        vegetationArea: '30.0000',
      })
      .expect(400);
  });
});