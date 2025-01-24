import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabase } from '@db';
import { type UserRequest } from '@server/types/types';
import { verifyAuth } from '@server/middleware/auth';

const router = Router();

// GET /tickets/
// Fetch all ticket details with history, tags, and messages
router.get('/', verifyAuth, async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;
    console.log(userId);

    try {
        // requester:users!tickets_customer_id_fkey(*),
        //         assignee:users!tickets_assigned_to_fkey(*),
        //         organization:users!tickets_customer_id_fkey (
        //             organizations(*)                
        //         )
        // Fetch ticket with related data
        const response = await supabase
            .from('tickets')
            .select()
            .eq('assigned_to', userId);
            // .or(`assigned_to.eq.${userId},customer_id.eq.${userId}`);
        console.log(response);
        const { data: tickets, error: ticketError } = response;
        if (ticketError) throw ticketError;
        if (!tickets) {
            return res.json({ tickets: [] });
        }

        for (let ticket of tickets) {
            
        }

        // const allMessages = [];
        // // Fetch all messages
        // for (const ticket of tickets) {
        //     const { data: messages, error: messagesError } = await supabase
        //         .from('messages')
        //         .select('*')
        //         .eq('ticket_id', ticket.id)
        //         .order('created_at', { ascending: true });

        //     if (messagesError) throw messagesError;

        //     allMessages.push(...messages);
        // }

        // Return ticket with messages
        res.json({
            tickets: tickets
        });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /tickets/{ticketId}
// Fetch ticket details with history, tags, and messages
router.get('/:ticketId', verifyAuth, async (req: UserRequest, res: Response) => {
    const { ticketId } = req.params;
    const userId = req.user?.id;

    try {
        // Fetch ticket with related data
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`
                *,
                customer:customer_id(id, user_id),
                assigned_to:assigned_to_id(id, user_id),
                team:team_id(*),
                tags:ticket_tags(tag:tag_id(*))
            `)
            .eq('id', ticketId)
            .single();

        if (ticketError) throw ticketError;
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Check permissions
        const isAgent = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        const isCustomer = ticket.customer.user_id === userId;

        if (!isAgent.data && !isCustomer) {
            return res.status(403).json({ error: 'Not authorized to view this ticket' });
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Return ticket with messages
        res.json({
            ...ticket,
            messages: messages || []
        });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router; 