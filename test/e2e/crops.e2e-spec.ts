import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { createValidationPipe } from '../../src/common/config/validation-pipe.config.js';

import { clearDatabase } from '@tests/e2e/helpers/database.helper.js';

describe('Crops (e2e)', () => {
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

  it('should create a crop', async () => {
    const response = await request(app.getHttpServer())
      .post('/crops')
      .send({
        name: 'Soybean',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('Soybean');
  });

  it('should reject a duplicated crop name case-insensitively', async () => {
    await request(app.getHttpServer())
      .post('/crops')
      .send({
        name: 'Soybean',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/crops')
      .send({
        name: 'soybean',
      })
      .expect(409);
  });
});