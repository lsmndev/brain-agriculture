import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { createValidationPipe } from '../../src/common/config/validation-pipe.config.js';

import { clearDatabase } from '@tests/e2e/helpers/database.helper.js';

describe('Producers (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('E2E tests must run with NODE_ENV=test');
    }

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

  it('should create and retrieve a producer', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/producers')
      .send({
        name: 'John Doe',
        document: '529.982.247-25',
        documentType: 'CPF',
      })
      .expect(201);

    const producerId = createResponse.body.id;

    expect(producerId).toBeDefined();
    expect(createResponse.body.name).toBe('John Doe');
    expect(createResponse.body.document).toBe('52998224725');
    expect(createResponse.body.documentType).toBe('CPF');

    const findResponse = await request(app.getHttpServer())
      .get(`/producers/${producerId}`)
      .expect(200);

    expect(findResponse.body.id).toBe(producerId);
    expect(findResponse.body.name).toBe('John Doe');
    expect(findResponse.body.document).toBe('52998224725');
    expect(findResponse.body.documentType).toBe('CPF');
  });

  it('should reject an invalid document', async () => {
    await request(app.getHttpServer())
      .post('/producers')
      .send({
        name: 'John Doe',
        document: '12345678900',
        documentType: 'CPF',
      })
      .expect(400);
  });

  it('should reject a duplicated document', async () => {
    const payload = {
      name: 'John Doe',
      document: '52998224725',
      documentType: 'CPF',
    };

    await request(app.getHttpServer())
      .post('/producers')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/producers')
      .send({
        ...payload,
        name: 'Jane Doe',
      })
      .expect(409);
  });
});