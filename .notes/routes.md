** All routes should be implemented in an appropriate file in server/src/routes. If unsure of which file to use or whether a new file is needed, please ask. **

Authentication & Users
    POST /auth/login
        Authenticate user (JWT token generation).

    POST /auth/refresh
        Refresh expired JWT tokens.

    POST /users
        Create a new user (registration).
        Body: email, password, organization_id
        Roles: Public

    GET /users/me
        Fetch current user details.
        Roles: Authenticated

    GET /users/{userId}
        Fetch user profile.
        Roles: Public

    PATCH /users/{userId}
        Update user profile.
        Roles: Admin/Owner/Org Admin

Organizations
    GET /organizations
        List all organizations.
        Roles: Public

    POST /organizations
        Create a new organization.
        Roles: Admin

    PATCH /organizations/{orgId}
        Update organization details.
        Roles: Admin

Teams
    GET /teams
        List teams in the current organization.
        Roles: Agent/Admin

    POST /teams
        Create a new team.
        Roles: Admin

    POST /teams/{teamId}/members
        Add a user to a team.
        Body: { userId, role }
        Roles: Admin

    DELETE /teams/{teamId}/members/{userId}
        Remove a member from a team.
        Roles: Admin

Tickets
    GET /tickets
        List tickets with filters (status, priority, assigned_to).
        Query Params: status, priority, team_id
        Roles: Agent/Admin/Customer (scoped)

    POST /tickets
        Create a new ticket.
        Body: subject, description, customer_id, channel
        Roles: Customer/Agent

    GET /tickets/{ticketId}
        Fetch ticket details with history, tags, and messages.
        Roles: Agent/Admin/Customer (owner)

    PATCH /tickets/{ticketId}
        Update ticket (status, priority, assigned_to).
        Body: status, priority, assigned_to, team_id
        Roles: Agent/Admin

    POST /tickets/bulk/update
        Bulk update tickets (e.g., status changes).
        Body: { ticketIds, updates }
        Roles: Admin

    POST /tickets/{ticketId}/tags
        Add a tag to a ticket.
        Body: { tagId }
        Roles: Agent/Admin

Messages & Collaboration
    GET /tickets/{ticketId}/messages
        List messages (internal notes or customer interactions).
        Roles: Agent/Admin/Customer (owner)

    POST /tickets/{ticketId}/messages
        Post a message (internal or external).
        Body: content, is_internal
        Roles: Agent/Customer (owner)

    DELETE /messages/{messageId}
        Delete a message (admin/internal use).
        Roles: Admin

Knowledge Base
    GET /kb/articles
        Search articles by title/category/tags.
        Query Params: search, category
        Roles: Public

    POST /kb/articles
        Create a knowledge base article.
        Body: title, content, category
        Roles: Admin

Webhooks & API Integrations
    POST /webhooks
        Register a new webhook.
        Body: url, event_type
        Roles: Admin

    GET /webhooks
        List active webhooks.
        Roles: Admin

    DELETE /webhooks/{webhookId}
        Remove a webhook.
        Roles: Admin

Admin & Analytics
    GET /metrics/tickets
        Fetch aggregate ticket metrics (response times, resolution rates).
        Roles: Admin

    GET /audit-logs
        Retrieve audit logs with filters (user, action).
        Query Params: userId, action
        Roles: Admin

Customer-Specific
    GET /customers/me/tickets
        List tickets for the authenticated customer.
        Roles: Customer

    POST /feedback/tickets/{ticketId}
        Submit post-resolution feedback.
        Body: { rating, comment }
        Roles: Customer

Security Schemes
JWT (Bearer Auth): Used for user/agent/admin authentication.

API Key: For integrations (sent in X-API-Key header).

Notes
Pagination: All list endpoints support limit and offset query parameters.

Permissions: Granular access enforced via role checks (e.g., customers can only access their own tickets).

Validation: Enums (e.g., priority, status) align with schema CHECK constraints.

Response Formats: Consistent error schemas (e.g., 400 Invalid status).