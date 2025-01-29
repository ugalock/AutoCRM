import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabase } from '@db';
import { type User, type UserRequest, AutoCRM } from '@server/types/types';
import { verifyAuth } from '@server/middleware/auth';

const router = Router();
router.use(verifyAuth);
// GET /teams
// Fetch all teams in the current organization and AutoCRM
router.get('/', async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;

    try {
        const { data, error: userError } = await supabase
            .from('users')
            .select(`
                *
            `)
            .eq('id', userId)
            .single();
        if (userError) throw userError;
        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = data as User;
        // Fetch ticket with related data
        const response = await supabase
            .from('teams')
            .select(`
                *,
                organizations(*)
            `)
            .or(`organization_id.eq.${user.organization_id!},organization_id.eq.${AutoCRM.id}`);
        const { data: teams, error: teamError } = response;
        if (teamError) throw teamError;
        if (!teams) {
            return res.status(404).json({ error: 'No teams found' });
        }
        res.json({
            teams: teams
        });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /teams/all
// Fetch all teams
router.get('/all', async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;

    try {
        const { data, error: userError } = await supabase
            .from('users')
            .select(`
                *
            `)
            .eq('id', userId)
            .single();
        if (userError) throw userError;
        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        } 
        const user = data as User;
        if (user.organization_id !== AutoCRM.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        // Fetch ticket with related data
        const response = await supabase
            .from('teams')
            .select(`
                *,
                organizations(*)
            `);
        const { data: teams, error: teamError } = response;
        if (teamError) throw teamError;
        if (!teams) {
            return res.status(404).json({ error: 'No teams found' });
        }
        res.json({
            teams: teams
        });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;