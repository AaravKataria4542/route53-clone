import { getCurrentMockUser } from "@/lib/mockAuth";
import type { RecordType } from "@/lib/dns";

export type HostedZone = {
  id: string;
  user_id: string;
  name: string;
  type: "Public" | "Private";
  comment: string | null;
  vpc_id: string | null;
  vpc_region: string | null;
  record_count: number;
  created_at: string;
  updated_at: string;
};

export type DnsRecord = {
  id: string;
  zone_id: string;
  user_id: string;
  name: string;
  type: RecordType | "SOA";
  ttl: number;
  value: string;
  routing_policy: string;
  created_at: string;
  updated_at: string;
};

export type HealthCheck = {
  id: string;
  user_id: string;
  name: string;
  protocol: string;
  endpoint: string;
  port: number;
  path: string | null;
  status: string;
  created_at: string;
};

type Store = {
  hosted_zones: HostedZone[];
  dns_records: DnsRecord[];
  health_checks: HealthCheck[];
};

const STORE_KEY = "route53-clone-data";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function id(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function emptyStore(): Store {
  return { hosted_zones: [], dns_records: [], health_checks: [] };
}

function readStore(): Store {
  if (!canUseStorage()) return emptyStore();
  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) return emptyStore();
  try {
    const parsed = JSON.parse(raw) as Store;
    return {
      hosted_zones: parsed.hosted_zones ?? [],
      dns_records: parsed.dns_records ?? [],
      health_checks: parsed.health_checks ?? [],
    };
  } catch {
    window.localStorage.removeItem(STORE_KEY);
    return emptyStore();
  }
}

function writeStore(store: Store) {
  if (canUseStorage()) window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function currentUserId() {
  const user = getCurrentMockUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

function withRecordCounts(store: Store): Store {
  return {
    ...store,
    hosted_zones: store.hosted_zones.map((zone) => ({
      ...zone,
      record_count: store.dns_records.filter((record) => record.zone_id === zone.id).length,
    })),
  };
}

export function listHostedZones() {
  const userId = currentUserId();
  return withRecordCounts(readStore()).hosted_zones
    .filter((zone) => zone.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getHostedZone(zoneId: string) {
  const userId = currentUserId();
  return withRecordCounts(readStore()).hosted_zones.find(
    (zone) => zone.id === zoneId && zone.user_id === userId,
  ) ?? null;
}

export function createHostedZone(input: {
  name: string;
  type: "Public" | "Private";
  comment?: string | null;
  vpc_id?: string | null;
  vpc_region?: string | null;
}) {
  const userId = currentUserId();
  const now = new Date().toISOString();
  const zoneName = input.name.trim().replace(/\.$/, "");
  const zone: HostedZone = {
    id: id("hz"),
    user_id: userId,
    name: zoneName,
    type: input.type,
    comment: input.comment || null,
    vpc_id: input.type === "Private" ? input.vpc_id || null : null,
    vpc_region: input.type === "Private" ? input.vpc_region || null : null,
    record_count: 2,
    created_at: now,
    updated_at: now,
  };
  const defaults: DnsRecord[] = [
    {
      id: id("rr"),
      zone_id: zone.id,
      user_id: userId,
      name: zone.name,
      type: "NS",
      ttl: 172800,
      value: "ns-1.awsdns-mock.com.\nns-2.awsdns-mock.net.\nns-3.awsdns-mock.org.\nns-4.awsdns-mock.co.uk.",
      routing_policy: "Simple",
      created_at: now,
      updated_at: now,
    },
    {
      id: id("rr"),
      zone_id: zone.id,
      user_id: userId,
      name: zone.name,
      type: "SOA",
      ttl: 900,
      value: "ns-1.awsdns-mock.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
      routing_policy: "Simple",
      created_at: now,
      updated_at: now,
    },
  ];
  const store = readStore();
  store.hosted_zones.push(zone);
  store.dns_records.push(...defaults);
  writeStore(withRecordCounts(store));
  return zone;
}

export function deleteHostedZones(zoneIds: string[]) {
  const userId = currentUserId();
  const ids = new Set(zoneIds);
  const store = readStore();
  store.hosted_zones = store.hosted_zones.filter((zone) => zone.user_id !== userId || !ids.has(zone.id));
  store.dns_records = store.dns_records.filter((record) => record.user_id !== userId || !ids.has(record.zone_id));
  writeStore(withRecordCounts(store));
}

export function listDnsRecords(zoneId: string) {
  const userId = currentUserId();
  return readStore().dns_records
    .filter((record) => record.user_id === userId && record.zone_id === zoneId)
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

export function createDnsRecord(zoneId: string, input: {
  name: string;
  type: RecordType;
  ttl: number;
  value: string;
  routing_policy: string;
}) {
  const userId = currentUserId();
  const now = new Date().toISOString();
  const store = readStore();
  const zone = store.hosted_zones.find((item) => item.id === zoneId && item.user_id === userId);
  if (!zone) throw new Error("Hosted zone not found");
  const record: DnsRecord = {
    id: id("rr"),
    zone_id: zoneId,
    user_id: userId,
    name: input.name,
    type: input.type,
    ttl: input.ttl,
    value: input.value,
    routing_policy: input.routing_policy,
    created_at: now,
    updated_at: now,
  };
  store.dns_records.push(record);
  writeStore(withRecordCounts(store));
  return record;
}

export function updateDnsRecord(recordId: string, input: {
  name: string;
  type: RecordType;
  ttl: number;
  value: string;
  routing_policy: string;
}) {
  const userId = currentUserId();
  const store = readStore();
  const index = store.dns_records.findIndex((record) => record.id === recordId && record.user_id === userId);
  if (index === -1) throw new Error("Record not found");
  store.dns_records[index] = { ...store.dns_records[index], ...input, updated_at: new Date().toISOString() };
  writeStore(withRecordCounts(store));
}

export function deleteDnsRecords(recordIds: string[]) {
  const userId = currentUserId();
  const ids = new Set(recordIds);
  const store = readStore();
  store.dns_records = store.dns_records.filter(
    (record) => record.user_id !== userId || record.type === "SOA" || record.type === "NS" || !ids.has(record.id),
  );
  writeStore(withRecordCounts(store));
}

export function listHealthChecks() {
  const userId = currentUserId();
  return readStore().health_checks
    .filter((item) => item.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createHealthCheck(input: {
  name: string;
  protocol: string;
  endpoint: string;
  port: number;
  path: string | null;
}) {
  const userId = currentUserId();
  const healthCheck: HealthCheck = {
    id: id("hc"),
    user_id: userId,
    name: input.name,
    protocol: input.protocol,
    endpoint: input.endpoint,
    port: input.port,
    path: input.path,
    status: "Healthy",
    created_at: new Date().toISOString(),
  };
  const store = readStore();
  store.health_checks.push(healthCheck);
  writeStore(store);
  return healthCheck;
}

export function getResourceCounts() {
  const userId = currentUserId();
  const store = withRecordCounts(readStore());
  return {
    zones: store.hosted_zones.filter((zone) => zone.user_id === userId).length,
    records: store.dns_records.filter((record) => record.user_id === userId).length,
    hc: store.health_checks.filter((item) => item.user_id === userId).length,
  };
}
