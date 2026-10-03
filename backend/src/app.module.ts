import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // Load .env variables globally — must be first
    ConfigModule.forRoot({ isGlobal: true }),
    // Connect to MongoDB using env variable
    MongooseModule.forRoot(process.env.MONGODB_URI!),
  ],
})
export class AppModule {}
