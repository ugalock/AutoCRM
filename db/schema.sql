-- Users, Orgs, and Teams
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_external BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  organization_id UUID REFERENCES organizations(id),
  profile JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employees (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  internal_permissions JSONB
);

CREATE TABLE customers (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  is_org_admin BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('member', 'manager')),
  PRIMARY KEY (team_id, user_id)
);

-- Ticket management
CREATE TABLE ticket_statuses (
  status TEXT PRIMARY KEY NOT NULL,
  customer_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT REFERENCES ticket_statuses(status) NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  customer_id UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  channel TEXT CHECK (channel IN ('email', 'chat', 'phone', 'social')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Flexible Metadata
CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_custom_fields (
  ticket_id UUID REFERENCES tickets(id),
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  PRIMARY KEY (ticket_id, field_name)
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  organization_id UUID REFERENCES organizations(id)
);

CREATE TABLE ticket_tags (
  ticket_id UUID REFERENCES tickets(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (ticket_id, tag_id)
);

-- Collaboration & Communication
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id),
  message_id UUID REFERENCES messages(id),
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge & Automation
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  views INT DEFAULT 0,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API & Integrations
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash TEXT NOT NULL,
  permissions JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Audit & Analytics
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_metrics (
  ticket_id UUID PRIMARY KEY REFERENCES tickets(id),
  first_response_time INTERVAL,
  resolution_time INTERVAL,
  reopen_count INT DEFAULT 0,
  customer_satisfaction_score INT
);

-- Routing & AI Features
CREATE TABLE routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  target_type TEXT CHECK (target_type IN ('team', 'user')),
  target_id UUID NOT NULL,
  priority INT,
  enabled BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id)
);

-- Indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_messages_ticket ON messages(ticket_id);
CREATE INDEX idx_tickets_team ON tickets(team_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_organizations_name ON organizations(name);

ALTER TABLE attachments ADD CONSTRAINT chk_ticket_or_message
  CHECK (ticket_id IS NOT NULL OR message_id IS NOT NULL);
CREATE UNIQUE INDEX idx_teams_org_name ON teams(organization_id, name);

INSERT INTO ticket_statuses VALUES ('New', false),('Open', false),('Pending', false),('On Hold', false),('In Progress', false),('Awaiting Reply', false),('Resolved', true),('Closed', true),('Escalated', false),('Blocked', false),('Backlog', false),('In Review', false),('Staged', false),('Reopened', false),('Closed (Will Not Fix)', false);