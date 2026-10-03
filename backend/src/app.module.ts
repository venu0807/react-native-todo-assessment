import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Load .env variables globally — must be first
    ConfigModule.forRoot({ isGlobal: true }),
    // Connect to MongoDB using env variable
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    // Authentication module
    AuthModule,
  ],
})
export class AppModule {}
