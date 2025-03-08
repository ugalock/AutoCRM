import { supabase } from '@db';
import { Database } from '@db/types';
import { KnowledgeBaseService } from './kb';
import { AIAgent } from './agent';

type KnowledgeBaseArticle = Database['public']['Tables']['knowledge_base']['Row'];

const { data, error } = await supabase.from('knowledge_base').select('*');
if (error) {
    console.error(error);
}

const kbService = new KnowledgeBaseService();
kbService.initializeKnowledgeBase(data as KnowledgeBaseArticle[]);

const aiAgent = new AIAgent(kbService);

export { kbService, aiAgent };
