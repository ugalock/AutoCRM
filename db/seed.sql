-- Organizations
INSERT INTO organizations (id, name, is_external, created_at) VALUES ('9066e91f-faa2-4a68-8749-af0582dd435c', 'AutoCRM', false, '2024-01-01T00:00:00.000Z');
INSERT INTO organizations (id, name, is_external, created_at) VALUES ('f2080e7b-20e0-4391-a773-b3350e81b55f', 'TechCorp Solutions', true, '2024-01-01T00:00:00.000Z');
INSERT INTO organizations (id, name, is_external, created_at) VALUES ('7438078c-7b88-47bc-af1b-f7cdd1d33d0a', 'Retail Dynamics', true, '2024-01-01T00:00:00.000Z');
INSERT INTO organizations (id, name, is_external, created_at) VALUES ('36a37777-c285-4f7b-97d7-fdd0cdcadd06', 'Healthcare Plus', true, '2024-01-01T00:00:00.000Z');

-- Teams
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('af105da1-0ddd-437d-8473-274644b92b9d', 'Support Team', 'Support Team for AutoCRM', '9066e91f-faa2-4a68-8749-af0582dd435c', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'Development Team', 'Development Team for AutoCRM', '9066e91f-faa2-4a68-8749-af0582dd435c', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('3d588537-d74b-4e65-8d82-3b019310c88a', 'Sales Team', 'Sales Team for AutoCRM', '9066e91f-faa2-4a68-8749-af0582dd435c', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('e6ee0422-4c98-4ad8-b554-8dc63c315426', 'IT Department', 'IT Department for TechCorp Solutions', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('4104ab91-21be-41c8-9945-7bced137db30', 'Customer Success', 'Customer Success for TechCorp Solutions', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('61078a40-c070-420b-99ed-fc2ecd6a943c', 'Operations', 'Operations for Retail Dynamics', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('8cda61fc-184c-459f-9b96-86710254751f', 'Customer Service', 'Customer Service for Retail Dynamics', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('9565f3e2-0fb9-423d-bb61-101ed7748e07', 'Medical Support', 'Medical Support for Healthcare Plus', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '2024-01-01T00:00:00.000Z');
INSERT INTO teams (id, name, description, organization_id, created_at) VALUES ('8ad6a53c-2421-472c-b635-a13721394f7f', 'Patient Care', 'Patient Care for Healthcare Plus', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '2024-01-01T00:00:00.000Z');

-- Users
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'john.smith@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name":"john smith"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('e8e954ae-84cf-4d14-995e-5d17307e9994', 'sarah.jones@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name":"sarah jones"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('47c0706e-bd36-40a9-ab05-ae8487ac2282', 'mike.wilson@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name":"mike wilson"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('e6527279-05fa-472f-b0d0-8e252292dc22', 'lisa.brown@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name":"lisa brown"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'david.miller@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name":"david miller"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('3fdf20cd-a4e2-4ef7-be0a-e3a5636702fe', 'customer1@techcorpsolutions.com', 'hashed_password_here', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '{"name":"Customer 1"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('4642e5fc-24b5-4da2-a1e5-d6295b35b3d5', 'customer2@techcorpsolutions.com', 'hashed_password_here', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '{"name":"Customer 2"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('24dbbfa2-9502-43e6-955b-1ea791cdcab2', 'customer1@retaildynamics.com', 'hashed_password_here', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '{"name":"Customer 1"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('4f3eb095-3961-46e7-86e1-30663c568bf5', 'customer2@retaildynamics.com', 'hashed_password_here', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '{"name":"Customer 2"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('3fc942e4-e215-45dd-aeee-0ecdd7a571f5', 'customer1@healthcareplus.com', 'hashed_password_here', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '{"name":"Customer 1"}', '2024-01-01T00:00:00.000Z');
INSERT INTO users (id, email, password_hash, organization_id, profile, created_at) VALUES ('3dcd8416-b047-455c-ad5a-2cc82cc4cd41', 'customer2@healthcareplus.com', 'hashed_password_here', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '{"name":"Customer 2"}', '2024-01-01T00:00:00.000Z');

-- Employees
INSERT INTO employees (user_id, role, internal_permissions) VALUES ('c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'admin', '{"can_view_all":true}');
INSERT INTO employees (user_id, role, internal_permissions) VALUES ('e8e954ae-84cf-4d14-995e-5d17307e9994', 'agent', '{"can_view_all":true}');
INSERT INTO employees (user_id, role, internal_permissions) VALUES ('47c0706e-bd36-40a9-ab05-ae8487ac2282', 'agent', '{"can_view_all":true}');
INSERT INTO employees (user_id, role, internal_permissions) VALUES ('e6527279-05fa-472f-b0d0-8e252292dc22', 'agent', '{"can_view_all":true}');
INSERT INTO employees (user_id, role, internal_permissions) VALUES ('b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'agent', '{"can_view_all":true}');

-- Customers
INSERT INTO customers (user_id, is_org_admin) VALUES ('3fdf20cd-a4e2-4ef7-be0a-e3a5636702fe', true);
INSERT INTO customers (user_id, is_org_admin) VALUES ('4642e5fc-24b5-4da2-a1e5-d6295b35b3d5', false);
INSERT INTO customers (user_id, is_org_admin) VALUES ('24dbbfa2-9502-43e6-955b-1ea791cdcab2', true);
INSERT INTO customers (user_id, is_org_admin) VALUES ('4f3eb095-3961-46e7-86e1-30663c568bf5', false);
INSERT INTO customers (user_id, is_org_admin) VALUES ('3fc942e4-e215-45dd-aeee-0ecdd7a571f5', true);
INSERT INTO customers (user_id, is_org_admin) VALUES ('3dcd8416-b047-455c-ad5a-2cc82cc4cd41', false);

-- Team Members
INSERT INTO team_members (team_id, user_id, role) VALUES ('af105da1-0ddd-437d-8473-274644b92b9d', 'c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'manager');
INSERT INTO team_members (team_id, user_id, role) VALUES ('af105da1-0ddd-437d-8473-274644b92b9d', 'e8e954ae-84cf-4d14-995e-5d17307e9994', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('af105da1-0ddd-437d-8473-274644b92b9d', '47c0706e-bd36-40a9-ab05-ae8487ac2282', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('af105da1-0ddd-437d-8473-274644b92b9d', 'e6527279-05fa-472f-b0d0-8e252292dc22', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('af105da1-0ddd-437d-8473-274644b92b9d', 'b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'manager');
INSERT INTO team_members (team_id, user_id, role) VALUES ('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'e8e954ae-84cf-4d14-995e-5d17307e9994', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('31ff28b4-800e-469a-ae0d-95b759df4eb4', '47c0706e-bd36-40a9-ab05-ae8487ac2282', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'e6527279-05fa-472f-b0d0-8e252292dc22', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('3d588537-d74b-4e65-8d82-3b019310c88a', 'c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'manager');
INSERT INTO team_members (team_id, user_id, role) VALUES ('3d588537-d74b-4e65-8d82-3b019310c88a', 'e8e954ae-84cf-4d14-995e-5d17307e9994', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('3d588537-d74b-4e65-8d82-3b019310c88a', '47c0706e-bd36-40a9-ab05-ae8487ac2282', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('3d588537-d74b-4e65-8d82-3b019310c88a', 'e6527279-05fa-472f-b0d0-8e252292dc22', 'member');
INSERT INTO team_members (team_id, user_id, role) VALUES ('3d588537-d74b-4e65-8d82-3b019310c88a', 'b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'member');