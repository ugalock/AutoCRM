import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { Document } from '@langchain/core/documents';
import { KnowledgeBaseService } from './kb';
import { Database } from '@db/types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type Team = Database['public']['Tables']['teams']['Row'] & { organizations: Organization };

interface Ticket {
    team_name: string;
    organization_id: string;
    subject: string;
    description: string;
}

interface ChatMessage {
    id: string;
    content: string;
    timestamp: string;
    isAI: boolean;
    userId?: string;
}

interface ConversationHistory {
    userId: string;
    messages: ChatMessage[];   
}

export class AIAgent {
  private model: ChatOpenAI;
  private kbService: KnowledgeBaseService;

  constructor(kbService: KnowledgeBaseService) {
    this.model = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.2,
    });
    this.kbService = kbService;
  }

  private async generatePrompt(
    query: string,
    relevantArticles: Document[],
    teams: Team[],
    history?: ConversationHistory
  ): Promise<Array<SystemMessage | HumanMessage | AIMessage>> {
    const systemPrompt = `You are a helpful customer support AI agent. 
    You have access to knowledge base articles and, should one be directly relevant, provide the article ID
        - JSON response format: {"article_id": "ID HERE"}.
    If a question cannot be answered using the knowledge base and requires human expertise, suggest creating a ticket with a human agent. Possible teams to create a ticket for are: ${teams.map(team => team.name).join(', ')}.
        - JSON response format: {"ticket": {"team_name": "TEAM NAME HERE", "subject": "SUBJECT HERE", "description": "DESCRIPTION HERE"}}.
    If you're unsure, respond with: {"response": "Sorry, I'm not sure how best to help with that. Please feel free to rephrase the question or to open a ticket with a human agent."}`;

    const messages: Array<SystemMessage | HumanMessage | AIMessage> = [
      new SystemMessage(systemPrompt),
    ];

    // Add conversation history if available
    if (history) {
      history.messages.forEach((msg) => {
        if (msg.isAI) {
          messages.push(new AIMessage(msg.content));
        } else {
          messages.push(new HumanMessage(msg.content));
        }
      });
    }

    // Add context from relevant articles
    if (relevantArticles.length > 0) {
      const articlesContext = relevantArticles
        .map((doc) => `[ID:${doc.metadata.id}] [CATEGORY:${doc.metadata.category}]\n${doc.pageContent}`)
        .join('\n\n');
      messages.push(
        new SystemMessage(`Relevant knowledge base articles:\n${articlesContext}`)
      );
    }

    messages.push(new HumanMessage(query));
    return messages;
  }

  async handleChatQuery(
    query: string,
    organization: string,
    teams: Team[] = [],
    history?: ConversationHistory
  ) {
    const relevantArticles = await this.kbService.findRelevantArticles(
      query,
      organization
    );
    const messages = await this.generatePrompt(query, relevantArticles, teams, history);
    const jsonModel = this.model.bind({ response_format: { type: "json_object" } });
    const response = await jsonModel.invoke(messages);
    const content = typeof response.content === "string" ? JSON.parse(response.content) : response.content;
    return content;
  }

  async evaluateTicket(ticket: Ticket) {
    const relevantArticles = await this.kbService.findRelevantArticles(
      `${ticket.team_name}\n${ticket.subject}\n${ticket.description}`,
      ticket.organization_id
    );

    const messages = [
      new SystemMessage(`You are a helpful customer support AI agent.
        Your task is to determine if this support ticket could be resolved using existing knowledge base articles.
        If yes, provide the relevant article ID via the JSON response format {"article_id": "ID HERE"}. If no, explain why human support is needed via the JSON response format {"response": "REASON HERE"}.
        Consider the ticket priority and complexity when making your decision.`),
      new HumanMessage(
        JSON.stringify({
          ticket,
          relevantArticles: relevantArticles.map((doc) => doc.pageContent),
        })
      ),
    ];

    const jsonModel = this.model.bind({ response_format: { type: "json_object" } });
    const response = await jsonModel.invoke(messages);
    const content = typeof response.content === "string" ? JSON.parse(response.content) : response.content;
    return content;
  }
}