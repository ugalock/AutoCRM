import { useEffect, useState, useRef } from "react";
import { format } from "timeago.js";
import {
    Home,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Circle,
} from "lucide-react";
import { supabase } from "@db";
import type { Database } from "@db/types";
import { TicketPriority } from "@/types/workspace";
import type { RealtimeEvent } from "@/types/realtime";
import { getUserName } from "@/lib/utils";
import { CreateTicket } from "@/components/tickets/CreateTicket";
import { AIChat } from '@/components/dashboard/AIChat';
import { aiAgent } from "@services";

type RoleCategory = 'agent' | 'admin' | 'manager' | 'member'

interface Role {
    roleCategory: RoleCategory
}

type User = Database['public']['Tables']['users']['Row'] & {
    role: Role
}

export type Organization = Database['public']['Tables']['organizations']['Row']

type TicketStatusHistory = Database['public']['Tables']['ticket_status_history']['Row']
type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
    requester: User;
    assignee?: User | null;
    organization: Organization;
    priority: TicketPriority;
    ticketNumber: number | 123;
    tags: { name: string }[] | [];
    custom_fields: { name: string, value: string }[] | [];
    ticket_status_history: TicketStatusHistory[] | [];
};

type Team = Database['public']['Tables']['teams']['Row'] & { organizations: Organization };

interface TicketCounts {
    open: number;
    pending: number;
    solved: number;
    new: number;
}

interface TicketSections {
    requireAction: Ticket[];
    urgent: Ticket[];
    high: Ticket[];
    normal: Ticket[];
    low: Ticket[];
    closed: Ticket[];
}

interface DashboardViewProps {
    onTicketSelect: (ticketId: string, subject: string, priority: TicketPriority, ticketNumber: number) => void;
    realtimeEvent: RealtimeEvent | null;
    userRole?: RoleCategory; // ('agent', 'admin') means Employee | ('manager', 'member') means Customer
}

export function DashboardView({ onTicketSelect, realtimeEvent, userRole = 'member' }: DashboardViewProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketSections, setTicketSections] = useState<TicketSections>({
        requireAction: [],
        urgent: [],
        high: [],
        normal: [],
        low: [],
        closed: [],
    });
    const [ticketCounts, setTicketCounts] = useState<TicketCounts>({
        open: 0,
        pending: 0,
        solved: 0,
        new: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
    const [allSelected, setAllSelected] = useState(false);
    const [isUpdatesPanelOpen, setIsUpdatesPanelOpen] = useState(true);
    const [isAIChatActive, setIsAIChatActive] = useState(false);
    const [columnWidths, setColumnWidths] = useState({
        checkbox: 48, // w-12
        status: 90,   // w-[90px]
        subject: 30,  // 30%
        requester: 15,// 15%
        updated: 15,  // 15%
        organization: 15,    // 15%
        assignee: 15  // 15%
    });
    const [resizing, setResizing] = useState<string | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);
    const tableRef = useRef<HTMLTableElement>(null);

    // Get current user's ID for CreateTicket component
    const [userId, setUserId] = useState<string>('');
    const [user, setUser] = useState<User | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [ticketCreateArgs, setTicketCreateArgs] = useState<{ team_name: string, subject: string, description: string } | null>(null);

    useEffect(() => {
        async function fetchTeams() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const response = await fetch('/teams', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                setTeams(data.teams || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch teams');
            }
        }

        fetchTeams();
    }, []);

    useEffect(() => {
        async function getCurrentUser() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const response = await fetch(
                    `/users/${session.user.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                const { user, error } = await response.json()
                if (error) {
                    console.error('Error fetching user:', error);
                    setError(error);
                    return;
                }
                // console.log(user);
                setUser(user);
                setUserId(user.id);
            }
        }
        getCurrentUser();
    }, []);

    // Function to organize tickets into sections
    const organizeTicketsIntoSections = (ticketsToOrganize: Ticket[], userId: string) => {
        const sections: TicketSections = {
            requireAction: [],
            urgent: [],
            high: [],
            normal: [],
            low: [],
            closed: [],
        };

        ticketsToOrganize.forEach((ticket) => {
            const isRecent = new Date(ticket.updated_at || '') > new Date(Date.now() - 1000 * 60 * 60 * 6);
            const isAssignedToMe = ticket.assigned_to === userId;

            if (ticket.status === 'New' && isAssignedToMe) {
                sections.requireAction.push(ticket);
            } else if (ticket.closed_at) {
                sections.closed.push(ticket);
            } else {
                // Add to priority-based section
                switch (ticket.priority) {
                    case 'urgent':
                        sections.urgent.push(ticket);
                        break;
                    case 'high':
                        sections.high.push(ticket);
                        break;
                    case 'normal':
                        sections.normal.push(ticket);
                        break;
                    case 'low':
                        sections.low.push(ticket);
                        break;
                    default:
                        sections.normal.push(ticket);
                }
            }
        });

        return sections;
    };

    // Function to update ticket counts
    const updateTicketCounts = (ticketsToCount: Ticket[]) => {
        const counts = ticketsToCount.reduce((acc: Record<string, number>, ticket: Ticket) => {
            acc[ticket.status as keyof TicketCounts] = (acc[ticket.status as keyof TicketCounts] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            open: counts.open || 0,
            pending: counts.pending || 0,
            solved: counts.solved || 0,
            new: counts.new || 0,
        };
    };

    // Initial data fetch
    useEffect(() => {
        async function fetchTickets() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    return;
                }

                const response = await fetch(`/tickets`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const { tickets: transformedTickets } = await response.json();
                console.log(transformedTickets)
                if (error) {
                    throw new Error(error);
                }

                setTickets(transformedTickets);
                setTicketSections(organizeTicketsIntoSections(transformedTickets, session.user.id));
                setTicketCounts(updateTicketCounts(transformedTickets));

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
            } finally {
                setLoading(false);
            }
        }

        fetchTickets();
    }, []);

    // Handle real-time events
    useEffect(() => {
        if (!realtimeEvent) return;

        const handleRealtimeEvent = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            if (realtimeEvent.table === 'tickets') {
                // Fetch the updated ticket's full details
                const response = await fetch(
                    `/tickets/${realtimeEvent.payload.new.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const { data: ticketData, error } = await response.json();
                if (error) {
                    console.error('Error fetching ticket:', error);
                    return;
                }

                if (ticketData && ticketData.ticket) {
                    const updatedTicket = ticketData.ticket;

                    setTickets(prevTickets => {
                        let updatedTickets;
                        if (realtimeEvent.eventType === 'INSERT') {
                            updatedTickets = [...prevTickets, updatedTicket];
                        } else if (realtimeEvent.eventType === 'UPDATE') {
                            updatedTickets = prevTickets.map(ticket =>
                                ticket.id === updatedTicket.id ? updatedTicket : ticket
                            );
                        } else {
                            return prevTickets;
                        }

                        // Update sections and counts based on the new tickets array
                        setTicketSections(organizeTicketsIntoSections(updatedTickets, session.user.id));
                        setTicketCounts(updateTicketCounts(updatedTickets));
                        return updatedTickets;
                    });
                }
            }
        };

        handleRealtimeEvent();
    }, [realtimeEvent]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allTicketIds = tickets.map(ticket => ticket.id);
            setSelectedTickets(new Set(allTicketIds));
        } else {
            setSelectedTickets(new Set());
        }
        setAllSelected(checked);
    };

    const handleSelectTicket = (ticketId: string, checked: boolean) => {
        const newSelected = new Set(selectedTickets);
        if (checked) {
            newSelected.add(ticketId);
        } else {
            newSelected.delete(ticketId);
        }
        setSelectedTickets(newSelected);
        setAllSelected(newSelected.size === tickets.length);
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'new':
                return 'text-orange-500';
            case 'open':
                return 'text-red-500';
            case 'pending':
                return 'text-blue-500';
            case 'on_hold':
                return 'text-gray-700';
            case 'solved':
            case 'closed':
                return 'text-gray-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusDescription = (status: string): string => {
        switch (status) {
            case 'new':
                return 'Indicates that no action has been taken on the ticket. After a New ticket\'s status has been changed, it can\'t be set back to New.';
            case 'open':
                return 'Indicates a ticket has been assigned to an agent and is in progress. It\'s waiting for action by the agent.';
            case 'pending':
                return 'Indicates the agent is waiting for more information from the requester. When the requester responds and a new comment is added, the ticket status is automatically reset to Open.';
            case 'on_hold':
                return 'Indicates the agent is waiting for information or action from someone other than the requester. On-hold is an internal status that the ticket requester never sees.';
            case 'solved':
                return 'Indicates the agent has submitted a solution.';
            case 'closed':
                return 'Indicates that the ticket is closed by the system and the requester can no longer reopen it. Tickets can\'t manually be set to Closed.';
            default:
                return '';
        }
    };

    const renderTicketSection = (title: string, tickets: Ticket[]) => {
        if (tickets.length === 0) return null;

        return (
            <>
                <tr>
                    <td colSpan={7} className="text-sm text-gray-500 bg-gray-50 pl-4 py-2 border-t text-left">{title} ({tickets.length})</td>
                </tr>
                {tickets.map((ticket) => (
                    <tr
                        key={ticket.id}
                        className="border-t hover:bg-gray-50 cursor-pointer h-12"
                    >
                        <td className="py-3 px-4" style={{ width: columnWidths.checkbox }}>
                            <div className="flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-150 ease-in-out cursor-pointer hover:border-blue-400"
                                    checked={selectedTickets.has(ticket.id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleSelectTicket(ticket.id, e.target.checked);
                                    }}
                                />
                            </div>
                        </td>
                        <td className="py-3 px-4 text-left" style={{ width: columnWidths.status }} onClick={() => onTicketSelect(ticket.id, ticket.subject, ticket.priority, ticket.ticketNumber)}>
                            <div className="flex items-start space-x-2 overflow-visible">
                                <div className="relative group">
                                    <Circle
                                        size={16}
                                        className={`flex-shrink-0 fill-current ${getStatusColor(ticket.status)}`}
                                    />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 w-64 whitespace-normal text-left" style={{ zIndex: 100000 }}>
                                        <div className="font-medium mb-1 capitalize">{ticket.status.replace('_', ' ')}</div>
                                        {ticket.status}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                            <div className="border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-blue-600 flex-shrink-0">#{ticket.ticketNumber}</span>
                            </div>
                        </td>
                        <td className="py-3 px-4 text-left relative group" style={{ width: `${columnWidths.subject}%` }} onClick={() => onTicketSelect(ticket.id, ticket.subject, ticket.priority, ticket.ticketNumber)}>
                            <span className="truncate block">{ticket.subject}</span>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                Created {new Date(ticket.created_at || '').toLocaleString()}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                    <div className="border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        </td>
                        <td className="py-3 px-4 text-left" style={{ width: `${columnWidths.requester}%` }} onClick={() => onTicketSelect(ticket.id, ticket.subject, ticket.priority, ticket.ticketNumber)}>
                            <span className="truncate block">{getUserName(ticket.requester)}</span>
                        </td>
                        <td className="py-3 px-4 text-left relative group" style={{ width: `${columnWidths.updated}%` }} onClick={() => onTicketSelect(ticket.id, ticket.subject, ticket.priority, ticket.ticketNumber)}>
                            <span className="truncate block">{format(ticket.updated_at || '')}</span>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {new Date(ticket.updated_at || '').toLocaleString()}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                    <div className="border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        </td>
                        <td className="py-3 px-4 text-left" style={{ width: `${columnWidths.organization}%` }} onClick={() => onTicketSelect(ticket.id, ticket.subject, ticket.priority, ticket.ticketNumber)}>
                            <span className="truncate block">{ticket.organization?.name || ''}</span>
                        </td>
                        <td className="py-3 px-4 text-left" style={{ width: `${columnWidths.assignee}%` }} onClick={() => onTicketSelect(ticket.id, ticket.subject, ticket.priority, ticket.ticketNumber)}>
                            <span className="truncate block">{getUserName(ticket.assignee)}</span>
                        </td>
                    </tr>
                ))}
            </>
        );
    };

    const handleResizeStart = (e: React.MouseEvent, columnId: string, initialWidth: number) => {
        e.preventDefault();
        setResizing(columnId);
        setStartX(e.clientX);
        setStartWidth(initialWidth);
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!resizing) return;

        const diff = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px

        setColumnWidths(prev => ({
            ...prev,
            [resizing]: resizing.includes('%') ? (newWidth / (tableRef.current?.clientWidth || 1)) * 100 : newWidth
        }));
    };

    const handleResizeEnd = () => {
        setResizing(null);
    };

    useEffect(() => {
        if (resizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
            return () => {
                window.removeEventListener('mousemove', handleResizeMove);
                window.removeEventListener('mouseup', handleResizeEnd);
            };
        }
    }, [resizing, startX, startWidth]);

    // Function to handle MessageCircle click
    const handleAIChatToggle = () => {
        if (isAIChatActive) {
            setIsAIChatActive(false);
        } else {
            setIsUpdatesPanelOpen(false);
            setIsAIChatActive(true);
        }
    };

    // Update the updates panel toggle to also handle AI chat
    const handleUpdatesPanelToggle = () => {
        if (isUpdatesPanelOpen) {
            setIsUpdatesPanelOpen(false);
        } else {
            setIsAIChatActive(false);
            setIsUpdatesPanelOpen(true);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="flex h-full">
            {/* Left Sidebar */}
            <div className="w-14 bg-[#1f73b7] flex flex-col items-center py-4 text-white">
                <div className="mb-8">
                    <div 
                        className={`w-8 h-8 ${isAIChatActive ? 'bg-white text-[#1f73b7]' : 'bg-white/20'} rounded flex items-center justify-center cursor-pointer hover:bg-white hover:text-[#1f73b7] transition-colors`}
                        onClick={handleAIChatToggle}
                    >
                        <MessageCircle size={20} />
                    </div>
                </div>
                <nav className="space-y-4">
                    <button className="p-2 hover:bg-white/10 rounded">
                        <Home size={20} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded">
                        <Users size={20} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded">
                        <BarChart3 size={20} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded">
                        <Settings size={20} />
                    </button>
                </nav>
            </div>

            <div className="flex-1 flex">
                {/* Updates Panel */}
                {isUpdatesPanelOpen && (
                    <div className="relative bg-gray-100 border-r w-80 transition-all duration-300 ease-in-out flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-white">
                            <h2 className="font-medium">Updates to tickets</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                Updates to tickets will appear here
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Chat Panel */}
                <AIChat
                    currentUser={user}
                    isActive={isAIChatActive}
                    onClose={() => setIsAIChatActive(false)}
                    teams={teams}
                    onTicketCreate={setTicketCreateArgs}
                />

                {/* Collapse Button */}
                <div className="relative z-50">
                    <div className={`absolute top-1/2 ${isUpdatesPanelOpen || isAIChatActive ? '-right-3' : '-right-2'} transform -translate-y-1/2`}>
                        <button
                            onClick={isAIChatActive ? handleAIChatToggle : handleUpdatesPanelToggle}
                            className="bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
                        >
                            {isUpdatesPanelOpen || isAIChatActive ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Fixed Header Section */}
                    <div className="flex-none p-6 bg-gray-50">
                        <div className="mb-6">
                            <div className="flex divide-x">
                                {/* Open Tickets Section */}
                                <div className="pr-6 w-[300px]">
                                    <h2 className="text-lg font-medium mb-4 text-left">Open Tickets</h2>
                                    <div className="flex">
                                        <div className="bg-white p-4 rounded-l-lg border-l border-y w-[138px]">
                                            <div className="text-sm font-medium mb-2">You</div>
                                            <div className="text-2xl font-bold">999</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-r-lg border w-[138px]">
                                            <div className="text-sm font-medium mb-2">Groups</div>
                                            <div className="text-2xl font-bold">999</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Conditional rendering based on userRole */}
                                {(userRole === 'manager' || userRole === 'member') ? (
                                    <CreateTicket 
                                        userId={userId} 
                                        teams={teams} 
                                        initialValues={ticketCreateArgs}
                                    />
                                ) : (
                                    /* Ticket Statistics Section */
                                    <div className="pl-6 w-[450px]">
                                        <h2 className="text-lg font-medium mb-4 text-left">Ticket Statistics</h2>
                                        <div className="flex">
                                            <div className="bg-white p-4 rounded-l-lg border-l border-y border-r w-[138px]">
                                                <div className="text-sm font-medium mb-2">Good</div>
                                                <div className="text-2xl font-bold">999</div>
                                            </div>
                                            <div className="bg-white p-4 border-y w-[138px]">
                                                <div className="text-sm font-medium mb-2">Bad</div>
                                                <div className="text-2xl font-bold">999</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-r-lg border w-[138px]">
                                                <div className="text-sm font-medium mb-2">Solved</div>
                                                <div className="text-2xl font-bold">999</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <div className="bg-white rounded-lg border p-4" style={{ overflow: 'visible' }}>
                            <div className="overflow-auto">
                                <table ref={tableRef} className="w-full table-fixed relative" style={{ minWidth: '600px' }}>
                                    <thead className="bg-gray-50 text-sm text-gray-500 sticky top-0">
                                        <tr className="relative">
                                            <th className="py-3 px-4 text-left font-medium" style={{ width: columnWidths.checkbox }}>
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-150 ease-in-out cursor-pointer hover:border-blue-400"
                                                        checked={allSelected}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </div>
                                                <div
                                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 group"
                                                    onMouseDown={(e) => handleResizeStart(e, 'checkbox', columnWidths.checkbox)}
                                                >
                                                    <div className="absolute inset-y-0 right-0 w-4 -translate-x-1/2 group-hover:bg-blue-500/10" />
                                                </div>
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium relative" style={{ width: columnWidths.status }}>
                                                <div
                                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 group"
                                                    onMouseDown={(e) => handleResizeStart(e, 'status', columnWidths.status)}
                                                >
                                                    <div className="absolute inset-y-0 right-0 w-4 -translate-x-1/2 group-hover:bg-blue-500/10" />
                                                </div>
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium relative" style={{ width: `${columnWidths.subject}%` }}>
                                                Subject
                                                <div
                                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 group"
                                                    onMouseDown={(e) => handleResizeStart(e, 'subject', columnWidths.subject)}
                                                >
                                                    <div className="absolute inset-y-0 right-0 w-4 -translate-x-1/2 group-hover:bg-blue-500/10" />
                                                </div>
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium relative" style={{ width: `${columnWidths.requester}%` }}>
                                                Requester
                                                <div
                                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 group"
                                                    onMouseDown={(e) => handleResizeStart(e, 'requester', columnWidths.requester)}
                                                >
                                                    <div className="absolute inset-y-0 right-0 w-4 -translate-x-1/2 group-hover:bg-blue-500/10" />
                                                </div>
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium relative" style={{ width: `${columnWidths.updated}%` }}>
                                                Last updated
                                                <div
                                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 group"
                                                    onMouseDown={(e) => handleResizeStart(e, 'updated', columnWidths.updated)}
                                                >
                                                    <div className="absolute inset-y-0 right-0 w-4 -translate-x-1/2 group-hover:bg-blue-500/10" />
                                                </div>
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium relative" style={{ width: `${columnWidths.organization}%` }}>
                                                Org
                                                <div
                                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 group"
                                                    onMouseDown={(e) => handleResizeStart(e, 'organization', columnWidths.organization)}
                                                >
                                                    <div className="absolute inset-y-0 right-0 w-4 -translate-x-1/2 group-hover:bg-blue-500/10" />
                                                </div>
                                            </th>
                                            <th className="py-3 px-4 text-left font-medium relative" style={{ width: `${columnWidths.assignee}%` }}>
                                                Agent
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderTicketSection('Require Action', ticketSections.requireAction)}
                                        {renderTicketSection('Urgent Tickets', ticketSections.urgent)}
                                        {renderTicketSection('High Priority', ticketSections.high)}
                                        {renderTicketSection('Normal Priority', ticketSections.normal)}
                                        {renderTicketSection('Low Priority', ticketSections.low)}
                                        {renderTicketSection('Closed Tickets', ticketSections.closed)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 