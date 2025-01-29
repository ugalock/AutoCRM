import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Database, AutoCRM } from '@db/types';

type KnowledgeBaseArticle = Database['public']['Tables']['knowledge_base']['Row'];

export class KnowledgeBaseService {
  private vectorStore: MemoryVectorStore;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large',
      // Add your OpenAI API configuration
    });
    this.vectorStore = new MemoryVectorStore(this.embeddings);
  }

  async initializeKnowledgeBase(articles: KnowledgeBaseArticle[]) {
    const transformer = new HtmlToTextTransformer();
    const documents = articles.map(
      (article) =>
        new Document({
          pageContent: article.content.replace('{kbtitle}', article.title),
          metadata: {
            organization_id: article.organization_id,
            category: article.category,
            id: article.id,
          },
        })
    );
    const transformedDocuments = await transformer.transformDocuments(documents);
    await this.vectorStore.addDocuments(transformedDocuments);
  }

  async findRelevantArticles(query: string, organization: string) {
    const filter = (doc: Document) => doc.metadata.organization_id === organization || doc.metadata.organization_id === AutoCRM.id;
    return await this.vectorStore.similaritySearch(query, 3, filter);
  }
}