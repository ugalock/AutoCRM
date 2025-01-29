import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabase } from '@db';
import { type UserRequest } from '@server/types/types';
import { verifyAuth } from '@server/middleware/auth';
import { type TeamMemberCount } from '@db/types';

const router = Router();
router.use(verifyAuth);
// GET /tickets/
// Fetch all ticket details with history, tags, and messages
router.get('/', async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;

    try {
        // Fetch ticket with related data
        const response = await supabase
            .from('tickets')
            .select(`
                *,
                requester: users!tickets_customer_id_fkey(*),
                assignee: users!tickets_assigned_to_fkey(*),
                organization: users!tickets_customer_id_fkey (
                    organizations(*)                
                ),
                custom_fields: ticket_custom_fields(*),
                tags: ticket_tags(tag:tag_id(*)),
                ticket_status_history(*)
            `)
            .or(`assigned_to.eq.${userId},customer_id.eq.${userId}`)
            .order('changed_at', { referencedTable: 'ticket_status_history', ascending: true });
        console.log(response);
        const { data: tickets, error: ticketError } = response;
        if (ticketError) throw ticketError;
        if (!tickets) {
            return res.json({ tickets: [] });
        }

        for (let ticket of tickets) {
            ticket.organization = ticket.organization.organizations;
        }

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
router.get('/:ticketId', async (req: UserRequest, res: Response) => {
    const { ticketId } = req.params;
    const userId = req.user?.id;

    try {
        // Fetch ticket with related data
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`
                *,
                requester: users!tickets_customer_id_fkey(*, customers(is_org_admin)),
                assignee: users!tickets_assigned_to_fkey(*, employees(role)),
                organization: users!tickets_customer_id_fkey (
                    organizations(*)                
                ),
                custom_fields: ticket_custom_fields(*),
                tags: ticket_tags(tag:tag_id(*)),
                ticket_status_history(*)
            `)
            .eq('id', ticketId)
            .order('changed_at', { referencedTable: 'ticket_status_history', ascending: true })
            .single();

        if (ticketError) throw ticketError;
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        ticket.organization = ticket.organization.organizations;
        ticket.requester.role = {roleCategory: ticket.requester.customers.is_org_admin ? 'manager' : 'member'};
        ticket.assignee.role = {roleCategory: ticket.assignee.employees.role};

        // Check permissions
        const isCustomer = ticket.requester.id === userId;
        if (!isCustomer) {
            const isAgent = await supabase
                .from('employees')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();
            if (!isAgent.data) {
                return res.status(403).json({ error: 'Not authorized to view this ticket' });
            }
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select(`
                *,
                user: users!messages_user_id_fkey(*)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Fetch statuses
        const { data: statuses, error: statusesError } = await supabase
            .from('ticket_statuses')
            .select(`*`);

        if (statusesError) throw statusesError;

        // Fetch status history
        const { data: statusHistory, error: statusHistoryError } = await supabase
            .from('ticket_status_history')
            .select(`*`)
            .eq('ticket_id', ticketId)
            .order('changed_at', { ascending: true });

        if (statusHistoryError) throw statusHistoryError;

        // Return ticket with messages
        res.json({
            data: {
                ticket,
                messages: messages || [],
                statuses: statuses,
                statusHistory: statusHistory || []
            }
        });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PATCH /tickets/{ticketId}
// Update ticket (status, priority, assigned_to, team_id)
router.patch('/:ticketId', async (req: UserRequest, res: Response) => {
    const { ticketId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    try {
        const { data: ticket, error: ticketError } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .single();

            if (ticketError) throw ticketError;
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

        // Verify user has permission to update tickets
        if (ticket.customer_id !== userId && ticket.assigned_to !== userId) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select(`
                    *,
                    customers(is_org_admin),
                    employees(role)
                `)
                .eq('id', userId)
                .maybeSingle();
            
            if (userError) throw userError;
            if (!user) {
                return res.status(403).json({ error: 'Not authorized to update tickets' });
            }
            console.log(user);
            if (!user.customers.is_org_admin && user.employees.role !== 'admin') {
                return res.status(403).json({ error: 'Not authorized to update tickets' });
            }
        }

        // Start a transaction if we're updating status (need to update two tables)
        if (updates.status) {
            // Only create history entry if status is actually changing
            if (ticket.status !== updates.status) {
                const { error: historyError } = await supabase
                    .from('ticket_status_history')
                    .insert({
                        ticket_id: ticketId,
                        old_status: ticket.status,
                        new_status: updates.status,
                        changed_by: userId
                    });

                if (historyError) throw historyError;
            }

            const closedStatuses = ['Closed', 'Resolved', 'Closed (Will Not Fix)'];
            if (closedStatuses.includes(updates.status) && !ticket.closed_at) {
                const { error: ticketNumberError } = await supabase
                    .from('tickets')
                    .update({ closed_at: new Date().toISOString() })
                    .eq('id', ticketId);

                if (ticketNumberError) throw ticketNumberError;
            } else if (ticket.closed_at && !closedStatuses.includes(updates.status)) {
                const { error: ticketNumberError } = await supabase
                    .from('tickets')
                    .update({ closed_at: null })
                    .eq('id', ticketId);
                if (ticketNumberError) throw ticketNumberError;
            }
        }

        // Update the ticket with any provided fields
        const updateData: Record<string, any> = {};
        const allowedFields = ['status', 'priority', 'assigned_to', 'team_id'];
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        // Only proceed with update if there are fields to update
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from('tickets')
                .update(updateData)
                .eq('id', ticketId);

            if (updateError) throw updateError;
        }

        res.json({ message: 'Ticket updated successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /tickets
// Create a new ticket
router.post('/', async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;
    const { team_id, subject, description, priority, customer_id, channel } = req.body;

    try {
        // Validate required fields
        if (!team_id || !subject || !priority || !customer_id || !channel) {
            return res.status(400).json({ 
                error: 'Missing required fields. Required: team_id, subject, priority, customer_id, channel' 
            });
        }

        // Validate priority is one of the allowed values
        const allowedPriorities = ['urgent', 'high', 'normal', 'low'];
        if (!allowedPriorities.includes(priority)) {
            return res.status(400).json({ 
                error: `Invalid priority. Must be one of: ${allowedPriorities.join(', ')}` 
            });
        }

        // Verify team exists
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', team_id)
            .single();

        if (teamError || !team) {
            return res.status(400).json({ error: 'Invalid team_id' });
        }

        // Create the ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .insert({
                team_id,
                subject,
                description,
                priority,
                customer_id,
                channel,
                status: 'New'
            })
            .select()
            .single();

        if (ticketError) throw ticketError;

        // Create initial status history entry
        const { error: historyError } = await supabase
            .from('ticket_status_history')
            .insert({
                ticket_id: ticket.id,
                old_status: null,
                new_status: 'New',
                changed_by: userId
            });

        if (historyError) throw historyError;
        
        const { data, error: teamMembersError } = await supabase.rpc('get_team_members_with_open_tickets', { teamid: team_id });

        if (teamMembersError) throw teamMembersError;
        if (!data) return res.status(404).json({ error: 'No team members found' });

        const teamMembers = data as TeamMemberCount[];
        // console.log(teamMembers);

        // teamMembers.sort((a, b) => a.open_ticket_count - b.open_ticket_count);
        teamMembers.sort((a, b) => b.open_ticket_count - a.open_ticket_count); // Sort by open ticket count, highest first for testing purposes
        const assignee = teamMembers[0].user_id;
        const { error: assigneeError } = await supabase
            .from('tickets')
            .update({ assigned_to: assignee })
            .eq('id', ticket.id);
        if (assigneeError) throw assigneeError;

        // Return the created ticket
        res.status(201).json({ 
            message: 'Ticket created successfully',
            data: ticket
        });
    } catch (error: any) {
        console.error('Error creating ticket:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router; 