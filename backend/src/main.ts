import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log('🚀 Expense Tracker API running on http://localhost:3000');
  console.log('📊 Frontend available at http://localhost:3000');
  console.log('🗄️  Connected to PostgreSQL database');
}
bootstrap();
