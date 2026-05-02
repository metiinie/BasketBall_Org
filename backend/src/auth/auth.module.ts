import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseService } from './supabase.service';

@Module({
  imports: [PassportModule],
  providers: [SupabaseStrategy, SupabaseService],
  exports: [SupabaseStrategy, SupabaseService],
})
export class AuthModule {}
