SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'ec48e8ae-4870-49ed-b78e-3643d1fb6c30', '{"action":"user_confirmation_requested","actor_id":"93e34b8c-e0b5-427f-a805-c891ce7de7c9","actor_username":"john.smith@autocrm.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-01-23 23:03:08.530008+00', ''),
	('00000000-0000-0000-0000-000000000000', '1256794e-5a63-49b8-83b4-60bf92db55c8', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"john.smith@autocrm.com","user_id":"93e34b8c-e0b5-427f-a805-c891ce7de7c9","user_phone":""}}', '2025-01-23 23:04:38.724078+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd92578a3-a36e-44ee-99e8-c4d9d9e38ce4', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"john.smith@autocrm.com","user_id":"80f04387-c117-4999-bb50-5f8bfeb52df6","user_phone":""}}', '2025-01-23 23:04:56.56106+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aaa35261-4190-4bc6-afb8-3719c010131d', '{"action":"login","actor_id":"80f04387-c117-4999-bb50-5f8bfeb52df6","actor_username":"john.smith@autocrm.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-01-23 23:08:07.032751+00', ''),
	('00000000-0000-0000-0000-000000000000', '67c7f9d3-937d-44f6-8c60-b0e09673643d', '{"action":"login","actor_id":"80f04387-c117-4999-bb50-5f8bfeb52df6","actor_username":"john.smith@autocrm.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-01-23 23:08:21.718119+00', ''),
	('00000000-0000-0000-0000-000000000000', '6fcd1e7e-19e1-4f85-8c2c-ceb18fbf3bae', '{"action":"login","actor_id":"80f04387-c117-4999-bb50-5f8bfeb52df6","actor_username":"john.smith@autocrm.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-01-23 23:08:30.513714+00', ''),
	('00000000-0000-0000-0000-000000000000', '07273012-bba3-4a9e-b75a-544a3fa3d7e1', '{"action":"token_refreshed","actor_id":"80f04387-c117-4999-bb50-5f8bfeb52df6","actor_username":"john.smith@autocrm.com","actor_via_sso":false,"log_type":"token"}', '2025-01-24 15:24:16.903551+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fcc39447-71fb-435c-bb45-9f2bf6611ede', '{"action":"token_revoked","actor_id":"80f04387-c117-4999-bb50-5f8bfeb52df6","actor_username":"john.smith@autocrm.com","actor_via_sso":false,"log_type":"token"}', '2025-01-24 15:24:16.90978+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a94d0aa2-4745-412b-af6d-c4ff29cdf7d3', '{"action":"login","actor_id":"80f04387-c117-4999-bb50-5f8bfeb52df6","actor_username":"john.smith@autocrm.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-01-24 15:25:08.298004+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '80f04387-c117-4999-bb50-5f8bfeb52df6', 'authenticated', 'authenticated', 'john.smith@autocrm.com', '$2a$10$L7GhBOiRH7ZNwlAhE9Wo0OGbaFxpT89/LaFg/1AYqgqFCQf3pMT7y', '2025-01-23 23:04:56.5623+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-01-24 15:25:08.298709+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-01-23 23:04:56.556809+00', '2025-01-24 15:25:08.303501+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('80f04387-c117-4999-bb50-5f8bfeb52df6', '80f04387-c117-4999-bb50-5f8bfeb52df6', '{"sub": "80f04387-c117-4999-bb50-5f8bfeb52df6", "email": "john.smith@autocrm.com", "email_verified": false, "phone_verified": false}', 'email', '2025-01-23 23:04:56.560118+00', '2025-01-23 23:04:56.560171+00', '2025-01-23 23:04:56.560171+00', '4661529d-07c0-494c-9a7c-285f8831bae7');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('70cd3e32-c5f5-463e-a015-b973124a5435', '80f04387-c117-4999-bb50-5f8bfeb52df6', '2025-01-23 23:08:07.035816+00', '2025-01-23 23:08:07.035816+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36', '47.39.145.93', NULL),
	('92f1de2c-1f42-4eac-92b3-32d19614bc37', '80f04387-c117-4999-bb50-5f8bfeb52df6', '2025-01-23 23:08:21.718906+00', '2025-01-23 23:08:21.718906+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36', '47.39.145.93', NULL),
	('91cd8d27-f808-47b9-ba48-57141e6cb367', '80f04387-c117-4999-bb50-5f8bfeb52df6', '2025-01-23 23:08:30.51447+00', '2025-01-24 15:24:16.926127+00', NULL, 'aal1', NULL, '2025-01-24 15:24:16.926048', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36', '47.39.145.93', NULL),
	('da519a2b-b1a0-4dc8-a50f-614ed9344640', '80f04387-c117-4999-bb50-5f8bfeb52df6', '2025-01-24 15:25:08.298821+00', '2025-01-24 15:25:08.298821+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36', '47.39.145.93', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('70cd3e32-c5f5-463e-a015-b973124a5435', '2025-01-23 23:08:07.048336+00', '2025-01-23 23:08:07.048336+00', 'password', 'b43694a7-485c-4806-a0ca-6843bb5fc2a7'),
	('92f1de2c-1f42-4eac-92b3-32d19614bc37', '2025-01-23 23:08:21.721374+00', '2025-01-23 23:08:21.721374+00', 'password', '8906d0cf-89c1-44b8-936b-7db8cf66ccac'),
	('91cd8d27-f808-47b9-ba48-57141e6cb367', '2025-01-23 23:08:30.517121+00', '2025-01-23 23:08:30.517121+00', 'password', '49031c42-27b1-4ff5-9be8-e1572e967550'),
	('da519a2b-b1a0-4dc8-a50f-614ed9344640', '2025-01-24 15:25:08.303837+00', '2025-01-24 15:25:08.303837+00', 'password', '5190ef2c-0572-4bee-86d5-199c2eb36cdb');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, '-rgwvHlPTQj2KjM927ZqBA', '80f04387-c117-4999-bb50-5f8bfeb52df6', false, '2025-01-23 23:08:07.038049+00', '2025-01-23 23:08:07.038049+00', NULL, '70cd3e32-c5f5-463e-a015-b973124a5435'),
	('00000000-0000-0000-0000-000000000000', 2, '2ZJbzi-on1DyTUw7bD7Nbg', '80f04387-c117-4999-bb50-5f8bfeb52df6', false, '2025-01-23 23:08:21.719809+00', '2025-01-23 23:08:21.719809+00', NULL, '92f1de2c-1f42-4eac-92b3-32d19614bc37'),
	('00000000-0000-0000-0000-000000000000', 3, 'xsj7CW36V9ZetFIk4SafEA', '80f04387-c117-4999-bb50-5f8bfeb52df6', true, '2025-01-23 23:08:30.5152+00', '2025-01-24 15:24:16.912051+00', NULL, '91cd8d27-f808-47b9-ba48-57141e6cb367'),
	('00000000-0000-0000-0000-000000000000', 4, 'ZbttecP8r3oU2Wo39_Yzhg', '80f04387-c117-4999-bb50-5f8bfeb52df6', false, '2025-01-24 15:24:16.916176+00', '2025-01-24 15:24:16.916176+00', 'xsj7CW36V9ZetFIk4SafEA', '91cd8d27-f808-47b9-ba48-57141e6cb367'),
	('00000000-0000-0000-0000-000000000000', 5, 'yy4k4bN3KehT6R3DnNGpug', '80f04387-c117-4999-bb50-5f8bfeb52df6', false, '2025-01-24 15:25:08.302533+00', '2025-01-24 15:25:08.302533+00', NULL, 'da519a2b-b1a0-4dc8-a50f-614ed9344640');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--



--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "name", "created_at", "is_external") VALUES
	('9066e91f-faa2-4a68-8749-af0582dd435c', 'AutoCRM', '2024-01-01 00:00:00+00', false),
	('f2080e7b-20e0-4391-a773-b3350e81b55f', 'TechCorp Solutions', '2024-01-01 00:00:00+00', true),
	('7438078c-7b88-47bc-af1b-f7cdd1d33d0a', 'Retail Dynamics', '2024-01-01 00:00:00+00', true),
	('36a37777-c285-4f7b-97d7-fdd0cdcadd06', 'Healthcare Plus', '2024-01-01 00:00:00+00', true);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "password_hash", "organization_id", "profile", "created_at") VALUES
	('c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'john.smith@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name": "john smith"}', '2024-01-01 00:00:00+00'),
	('e8e954ae-84cf-4d14-995e-5d17307e9994', 'sarah.jones@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name": "sarah jones"}', '2024-01-01 00:00:00+00'),
	('47c0706e-bd36-40a9-ab05-ae8487ac2282', 'mike.wilson@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name": "mike wilson"}', '2024-01-01 00:00:00+00'),
	('e6527279-05fa-472f-b0d0-8e252292dc22', 'lisa.brown@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name": "lisa brown"}', '2024-01-01 00:00:00+00'),
	('b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'david.miller@autocrm.com', 'hashed_password_here', '9066e91f-faa2-4a68-8749-af0582dd435c', '{"name": "david miller"}', '2024-01-01 00:00:00+00'),
	('3fdf20cd-a4e2-4ef7-be0a-e3a5636702fe', 'customer1@techcorpsolutions.com', 'hashed_password_here', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '{"name": "Customer 1"}', '2024-01-01 00:00:00+00'),
	('4642e5fc-24b5-4da2-a1e5-d6295b35b3d5', 'customer2@techcorpsolutions.com', 'hashed_password_here', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '{"name": "Customer 2"}', '2024-01-01 00:00:00+00'),
	('24dbbfa2-9502-43e6-955b-1ea791cdcab2', 'customer1@retaildynamics.com', 'hashed_password_here', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '{"name": "Customer 1"}', '2024-01-01 00:00:00+00'),
	('4f3eb095-3961-46e7-86e1-30663c568bf5', 'customer2@retaildynamics.com', 'hashed_password_here', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '{"name": "Customer 2"}', '2024-01-01 00:00:00+00'),
	('3fc942e4-e215-45dd-aeee-0ecdd7a571f5', 'customer1@healthcareplus.com', 'hashed_password_here', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '{"name": "Customer 1"}', '2024-01-01 00:00:00+00'),
	('3dcd8416-b047-455c-ad5a-2cc82cc4cd41', 'customer2@healthcareplus.com', 'hashed_password_here', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '{"name": "Customer 2"}', '2024-01-01 00:00:00+00');


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."teams" ("id", "name", "description", "organization_id", "created_at") VALUES
	('af105da1-0ddd-437d-8473-274644b92b9d', 'Support Team', 'Support Team for AutoCRM', '9066e91f-faa2-4a68-8749-af0582dd435c', '2024-01-01 00:00:00+00'),
	('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'Development Team', 'Development Team for AutoCRM', '9066e91f-faa2-4a68-8749-af0582dd435c', '2024-01-01 00:00:00+00'),
	('3d588537-d74b-4e65-8d82-3b019310c88a', 'Sales Team', 'Sales Team for AutoCRM', '9066e91f-faa2-4a68-8749-af0582dd435c', '2024-01-01 00:00:00+00'),
	('e6ee0422-4c98-4ad8-b554-8dc63c315426', 'IT Department', 'IT Department for TechCorp Solutions', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '2024-01-01 00:00:00+00'),
	('4104ab91-21be-41c8-9945-7bced137db30', 'Customer Success', 'Customer Success for TechCorp Solutions', 'f2080e7b-20e0-4391-a773-b3350e81b55f', '2024-01-01 00:00:00+00'),
	('61078a40-c070-420b-99ed-fc2ecd6a943c', 'Operations', 'Operations for Retail Dynamics', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '2024-01-01 00:00:00+00'),
	('8cda61fc-184c-459f-9b96-86710254751f', 'Customer Service', 'Customer Service for Retail Dynamics', '7438078c-7b88-47bc-af1b-f7cdd1d33d0a', '2024-01-01 00:00:00+00'),
	('9565f3e2-0fb9-423d-bb61-101ed7748e07', 'Medical Support', 'Medical Support for Healthcare Plus', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '2024-01-01 00:00:00+00'),
	('8ad6a53c-2421-472c-b635-a13721394f7f', 'Patient Care', 'Patient Care for Healthcare Plus', '36a37777-c285-4f7b-97d7-fdd0cdcadd06', '2024-01-01 00:00:00+00');


--
-- Data for Name: ticket_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ticket_statuses" ("status", "customer_access", "created_at") VALUES
	('New', false, '2025-01-23 16:20:38.259427+00'),
	('Open', false, '2025-01-23 16:20:38.259427+00'),
	('Pending', false, '2025-01-23 16:20:38.259427+00'),
	('On Hold', false, '2025-01-23 16:20:38.259427+00'),
	('In Progress', false, '2025-01-23 16:20:38.259427+00'),
	('Awaiting Reply', false, '2025-01-23 16:20:38.259427+00'),
	('Resolved', true, '2025-01-23 16:20:38.259427+00'),
	('Closed', true, '2025-01-23 16:20:38.259427+00'),
	('Escalated', false, '2025-01-23 16:20:38.259427+00'),
	('Blocked', false, '2025-01-23 16:20:38.259427+00'),
	('Backlog', false, '2025-01-23 16:20:38.259427+00'),
	('In Review', false, '2025-01-23 16:20:38.259427+00'),
	('Staged', false, '2025-01-23 16:20:38.259427+00'),
	('Reopened', false, '2025-01-23 16:20:38.259427+00'),
	('Closed (Will Not Fix)', false, '2025-01-23 16:20:38.259427+00');


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("user_id", "is_org_admin") VALUES
	('3fdf20cd-a4e2-4ef7-be0a-e3a5636702fe', true),
	('4642e5fc-24b5-4da2-a1e5-d6295b35b3d5', false),
	('24dbbfa2-9502-43e6-955b-1ea791cdcab2', true),
	('4f3eb095-3961-46e7-86e1-30663c568bf5', false),
	('3fc942e4-e215-45dd-aeee-0ecdd7a571f5', true),
	('3dcd8416-b047-455c-ad5a-2cc82cc4cd41', false);


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."employees" ("user_id", "role", "internal_permissions") VALUES
	('c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'admin', '{"can_view_all": true}'),
	('e8e954ae-84cf-4d14-995e-5d17307e9994', 'agent', '{"can_view_all": true}'),
	('47c0706e-bd36-40a9-ab05-ae8487ac2282', 'agent', '{"can_view_all": true}'),
	('e6527279-05fa-472f-b0d0-8e252292dc22', 'agent', '{"can_view_all": true}'),
	('b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'agent', '{"can_view_all": true}');


--
-- Data for Name: knowledge_base; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: routing_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."team_members" ("team_id", "user_id", "role") VALUES
	('af105da1-0ddd-437d-8473-274644b92b9d', 'c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'manager'),
	('af105da1-0ddd-437d-8473-274644b92b9d', 'e8e954ae-84cf-4d14-995e-5d17307e9994', 'member'),
	('af105da1-0ddd-437d-8473-274644b92b9d', '47c0706e-bd36-40a9-ab05-ae8487ac2282', 'member'),
	('af105da1-0ddd-437d-8473-274644b92b9d', 'e6527279-05fa-472f-b0d0-8e252292dc22', 'member'),
	('af105da1-0ddd-437d-8473-274644b92b9d', 'b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'member'),
	('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'manager'),
	('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'e8e954ae-84cf-4d14-995e-5d17307e9994', 'member'),
	('31ff28b4-800e-469a-ae0d-95b759df4eb4', '47c0706e-bd36-40a9-ab05-ae8487ac2282', 'member'),
	('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'e6527279-05fa-472f-b0d0-8e252292dc22', 'member'),
	('31ff28b4-800e-469a-ae0d-95b759df4eb4', 'b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'member'),
	('3d588537-d74b-4e65-8d82-3b019310c88a', 'c19b7055-04a3-47d0-9408-1b2abfc5d5e8', 'manager'),
	('3d588537-d74b-4e65-8d82-3b019310c88a', 'e8e954ae-84cf-4d14-995e-5d17307e9994', 'member'),
	('3d588537-d74b-4e65-8d82-3b019310c88a', '47c0706e-bd36-40a9-ab05-ae8487ac2282', 'member'),
	('3d588537-d74b-4e65-8d82-3b019310c88a', 'e6527279-05fa-472f-b0d0-8e252292dc22', 'member'),
	('3d588537-d74b-4e65-8d82-3b019310c88a', 'b389b5a8-6d5e-4a9d-8e45-5bb05b33977b', 'member');


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_custom_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 5, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
