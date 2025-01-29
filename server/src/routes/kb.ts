import { Router, type Response } from 'express';
import { supabase } from '@db';
import { Database, AutoCRM } from '@db/types';
import { softVerifyAuth } from '@server/middleware/auth';
import { type UserRequest } from '@server/types/types';
const router = Router();

type Organization = Database['public']['Tables']['organizations']['Row'];
type KnowledgeBase = Database['public']['Tables']['knowledge_base']['Row'];
type KnowledgeBaseArticle = KnowledgeBase & {
    organizations: Organization;
};

// GET /kb - List all knowledge base articles
router.get('/', softVerifyAuth, async (req: UserRequest, res: Response) => {
    try {
        // Fetch all knowledge base articles
        const { data: articles, error } = await supabase
            .from('knowledge_base')
            .select(`
                *,
                organizations(*)
            `)
            .or(`organization_id.eq.${AutoCRM.id},organization_id.eq.${req.user?.id || '1'}`)
            .order('organization_id')
            .order('category')
            .order('title');

        if (error) throw error;

        // Group articles by organization and category
        const groupedArticles = articles.reduce((acc: Record<string, Record<string, KnowledgeBaseArticle[]>>, article) => {
            const orgName = article.organizations?.name || 'General';
            const category = article.category || 'Uncategorized';

            if (!acc[orgName]) {
                acc[orgName] = {};
            }
            if (!acc[orgName][category]) {
                acc[orgName][category] = [];
            }
            acc[orgName][category].push(article);
            return acc;
        }, {});

        res.json({articles: groupedArticles});
    } catch (error) {
        console.error('Error fetching knowledge base articles:', error);
        res.status(500).json({ error: 'Failed to fetch knowledge base articles' });
    }
});

export default router; 