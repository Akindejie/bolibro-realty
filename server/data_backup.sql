--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Location; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Location" (id, address, city, state, country, "postalCode", coordinates) VALUES (15, '421', 'Troy', 'Ohio', 'United States', '45373', '0101000020E61000007594DE92F77B52C03D0A7CEAFD544440');
INSERT INTO public."Location" (id, address, city, state, country, "postalCode", coordinates) VALUES (16, '421', 'Troy', 'Ohio', 'United States', '45373', '0101000020E61000007594DE92F77B52C03D0A7CEAFD544440');
INSERT INTO public."Location" (id, address, city, state, country, "postalCode", coordinates) VALUES (18, '14111', 'Marysville', 'Ohio', 'United States', '43040', '0101000020E6100000A1C308742B485EC0FFE5D3D25FB44340');
INSERT INTO public."Location" (id, address, city, state, country, "postalCode", coordinates) VALUES (19, 'East Township', 'Town of Knox', 'New York', 'United States', '12107', '0101000020E610000000000000000000000000000000000000');
INSERT INTO public."Location" (id, address, city, state, country, "postalCode", coordinates) VALUES (17, '4988', 'Mentor', 'Ohio', 'United States', '44060', '0101000020E6100000300316513B4C57C0B4C9A75C8C8D4240');


--
-- Data for Name: Manager; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Manager" (id, "cognitoId", name, email, "phoneNumber") VALUES (12, '44a85478-2061-703a-d2db-badee16544bf', 'bolibro', 'bolibro623@gmail.com', '');


--
-- Data for Name: Property; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Property" (id, name, description, "pricePerMonth", "securityDeposit", "applicationFee", "photoUrls", amenities, highlights, "isPetsAllowed", "isParkingIncluded", beds, baths, "squareFeet", "propertyType", "postedDate", "averageRating", "numberOfReviews", "locationId", "managerCognitoId", status, images) VALUES (16, 'Property 1', 'First Proper', 1000, 500, 100, '{}', '{Microwave}', '{Heating}', true, true, 1, 1, 1000, 'Apartment', '2025-03-29 22:19:31.534', 0, 0, 16, '44a85478-2061-703a-d2db-badee16544bf', 'Available', '{https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/16/property_16_image_0_1744133731149.png}');
INSERT INTO public."Property" (id, name, description, "pricePerMonth", "securityDeposit", "applicationFee", "photoUrls", amenities, highlights, "isPetsAllowed", "isParkingIncluded", beds, baths, "squareFeet", "propertyType", "postedDate", "averageRating", "numberOfReviews", "locationId", "managerCognitoId", status, images) VALUES (18, 'Property 3', 'Third Property', 3000, 1500, 300, '{}', '{Pool}', '{SatelliteTV}', true, true, 3, 3, 3000, 'Apartment', '2025-03-29 22:44:41.933', 0, 0, 18, '44a85478-2061-703a-d2db-badee16544bf', 'Available', '{https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/18/property_18_image_0_1744133734405.png,https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/18/property_18_image_1_1744133736388.png}');
INSERT INTO public."Property" (id, name, description, "pricePerMonth", "securityDeposit", "applicationFee", "photoUrls", amenities, highlights, "isPetsAllowed", "isParkingIncluded", beds, baths, "squareFeet", "propertyType", "postedDate", "averageRating", "numberOfReviews", "locationId", "managerCognitoId", status, images) VALUES (19, 'Property 4', 'Fourth Property', 4000, 2000, 400, '{}', '{HighSpeedInternet}', '{Intercom}', true, true, 4, 4, 4000, 'Apartment', '2025-03-29 23:35:50.953', 0, 0, 19, '44a85478-2061-703a-d2db-badee16544bf', 'Available', '{https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/19/property_19_image_0_1744133738237.png,https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/19/property_19_image_1_1744133739664.png}');
INSERT INTO public."Property" (id, name, description, "pricePerMonth", "securityDeposit", "applicationFee", "photoUrls", amenities, highlights, "isPetsAllowed", "isParkingIncluded", beds, baths, "squareFeet", "propertyType", "postedDate", "averageRating", "numberOfReviews", "locationId", "managerCognitoId", status, images) VALUES (17, 'Property 2', 'Second House', 2000, 1000, 200, '{}', '{Refrigerator,WalkInClosets}', '{DoubleVanities,SmokeFree}', true, true, 2, 2, 1000, 'Apartment', '2025-03-29 22:23:21.554', 0, 0, 17, '44a85478-2061-703a-d2db-badee16544bf', 'Available', '{https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/17/property_17_image_0_1744133741204.png,https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/17/property_17_image_1_1744133742838.png,https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/17/property_17_image_2_1744133744066.webp}');


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Tenant" (id, "cognitoId", name, email, "phoneNumber") VALUES (17, '94f8c4a8-c0f1-703b-7c8a-878414df8d76', 'deji', 'fuddisnalk@gmail.com', '');


--
-- Data for Name: Lease; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Lease" (id, "startDate", "endDate", rent, deposit, "propertyId", "tenantCognitoId") VALUES (19, '2025-03-29 23:44:16.688', '2026-03-29 23:44:16.688', 1000, 500, 16, '94f8c4a8-c0f1-703b-7c8a-878414df8d76');


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Application" (id, "applicationDate", status, "propertyId", "tenantCognitoId", name, email, "phoneNumber", message, "leaseId") VALUES (18, '2025-03-29 23:44:16.291', 'Pending', 16, '94f8c4a8-c0f1-703b-7c8a-878414df8d76', 'Akin Deji', 'fuddisnalk@gmail.com', '1234567890', 'I really need this apartment.', 19);


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _TenantFavorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."_TenantFavorites" ("A", "B") VALUES (16, 17);
INSERT INTO public."_TenantFavorites" ("A", "B") VALUES (18, 17);


--
-- Data for Name: _TenantProperties; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('63404164-812c-4b79-b71c-90eb1bac9c77', '1f2c23b78324576f03cacf0fa365252bebec5e1b590df1b05a310346ce65c062', '2025-03-11 12:16:23.19979-04', '20250311160646_add_postgis', NULL, NULL, '2025-03-11 12:16:22.587349-04', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('e0b0282e-c19e-4aca-8ef7-b30f24a039f4', '731f6603a5780e4bb4a18f398f7a5697933925255fab7ce5072d09c3a4b3719c', '2025-04-07 09:22:16.005077-04', '20250407132215_add_property_status', NULL, NULL, '2025-04-07 09:22:15.993696-04', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4140ff09-bd96-4816-8371-d18106ea8df7', '08f1d3188520884621bed77afceae79d1e8c2fe77e2a764e4041247a9c073989', '2025-04-07 09:43:29.625198-04', '20250407134329_add_property_images', NULL, NULL, '2025-04-07 09:43:29.62182-04', 1);


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: Application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Application_id_seq"', 18, true);


--
-- Name: Lease_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Lease_id_seq"', 19, true);


--
-- Name: Location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Location_id_seq"', 19, true);


--
-- Name: Manager_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Manager_id_seq"', 12, true);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 16, false);


--
-- Name: Property_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Property_id_seq"', 19, true);


--
-- Name: Tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Tenant_id_seq"', 17, true);


--
-- PostgreSQL database dump complete
--

