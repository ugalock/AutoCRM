import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface LoginFormData {
    email: string;
    password: string;
}

const Login: React.FC = () => {
    const { signIn, signUp } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            if (isRegistering) {
                await signUp(formData.email, formData.password);
                setError('Registration successful! Please check your email to verify your account.');
            } else {
                await signIn(formData.email, formData.password);
            }
        } catch (err) {
            setError(isRegistering ? 'Failed to register.' : 'Failed to sign in. Please check your credentials.');
            console.error(isRegistering ? 'Registration error:' : 'Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                        {isRegistering ? 'Create an Account' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isRegistering
                            ? 'Enter your details to create your account'
                            : 'Enter your credentials to access your account'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <Alert className={`mb-6 ${error.includes('successful')
                                ? 'bg-primary/10 text-primary'
                                : 'bg-destructive/10 text-destructive border-destructive/50'
                            }`}>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="transition-all duration-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="transition-all duration-200"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isRegistering ? 'Creating account...' : 'Signing in...'}
                                </span>
                            ) : (
                                isRegistering ? 'Create account' : 'Sign in'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={toggleMode}
                        className="w-full"
                        disabled={loading}
                    >
                        {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Create one'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;