import { useEffect, useState, useRef } from 'react';
import { Plus, X, MessageCircle } from 'lucide-react';
import { getUserName } from '@/lib/utils';
import { Database } from '@db/types';
import { aiAgent } from "@services";
import { Organization } from '@/components/views/DashboardView';
import { AutoCRM } from '@db/types';
type RoleCategory = 'agent' | 'admin' | 'manager' | 'member'

interface Role {
    roleCategory: RoleCategory
}

type User = Database['public']['Tables']['users']['Row'] & {
    role: Role
}

type Team = Database['public']['Tables']['teams']['Row'] & { organizations: Organization };

interface ChatMessage {
    id: string;
    content: string;
    timestamp: string;
    isAI: boolean;
    isTicket?: boolean;
    userId?: string;
}

interface ConversationHistory {
    userId: string;
    messages: ChatMessage[];
}

interface ChatTab {
    id: string;
    title: string;
    messages: ChatMessage[];
    funcArgs: Map<string, any>;
}

interface SerializedChatTab {
    id: string;
    title: string;
    messages: ChatMessage[];
    funcArgs: [string, any][];
}

interface AIChatProps {
    currentUser: User | null;
    isActive: boolean;
    onClose: () => void;
    teams: Team[];
    onTicketCreate?: (args: { team_name: string, subject: string, description: string }) => void;
}

export function AIChat({ currentUser, isActive, onClose, teams, onTicketCreate }: AIChatProps) {
    // console.log(currentUser);
    const [tabs, setTabs] = useState<ChatTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Load chat history from local storage on mount
    useEffect(() => {
        const savedChats = localStorage.getItem('aiChats');
        if (savedChats) {
            const serializedChats: SerializedChatTab[] = JSON.parse(savedChats);
            const parsedChats: ChatTab[] = serializedChats.map(chat => ({
                id: chat.id,
                title: chat.title,
                messages: chat.messages,
                funcArgs: new Map(chat.funcArgs),
            }));
            setTabs(parsedChats);
            // Set active tab to the last active one or the first tab
            const lastActiveTab = localStorage.getItem('activeAIChatTab');
            if (lastActiveTab && parsedChats.find((tab: ChatTab) => tab.id === lastActiveTab)) {
                setActiveTabId(lastActiveTab);
            } else if (parsedChats.length > 0) {
                setActiveTabId(parsedChats[0].id);
            } else {
                createNewChat();
            }
        }
    }, []);

    // Save chat history to local storage whenever it changes
    useEffect(() => {
        if (tabs.length > 0) {
            const serializedTabs: SerializedChatTab[] = tabs.map(tab => ({
                id: tab.id,
                title: tab.title,
                messages: tab.messages,
                funcArgs: Array.from(tab.funcArgs.entries()),
            }));
            localStorage.setItem('aiChats', JSON.stringify(serializedTabs));
        }
        if (activeTabId) {
            localStorage.setItem('activeAIChatTab', activeTabId);
        }
    }, [tabs, activeTabId]);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [tabs]);

    const createNewChat = () => {
        const newTab: ChatTab = {
            id: `chat-${Date.now()}`,
            title: 'New Chat',
            messages: [],
            funcArgs: new Map<string, any>(),
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    };

    const closeTab = (tabId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        const newTabs = tabs.filter(tab => tab.id !== tabId);
        if (activeTabId === tabId && newTabs.length > 0) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
        setTabs(newTabs);
        if (newTabs.length === 0) {
            createNewChat();
        }
    };

    const handleButtonClick = (messageId: string) => {
        const args = tabs.find(tab => tab.id === activeTabId)?.funcArgs.get(messageId);
        if (args && onTicketCreate) {
            console.log(args);
            onTicketCreate(args);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || isSending || !activeTabId) return;

        try {
            setIsSending(true);
            const timestamp = new Date().toISOString();
            const msgId = `msg-${timestamp}`;
            const newMessage: ChatMessage = {
                id: msgId,
                content: messageInput.trim(),
                timestamp: timestamp,
                isAI: false,
                userId: currentUser?.id,
            };

            // Update the tab's messages and title if it's the first message
            setTabs(prev => prev.map(tab => {
                if (tab.id === activeTabId) {
                    const updatedMessages = [...tab.messages, newMessage];
                    return {
                        ...tab,
                        title: tab.messages.length === 0 ? messageInput.trim() : tab.title,
                        messages: updatedMessages,
                    };
                }
                return tab;
            }));

            // Clear the input
            setMessageInput('');
            
            let aiResponse = "I'm an AI assistant. How can I help you today?";
            const ai_timestamp = new Date().toISOString();
            const aiMsgId = `msg-${ai_timestamp}`;
            let isTicket = false;
            if (currentUser) {
                const chatHistory: ConversationHistory = {
                    userId: currentUser.id,
                    messages: [],
                };
                for (const tab of tabs) {
                    if (tab.id === activeTabId) {
                        chatHistory.messages = tab.messages.slice(0, -1);
                    }
                }
                // article_id, ticket, response
                const response = await aiAgent.handleChatQuery(messageInput, currentUser.organization_id!, teams.filter(team => team.organization_id === AutoCRM.id), chatHistory);
                if (response.article_id) {
                    aiResponse = `I found an article that might help you: <a href="/kb/${response.article_id}" target="_blank" class="text-blue-500 hover:text-blue-700 underline">Here</a>`;
                } else if (response.ticket) {
                    const ticket = response.ticket;
                    const team = teams.find(team => team.name === ticket.team_name);
                    if (!team) {
                        throw new Error(`Team ${ticket.team_name} not found`);
                    }
                    tabs.find(tab => tab.id === activeTabId)?.funcArgs.set(aiMsgId, {team_id: team.id, subject: ticket.subject, description: ticket.description});
                    const ticketButton = `<button onclick="handleButtonClick('${aiMsgId}')" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">Create Ticket</button>`;
                    aiResponse = `It sounds like you might need to talk to a human agent. Here's a button to create a ticket:`;
                    isTicket = true;
                } else {
                    aiResponse = response.response;
                }
            }
            const msg: ChatMessage = {
                id: aiMsgId,
                content: aiResponse,
                timestamp: ai_timestamp,
                isAI: true,
                isTicket: isTicket,
            };
            setTabs(prev => prev.map(tab => {
                if (tab.id === activeTabId) {
                    return {
                        ...tab,
                        messages: [...tab.messages, msg],
                    };
                }
                return tab;
            }));
            setIsSending(false);

        } catch (error) {
            console.error('Failed to send message:', error);
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isActive) return null;

    return (
        <div className="relative bg-gray-100 border-r w-80 transition-all duration-300 ease-in-out flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-white items-center">
                <h2 className="font-medium">AI Support</h2>
            </div>

            {/* Tabs */}
            <div className="border-b bg-white">
                <div className="flex items-center overflow-x-auto">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`
                                flex items-center px-4 py-2 border-r cursor-pointer font-medium
                                ${activeTabId === tab.id ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}
                            `}
                            onClick={() => setActiveTabId(tab.id)}
                        >
                            <div className="flex items-center w-full">
                                <div className="truncate max-w-[120px]" title={tab.title}>
                                    {tab.title}
                                </div>
                                <button
                                    className="ml-2 p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
                                    onClick={(e) => closeTab(tab.id, e)}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={createNewChat}
                        className="px-3 py-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-r flex items-center"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={chatContainerRef}>
                {activeTabId && tabs.find(tab => tab.id === activeTabId)?.messages.map(message => (
                    <div
                        key={message.id}
                        className={`flex space-x-3 ${message.isAI ? '' : 'justify-end'}`}
                    >
                        <div className={`max-w-[85%] ${message.isAI ? '' : 'ml-auto'}`}>
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium">
                                    {message.isAI ? 'AI Support' : getUserName(currentUser)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {new Date(message.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className={`rounded-lg p-3 ${message.isAI ? 'bg-white' : 'bg-blue-400 ml-auto text-white'}`}>
                                <p 
                                    className={`text-left ${message.isAI ? '' : 'text-right'}`}
                                    dangerouslySetInnerHTML={{ __html: message.content }}
                                />
                            </div>
                            {message.isTicket && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <button onClick={() => handleButtonClick(message.id)} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">Create Ticket</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Message Input */}
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
                        <div></div>
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
    );
} 