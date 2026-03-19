import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Wrapping AuthGuard('jwt') in our own class lets us:
// 1. Give it a clean name to import across the app
// 2. Extend it later (e.g. add role checks) without changing every route
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
