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
interface Account {
    accountId: string
    name: string
    subdomain: string
    endUserAccountCreationType: 'submit_ticket' | 'sign_up'
}

type RoleCategory = 'agent' | 'admin' | 'owner' | 'customer'

interface Role {
    roleCategory: RoleCategory
}

type User = Database['public']['Tables']['users']['Row'] & {
    role: Role
}

type Organization = Database['public']['Tables']['organizations']['Row']

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    requester: User;
    assignee?: User | null;
    organization: Organization;
    priority: TicketPriority;
    ticketNumber: number | 123;
    tags: { name: string }[] | [];
    custom_fields: { name: string, value: string }[] | [];
}

interface Message {
    id: string
    content: string
    is_internal: boolean
    created_at: string
    user: User
}

interface TicketViewProps {
    ticketId: string;
    realtimeEvent: RealtimeEvent | null;
}

export function TicketView({ ticketId, realtimeEvent }: TicketViewProps) {
    const [account, setAccount] = useState<Account | null>(null)
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [requester, setRequester] = useState<User | null>(null)
    const [assignee, setAssignee] = useState<User | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [messageInput, setMessageInput] = useState('')
    const [isSending, setIsSending] = useState(false)
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

            setAccount(data.account)
            setTicket(data.ticket)
            setMessages(data.messages)
            setAssignee(data.assignee)
            setRequester(data.requester)

            // Add requester profile to userProfiles if available
            if (data.requester) {
                setUserProfiles(prev => ({
                    ...prev,
                    [data.requester.userId]: {
                        id: data.requester.userId,
                        name: data.requester.name,
                        email: data.requester.email,
                        role: data.requester.userType,
                    }
                }))
            }

            // Add assignee profile to userProfiles if available
            if (data.assignee) {
                setUserProfiles(prev => ({
                    ...prev,
                    [data.assignee.userId]: {
                        id: data.assignee.userId,
                        name: data.assignee.name,
                        email: data.assignee.email,
                        role: data.assignee.userType,
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
                        authorId !== data.requester?.id &&
                        authorId !== data.assignee?.id
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

            const { data, error } = await response.json()
            if (error) throw new Error(error)

            // Add the user profile to local storage
            setUserProfiles(prev => ({
                ...prev,
                [userId]: data
            }))

            return data
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
    }, [ticketId])

    // Handle real-time events
    useEffect(() => {
        if (!realtimeEvent) return;

        const handleRealtimeEvent = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            // Store scroll position state before updates
            wasAtBottomRef.current = isAtBottom()


            // Handle ticket updates
            if (realtimeEvent.table === 'tickets' &&
                realtimeEvent.eventType === 'UPDATE' &&
                realtimeEvent.payload.new.ticketId === ticketId) {
                await fetchTicketData(session);
            }

            // Handle message changes
            if (realtimeEvent.table === 'messages') {
                const messagePayload = realtimeEvent.payload.new;

                // Only process messages for this ticket
                if (messagePayload.ticketId === ticketId) {
                    if (realtimeEvent.eventType === 'INSERT') {
                        // Get the author profile
                        const authorProfile = await getUserProfile(messagePayload.user.id, session);

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
    }, [realtimeEvent, ticketId]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || isSending) return;

        try {
            setIsSending(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No active session');
            }
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

    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>
    if (!account || !ticket) return <div>Data not found</div>

    return (
        <div className="flex h-full">
            <div className="w-64 flex-shrink-0 border-r bg-white">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-medium">
                            {requester?.email || 'Unknown Requester'}
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
                                <option>{requester?.email || 'Unknown Requester'}</option>
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
                    <h1 className="text-xl font-medium mb-1 text-left">
                        Conversation with {requester?.email || 'Unknown Requester'}
                    </h1>
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
                        {messages.map((message) => {
                            // Try to get author info from userProfiles first
                            const authorProfile = userProfiles[message.user.id]
                            const authorName = authorProfile?.email.split('@')[0] || message.user?.email.split('@')[0] || 'Unknown User'

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
                                        <span>{authorName}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-medium">{authorName}</span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(message.created_at).toLocaleString()}
                                            </span>
                                            {!message.is_internal && (
                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                    Internal Note
                                                </span>
                                            )}
                                        </div>
                                        <div className={`rounded-lg p-3 ${message.is_internal ? 'bg-blue-50' : 'bg-gray-100'}`}>
                                            <p className="text-left">{message.content}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
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
            <div className="w-80 flex-shrink-0 border-l bg-white">
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
                                {requester?.email.split('@')[0] || 'Unknown Requester'}
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