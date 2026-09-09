import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from './../src/app.module';
import { createHttpTestApp } from './helpers/create-http-test-app';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createHttpTestApp({
      imports: [AppModule],
    });
  });

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200);

    expect(response.text).toBe('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
