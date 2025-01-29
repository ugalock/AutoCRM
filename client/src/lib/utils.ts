import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Database } from "@db/types";

type DatabaseUser = Database['public']['Tables']['users']['Row'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserName(user: DatabaseUser | null | undefined, defaultName: string = 'Unknown'): string {
    if (!user) return defaultName;
    if (user.profile && typeof user.profile === 'object' && "name" in user.profile) {
        return user.profile.name as string;
    }
    return user.email.split('@')[0] || defaultName;
}
