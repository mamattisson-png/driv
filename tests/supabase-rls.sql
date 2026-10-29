-- Run only against the isolated DRIV Test project.
-- All synthetic identities and documents are rolled back.
BEGIN;
INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
VALUES
('00000000-0000-0000-0000-000000000000','a1100000-0000-4000-8000-000000000001','authenticated','authenticated','driv-test-a@example.invalid','',now(),now(),now()),
('00000000-0000-0000-0000-000000000000','b2200000-0000-4000-8000-000000000002','authenticated','authenticated','driv-test-b@example.invalid','',now(),now(),now());
INSERT INTO public.driv_docs(user_id,id,data) VALUES
('a1100000-0000-4000-8000-000000000001','m-2026-10','{"_rev":"one","days":{"2026-10-29":{"workouts":[{"_id":"a","reps":10}]}}}'::jsonb),
('b2200000-0000-4000-8000-000000000002','m-2026-10','{"_rev":"other"}'::jsonb);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a1100000-0000-4000-8000-000000000001',true);
DO $$
DECLARE n integer; denied boolean := false;
BEGIN
  SELECT count(*) INTO n FROM public.driv_docs;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS SELECT failed'; END IF;
  UPDATE public.driv_docs SET data = '{"_rev":"hijack"}' WHERE user_id='b2200000-0000-4000-8000-000000000002';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'RLS UPDATE failed'; END IF;
  DELETE FROM public.driv_docs WHERE user_id='b2200000-0000-4000-8000-000000000002';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'RLS DELETE failed'; END IF;
  BEGIN
    INSERT INTO public.driv_docs(user_id,id,data)
      VALUES('b2200000-0000-4000-8000-000000000002','settings','{}');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'RLS INSERT failed'; END IF;
  UPDATE public.driv_docs SET data='{"_rev":"two"}'
    WHERE user_id='a1100000-0000-4000-8000-000000000001'
      AND id='m-2026-10' AND data->>'_rev'='one';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'Optimistic update failed'; END IF;
  UPDATE public.driv_docs SET data='{"_rev":"three"}'
    WHERE user_id='a1100000-0000-4000-8000-000000000001'
      AND id='m-2026-10' AND data->>'_rev'='one';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Stale revision overwritten'; END IF;
END $$;
ROLLBACK;
