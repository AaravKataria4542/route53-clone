
CREATE TABLE public.hosted_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Public','Private')),
  comment TEXT,
  vpc_id TEXT,
  vpc_region TEXT,
  record_count INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX hosted_zones_user_idx ON public.hosted_zones(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hosted_zones TO authenticated;
GRANT ALL ON public.hosted_zones TO service_role;
ALTER TABLE public.hosted_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own zones" ON public.hosted_zones FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.hosted_zones ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('A','AAAA','CNAME','TXT','MX','NS','PTR','SRV','CAA','SOA')),
  ttl INT NOT NULL DEFAULT 300,
  value TEXT NOT NULL,
  routing_policy TEXT NOT NULL DEFAULT 'Simple',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX dns_records_zone_idx ON public.dns_records(zone_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dns_records TO authenticated;
GRANT ALL ON public.dns_records TO service_role;
ALTER TABLE public.dns_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own records" ON public.dns_records FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL DEFAULT 'HTTPS',
  endpoint TEXT NOT NULL,
  port INT NOT NULL DEFAULT 443,
  path TEXT DEFAULT '/',
  status TEXT NOT NULL DEFAULT 'Healthy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_checks TO authenticated;
GRANT ALL ON public.health_checks TO service_role;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own hc" ON public.health_checks FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.bump_zone_record_count() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    UPDATE public.hosted_zones SET record_count=record_count+1, updated_at=now() WHERE id=NEW.zone_id;
  ELSIF TG_OP='DELETE' THEN
    UPDATE public.hosted_zones SET record_count=GREATEST(record_count-1,0), updated_at=now() WHERE id=OLD.zone_id;
  END IF;
  RETURN NULL;
END;$$;
CREATE TRIGGER dns_records_count_trg AFTER INSERT OR DELETE ON public.dns_records FOR EACH ROW EXECUTE FUNCTION public.bump_zone_record_count();
