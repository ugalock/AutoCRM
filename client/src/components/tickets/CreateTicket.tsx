import { useState, useEffect } from "react";
import ReactTooltip, { Tooltip } from 'react-tooltip';
import Select from 'react-select';
import { Plus, Minus } from 'lucide-react';
import { supabase } from "@db";
import { type Database, AutoCRM } from "@db/types";
import { TicketPriority } from "@/types/workspace";

type Organization = Database['public']['Tables']['organizations']['Row'];
type Team = Database['public']['Tables']['teams']['Row'] & { organizations: Organization };

interface CreateTicketProps {
    userId: string;
    teams: Team[];
    initialValues?: { team_name: string, subject: string, description: string } | null;
}

export function CreateTicket({ userId, teams, initialValues }: CreateTicketProps) {
    const [loading, setLoading] = useState(false);
    const [hoveredOption, setHoveredOption] = useState<Team | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        team_id: '',
        subject: '',
        description: '',
        priority: 'normal' as TicketPriority,
    });

    // Handle initialValues changes
    useEffect(() => {
        if (initialValues) {
            setIsExpanded(true);
            const newFormData = {
                team_id: teams.find(team => team.name === initialValues.team_name)?.id || '',
                subject: initialValues.subject,
                description: initialValues.description,
            }
            setFormData(prev => ({
                ...prev,
                ...newFormData
            }));
        }
    }, [initialValues]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session found');

            const response = await fetch('/tickets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    customer_id: userId,
                    channel: 'chat'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create ticket');
            }

            // Reset form after successful submission
            setFormData({
                team_id: '',
                subject: '',
                description: '',
                priority: 'normal',
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMouseEnter = (option: Team) => {
        setHoveredOption(option);
    };

    const handleMouseLeave = () => {
        setHoveredOption(null);
    };

    return (
        <div className="pl-6 w-[450px]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-left">Create New Ticket</h2>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    {isExpanded ? (
                        <Minus className="w-5 h-5 text-gray-500" />
                    ) : (
                        <Plus className="w-5 h-5 text-gray-500" />
                    )}
                </button>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white rounded-lg border p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
                                Team
                            </label>
                            <select
                                id="team"
                                name="team_id"
                                value={formData.team_id}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="">Select a team</option>
                                {teams.map(team => (
                                    team.organization_id === AutoCRM.id ? (
                                        <option
                                            key={team.id}
                                            value={team.id}
                                            onMouseEnter={() => handleMouseEnter(team)}
                                            onMouseLeave={handleMouseLeave}
                                            className={`${hoveredOption?.id === team.id ? 'bg-gray-100' : ''}`}
                                            data-tip={team.description}
                                        >
                                            {team.name}
                                        </option>
                                    ) : null
                                ))}
                            </select>
                            {hoveredOption && (
                                <div className="absolute left-0 top-0 w-full h-full bg-gray-100 opacity-50 z-10">
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-white rounded-lg p-4">
                                        <p className="text-sm text-gray-700">{hoveredOption.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Brief description of the issue"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Provide more details about your issue"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
} 