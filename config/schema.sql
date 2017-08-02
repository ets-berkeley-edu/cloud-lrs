--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: credentials; Type: TABLE; Schema: public; Owner: cloudlrs; Tablespace:
--

CREATE TABLE credentials (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    key character varying(255) NOT NULL,
    secret character varying(255) NOT NULL,
    anonymous boolean DEFAULT false NOT NULL,
    read_permission boolean DEFAULT false NOT NULL,
    write_permission boolean DEFAULT false NOT NULL,
    datashare boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id integer NOT NULL
);


ALTER TABLE public.credentials OWNER TO cloudlrs;

--
-- Name: credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: cloudlrs
--

CREATE SEQUENCE credentials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.credentials_id_seq OWNER TO cloudlrs;

--
-- Name: credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloudlrs
--

ALTER SEQUENCE credentials_id_seq OWNED BY credentials.id;


--
-- Name: opt_outs; Type: TABLE; Schema: public; Owner: cloudlrs; Tablespace:
--

CREATE TABLE opt_outs (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    credential_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.opt_outs OWNER TO cloudlrs;

--
-- Name: statements; Type: TABLE; Schema: public; Owner: cloudlrs; Tablespace:
--

CREATE TABLE statements (
    uuid character varying(255) NOT NULL,
    statement json NOT NULL,
    verb character varying(255) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    activity_type character varying(255) NOT NULL,
    actor_type character varying(255) NOT NULL,
    statement_type character varying(255) NOT NULL,
    statement_version character varying(255) NOT NULL,
    voided boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id integer NOT NULL,
    user_id integer,
    credential_id integer NOT NULL
);


ALTER TABLE public.statements OWNER TO cloudlrs;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: cloudlrs; Tablespace:
--

CREATE TABLE tenants (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.tenants OWNER TO cloudlrs;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: cloudlrs
--

CREATE SEQUENCE tenants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tenants_id_seq OWNER TO cloudlrs;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloudlrs
--

ALTER SEQUENCE tenants_id_seq OWNED BY tenants.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: cloudlrs; Tablespace:
--

CREATE TABLE users (
    id integer NOT NULL,
    name character varying(255),
    external_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id integer NOT NULL
);


ALTER TABLE public.users OWNER TO cloudlrs;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: cloudlrs
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO cloudlrs;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cloudlrs
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY credentials ALTER COLUMN id SET DEFAULT nextval('credentials_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY tenants ALTER COLUMN id SET DEFAULT nextval('tenants_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Data for Name: credentials; Type: TABLE DATA; Schema: public; Owner: cloudlrs
--

COPY credentials (id, name, description, key, secret, anonymous, read_permission, write_permission, datashare, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Name: credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloudlrs
--

SELECT pg_catalog.setval('credentials_id_seq', 1, false);


--
-- Data for Name: opt_outs; Type: TABLE DATA; Schema: public; Owner: cloudlrs
--

COPY opt_outs ("createdAt", "updatedAt", credential_id, user_id) FROM stdin;
\.


--
-- Data for Name: statements; Type: TABLE DATA; Schema: public; Owner: cloudlrs
--

COPY statements (uuid, statement, verb, "timestamp", activity_type, actor_type, statement_type, statement_version, voided, created_at, updated_at, tenant_id, user_id, credential_id) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: cloudlrs
--

COPY tenants (id, tenant_api_domain, api_key, name, use_https, logo, created_at, updated_at) FROM stdin;
\.


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloudlrs
--

SELECT pg_catalog.setval('tenants_id_seq', 1, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cloudlrs
--

COPY users (id, name, external_id, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cloudlrs
--

SELECT pg_catalog.setval('users_id_seq', 1, false);


--
-- Name: credentials_key_key; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY credentials
    ADD CONSTRAINT credentials_key_key UNIQUE (key);


--
-- Name: credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (id);


--
-- Name: credentials_secret_key; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY credentials
    ADD CONSTRAINT credentials_secret_key UNIQUE (secret);


--
-- Name: opt_outs_pkey; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY opt_outs
    ADD CONSTRAINT opt_outs_pkey PRIMARY KEY (credential_id, user_id);


--
-- Name: statements_pkey; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY statements
    ADD CONSTRAINT statements_pkey PRIMARY KEY (uuid);


--
-- Name: tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants_tenant_api_domain_key; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY tenants
    ADD CONSTRAINT tenants_tenant_api_domain_key UNIQUE (tenant_api_domain);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: cloudlrs; Tablespace:
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: credentials_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY credentials
    ADD CONSTRAINT credentials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: opt_outs_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY opt_outs
    ADD CONSTRAINT opt_outs_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES credentials(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: opt_outs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY opt_outs
    ADD CONSTRAINT opt_outs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: statements_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY statements
    ADD CONSTRAINT statements_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES credentials(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: statements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY statements
    ADD CONSTRAINT statements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: statements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY statements
    ADD CONSTRAINT statements_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cloudlrs
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: sandeep
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM sandeep;
GRANT ALL ON SCHEMA public TO sandeep;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--
