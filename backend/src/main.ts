import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000, '0.0.0.0');

  // Get local IP address for network access
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }

  console.log('🚀 Expense Tracker API running on http://localhost:3000');
  console.log('📊 Frontend available at http://localhost:3000');
  console.log(`📱 Access from phone: http://${localIP}:3000`);
  console.log('🗄️  Connected to PostgreSQL database');
}
bootstrap();
