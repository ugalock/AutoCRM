import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@db';
import { Tab, WorkspaceState, TicketPriority } from '../types/workspace';
import {
    MessageCircle,
    Search,
    Phone,
    Bell,
    Grid,
    HelpCircle,
    User,
    ChevronDown,
    LogOut,
    Circle,
    X,
    Plus,
} from "lucide-react";
import { DashboardView } from '@/components/views/DashboardView';
import { TicketView } from '@/components/views/TicketView';
import { NewTabDialog } from '@/components/dashboard/NewTabDialog';
import type { Database } from '@db/types';
import { RealtimeEvent } from '@/types/realtime'

type DatabaseTicket = Database['public']['Tables']['tickets']['Row'];
type DatabaseComment = Database['public']['Tables']['messages']['Row'];

const getPriorityColor = (priority: TicketPriority | undefined): string => {
    switch (priority) {
        case 'urgent':
            return 'text-red-500';
        case 'high':
            return 'text-orange-500';
        case 'normal':
            return 'text-blue-500';
        case 'low':
            return 'text-gray-500';
        default:
            return 'text-gray-400';
    }
};


interface EmployeeHeaderProps {
    variant?: 'dashboard' | 'conversation';
}

export function EmployeeHeader({ variant = 'conversation' }: EmployeeHeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle clicking outside of dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        async function fetchUserProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('email')
                    .eq('email', user.email)
                    .single();

                if (profile) {
                    setUserName(profile.email.split('@')[0]);
                }
            }
        }

        fetchUserProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setShowDropdown(false);
        window.location.href = '/';
    };

    const renderDashboardLeft = () => (
        <div className="flex items-center">
            <h1 className="text-lg font-medium mr-8">Dashboard</h1>
            <span className="text-sm text-gray-600 mr-4">
                {userName ? userName : 'Loading...'}
            </span>
        </div>
    );

    const renderConversationLeft = () => (
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                    <Grid size={20} />
                </button>
                <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded text-sm">
                    <MessageCircle size={16} />
                    <span>Conversations</span>
                    <span className="bg-gray-200 px-1.5 rounded">0</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                    <Phone size={20} />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                    <Bell size={20} />
                </button>
            </div>
        </div>
    );

    return (
        <header className={`flex items-center justify-between px-4 py-2 border-b ${variant === 'dashboard' ? 'h-14' : ''}`}>
            {variant === 'dashboard' ? renderDashboardLeft() : renderConversationLeft()}
            <div className="flex items-center space-x-4">
                <button className="p-1 hover:bg-gray-200 rounded">
                    <Search size={20} />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                    <HelpCircle size={20} />
                </button>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center space-x-2"
                    >
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                            {userName ? userName[0].toUpperCase() : <User size={20} />}
                        </div>
                        <ChevronDown size={16} />
                    </button>
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
} 

export function EmployeeWorkspace() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [workspace, setWorkspace] = useState<WorkspaceState>({
        tabs: [],
        activeTabId: null,
    });
    const [isNewTabDialogOpen, setIsNewTabDialogOpen] = useState(false);
    const [realtimeEvent, setRealtimeEvent] = useState<RealtimeEvent | null>(null);

    useEffect(() => {
        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
                return;
            }
        }

        checkAuth();
    }, [navigate]);

    // Initialize dashboard tab if no tabs exist
    useEffect(() => {
        if (workspace.tabs.length === 0) {
            const dashboardTab: Tab = {
                id: 'dashboard',
                type: 'dashboard',
                title: 'Dashboard',
            };
            setWorkspace({
                tabs: [dashboardTab],
                activeTabId: dashboardTab.id,
            });
        }
    }, [workspace.tabs.length]);

    // Set up centralized realtime subscription
    useEffect(() => {
        const setupRealtimeSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const channel = supabase.channel('workspace-changes')
                // Listen for ticket changes
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'tickets',
                    },
                    (payload) => {
                        setRealtimeEvent({
                            table: 'tickets',
                            schema: 'public',
                            eventType: 'INSERT',
                            payload: {
                                new: payload.new as DatabaseTicket,
                                old: payload.old as DatabaseTicket,
                            },
                        });
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'tickets',
                    },
                    (payload) => {
                        setRealtimeEvent({
                            table: 'tickets',
                            schema: 'public',
                            eventType: 'UPDATE',
                            payload: {
                                new: payload.new as DatabaseTicket,
                                old: payload.old as DatabaseTicket,
                            },
                        });
                    }
                )
                // Listen for comment changes
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload) => {
                        setRealtimeEvent({
                            table: 'messages',
                            schema: 'public',
                            eventType: 'INSERT',
                            payload: {
                                new: payload.new as DatabaseComment,
                                old: payload.old as DatabaseComment,
                            },
                        });
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload) => {
                        setRealtimeEvent({
                            table: 'messages',
                            schema: 'public',
                            eventType: 'UPDATE',
                            payload: {
                                new: payload.new as DatabaseComment,
                                old: payload.old as DatabaseComment,
                            },
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupRealtimeSubscription();
    }, []);

    // Sync URL with active tab
    useEffect(() => {
        const activeTab = workspace.tabs.find(tab => tab.id === workspace.activeTabId);
        if (activeTab) {
            const params: { [key: string]: string } = { view: activeTab.type };
            if (activeTab.data?.ticketId) {
                params.ticketId = activeTab.data.ticketId;
            }
            setSearchParams(params);
        }
    }, [workspace.activeTabId, workspace.tabs, setSearchParams]);

    const openTicketTab = (ticketId: string, subject: string, priority: TicketPriority, ticketNumber: number) => {
        // Check if tab already exists
        const existingTab = workspace.tabs.find(
            tab => tab.type === 'ticket' && tab.data?.ticketId === ticketId
        );

        if (existingTab) {
            setWorkspace(prev => ({
                ...prev,
                activeTabId: existingTab.id,
            }));
            return;
        }

        // Create new tab
        const newTab: Tab = {
            id: `ticket-${ticketId}`,
            type: 'ticket',
            title: subject,
            data: { ticketId, subject, priority, ticketNumber },
        };

        setWorkspace(prev => ({
            tabs: [...prev.tabs, newTab],
            activeTabId: newTab.id,
        }));
    };

    const closeTab = (tabId: string) => {
        setWorkspace(prev => {
            const newTabs = prev.tabs.filter(tab => tab.id !== tabId);
            let newActiveTabId = prev.activeTabId;

            // If we're closing the active tab, activate the previous tab
            if (tabId === prev.activeTabId) {
                const index = prev.tabs.findIndex(tab => tab.id === tabId);
                newActiveTabId = newTabs[Math.max(0, index - 1)]?.id || null;
            }

            return {
                tabs: newTabs,
                activeTabId: newActiveTabId,
            };
        });
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Tabs */}
            <div className="bg-white border-b relative">
                <div className="flex items-center">
                    {workspace.tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`
                flex items-center px-4 border-r cursor-pointer font-medium h-[3.5rem]
                ${workspace.activeTabId === tab.id
                                    ? 'bg-gray-100 border-b border-gray-100 relative -mb-px'
                                    : 'bg-white shadow-[inset_0_-4px_8px_-4px_rgba(0,0,0,0.1)]'
                                }
                ${workspace.activeTabId === tab.id ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}
              `}
                            onClick={() => setWorkspace(prev => ({ ...prev, activeTabId: tab.id }))}
                        >
                            <div className="flex items-center w-full">
                                {tab.type === 'ticket' && (
                                    <Circle
                                        size={8}
                                        className={`mr-2 flex-shrink-0 fill-current ${getPriorityColor(tab.data?.priority)}`}
                                    />
                                )}
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className="truncate max-w-[200px]">{tab.title}</span>
                                    {tab.type === 'ticket' && tab.data?.ticketNumber && (
                                        <span className="text-xs font-normal text-gray-500">
                                            #{tab.data.ticketNumber}
                                        </span>
                                    )}
                                </div>
                                {tab.type !== 'dashboard' && (
                                    <button
                                        className="ml-2 p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeTab(tab.id);
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setIsNewTabDialogOpen(true)}
                        className="px-3 h-[3.5rem] hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-r flex items-center"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Header */}
            <div className="bg-gray-100">
                <EmployeeHeader
                    variant={workspace.tabs.find(tab => tab.id === workspace.activeTabId)?.type === 'dashboard' ? 'dashboard' : 'conversation'}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {workspace.tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`h-full ${workspace.activeTabId === tab.id ? '' : 'hidden'}`}
                    >
                        {tab.type === 'dashboard' && (
                            <DashboardView
                                onTicketSelect={(ticketId, subject, priority, ticketNumber) =>
                                    openTicketTab(ticketId, subject, priority, ticketNumber)}
                                realtimeEvent={realtimeEvent}
                            />
                        )}
                        {tab.type === 'ticket' && tab.data?.ticketId && (
                            <TicketView
                                ticketId={tab.data.ticketId}
                                realtimeEvent={realtimeEvent}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* New Tab Dialog */}
            <NewTabDialog
                isOpen={isNewTabDialogOpen}
                onClose={() => setIsNewTabDialogOpen(false)}
            />
        </div>
    );
} 