--
-- PostgreSQL database dump
--

\restrict 3bTFpcZJtWaLEmf2ZWvo67VTP8wHbh4Px1T3fpWKVlzcnzJffC1eKkQtGY00SI2

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

-- Started on 2026-08-06 07:28:39

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 16541)
-- Name: calificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calificacion (
    calificacion_id integer NOT NULL,
    servicio_id integer NOT NULL,
    califica_usuario_id integer NOT NULL,
    calificado_usuario_id integer NOT NULL,
    valor_calificacion integer NOT NULL,
    comentario text,
    fecha_calificacion timestamp without time zone
);


ALTER TABLE public.calificacion OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16540)
-- Name: calificacion_calificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calificacion_calificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calificacion_calificacion_id_seq OWNER TO postgres;

--
-- TOC entry 3439 (class 0 OID 0)
-- Dependencies: 228
-- Name: calificacion_calificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calificacion_calificacion_id_seq OWNED BY public.calificacion.calificacion_id;


--
-- TOC entry 219 (class 1259 OID 16443)
-- Name: direccion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.direccion (
    direccion_id integer NOT NULL,
    usuario_id integer NOT NULL,
    calle character varying(255) NOT NULL,
    colonia character varying(100) NOT NULL,
    latitud numeric(10,8) NOT NULL,
    longitud numeric(11,8) NOT NULL,
    codigo_postal character varying(5),
    pais character varying(100),
    estado character varying(100),
    ciudad character varying(100),
    numero_calle character varying(20),
    "referencias_Casa" text
);


ALTER TABLE public.direccion OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16442)
-- Name: direccion_direccion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.direccion_direccion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.direccion_direccion_id_seq OWNER TO postgres;

--
-- TOC entry 3440 (class 0 OID 0)
-- Dependencies: 218
-- Name: direccion_direccion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.direccion_direccion_id_seq OWNED BY public.direccion.direccion_id;


--
-- TOC entry 222 (class 1259 OID 16467)
-- Name: mascota; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mascota (
    mascota_id integer NOT NULL,
    usuario_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    raza character varying(100),
    color character varying(50),
    sexo character varying(15),
    fecha_nacimiento date,
    peso_kg numeric(5,2),
    esterilizado character varying(10) DEFAULT false,
    miedos text,
    alergias text,
    num_patas integer DEFAULT 4,
    notas_comportamiento text,
    url_foto character varying(255),
    tipo_mascota character varying(80)
);


ALTER TABLE public.mascota OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16466)
-- Name: mascota_mascota_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mascota_mascota_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.mascota_mascota_id_seq OWNER TO postgres;

--
-- TOC entry 3441 (class 0 OID 0)
-- Dependencies: 221
-- Name: mascota_mascota_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mascota_mascota_id_seq OWNED BY public.mascota.mascota_id;


--
-- TOC entry 230 (class 1259 OID 24576)
-- Name: paseador_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paseador_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.paseador_id_seq OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16454)
-- Name: paseador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paseador (
    paseador_id integer DEFAULT nextval('public.paseador_id_seq'::regclass) NOT NULL,
    biografia text,
    url_foto_perfil character varying(255),
    tarifa_base_hora numeric(8,2) NOT NULL,
    zona_operacion character varying(100),
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    correo character varying(150) NOT NULL,
    contrasenia character varying(255) NOT NULL,
    telefono character varying(20)
);


ALTER TABLE public.paseador OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16433)
-- Name: rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rol (
    rol_id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.rol OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16432)
-- Name: rol_rol_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rol_rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rol_rol_id_seq OWNER TO postgres;

--
-- TOC entry 3442 (class 0 OID 0)
-- Dependencies: 216
-- Name: rol_rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rol_rol_id_seq OWNED BY public.rol.rol_id;


--
-- TOC entry 227 (class 1259 OID 16529)
-- Name: seguimientogps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seguimientogps (
    seguimiento_id integer NOT NULL,
    servicio_id integer NOT NULL,
    timestamp_registro timestamp without time zone NOT NULL,
    latitud numeric(10,8) NOT NULL,
    longitud numeric(11,8) NOT NULL
);


ALTER TABLE public.seguimientogps OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16528)
-- Name: seguimientogps_seguimiento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seguimientogps_seguimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.seguimientogps_seguimiento_id_seq OWNER TO postgres;

--
-- TOC entry 3443 (class 0 OID 0)
-- Dependencies: 226
-- Name: seguimientogps_seguimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seguimientogps_seguimiento_id_seq OWNED BY public.seguimientogps.seguimiento_id;


--
-- TOC entry 225 (class 1259 OID 16498)
-- Name: servicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servicio (
    servicio_id integer NOT NULL,
    dueno_id integer NOT NULL,
    paseador_id integer,
    mascota_id integer NOT NULL,
    direccion_id integer NOT NULL,
    tipo_servicio character varying(20) DEFAULT 'Paseo'::character varying,
    duracion_minutos integer NOT NULL,
    costo_total numeric(8,2),
    estado character varying(20) DEFAULT 'esperando'::character varying,
    hora_solicitada timestamp without time zone NOT NULL,
    hora_inicio timestamp without time zone,
    hora_fin timestamp without time zone,
    ruta_geo_json text,
    notas_dueno text,
    notas_paseador text
);


ALTER TABLE public.servicio OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 24616)
-- Name: servicio_multiple_mascotas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servicio_multiple_mascotas (
    servicio_mascota_id integer NOT NULL,
    servicio_id integer NOT NULL,
    mascota_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.servicio_multiple_mascotas OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24615)
-- Name: servicio_multiple_mascotas_servicio_mascota_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.servicio_multiple_mascotas_servicio_mascota_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.servicio_multiple_mascotas_servicio_mascota_id_seq OWNER TO postgres;

--
-- TOC entry 3444 (class 0 OID 0)
-- Dependencies: 231
-- Name: servicio_multiple_mascotas_servicio_mascota_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.servicio_multiple_mascotas_servicio_mascota_id_seq OWNED BY public.servicio_multiple_mascotas.servicio_mascota_id;


--
-- TOC entry 224 (class 1259 OID 16497)
-- Name: servicio_servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.servicio_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.servicio_servicio_id_seq OWNER TO postgres;

--
-- TOC entry 3445 (class 0 OID 0)
-- Dependencies: 224
-- Name: servicio_servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.servicio_servicio_id_seq OWNED BY public.servicio.servicio_id;


--
-- TOC entry 215 (class 1259 OID 16422)
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    usuario_id integer NOT NULL,
    nombre_completo character varying(255) NOT NULL,
    telefono character varying(50),
    email character varying(255) NOT NULL,
    contrasena character varying(255) NOT NULL,
    url_foto_perfil character varying(255)
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 16421)
-- Name: usuario_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuario_usuario_id_seq OWNER TO postgres;

--
-- TOC entry 3446 (class 0 OID 0)
-- Dependencies: 214
-- Name: usuario_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_usuario_id_seq OWNED BY public.usuario.usuario_id;


--
-- TOC entry 223 (class 1259 OID 16482)
-- Name: usuariorol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuariorol (
    usuario_id integer NOT NULL,
    rol_id integer NOT NULL
);


ALTER TABLE public.usuariorol OWNER TO postgres;

--
-- TOC entry 3228 (class 2604 OID 16544)
-- Name: calificacion calificacion_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificacion ALTER COLUMN calificacion_id SET DEFAULT nextval('public.calificacion_calificacion_id_seq'::regclass);


--
-- TOC entry 3219 (class 2604 OID 16446)
-- Name: direccion direccion_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion ALTER COLUMN direccion_id SET DEFAULT nextval('public.direccion_direccion_id_seq'::regclass);


--
-- TOC entry 3221 (class 2604 OID 16470)
-- Name: mascota mascota_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mascota ALTER COLUMN mascota_id SET DEFAULT nextval('public.mascota_mascota_id_seq'::regclass);


--
-- TOC entry 3218 (class 2604 OID 16436)
-- Name: rol rol_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol ALTER COLUMN rol_id SET DEFAULT nextval('public.rol_rol_id_seq'::regclass);


--
-- TOC entry 3227 (class 2604 OID 16532)
-- Name: seguimientogps seguimiento_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimientogps ALTER COLUMN seguimiento_id SET DEFAULT nextval('public.seguimientogps_seguimiento_id_seq'::regclass);


--
-- TOC entry 3224 (class 2604 OID 16501)
-- Name: servicio servicio_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio ALTER COLUMN servicio_id SET DEFAULT nextval('public.servicio_servicio_id_seq'::regclass);


--
-- TOC entry 3229 (class 2604 OID 24619)
-- Name: servicio_multiple_mascotas servicio_mascota_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_multiple_mascotas ALTER COLUMN servicio_mascota_id SET DEFAULT nextval('public.servicio_multiple_mascotas_servicio_mascota_id_seq'::regclass);


--
-- TOC entry 3217 (class 2604 OID 16425)
-- Name: usuario usuario_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN usuario_id SET DEFAULT nextval('public.usuario_usuario_id_seq'::regclass);


--
-- TOC entry 3430 (class 0 OID 16541)
-- Dependencies: 229
-- Data for Name: calificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calificacion (calificacion_id, servicio_id, califica_usuario_id, calificado_usuario_id, valor_calificacion, comentario, fecha_calificacion) FROM stdin;
\.


--
-- TOC entry 3420 (class 0 OID 16443)
-- Dependencies: 219
-- Data for Name: direccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.direccion (direccion_id, usuario_id, calle, colonia, latitud, longitud, codigo_postal, pais, estado, ciudad, numero_calle, "referencias_Casa") FROM stdin;
8	3	Avenida Las Américas	Ignacio Ramirez	20.91212540	-100.72153940	37748	Mexico	Guanajuato	San Miguel de Allende	137	angel wuapo
9	3	Calle Francisco Marqués	Independencia	20.92648520	-100.75424210	37732	Mexico	Guanajuato	San Miguel de Allende	29	OLAAA
15	3	Calle Puente de Umaran	San Miguel de Allende Centro	20.91318630	-100.74329170	37700	Mexico	Guanajuato	San Miguel de Allende	15	feeff
16	3	Andador de las Fuentes	Malaquin Infonavit	20.90773620	-100.76063490	37755	Mexico	Guanajuato	San Miguel de Allende	12	\N
\.


--
-- TOC entry 3423 (class 0 OID 16467)
-- Dependencies: 222
-- Data for Name: mascota; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mascota (mascota_id, usuario_id, nombre, raza, color, sexo, fecha_nacimiento, peso_kg, esterilizado, miedos, alergias, num_patas, notas_comportamiento, url_foto, tipo_mascota) FROM stdin;
22	3	Makunga2	Leon	Cafe amarillento	hembra	2002-12-01	123.00	true	A la abuelitaaaaaaaaa	No	5	Le tiene miedo a la abuelita	1782445641229.jpg	Leon Africano del Congo del Norte
23	3	Naranjoso	Gato naranjo de la mandarina	Naranja	macho	2002-12-02	1.00	true	Al sepso	No	4	OLA	1782446347218.jpg	Gato
\.


--
-- TOC entry 3421 (class 0 OID 16454)
-- Dependencies: 220
-- Data for Name: paseador; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paseador (paseador_id, biografia, url_foto_perfil, tarifa_base_hora, zona_operacion, nombre, apellido, correo, contrasenia, telefono) FROM stdin;
2	Paseador con experiencia en perros pequeños y medianos.	perfil.jpg	120.00	San Miguel de Allende	Martin	Perez	martin@gmail.com	123456	4151234567
3	Quiero ahorrar para un pinshi terreno.	1782317536055.jpg	1000.00	Centro	Isaias Sebastian	Zanches	isaias1@gmail.com	$2b$10$L6cNpdcUz2ROsrfPxbk1J.AceQHozje/LpUB9dcNNWlh8/..IUYAa	4151112233
\.


--
-- TOC entry 3418 (class 0 OID 16433)
-- Dependencies: 217
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rol (rol_id, nombre) FROM stdin;
\.


--
-- TOC entry 3428 (class 0 OID 16529)
-- Dependencies: 227
-- Data for Name: seguimientogps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seguimientogps (seguimiento_id, servicio_id, timestamp_registro, latitud, longitud) FROM stdin;
44	23	2026-06-26 10:51:43.423382	19.43260000	-99.13320000
45	23	2026-06-26 10:51:51.179759	20.90908387	-100.70942788
46	23	2026-06-26 10:51:51.199734	20.90908387	-100.70942788
47	23	2026-06-26 11:02:49.199465	20.90983635	-100.70976353
48	23	2026-06-26 11:02:49.199983	20.90983635	-100.70976353
49	24	2026-06-26 11:15:12.397354	19.43260000	-99.13320000
50	25	2026-06-26 11:16:47.617994	19.43260000	-99.13320000
51	26	2026-06-26 11:18:24.704228	19.43260000	-99.13320000
52	27	2026-06-26 11:21:24.295788	20.90985172	-100.70974083
53	28	2026-06-26 11:21:25.599028	20.90985172	-100.70974083
54	29	2026-06-26 11:21:29.282519	20.90985172	-100.70974083
55	30	2026-06-26 11:25:53.854828	20.90977697	-100.70975161
56	31	2026-06-26 11:26:34.25578	20.90977697	-100.70975161
57	32	2026-06-26 11:32:55.49967	20.90984884	-100.70974890
58	33	2026-06-26 11:37:11.026126	20.90984715	-100.70973521
59	33	2026-06-26 11:37:20.948903	20.90984715	-100.70973521
60	33	2026-06-26 11:37:37.6156	20.90983497	-100.70976717
61	33	2026-06-26 11:38:02.654794	20.90983497	-100.70976717
62	33	2026-06-26 11:38:19.835777	20.90983497	-100.70976717
63	33	2026-06-26 11:39:02.831123	20.90982153	-100.70978440
64	34	2026-06-26 11:39:28.3864	19.43260000	-99.13320000
65	34	2026-06-26 11:40:19.865987	20.90982153	-100.70978440
66	33	2026-06-26 11:40:19.866445	20.90982153	-100.70978440
67	33	2026-06-26 11:40:24.492503	20.90982153	-100.70978440
68	34	2026-06-26 11:40:24.493986	20.90982153	-100.70978440
69	34	2026-06-26 11:40:38.14582	20.90982153	-100.70978440
70	33	2026-06-26 11:40:38.146788	20.90982153	-100.70978440
71	33	2026-06-26 11:40:43.851496	20.90982301	-100.70978249
72	34	2026-06-26 11:40:43.853184	20.90982301	-100.70978249
73	33	2026-06-26 11:40:47.77413	20.90982301	-100.70978249
74	34	2026-06-26 11:40:47.774352	20.90982301	-100.70978249
75	33	2026-06-26 11:41:07.068129	20.90983497	-100.70976717
76	34	2026-06-26 11:41:07.073281	20.90983497	-100.70976717
77	34	2026-06-26 11:41:27.595705	20.90983497	-100.70976717
78	33	2026-06-26 11:41:27.607001	20.90983497	-100.70976717
79	33	2026-06-26 11:41:48.532073	20.90983497	-100.70976717
80	34	2026-06-26 11:41:48.537104	20.90983497	-100.70976717
81	33	2026-06-26 11:42:06.874709	20.90983497	-100.70976717
82	34	2026-06-26 11:42:06.891081	20.90983497	-100.70976717
83	34	2026-06-26 11:50:33.935949	20.90986926	-100.70972286
84	33	2026-06-26 11:50:33.943224	20.90986926	-100.70972286
85	33	2026-06-26 11:50:34.534081	20.90986926	-100.70972286
86	34	2026-06-26 11:50:34.534337	20.90986926	-100.70972286
87	33	2026-06-26 11:50:36.45335	20.90986926	-100.70972286
88	34	2026-06-26 11:50:36.454444	20.90986926	-100.70972286
89	33	2026-06-26 11:50:39.787664	20.90986926	-100.70972286
90	34	2026-06-26 11:50:39.787877	20.90986926	-100.70972286
91	35	2026-07-03 09:49:05.841124	19.43260000	-99.13320000
92	35	2026-07-03 09:49:37.231143	20.90916907	-100.70943968
93	35	2026-07-03 09:49:53.763065	20.90916907	-100.70943968
94	35	2026-07-03 09:50:18.729942	20.90909516	-100.70943371
95	35	2026-07-03 09:51:04.683084	20.90909516	-100.70943371
96	35	2026-07-03 09:54:52.415521	20.90868682	-100.70934811
97	35	2026-07-03 09:55:00.031852	20.90868682	-100.70934811
98	35	2026-07-03 09:56:17.464076	20.90884777	-100.70938081
99	35	2026-07-03 09:57:50.811695	20.90895780	-100.70939412
100	35	2026-07-03 09:59:01.807971	20.90900797	-100.70940181
101	36	2026-07-03 10:20:16.509696	20.90907270	-100.70942653
102	37	2026-07-03 10:22:57.157641	19.43260000	-99.13320000
103	38	2026-07-03 10:42:15.721313	20.90911924	-100.70943132
104	39	2026-07-03 10:42:40.68669	19.43260000	-99.13320000
105	40	2026-07-03 10:44:38.662989	20.90911772	-100.70943340
106	41	2026-07-03 21:28:36.870799	20.90574651	-100.76057301
107	42	2026-07-07 21:52:22.84354	20.94116100	-100.78927200
108	43	2026-07-09 22:35:37.198682	19.43260000	-99.13320000
109	44	2026-08-04 21:06:37.137128	20.91642169	-100.74056474
110	45	2026-08-04 21:06:57.944918	20.91642169	-100.74056474
111	46	2026-08-04 21:12:42.896272	20.91648163	-100.74042787
112	47	2026-08-04 21:17:05.241152	20.91648324	-100.74041998
113	48	2026-08-04 21:18:31.400428	20.91645434	-100.74048479
114	49	2026-08-04 21:39:24.193582	20.91645434	-100.74048479
115	50	2026-08-04 21:39:29.389711	20.91645434	-100.74048479
116	51	2026-08-04 21:48:45.908395	20.91645434	-100.74048479
117	52	2026-08-04 21:52:54.178551	20.91644713	-100.74050540
118	53	2026-08-04 21:55:58.288122	20.91645042	-100.74049907
119	54	2026-08-04 21:56:02.896268	20.91645042	-100.74049907
120	55	2026-08-04 21:58:34.394685	20.91645042	-100.74049907
121	56	2026-08-04 22:01:46.914383	20.91644713	-100.74050540
122	57	2026-08-04 22:01:50.993402	20.91644713	-100.74050540
123	58	2026-08-04 22:02:20.985958	20.91644713	-100.74050540
124	59	2026-08-04 22:02:24.10672	20.91644713	-100.74050540
125	60	2026-08-04 22:11:29.644556	20.91645434	-100.74048479
126	61	2026-08-04 22:11:42.930237	20.91645434	-100.74048479
127	62	2026-08-04 22:17:01.218376	20.91645434	-100.74048479
128	63	2026-08-04 22:17:39.451674	20.91645434	-100.74048479
129	64	2026-08-04 22:17:43.448876	20.91645434	-100.74048479
130	65	2026-08-04 22:20:28.244926	20.91645434	-100.74048479
131	66	2026-08-04 22:23:03.172299	20.91645434	-100.74048479
132	67	2026-08-04 22:26:33.272348	20.91645434	-100.74048479
133	67	2026-08-04 22:28:29.050699	20.91645491	-100.74048479
134	67	2026-08-04 22:28:48.69425	20.91645491	-100.74048479
135	67	2026-08-04 22:29:03.111777	20.91645491	-100.74048479
136	68	2026-08-04 22:29:16.543233	20.91645491	-100.74048479
137	68	2026-08-04 22:29:41.728265	20.91645434	-100.74048479
138	68	2026-08-04 22:30:43.922105	20.91634487	-100.74046039
139	68	2026-08-04 22:31:27.360926	20.91634487	-100.74046039
140	68	2026-08-04 22:32:10.179359	20.91634487	-100.74046039
141	68	2026-08-04 22:33:44.991513	20.91629218	-100.74037711
142	69	2026-08-04 22:35:15.730862	20.91629218	-100.74037711
143	69	2026-08-04 22:35:23.763728	20.91629218	-100.74037711
144	69	2026-08-04 22:35:37.284386	20.91629218	-100.74037711
145	69	2026-08-04 22:36:00.882181	20.91629218	-100.74037711
146	69	2026-08-04 22:37:33.860287	20.91629218	-100.74037711
147	70	2026-08-04 22:38:08.886508	20.91629218	-100.74037711
148	70	2026-08-04 22:38:17.015058	20.91629218	-100.74037711
149	70	2026-08-04 22:38:27.17994	20.91629218	-100.74037711
150	71	2026-08-04 22:39:00.058812	20.91629218	-100.74037711
151	71	2026-08-04 22:39:07.42789	20.91629218	-100.74037711
152	71	2026-08-04 22:39:24.279385	20.91629218	-100.74037711
153	71	2026-08-04 22:40:07.947281	20.91645434	-100.74048479
154	72	2026-08-04 22:46:13.103215	20.91629218	-100.74037711
155	73	2026-08-04 22:46:21.205356	20.91645434	-100.74048479
156	72	2026-08-04 22:46:23.336698	20.91645434	-100.74048479
157	74	2026-08-04 22:58:45.036829	20.91631067	-100.74041094
158	74	2026-08-04 22:58:53.498371	20.91631067	-100.74041094
159	75	2026-08-04 23:13:04.621995	20.91631067	-100.74041094
160	75	2026-08-04 23:13:16.384136	20.91631067	-100.74041094
161	76	2026-08-04 23:18:24.345125	20.91645434	-100.74048479
162	76	2026-08-04 23:18:33.799798	20.91645434	-100.74048479
163	77	2026-08-04 23:23:28.667433	20.91645434	-100.74048479
164	77	2026-08-04 23:23:36.800847	20.91645434	-100.74048479
165	78	2026-08-04 23:26:38.431687	20.91645434	-100.74048479
166	78	2026-08-04 23:26:46.196621	20.91645434	-100.74048479
167	79	2026-08-04 23:30:35.73471	20.91645042	-100.74049907
168	79	2026-08-04 23:30:43.954022	20.91645042	-100.74049907
169	80	2026-08-04 23:34:06.087732	19.43260000	-99.13320000
170	80	2026-08-04 23:34:15.968615	20.91634487	-100.74046039
171	81	2026-08-04 23:44:07.547115	20.91645442	-100.74048724
172	82	2026-08-04 23:44:14.723701	20.91645442	-100.74048724
173	81	2026-08-04 23:44:16.919751	20.91645442	-100.74048724
174	81	2026-08-04 23:44:16.950251	20.91645442	-100.74048724
175	83	2026-08-04 23:45:16.43097	20.91645442	-100.74048724
176	84	2026-08-04 23:45:25.65173	19.43260000	-99.13320000
177	83	2026-08-04 23:45:32.190679	20.91645442	-100.74048724
178	85	2026-08-05 09:55:00.490678	20.91645434	-100.74048479
179	86	2026-08-05 09:55:51.77235	20.91645434	-100.74048479
180	87	2026-08-05 09:55:52.623571	20.91645434	-100.74048479
181	88	2026-08-05 09:56:47.182561	20.91645042	-100.74049907
182	89	2026-08-05 10:05:19.962439	20.91628578	-100.74051558
183	90	2026-08-05 10:05:20.766961	20.91628578	-100.74051558
184	91	2026-08-05 10:06:16.167205	20.91628578	-100.74051558
185	92	2026-08-05 10:09:17.123947	20.91642169	-100.74056474
186	93	2026-08-05 10:16:18.64054	20.91642169	-100.74056474
187	94	2026-08-05 10:22:06.392139	19.43260000	-99.13320000
188	95	2026-08-05 10:23:20.23139	19.43260000	-99.13320000
189	96	2026-08-05 10:23:21.158358	20.91642169	-100.74056474
190	97	2026-08-05 10:23:28.128635	20.91628578	-100.74051558
191	98	2026-08-05 10:26:13.502984	20.91629265	-100.74051700
192	99	2026-08-05 10:26:16.756455	20.91629265	-100.74051700
193	100	2026-08-05 10:28:41.868091	20.91634487	-100.74046039
194	101	2026-08-05 10:29:37.393033	20.91634487	-100.74046039
195	102	2026-08-05 10:29:47.90736	20.91634487	-100.74046039
196	103	2026-08-05 10:31:40.086399	20.91644759	-100.74050540
197	104	2026-08-05 10:39:42.56781	20.91645434	-100.74048479
198	105	2026-08-05 10:48:13.068372	20.91644369	-100.74051772
199	105	2026-08-05 10:49:24.203287	20.91644713	-100.74050540
200	104	2026-08-05 10:50:35.176911	20.91644713	-100.74050540
201	106	2026-08-05 10:50:55.873762	19.43260000	-99.13320000
202	103	2026-08-05 10:52:39.72382	20.91644713	-100.74050540
203	103	2026-08-05 10:52:41.273252	20.91644713	-100.74050540
204	103	2026-08-05 10:53:06.137046	20.91644369	-100.74051772
205	107	2026-08-05 10:53:48.671753	20.91644369	-100.74051772
206	108	2026-08-05 10:56:01.680484	20.91644369	-100.74051772
207	109	2026-08-05 10:56:09.381226	20.91644369	-100.74051772
208	110	2026-08-05 10:56:21.093541	20.91644369	-100.74051772
209	111	2026-08-05 10:58:17.469359	20.91644369	-100.74051772
210	112	2026-08-05 10:58:21.620649	20.91644369	-100.74051772
211	113	2026-08-05 10:58:35.446653	19.43260000	-99.13320000
212	114	2026-08-05 10:59:39.313111	19.43260000	-99.13320000
213	102	2026-08-05 10:59:40.742008	20.91644369	-100.74051772
214	115	2026-08-05 10:59:50.20742	20.91644369	-100.74051772
215	116	2026-08-05 21:38:35.253821	19.43260000	-99.13320000
216	94	2026-08-05 21:41:41.932541	20.93993600	-100.78779600
217	117	2026-08-05 21:42:12.973098	19.43260000	-99.13320000
218	93	2026-08-05 21:42:21.680488	20.93993600	-100.78779600
219	117	2026-08-05 21:42:55.814095	20.93993600	-100.78779600
220	92	2026-08-05 21:42:55.814275	20.93993600	-100.78779600
221	92	2026-08-05 21:43:59.405648	20.93993600	-100.78779600
222	117	2026-08-05 21:43:59.415618	20.93993600	-100.78779600
223	118	2026-08-05 21:46:20.104803	19.43260000	-99.13320000
224	118	2026-08-05 21:46:31.480113	20.93993600	-100.78779600
225	118	2026-08-05 21:46:31.854712	20.93993600	-100.78779600
226	118	2026-08-05 21:46:31.856679	20.93993600	-100.78779600
227	118	2026-08-05 21:46:31.857941	20.93993600	-100.78779600
228	118	2026-08-05 22:00:36.227735	20.94115200	-100.78918500
229	118	2026-08-05 22:00:36.30731	20.94115200	-100.78918500
230	118	2026-08-05 22:00:36.30914	20.94115200	-100.78918500
231	119	2026-08-05 22:00:43.23936	19.43260000	-99.13320000
232	118	2026-08-05 22:00:45.585814	20.94115200	-100.78918500
233	118	2026-08-05 22:00:45.585968	20.94115200	-100.78918500
234	118	2026-08-05 22:00:45.586782	20.94115200	-100.78918500
235	120	2026-08-05 22:00:48.598549	20.94115200	-100.78918500
236	119	2026-08-05 22:00:53.245026	20.94115200	-100.78918500
237	119	2026-08-05 22:00:53.24498	20.94115200	-100.78918500
238	119	2026-08-05 22:00:53.245463	20.94115200	-100.78918500
239	121	2026-08-05 22:07:14.039534	19.43260000	-99.13320000
240	121	2026-08-05 22:07:41.64256	20.94115200	-100.78918500
241	121	2026-08-05 22:07:41.708563	20.94115200	-100.78918500
242	121	2026-08-05 22:08:17.6158	20.94115200	-100.78918500
243	121	2026-08-05 22:09:26.734402	20.94115200	-100.78918500
244	121	2026-08-05 22:09:55.007571	20.94115200	-100.78918500
245	121	2026-08-05 22:10:01.109846	20.94115200	-100.78918500
\.


--
-- TOC entry 3426 (class 0 OID 16498)
-- Dependencies: 225
-- Data for Name: servicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicio (servicio_id, dueno_id, paseador_id, mascota_id, direccion_id, tipo_servicio, duracion_minutos, costo_total, estado, hora_solicitada, hora_inicio, hora_fin, ruta_geo_json, notas_dueno, notas_paseador) FROM stdin;
25	3	3	23	8	paseo	30	0.00	en_camino	2026-06-26 11:16:47.617994	2026-06-26 11:16:50.174258	\N	\N		\N
41	3	\N	22	8	paseo	30	0.00	rechazado	2026-07-03 21:28:36.870799	\N	\N	\N		\N
40	3	\N	23	8	paseo	30	0.00	rechazado	2026-07-03 10:44:38.662989	\N	\N	\N		\N
39	3	\N	23	8	paseo	30	0.00	rechazado	2026-07-03 10:42:40.68669	\N	\N	\N		\N
38	3	\N	23	8	paseo	30	0.00	rechazado	2026-07-03 10:42:15.721313	\N	\N	\N		\N
42	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-07-07 21:52:22.84354	\N	\N	\N		\N
43	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-07-09 22:35:37.198682	\N	\N	\N		\N
45	3	\N	22	8	paseo	90	0.00	rechazado	2026-08-04 21:06:57.944918	\N	\N	\N	POPO	\N
44	3	\N	22	8	paseo	90	0.00	rechazado	2026-08-04 21:06:37.137128	\N	\N	\N		\N
26	3	3	23	8	paseo	30	0.00	en_camino	2026-06-26 11:18:24.704228	2026-06-26 11:19:12.802171	\N	\N		\N
29	3	\N	22	8	paseo	30	0.00	rechazado	2026-06-26 11:21:29.282519	\N	\N	\N		\N
28	3	\N	22	8	paseo	30	0.00	rechazado	2026-06-26 11:21:25.599028	\N	\N	\N		\N
46	3	3	22	8	paseo	90	0.00	confirmar_precio	2026-08-04 21:12:42.896272	\N	\N	\N	POPO	\N
47	3	3	22	8	guarderia	30	0.00	confirmar_precio	2026-08-04 21:17:05.241152	\N	\N	\N		\N
27	3	3	22	8	paseo	30	0.00	en_camino	2026-06-26 11:21:24.295788	2026-06-26 11:21:35.567754	\N	\N		\N
48	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 21:18:31.400428	\N	\N	\N		\N
49	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 21:39:24.193582	\N	\N	\N		\N
50	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-04 21:39:29.389711	\N	\N	\N		\N
30	3	3	23	8	paseo	30	0.00	rechazado	2026-06-26 11:25:53.854828	2026-06-26 11:25:57.294712	\N	\N		\N
51	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 21:48:45.908395	\N	\N	\N		\N
52	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 21:52:54.178551	\N	\N	\N		\N
53	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 21:55:58.288122	\N	\N	\N		\N
54	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-04 21:56:02.896268	\N	\N	\N		\N
23	3	3	23	8	paseo	30	0.00	en_camino	2026-06-26 10:51:43.423382	2026-06-26 10:51:49.555921	\N	\N		\N
31	3	3	23	8	paseo	30	0.00	rechazado	2026-06-26 11:26:34.25578	2026-06-26 11:32:27.179944	\N	\N		\N
55	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 21:58:34.394685	\N	\N	\N		\N
56	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 22:01:46.914383	\N	\N	\N		\N
32	3	3	23	8	guarderia	30	0.00	en_camino	2026-06-26 11:32:55.49967	2026-06-26 11:36:58.798716	\N	\N		\N
33	3	3	23	8	guarderia	30	0.00	en_camino	2026-06-26 11:37:11.026126	2026-06-26 11:37:12.543356	\N	\N		\N
34	3	3	23	8	paseo	30	0.00	en_camino	2026-06-26 11:39:28.3864	2026-06-26 11:39:29.742054	\N	\N		\N
24	3	3	23	8	paseo	30	0.00	rechazado	2026-06-26 11:15:12.397354	2026-06-26 11:15:24.449734	\N	\N		\N
35	3	3	23	8	paseo	30	0.00	en_camino	2026-07-03 09:49:05.841124	2026-07-03 09:49:18.135206	\N	\N		\N
36	3	3	23	8	paseo	30	0.00	confirmar_precio	2026-07-03 10:20:16.509696	\N	\N	\N		\N
37	3	3	23	8	paseo	30	0.00	confirmar_precio	2026-07-03 10:22:57.157641	\N	\N	\N		\N
57	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 22:01:50.993402	\N	\N	\N		\N
58	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 22:02:20.985958	\N	\N	\N		\N
59	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 22:02:24.10672	\N	\N	\N		\N
60	3	3	22	8	guarderia	30	0.00	confirmar_precio	2026-08-04 22:11:29.644556	\N	\N	\N		\N
61	3	3	22	8	guarderia	30	0.00	confirmar_precio	2026-08-04 22:11:42.930237	\N	\N	\N		\N
62	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 22:17:01.218376	\N	\N	\N		\N
63	3	3	22	8	veterinaria	30	0.00	confirmar_precio	2026-08-04 22:17:39.451674	\N	\N	\N		\N
64	3	\N	22	8	veterinaria	30	0.00	rechazado	2026-08-04 22:17:43.448876	\N	\N	\N		\N
65	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 22:20:28.244926	\N	\N	\N		\N
66	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-04 22:23:03.172299	\N	\N	\N		\N
73	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-04 22:46:21.205356	\N	\N	\N		\N
67	3	3	22	8	paseo	30	0.00	en_camino	2026-08-04 22:26:33.272348	2026-08-04 22:28:26.764665	\N	\N		\N
68	3	3	22	8	paseo	30	0.00	en_camino	2026-08-04 22:29:16.543233	2026-08-04 22:29:22.775384	\N	\N		\N
69	3	3	22	8	paseo	30	0.00	en_camino	2026-08-04 22:35:15.730862	2026-08-04 22:35:22.305335	\N	\N		\N
78	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:26:38.431687	2026-08-04 23:26:45.070626	2026-08-04 23:26:49.039952	{"type":"LineString","coordinates":[[-100.74048479,20.91645434],[-100.74048479,20.91645434]]}		\N
70	3	3	22	8	paseo	30	0.00	en_camino	2026-08-04 22:38:08.886508	2026-08-04 22:38:15.858133	\N	\N		\N
74	3	3	22	8	paseo	30	0.00	completado	2026-08-04 22:58:45.036829	2026-08-04 22:58:51.750866	2026-08-04 22:58:55.915528	{"type":"LineString","coordinates":[[-100.74041094,20.91631067],[-100.74041094,20.91631067]]}		\N
71	3	3	22	8	paseo	30	0.00	completado	2026-08-04 22:39:00.058812	2026-08-04 22:39:06.357508	2026-08-04 22:40:21.372761	{"type":"LineString","coordinates":[[-100.74037711,20.91629218],[-100.74037711,20.91629218],[-100.74037711,20.91629218],[-100.74048479,20.91645434]]}		\N
77	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:23:28.667433	2026-08-04 23:23:35.256101	2026-08-04 23:23:39.542561	{"type":"LineString","coordinates":[[-100.74048479,20.91645434],[-100.74048479,20.91645434]]}		\N
72	3	3	22	8	paseo	30	0.00	completado	2026-08-04 22:46:13.103215	2026-08-04 22:46:21.418554	2026-08-04 22:46:25.981132	{"type":"LineString","coordinates":[[-100.74037711,20.91629218],[-100.74048479,20.91645434]]}		\N
75	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:13:04.621995	2026-08-04 23:13:10.715094	2026-08-04 23:13:20.254354	{"type":"LineString","coordinates":[[-100.74041094,20.91631067],[-100.74041094,20.91631067]]}		\N
79	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:30:35.73471	2026-08-04 23:30:42.843354	2026-08-04 23:30:47.388999	{"type":"LineString","coordinates":[[-100.74049907,20.91645042],[-100.74049907,20.91645042]]}		\N
76	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:18:24.345125	2026-08-04 23:18:30.811287	2026-08-04 23:18:37.181012	{"type":"LineString","coordinates":[[-100.74048479,20.91645434],[-100.74048479,20.91645434]]}		\N
80	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:34:06.087732	2026-08-04 23:34:14.598062	2026-08-04 23:34:18.807365	{"type":"LineString","coordinates":[[-99.1332,19.4326],[-100.74046039,20.91634487]]}		\N
81	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:44:07.547115	2026-08-04 23:44:15.9201	2026-08-04 23:44:21.423024	{"type":"LineString","coordinates":[[-100.74048724,20.91645442],[-100.74048724,20.91645442],[-100.74048724,20.91645442]]}		\N
82	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-04 23:44:14.723701	\N	\N	\N		\N
83	3	3	22	8	paseo	30	0.00	completado	2026-08-04 23:45:16.43097	2026-08-04 23:45:29.39472	2026-08-04 23:45:38.112159	{"type":"LineString","coordinates":[[-100.74048724,20.91645442],[-100.74048724,20.91645442]]}		\N
84	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-04 23:45:25.65173	\N	\N	\N		\N
85	3	3	22	8	paseo	30	0.00	en_camino	2026-08-05 09:55:00.490678	2026-08-05 09:55:11.664241	\N	\N		\N
87	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-05 09:55:52.623571	\N	\N	\N		\N
86	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 09:55:51.77235	\N	\N	\N		\N
109	3	3	23	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:56:09.381226	\N	\N	\N		\N
90	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-05 10:05:20.766961	\N	\N	\N		\N
89	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:05:19.962439	\N	\N	\N		\N
110	3	3	23	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:56:21.093541	\N	\N	\N		\N
118	3	3	22	8	paseo	30	500.00	completado	2026-08-05 21:46:20.104803	2026-08-05 21:46:26.397312	2026-08-05 21:46:37.976632	{"type":"LineString","coordinates":[[-99.1332,19.4326],[-100.787796,20.939936],[-100.787796,20.939936],[-100.787796,20.939936],[-100.787796,20.939936]]}		\N
96	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-05 10:23:21.158358	\N	\N	\N		\N
95	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:23:20.23139	\N	\N	\N		\N
112	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-05 10:58:21.620649	\N	\N	\N		\N
98	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:26:13.502984	\N	\N	\N		\N
99	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:26:16.756455	\N	\N	\N		\N
100	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:28:41.868091	\N	\N	\N		\N
111	3	\N	23	8	paseo	30	0.00	rechazado	2026-08-05 10:58:17.469359	\N	\N	\N		\N
101	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:29:37.393033	\N	\N	\N		\N
113	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:58:35.446653	\N	\N	\N		\N
114	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:59:39.313111	\N	\N	\N		\N
102	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:29:47.90736	2026-08-05 10:29:52.94109	2026-08-05 10:59:43.521563	{"type":"LineString","coordinates":[[-100.74046039,20.91634487],[-100.74051772,20.91644369]]}		\N
105	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:48:13.068372	2026-08-05 10:48:16.939657	2026-08-05 10:50:17.427238	{"type":"LineString","coordinates":[[-100.74051772,20.91644369],[-100.7405054,20.91644713]]}		\N
104	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:39:42.56781	2026-08-05 10:39:46.93276	2026-08-05 10:50:38.115045	{"type":"LineString","coordinates":[[-100.74048479,20.91645434],[-100.7405054,20.91644713]]}		\N
115	3	3	22	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:59:50.20742	\N	\N	\N		\N
97	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:23:28.128635	2026-08-05 10:24:14.471294	2026-08-05 21:37:06.421895	{"type":"LineString","coordinates":[[-100.74051558,20.91628578]]}		\N
106	3	3	23	8	paseo	30	500.00	completado	2026-08-05 10:50:55.873762	2026-08-05 10:51:00.246385	2026-08-05 10:51:04.554801	{"type":"LineString","coordinates":[[-99.1332,19.4326]]}		\N
103	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:31:40.086399	2026-08-05 10:31:45.721684	2026-08-05 10:53:07.550474	{"type":"LineString","coordinates":[[-100.7405054,20.91644759],[-100.7405054,20.91644713],[-100.7405054,20.91644713],[-100.74051772,20.91644369]]}		\N
107	3	3	23	8	paseo	30	500.00	completado	2026-08-05 10:53:48.671753	2026-08-05 10:53:53.808033	2026-08-05 10:54:02.022493	{"type":"LineString","coordinates":[[-100.74051772,20.91644369]]}		\N
108	3	3	23	8	paseo	30	0.00	confirmar_precio	2026-08-05 10:56:01.680484	\N	\N	\N		\N
120	3	\N	22	8	paseo	30	0.00	rechazado	2026-08-05 22:00:48.598549	\N	\N	\N		\N
116	3	3	22	8	paseo	30	500.00	completado	2026-08-05 21:38:35.253821	2026-08-05 21:38:44.270384	2026-08-05 21:39:06.703244	{"type":"LineString","coordinates":[[-99.1332,19.4326]]}		\N
94	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:22:06.392139	2026-08-05 10:22:16.922977	2026-08-05 21:41:58.017415	{"type":"LineString","coordinates":[[-99.1332,19.4326],[-100.787796,20.939936]]}		\N
93	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:16:18.64054	2026-08-05 10:16:22.826052	2026-08-05 21:42:16.626804	{"type":"LineString","coordinates":[[-100.74056474,20.91642169]]}		\N
119	3	3	22	8	paseo	30	500.00	completado	2026-08-05 22:00:43.23936	2026-08-05 22:00:52.117189	2026-08-05 22:00:59.007406	{"type":"LineString","coordinates":[[-99.1332,19.4326],[-100.789185,20.941152],[-100.789185,20.941152],[-100.789185,20.941152]]}		\N
91	3	3	23	8	paseo	30	500.00	completado	2026-08-05 10:06:16.167205	2026-08-05 10:06:21.737424	2026-08-05 22:01:49.607941	{"type":"LineString","coordinates":[[-100.74051558,20.91628578]]}		\N
117	3	3	22	8	paseo	30	500.00	completado	2026-08-05 21:42:12.973098	2026-08-05 21:42:23.533727	2026-08-05 21:42:28.945639	{"type":"LineString","coordinates":[[-99.1332,19.4326]]}		\N
88	3	3	22	8	paseo	30	500.00	completado	2026-08-05 09:56:47.182561	2026-08-05 09:56:51.570111	2026-08-05 22:01:52.416562	{"type":"LineString","coordinates":[[-100.74049907,20.91645042]]}		\N
92	3	3	22	8	paseo	30	500.00	completado	2026-08-05 10:09:17.123947	2026-08-05 10:09:25.095958	2026-08-05 21:45:13.653947	{"type":"LineString","coordinates":[[-100.74056474,20.91642169],[-100.787796,20.939936],[-100.787796,20.939936]]}		\N
121	3	3	22	8	paseo	30	500.00	completado	2026-08-05 22:07:14.039534	2026-08-05 22:07:34.578399	2026-08-05 22:08:06.69959	{"type":"LineString","coordinates":[[-99.1332,19.4326],[-100.789185,20.941152],[-100.789185,20.941152]]}		\N
\.


--
-- TOC entry 3433 (class 0 OID 24616)
-- Dependencies: 232
-- Data for Name: servicio_multiple_mascotas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicio_multiple_mascotas (servicio_mascota_id, servicio_id, mascota_id, created_at) FROM stdin;
25	23	23	2026-06-26 10:51:43.423382
26	24	23	2026-06-26 11:15:12.397354
27	24	22	2026-06-26 11:15:12.397354
28	25	23	2026-06-26 11:16:47.617994
29	25	22	2026-06-26 11:16:47.617994
30	26	23	2026-06-26 11:18:24.704228
31	27	22	2026-06-26 11:21:24.295788
32	28	22	2026-06-26 11:21:25.599028
33	29	22	2026-06-26 11:21:29.282519
34	29	23	2026-06-26 11:21:29.282519
35	30	23	2026-06-26 11:25:53.854828
36	30	22	2026-06-26 11:25:53.854828
37	31	23	2026-06-26 11:26:34.25578
38	31	22	2026-06-26 11:26:34.25578
39	32	23	2026-06-26 11:32:55.49967
40	33	23	2026-06-26 11:37:11.026126
41	34	23	2026-06-26 11:39:28.3864
42	34	22	2026-06-26 11:39:28.3864
43	35	23	2026-07-03 09:49:05.841124
44	36	23	2026-07-03 10:20:16.509696
45	36	22	2026-07-03 10:20:16.509696
46	37	23	2026-07-03 10:22:57.157641
47	37	22	2026-07-03 10:22:57.157641
48	38	23	2026-07-03 10:42:15.721313
49	39	23	2026-07-03 10:42:40.68669
50	40	23	2026-07-03 10:44:38.662989
51	41	22	2026-07-03 21:28:36.870799
52	41	23	2026-07-03 21:28:36.870799
53	42	22	2026-07-07 21:52:22.84354
54	43	22	2026-07-09 22:35:37.198682
55	44	22	2026-08-04 21:06:37.137128
56	45	22	2026-08-04 21:06:57.944918
57	45	23	2026-08-04 21:06:57.944918
58	46	22	2026-08-04 21:12:42.896272
59	46	23	2026-08-04 21:12:42.896272
60	47	22	2026-08-04 21:17:05.241152
61	48	22	2026-08-04 21:18:31.400428
62	49	22	2026-08-04 21:39:24.193582
63	50	22	2026-08-04 21:39:29.389711
64	51	22	2026-08-04 21:48:45.908395
65	52	22	2026-08-04 21:52:54.178551
66	53	22	2026-08-04 21:55:58.288122
67	54	22	2026-08-04 21:56:02.896268
68	55	22	2026-08-04 21:58:34.394685
69	56	22	2026-08-04 22:01:46.914383
70	57	22	2026-08-04 22:01:50.993402
71	58	22	2026-08-04 22:02:20.985958
72	59	22	2026-08-04 22:02:24.10672
73	60	22	2026-08-04 22:11:29.644556
74	61	22	2026-08-04 22:11:42.930237
75	62	22	2026-08-04 22:17:01.218376
76	63	22	2026-08-04 22:17:39.451674
77	64	22	2026-08-04 22:17:43.448876
78	65	22	2026-08-04 22:20:28.244926
79	66	22	2026-08-04 22:23:03.172299
80	67	22	2026-08-04 22:26:33.272348
81	68	22	2026-08-04 22:29:16.543233
82	69	22	2026-08-04 22:35:15.730862
83	70	22	2026-08-04 22:38:08.886508
84	71	22	2026-08-04 22:39:00.058812
85	72	22	2026-08-04 22:46:13.103215
86	73	22	2026-08-04 22:46:21.205356
87	74	22	2026-08-04 22:58:45.036829
88	75	22	2026-08-04 23:13:04.621995
89	76	22	2026-08-04 23:18:24.345125
90	77	22	2026-08-04 23:23:28.667433
91	78	22	2026-08-04 23:26:38.431687
92	79	22	2026-08-04 23:30:35.73471
93	80	22	2026-08-04 23:34:06.087732
94	81	22	2026-08-04 23:44:07.547115
95	82	22	2026-08-04 23:44:14.723701
96	83	22	2026-08-04 23:45:16.43097
97	84	22	2026-08-04 23:45:25.65173
98	85	22	2026-08-05 09:55:00.490678
99	86	22	2026-08-05 09:55:51.77235
100	87	22	2026-08-05 09:55:52.623571
101	88	22	2026-08-05 09:56:47.182561
102	89	22	2026-08-05 10:05:19.962439
103	90	22	2026-08-05 10:05:20.766961
104	91	23	2026-08-05 10:06:16.167205
105	92	22	2026-08-05 10:09:17.123947
106	93	22	2026-08-05 10:16:18.64054
107	94	22	2026-08-05 10:22:06.392139
108	95	22	2026-08-05 10:23:20.23139
109	96	22	2026-08-05 10:23:21.158358
110	97	22	2026-08-05 10:23:28.128635
111	98	22	2026-08-05 10:26:13.502984
112	99	22	2026-08-05 10:26:16.756455
113	100	22	2026-08-05 10:28:41.868091
114	101	22	2026-08-05 10:29:37.393033
115	102	22	2026-08-05 10:29:47.90736
116	103	22	2026-08-05 10:31:40.086399
117	104	22	2026-08-05 10:39:42.56781
118	105	22	2026-08-05 10:48:13.068372
119	106	23	2026-08-05 10:50:55.873762
120	107	23	2026-08-05 10:53:48.671753
121	108	23	2026-08-05 10:56:01.680484
122	109	23	2026-08-05 10:56:09.381226
123	110	23	2026-08-05 10:56:21.093541
124	110	22	2026-08-05 10:56:21.093541
125	111	23	2026-08-05 10:58:17.469359
126	111	22	2026-08-05 10:58:17.469359
127	112	22	2026-08-05 10:58:21.620649
128	113	22	2026-08-05 10:58:35.446653
129	114	22	2026-08-05 10:59:39.313111
130	115	22	2026-08-05 10:59:50.20742
131	116	22	2026-08-05 21:38:35.253821
132	117	22	2026-08-05 21:42:12.973098
133	118	22	2026-08-05 21:46:20.104803
134	119	22	2026-08-05 22:00:43.23936
135	120	22	2026-08-05 22:00:48.598549
136	121	22	2026-08-05 22:07:14.039534
\.


--
-- TOC entry 3416 (class 0 OID 16422)
-- Dependencies: 215
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (usuario_id, nombre_completo, telefono, email, contrasena, url_foto_perfil) FROM stdin;
1	ricardo patlan perez	4151112233	ricardo@gmail.com	$2b$10$IkEBVKMYo0WHp5LLEjl5UuORlZJvj0fqmTajUVznXuJhy3daG/Ucu	1775759211625.jpg
2	Angel Andres Arellano	4151234455	angel@gmail.com	$2b$10$AcwySy7EmoxHwNk2TfFO/.5boKXm1eujP2t/HU21bvRS6TMpDw.9K	1775842299674.jpg
3	Martin Isaias Perez	4151234455	martin@gmail.com	$2b$10$zXW2MU8HNNFX/IrV26bgHeYnrDsfhIfgU8LBRDl7abpQjJkGxdaki	1775843276250.jpg
4	Jose Martin Trejo	4151234455	blackmarti@gmail.com	$2b$10$.yX4yqmhduFAKDHrDKDD1On7o5KGf/2wG5MfTxdI2CukvC6vJ.02q	1776086521801.jpg
5	Ricardo Patlan Perez	4151709090	ricardo1@gmail.com	$2b$10$TflPq4j4wpcy9SmIPkbd/eTZPAfry.CoatrDeAwAtlUKJr90ltZvO	1776285895562.jpg
33	Prueba Usuario	5512774639	prueba20260625101709@example.com	$2b$10$gGc5d205WiV2HgUJGea7leI2ns17SuzsYAeO5MNNG8ImnmLfRwoaC	\N
34	MAmdnkwn	1111111111	isaias2@gmail.com	$2b$10$XcNBbod16yl8x8WgFIe0AuEDm5GSWHxqnD51YhXHHtcFf6ZkcBKjG	1782405679443.jpg
\.


--
-- TOC entry 3424 (class 0 OID 16482)
-- Dependencies: 223
-- Data for Name: usuariorol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuariorol (usuario_id, rol_id) FROM stdin;
\.


--
-- TOC entry 3447 (class 0 OID 0)
-- Dependencies: 228
-- Name: calificacion_calificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calificacion_calificacion_id_seq', 1, false);


--
-- TOC entry 3448 (class 0 OID 0)
-- Dependencies: 218
-- Name: direccion_direccion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.direccion_direccion_id_seq', 17, true);


--
-- TOC entry 3449 (class 0 OID 0)
-- Dependencies: 221
-- Name: mascota_mascota_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mascota_mascota_id_seq', 23, true);


--
-- TOC entry 3450 (class 0 OID 0)
-- Dependencies: 230
-- Name: paseador_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paseador_id_seq', 3, true);


--
-- TOC entry 3451 (class 0 OID 0)
-- Dependencies: 216
-- Name: rol_rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rol_rol_id_seq', 1, false);


--
-- TOC entry 3452 (class 0 OID 0)
-- Dependencies: 226
-- Name: seguimientogps_seguimiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seguimientogps_seguimiento_id_seq', 245, true);


--
-- TOC entry 3453 (class 0 OID 0)
-- Dependencies: 231
-- Name: servicio_multiple_mascotas_servicio_mascota_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servicio_multiple_mascotas_servicio_mascota_id_seq', 136, true);


--
-- TOC entry 3454 (class 0 OID 0)
-- Dependencies: 224
-- Name: servicio_servicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servicio_servicio_id_seq', 121, true);


--
-- TOC entry 3455 (class 0 OID 0)
-- Dependencies: 214
-- Name: usuario_usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_usuario_id_seq', 34, true);


--
-- TOC entry 3252 (class 2606 OID 16548)
-- Name: calificacion calificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_pkey PRIMARY KEY (calificacion_id);


--
-- TOC entry 3254 (class 2606 OID 16550)
-- Name: calificacion calificacion_servicio_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_servicio_id_key UNIQUE (servicio_id);


--
-- TOC entry 3240 (class 2606 OID 16448)
-- Name: direccion direccion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion
    ADD CONSTRAINT direccion_pkey PRIMARY KEY (direccion_id);


--
-- TOC entry 3244 (class 2606 OID 16476)
-- Name: mascota mascota_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mascota
    ADD CONSTRAINT mascota_pkey PRIMARY KEY (mascota_id);


--
-- TOC entry 3242 (class 2606 OID 16460)
-- Name: paseador paseador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paseador
    ADD CONSTRAINT paseador_pkey PRIMARY KEY (paseador_id);


--
-- TOC entry 3236 (class 2606 OID 16440)
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- TOC entry 3238 (class 2606 OID 16438)
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (rol_id);


--
-- TOC entry 3250 (class 2606 OID 16534)
-- Name: seguimientogps seguimientogps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimientogps
    ADD CONSTRAINT seguimientogps_pkey PRIMARY KEY (seguimiento_id);


--
-- TOC entry 3256 (class 2606 OID 24622)
-- Name: servicio_multiple_mascotas servicio_multiple_mascotas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_multiple_mascotas
    ADD CONSTRAINT servicio_multiple_mascotas_pkey PRIMARY KEY (servicio_mascota_id);


--
-- TOC entry 3248 (class 2606 OID 16507)
-- Name: servicio servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_pkey PRIMARY KEY (servicio_id);


--
-- TOC entry 3258 (class 2606 OID 24624)
-- Name: servicio_multiple_mascotas uq_servicio_mascota; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_multiple_mascotas
    ADD CONSTRAINT uq_servicio_mascota UNIQUE (servicio_id, mascota_id);


--
-- TOC entry 3232 (class 2606 OID 16431)
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- TOC entry 3234 (class 2606 OID 16429)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (usuario_id);


--
-- TOC entry 3246 (class 2606 OID 16486)
-- Name: usuariorol usuariorol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT usuariorol_pkey PRIMARY KEY (usuario_id, rol_id);


--
-- TOC entry 3268 (class 2606 OID 16556)
-- Name: calificacion calificacion_califica_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_califica_usuario_id_fkey FOREIGN KEY (califica_usuario_id) REFERENCES public.usuario(usuario_id);


--
-- TOC entry 3269 (class 2606 OID 16561)
-- Name: calificacion calificacion_calificado_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_calificado_usuario_id_fkey FOREIGN KEY (calificado_usuario_id) REFERENCES public.usuario(usuario_id);


--
-- TOC entry 3270 (class 2606 OID 16551)
-- Name: calificacion calificacion_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(servicio_id);


--
-- TOC entry 3259 (class 2606 OID 16449)
-- Name: direccion direccion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion
    ADD CONSTRAINT direccion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(usuario_id);


--
-- TOC entry 3271 (class 2606 OID 24630)
-- Name: servicio_multiple_mascotas fk_servicio_mascota_mascota; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_multiple_mascotas
    ADD CONSTRAINT fk_servicio_mascota_mascota FOREIGN KEY (mascota_id) REFERENCES public.mascota(mascota_id) ON DELETE CASCADE;


--
-- TOC entry 3272 (class 2606 OID 24625)
-- Name: servicio_multiple_mascotas fk_servicio_mascota_servicio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_multiple_mascotas
    ADD CONSTRAINT fk_servicio_mascota_servicio FOREIGN KEY (servicio_id) REFERENCES public.servicio(servicio_id) ON DELETE CASCADE;


--
-- TOC entry 3260 (class 2606 OID 16477)
-- Name: mascota mascota_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mascota
    ADD CONSTRAINT mascota_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(usuario_id);


--
-- TOC entry 3267 (class 2606 OID 16535)
-- Name: seguimientogps seguimientogps_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimientogps
    ADD CONSTRAINT seguimientogps_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(servicio_id);


--
-- TOC entry 3263 (class 2606 OID 16523)
-- Name: servicio servicio_direccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_direccion_id_fkey FOREIGN KEY (direccion_id) REFERENCES public.direccion(direccion_id);


--
-- TOC entry 3264 (class 2606 OID 16508)
-- Name: servicio servicio_dueno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_dueno_id_fkey FOREIGN KEY (dueno_id) REFERENCES public.usuario(usuario_id);


--
-- TOC entry 3265 (class 2606 OID 16518)
-- Name: servicio servicio_mascota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES public.mascota(mascota_id);


--
-- TOC entry 3266 (class 2606 OID 16513)
-- Name: servicio servicio_paseador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_paseador_id_fkey FOREIGN KEY (paseador_id) REFERENCES public.usuario(usuario_id);


--
-- TOC entry 3261 (class 2606 OID 16492)
-- Name: usuariorol usuariorol_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT usuariorol_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol(rol_id);


--
-- TOC entry 3262 (class 2606 OID 16487)
-- Name: usuariorol usuariorol_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT usuariorol_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(usuario_id);


-- Completed on 2026-08-06 07:28:39

--
-- PostgreSQL database dump complete
--

\unrestrict 3bTFpcZJtWaLEmf2ZWvo67VTP8wHbh4Px1T3fpWKVlzcnzJffC1eKkQtGY00SI2

