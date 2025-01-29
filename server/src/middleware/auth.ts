import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { type UserRequest, type ExpressUser } from '@server/types/types';
import { supabase } from '@db';

export const verifyAuth = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        req.user = { id: user.id, email: user.email } as ExpressUser;
        next();
    } catch (error) {
        next(error);
    }
}

export const softVerifyAuth = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        const { data: { user }, error: userError } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
        req.user = { id: user?.id, email: user?.email } as ExpressUser;
        next();
    } catch (error) {
        next(error);
    }
}