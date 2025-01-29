import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@db';
import { Database } from '@db/types';

type Organization = Database['public']['Tables']['organizations']['Row'];
interface KnowledgeBaseArticle {
    id: string;
    title: string;
    content: string;
    category: string | null;
    organization_id: string | null;
    organizations: Organization | null;
}

type GroupedArticles = Record<string, Record<string, KnowledgeBaseArticle[]>>;

const KnowledgeBase: React.FC = () => {
    const [articles, setArticles] = useState<GroupedArticles>({});
    const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { articleId } = useParams();

    // Function to find an article by ID in the grouped articles
    const findArticleById = (articles: GroupedArticles, id: string): KnowledgeBaseArticle | null => {
        console.log(id)
        for (const orgArticles of Object.values(articles)) {
            for (const categoryArticles of Object.values(orgArticles)) {
                const found = categoryArticles.find(article => article.id === id);
                if (found) return found;
            }
        }
        return null;
    };

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                const response = await fetch(`/kb`, {
                    method: 'GET',
                    headers: session ? {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    } : {'Content-Type': 'application/json'}
                });
                const { articles, error } = await response.json();
                if (error) throw error;
                setArticles(articles);

                // If there's an articleId in the URL, try to find and select that article
                if (articleId) {
                    const article = findArticleById(articles, articleId);
                    if (article) {
                        setSelectedArticle(article);
                    } else {
                        setError('Article not found');
                        // throw new Error('Article not found');
                        navigate('/kb');
                    }
                }

                setError(null);
            } catch (err) {
                setError('Failed to fetch knowledge base articles');
                console.error('Error fetching articles:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [articleId]);

    const handleArticleSelect = (article: KnowledgeBaseArticle) => {
        setSelectedArticle(article);
        navigate(`/kb/${article.id}`);
    };

    const handleBack = () => {
        setSelectedArticle(null);
        navigate('/kb');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    if (selectedArticle) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <button
                    onClick={handleBack}
                    className="mb-4 text-blue-500 hover:text-blue-700"
                >
                    ← Back to Articles
                </button>
                <h1 className="text-2xl font-bold mb-4">{selectedArticle.title}</h1>
                <hr />
                <div dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/{kbtitle}/g, selectedArticle.title) }} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Knowledge Base</h1>
            
            {Object.entries(articles).map(([orgName, categories]) => (
                <div key={orgName} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{orgName}</h2>
                    
                    {Object.entries(categories).map(([category, categoryArticles]) => (
                        <div key={category} className="mb-6">
                            <h3 className="text-xl font-medium mb-3">{category}</h3>
                            <ul className="space-y-2">
                                {categoryArticles.map((article) => (
                                    <li key={article.id}>
                                        <button
                                            onClick={() => handleArticleSelect(article)}
                                            className="text-blue-500 hover:text-blue-700 text-left"
                                        >
                                            {article.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default KnowledgeBase; 