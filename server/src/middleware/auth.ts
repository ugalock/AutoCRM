import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import { type UserRequest, type User } from '@server/types/types';
import { supabase } from '@db';

// export const verifyJWT = (req, res, next) => {
//     const token = req.headers['authorization']?.split(' ')[1];

//     if (token) {
//         jwt.verify(token, process.env.VITE_SUPABASE_JWT_SECRET!, (err: any, decoded: any) => {
//             if (err) {
//                 return res.status(401).send('Unauthorized');
//             }

//             req.user = decoded as User;
//             next();
//         });
//     } else {
//         return res.status(401).send('Unauthorized');
//     }
// };

export const verifyAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (dbError || !dbUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        (req as UserRequest).user = dbUser as User;
        next();
    } catch (error) {
        next(error);
    }
}