import { useEffect, useState, useRef } from 'react'
import { supabase } from '@db'
import {
    Paperclip,
    Smile,
    Link2,
    Maximize2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { RealtimeEvent } from '@/types/realtime'
import type { Database } from '@db/types';
import { TicketPriority } from '@/types/workspace';
import { getUserName } from '@/lib/utils';

// ('agent', 'admin') means Employee | ('manager', 'member') means Customer
type RoleCategory = 'agent' | 'admin' | 'manager' | 'member' 

interface Role {
    roleCategory: RoleCategory
}

type User = Database['public']['Tables']['users']['Row'] & {
    role: Role,
    name: string
}

type Organization = Database['public']['Tables']['organizations']['Row']

type TicketStatus = Database['public']['Tables']['ticket_statuses']['Row']

type TicketStatusHistory = Database['public']['Tables']['ticket_status_history']['Row']

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    requester: User;
    assignee?: User | null;
    organization: Organization;
    priority: TicketPriority;
    ticketNumber: number | 123;
    tags: { name: string }[] | [];
    custom_fields: { name: string, value: string }[] | [];
    ticket_status_history: TicketStatusHistory[] | [];
}

interface Message {
    id: string
    content: string
    is_internal: boolean
    created_at: string
    user: User
}

type ChatEvent = Message | TicketStatusHistory
interface TicketViewProps {
    ticketId: string;
    realtimeEvent: RealtimeEvent | null;
    userRole: RoleCategory; // ('agent', 'admin') means Employee | ('manager', 'member') means Customer
}

export function TicketView({ ticketId, realtimeEvent, userRole }: TicketViewProps) {
    const [user, setUser] = useState<User | null>(null)
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [requester, setRequester] = useState<User | null>(null)
    const [assignee, setAssignee] = useState<User | null>(null)
    const [statuses, setStatuses] = useState<TicketStatus[]>([])
    const [statusHistory, setStatusHistory] = useState<TicketStatusHistory[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [messageInput, setMessageInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<string>('')
    const [userProfiles, setUserProfiles] = useState<Record<string, User>>({})
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const hasScrolledToBottomRef = useRef(false)
    const wasAtBottomRef = useRef(false)

    // Function to check if scrolled to bottom
    const isAtBottom = () => {
        const container = chatContainerRef.current
        if (!container) return false

        const threshold = 50 // pixels from bottom to consider "at bottom"
        return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
    }

    // Function to scroll to bottom
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
            setHasUnreadMessages(false)
        }
    }

    // Initial scroll after data loads - only once
    useEffect(() => {
        if (!loading && messages.length > 0 && !hasScrolledToBottomRef.current) {
            scrollToBottom()
            hasScrolledToBottomRef.current = true
        }

        const container = chatContainerRef.current
        if (!container) return

        const handleScroll = () => {
            const isCurrentlyAtBottom = isAtBottom()

            wasAtBottomRef.current = isCurrentlyAtBottom

            // If we're at the bottom, clear unread messages
            if (isCurrentlyAtBottom) {
                setHasUnreadMessages(false)
            }
        }
        // Add both scroll and wheel event listeners for more reliable detection
        container.addEventListener('scroll', handleScroll)
        container.addEventListener('wheel', handleScroll)

        // Also check on any resize events
        window.addEventListener('resize', handleScroll)

        return () => {
            container.removeEventListener('scroll', handleScroll)
            container.removeEventListener('wheel', handleScroll)
            window.removeEventListener('resize', handleScroll)
        }
    }, [loading, messages.length])

    // // Add scroll event listener to track if user is at bottom and check for unread messages
    // useEffect(() => {

    // }, [])

    // Function to fetch ticket data
    const fetchTicketData = async (session: any) => {
        try {
            const response = await fetch(
                `/tickets/${ticketId}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            console.log(response);
            const { data, error: apiError } = await response.json()
            if (apiError) {
                throw new Error(apiError)
            }

            if (!data) {
                throw new Error('No data returned from API')
            }

            setUser(session.user.id === data.ticket.requester.id ? data.ticket.requester : data.ticket.assignee)
            setTicket(data.ticket)
            setMessages(data.messages)
            setAssignee(data.ticket.assignee)
            setRequester(data.ticket.requester)
            if (['member', 'manager'].includes(userRole)) {
                setStatuses(data.statuses.filter((status: TicketStatus) => status.customer_access || status.status === data.ticket.status))
            } else {
                setStatuses(data.statuses)
            }
            setStatusHistory(data.ticket.ticket_status_history)

            // Add requester profile to userProfiles if available
            if (data.ticket.requester) {
                setUserProfiles(prev => ({
                    ...prev,
                    [data.ticket.requester.id]: {
                        id: data.ticket.requester.id,
                        name: getUserName(data.ticket.requester, 'Unknown User'),
                        profile: data.ticket.requester.profile,
                        email: data.ticket.requester.email,
                        role: data.ticket.requester.role.roleCategory,
                    }
                }))
            }

            // Add assignee profile to userProfiles if available
            if (data.ticket.assignee) {
                setUserProfiles(prev => ({
                    ...prev,
                    [data.ticket.assignee.id]: {
                        id: data.ticket.assignee.id,
                        name: getUserName(data.ticket.assignee, 'Unknown User'),
                        profile: data.ticket.assignee.profile,
                        email: data.ticket.assignee.email,
                        role: data.ticket.assignee.role.roleCategory,
                    }
                }))
            }

            // Fetch profiles for any comment authors not in userProfiles
            const uniqueAuthorIds : string[] = Array.from(
                new Set(
                    data.messages
                        .map((message: Message) => message.user.id)
                        .filter((authorId: string) =>
                        authorId &&
                        authorId !== data.ticket.requester?.id &&
                        authorId !== data.ticket.assignee?.id
                    )
                )
            )

            // Fetch profiles for authors we don't have yet
            for (const authorId of uniqueAuthorIds) {
                const profile = await getUserProfile(authorId as string, session)
                if (profile) {
                    setUserProfiles(prev => ({
                        ...prev,
                        [authorId as string]: profile
                    }))
                }
            }

            for (const status of statusHistory) {
                if (!userProfiles[status.changed_by!]) {
                    const authorProfile = await getUserProfile(status.changed_by!, session);
                    if (authorProfile) {
                            setUserProfiles(prev => ({
                            ...prev,
                            [status.changed_by!]: authorProfile
                        }))
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data')
        }
    }

    // Function to fetch user profile
    const fetchUserProfile = async (userId: string, session: any) => {
        try {
            const response = await fetch(
                `/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            const { user, error } = await response.json()
            if (error) throw new Error(error)

            // Add the user profile to local storage
            setUserProfiles(prev => ({
                ...prev,
                [userId]: user
            }))

            return user
        } catch (err) {
            console.error(`Failed to fetch user profile for ${userId}:`, err)
            return null
        }
    }

    // Function to get user profile (from local storage or fetch)
    const getUserProfile = async (userId: string, session: any) => {
        if (userProfiles[userId]) {
            return userProfiles[userId]
        }
        return await fetchUserProfile(userId, session)
    }

    // Initial data fetch
    useEffect(() => {
        async function initializeTicketData() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    setError('No active session')
                    return
                }

                await fetchTicketData(session)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data')
            } finally {
                setLoading(false)
            }
        }

        initializeTicketData()
    }, [])

    // Handle real-time events
    useEffect(() => {
        console.log('realtimeEvent', realtimeEvent);
        if (!realtimeEvent) return;

        const handleRealtimeEvent = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            // Store scroll position state before updates
            wasAtBottomRef.current = isAtBottom()


            // Handle ticket updates
            if (realtimeEvent.table === 'tickets' &&
                realtimeEvent.eventType === 'UPDATE' &&
                realtimeEvent.payload.new.id === ticketId) {
                await fetchTicketData(session);
            }

            // Handle message changes
            if (realtimeEvent.table === 'messages') {
                const messagePayload = realtimeEvent.payload.new;

                // Only process messages for this ticket
                if (messagePayload.ticket_id === ticketId) {
                    if (realtimeEvent.eventType === 'INSERT') {
                        // Get the author profile
                        const authorProfile = await getUserProfile(messagePayload.user_id, session);
                        if (authorProfile) {
                            // Add the new message to state
                            const newMessage: Message = {
                                id: messagePayload.id,
                                content: messagePayload.content,
                                is_internal: messagePayload.is_internal,
                                created_at: messagePayload.created_at,
                                user: authorProfile
                            };

                            setMessages(prevMessages => {
                                const newMessages = [...prevMessages, newMessage]

                                // If we were at bottom, scroll to bottom after render
                                if (wasAtBottomRef.current) {
                                    setTimeout(scrollToBottom, 15)
                                    // scrollToBottom()
                                } else {
                                    // If we weren't at bottom, show unread messages indicator
                                    setHasUnreadMessages(true)
                                }
                                return newMessages
                            });
                        }
                    } else if (realtimeEvent.eventType === 'UPDATE') {
                        // Update the existing comment
                        setMessages(prevMessages =>
                            prevMessages.map(message =>
                                message.id === messagePayload.id
                                    ? {
                                        ...message,
                                        content: messagePayload.content,
                                        is_internal: messagePayload.is_internal,
                                    }
                                    : message
                            )
                        );
                    }
                }
            }
        };

        handleRealtimeEvent();
    }, [realtimeEvent]);

    useEffect(() => {
        if (ticket) {
            setSelectedStatus(ticket.status);
        }
    }, [ticket]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || isSending) return;

        try {
            setIsSending(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No active session');
            }
            console.log(session);
            const userProfile = await getUserProfile(session.user.id, session);
            if (!userProfile) {
                throw new Error('Failed to fetch user profile');
            }

            const { error: insertError } = await supabase
                .from('messages')
                .insert({
                    ticket_id: ticketId,
                    content: messageInput.trim(),
                    is_internal: false,
                    user_id: session.user.id,
                });

            if (insertError) throw insertError;

            // Clear the input
            setMessageInput('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const updateTicketStatus = async () => {
        // Don't update if status hasn't changed
        if (!ticket || selectedStatus === ticket.status) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No active session');
            }

            const response = await fetch(`/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: selectedStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update ticket status');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update ticket status');
        }
    };

    const renderMessage = (message: Message) => {
        // Try to get author info from userProfiles first
        const authorProfile = userProfiles[message.user.id]
        const authorName = authorProfile ? authorProfile.name : getUserName(message.user, 'Unknown User')

        return (
            <div key={`${message.id}-${message.created_at}`} className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0">
                    {/* {authorProfile?.avatarUrl && (
                                            <img
                                                src={authorProfile.avatarUrl}
                                                alt={authorName}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        )} */}
                    {/* <span>{authorName}</span> */}
                </div>
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{authorName}</span>
                        <span className="text-sm text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                        </span>
                        {message.is_internal && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                Internal Note
                            </span>
                        )}
                    </div>
                    <div className={`rounded-lg p-3 ${!message.is_internal ? 'bg-blue-50' : 'bg-gray-100'}`}>
                        <p className="text-left">{message.content}</p>
                    </div>
                </div>
            </div>
        )
    };

    const renderStatusHistory = (statusHistory: TicketStatusHistory) => {
        // Try to get author info from userProfiles first
        const authorProfile = userProfiles[statusHistory.changed_by!]
        const authorName = authorProfile ? getUserName(authorProfile, 'Unknown User') : 'Unknown User'
        return (
            <div key={`${statusHistory.id}-${statusHistory.changed_at}`} className="flex space-x-3 justify-end ml-auto">
                <div>
                    <div className="flex items-center space-x-2 mb-1 justify-end">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                        <span className="font-medium">{authorName}</span>
                        <span className="text-sm text-gray-500">
                            {new Date(statusHistory.changed_at!).toLocaleString()}
                        </span>
                    </div>
                    <div className={`rounded-lg p-3 bg-orange-100 text-orange-700 max-w-[80%] ml-auto`}>
                        <p className="text-right">{statusHistory.old_status ? `${statusHistory.old_status} → ${statusHistory.new_status}` : 'Created Ticket'}</p>
                    </div>
                </div>
            </div>
        )
    };

    const renderChat = () => {
        const combinedArray = [...messages, ...statusHistory];
        combinedArray.sort((a, b) => {
            const dateA = 'created_at' in a ? a.created_at : a.changed_at;
            const dateB = 'created_at' in b ? b.created_at : b.changed_at;
            return new Date(dateA!).getTime() - new Date(dateB!).getTime();
        });
        return combinedArray.map((event) => {
            if ('created_at' in event) {
                return renderMessage(event as Message);
            } else {
                return renderStatusHistory(event as TicketStatusHistory);
            }
        });
    }   

    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>
    if (!user || !ticket) return <div>Data not found</div>

    return (
        <div className="flex h-full">
            <div className="w-80 flex-shrink-0 border-r bg-white">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-medium">
                            {getUserName(requester, 'Unknown Requester')}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                        <span>{ticket.subject}</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-sm">
                            {ticket.status}
                        </span>
                        <span className="text-gray-500">Ticket #123</span>
                    </div>
                </div>
                <div className="p-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Organization
                            </label>
                            <select className="w-full p-2 border rounded">
                                <option>{ticket.organization?.name || 'No Organization'}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Requester
                            </label>
                            <select className="w-full p-2 border rounded">
                                <option>{getUserName(requester, 'Unknown Requester')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Assignee
                            </label>
                            <select className="w-full p-2 border rounded">
                                <option>
                                    {assignee?.email || 'Unassigned'}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-white min-w-0">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mb-1">
                        <h1 className="text-xl font-medium text-left">
                            Conversation with {getUserName(requester, 'Unknown Requester')}
                        </h1>
                        <div className="flex items-center space-x-2">
                            <select 
                                className="p-2 border rounded"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                {statuses.map((status) => (
                                    <option key={status.status} value={status.status}>
                                        {status.status}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={updateTicketStatus}
                                disabled={!ticket || selectedStatus === ticket.status}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                    <div className="text-sm text-red-500 text-left mb-2">
                        Via {ticket.channel || 'unknown channel'}
                    </div>
                    <div
                        className="relative text-sm text-gray-600 text-left cursor-pointer group"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                        <div className={`${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                            {ticket.description}
                        </div>
                        <button
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label={isDescriptionExpanded ? 'Collapse description' : 'Expand description'}
                        >
                            {isDescriptionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                        {renderChat()}
                    </div>
                    {/* New messages indicator in its own container */}
                    <div className="relative h-0">
                        {hasUnreadMessages && (
                            <div
                                className="absolute left-1/2 -top-4 -translate-x-1/2 bg-blue-500 text-white text-sm px-3 py-1.5 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors mx-auto w-fit z-10"
                                onClick={scrollToBottom}
                            >
                                New messages ↓
                            </div>
                        )}
                    </div>
                </div>
                <div className="border-t p-4 bg-white">
                    <div className="border rounded-lg">
                        <div className="p-3">
                            <textarea
                                placeholder="Write a message..."
                                className="w-full resize-none focus:outline-none"
                                rows={3}
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
                            <div className="flex items-center space-x-2">
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <Paperclip size={20} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <Smile size={20} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <Link2 size={20} />
                                </button>
                            </div>
                            <button
                                className={`px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim() || isSending}
                            >
                                {isSending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-70 flex-shrink-0 border-l bg-white">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full">
                                {/* {requester?.avatarUrl && (
                                    <img
                                        src={requester.avatarUrl}
                                        alt={requester?.name || 'Unknown Requester'}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                )} */}
                            </div>
                            <span className="font-medium">
                                {getUserName(requester, 'Unknown Requester')}
                            </span>
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <Maximize2 size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Email
                            </label>
                            <div className="text-blue-600">{requester?.email}</div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Role
                            </label>
                            <div className="capitalize">{requester?.role?.roleCategory || 'Unknown Role'}</div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Local time
                            </label>
                            <div>
                                {new Date(ticket.created_at || '').toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Language
                            </label>
                            <div>English (United States)</div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Notes
                            </label>
                            <textarea
                                className="w-full p-2 border rounded"
                                defaultValue="Valuable Customer since 2010"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 