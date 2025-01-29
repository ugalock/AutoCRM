import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@db';

interface Organization {
    id: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, organization_id: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    organizations: Organization[];
    loadingOrgs: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);

    useEffect(() => {
        // Load organizations
        const loadOrganizations = async () => {
            try {
                const { data: orgs, error } = await supabase
                    .from('organizations')
                    .select('id, name');
                
                if (error) throw error;
                setOrganizations(orgs || []);
            } catch (error) {
                console.error('Error loading organizations:', error);
            } finally {
                setLoadingOrgs(false);
            }
        };

        loadOrganizations();

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const res = await supabase.from('users').select('*').eq('email', email).single();
        if (!res.data) throw new Error('User not found');
        return res.data.organization_id === '9066e91f-faa2-4a68-8749-af0582dd435c';
    };

    const signUp = async (email: string, password: string, organization_id: string) => {
        // First create the Supabase auth user
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        // Then create the user record in our database
        const response = await fetch('/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                organization_id,
                user_id: data.user!.id,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create user');
        }
        return organization_id === '9066e91f-faa2-4a68-8749-af0582dd435c';
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        organizations,
        loadingOrgs,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;