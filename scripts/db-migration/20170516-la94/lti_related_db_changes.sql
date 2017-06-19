/* File contains changes performed to the cloud-lrs data model after adding LTI support. The script was run to set up LRS demo environment
 * using Canvas Beta at the IMS Learning Impact conference. Data was migrated using Amazon Data Management Service(DMS).
 * Since there are no active deployments beyond the dev environment at the time migration script is not obselete.
 *
 * NOTE: Use this file for reference purposes only as all of the data model changes are updated in Cloud LRS v1.0 release.
 */

CREATE TYPE public.enum_users_canvas_enrollment_state AS ENUM
('active', 'completed', 'inactive', 'invited', 'rejected');

/* Changes to Users table
 * Adding Canvas related columns required for LTI launch to the users table
 * Add all these column to the users table with a NOT NULL constraint. Make canvas_user_id NOT NULL after updates
 */
ALTER TABLE users ADD COLUMN canvas_global_user_id bigint,
  ADD COLUMN canvas_full_name character varying(255),
  ADD COLUMN canvas_image character varying(255),
  ADD COLUMN canvas_email character varying(255),
  ADD COLUMN canvas_enrollment_state public.enum_users_canvas_enrollment_state,
  ADD COLUMN canvas_user_id integer

-- Remove NOT NULL constraint
ALTER TABLE users ALTER COLUMN external_id TYPE character varying(765) ;
ALTER TABLE users ALTER COLUMN canvas_global_user_id TYPE bigint;

-- Derive external_id from canvas_global_user_id. External IDS are ectracted from the Caliper feed from the user_login column
UPDATE users SET external_id = NULL

-- Derive canas_user_id from the canvas_global_user_id. canvas_user_id matches the LTI launch params
UPDATE users
SET canvas_global_user_id = CAST(external_id AS bigint)
  , canvas_user_id = CAST(TRIM (LEADING '0' FROM SUBSTRING(external_id, 5, LENGTH(external_id))) AS integer);


/* Changes to the tenant table are noted here.
 * API Domain names and Keys are added to facilitate LTI launches
 */

ALTER TABLE public.tenants
  ADD COLUMN tenant_api_domain character varying(255),
  ADD COLUMN api_key character varying(255),
  ADD COLUMN use_https boolean DEFAULT true,
  ADD COLUMN logo character varying(255);


ALTER TABLE public.tenants RENAME COLUMN privacydashboard_lti_key TO lti_key;
ALTER TABLE public.tenants RENAME COLUMN privacydashboard_lti_secret TO lti_secret;
ALTER TABLE public.tenants ADD CONSTRAINT tenant_domain UNIQUE (tenant_api_domain);
ALTER TABLE public.tenants ADD CONSTRAINT tenant_lti_key_key UNIQUE (lti_key);
ALTER TABLE public.tenants ADD CONSTRAINT tenant_lti_secret_key UNIQUE (lti_secret);


-- INSERT bcourse BETA tenant information into the tenants table.
UPDATE public.tenants
  SET tenant_api_domain = '<tenant_api_domain>',
    api_key= '<api_key>',
    lti_key='<key>',
    lti_secret='<secret>',
    use_https=true,
    name='<tenant name>',
    logo='<logo URL>',
    created_at=now(),
    updated_at=now()
  WHERE id = 1 ;


-- Create Course related tables and create an auto generated sequence for course id
CREATE SEQUENCE public.courses_id_seq
  INCREMENT 1
  START 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  CACHE 1;

ALTER SEQUENCE public.courses_id_seq
  OWNER TO cloudlrs;


-- Adding course table

CREATE TABLE public.courses
(
  id integer NOT NULL DEFAULT nextval('courses_id_seq'::regclass),
  canvas_course_id integer NOT NULL,
  name character varying(255),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  privacydashboard_url character varying(255),
  tenant_id integer,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_course_id_fkey FOREIGN KEY (tenant_id)
  REFERENCES public.tenants (tenant_id) MATCH SIMPLE
  ON UPDATE CASCADE
  ON DELETE CASCADE
)
WITH (
  OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.courses
OWNER to cloudlrs;


-- Adding dummy read credentials for demo purposes
INSERT INTO public.read_credentials(
  id, name, description, anonymous, key, secret, created_at, updated_at, tenant_id)
  VALUES (1, 'Learning Analytics Research Project', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel semper dolor, a rutrum mauris. Sed quis elit nulla. Sed aliquam erat nisi, id consequat eros egestas quis. Fusce rhoncus, diam dapibus gravida consequat, tortor urna ornare nunc, tincidunt faucibus libero ex quis massa.', true, 'cloudlrs', 'cloudlrs', now(), now(), 1);

INSERT INTO public.read_credentials(
  id, name, description, anonymous, key, secret, created_at, updated_at, tenant_id)
  VALUES (2, 'Athletic Study Centre Advisor Dashboard', 'Nulla sit amet ornare odio. Phasellus ac rutrum tortor. Curabitur justo turpis, sagittis sollicitudin augue ut, lacinia mollis est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vivamus tincidunt tortor non nisi fermentum, quis aliquam nisl malesuada. Vestibulum efficitur quis justo a lacinia.', false, 'cloudlrs', 'cloudlrs', now(), now(), 1);

INSERT INTO public.read_credentials(
  id, name, description, anonymous, key, secret, created_at, updated_at, tenant_id)
  VALUES (3, 'SuiteC Impact Studio', 'Pellentesque volutpat eu orci non placerat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec dignissim odio a erat laoreet, eget vulputate mi rutrum. Curabitur eget erat consectetur, varius sapien eu, dignissim ligula. Donec volutpat commodo mi.', false, 'cloudlrs', 'cloudlrs', now(), now(), 1);
