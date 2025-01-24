import { type Request } from 'express';
import { Database } from '@db/types';

export type User = Database['public']['Tables']['users']['Row'];
export type UserRequest = Request & { user: User };