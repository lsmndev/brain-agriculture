import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function createProducer(app: INestApplication) {
  const response = await request(app.getHttpServer())
    .post('/producers')
    .send({
      name: 'John Doe',
      document: '52998224725',
      documentType: 'CPF',
    })
    .expect(201);

  return response.body;
}

export async function createFarm(app: INestApplication, producerId: string) {
  const response = await request(app.getHttpServer())
    .post('/farms')
    .send({
      producerId,
      name: 'Green Valley Farm',
      city: 'São Paulo',
      state: 'SP',
      totalArea: '1000.0000',
      arableArea: '750.0000',
      vegetationArea: '250.0000',
    })
    .expect(201);

  return response.body;
}

export async function createCrop(app: INestApplication, name = 'Soybean') {
  const response = await request(app.getHttpServer())
    .post('/crops')
    .send({
      name,
    })
    .expect(201);

  return response.body;
}

export async function createCropSeason(
  app: INestApplication,
  farmId: string,
  year = 2026,
  name = '2026 Harvest',
) {
  const response = await request(app.getHttpServer())
    .post('/crop-seasons')
    .send({
      farmId,
      name,
      year,
    })
    .expect(201);

  return response.body;
}

export async function createPlanting(
  app: INestApplication,
  cropSeasonId: string,
  cropId: string,
  plantedAreaHa = '100.0000',
) {
  const response = await request(app.getHttpServer())
    .post('/plantings')
    .send({
      cropSeasonId,
      cropId,
      plantedAreaHa,
    })
    .expect(201);

  return response.body;
}