import { type Request } from 'express';
import { Database } from '@db/types';

export type User = Database['public']['Tables']['users']['Row'];
export type ExpressUser = {
    id: string;
    email: string;
}
export type UserRequest = Request & { user?: ExpressUser };
export const AutoCRM = {
    id: '9066e91f-faa2-4a68-8749-af0582dd435c',
    name: 'AutoCRM'
}