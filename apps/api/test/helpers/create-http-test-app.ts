import type { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';

export async function createHttpTestApp(
  moduleMetadata: ModuleMetadata,
): Promise<INestApplication> {
  const module = await Test.createTestingModule(moduleMetadata).compile();
  const app = module.createNestApplication();

  await app.init();

  return app;
}
