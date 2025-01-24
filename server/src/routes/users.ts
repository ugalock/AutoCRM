import { Router } from 'express';
import { supabase } from '@db';
import { verifyAuth } from '@server/middleware/auth';
import type { Request, Response } from 'express';
import { UserRequest } from '@server/types/types';

const router = Router();

router.post('/', async (req, res) => {
    const { email, password, organization_id } = req.body;

    try {
        // Create user in database
        const { data: userData, error: dbError } = await supabase
            .from('users')
            .insert([
                { 
                    email,
                    organization_id,
                }
            ])
            .select()
            .single();

        if (dbError) throw dbError;

        // Based on organization_id, insert into employees or customers table
        if (organization_id === '9066e91f-faa2-4a68-8749-af0582dd435c') {
            const { error: employeeError } = await supabase
                .from('employees')
                .insert([
                    {
                        user_id: userData.id,
                        role: 'agent' // Default role for new employees
                    }
                ]);
            
            if (employeeError) throw employeeError;
        } else {
            const { error: customerError } = await supabase
                .from('customers')
                .insert([
                    {
                        user_id: userData.id,
                        is_org_admin: false // Default for new customers
                    }
                ]);
            
            if (customerError) throw customerError;
        }

        res.status(201).json(userData);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /users/{userId}
// Fetch user profile
router.get('/:userId', verifyAuth, async (req: UserRequest, res: Response) => {
    const userId = req.params.userId;

    try {
        // Fetch user with related data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select(`
                *,
                employee:employees(
                    id,
                    role,
                    team_id
                ),
                customer:customers(
                    id,
                    is_org_admin,
                    organization:organization_id(*)
                )
            `)
            .eq('id', userId)
            .single();

        if (userError) throw userError;
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router; 