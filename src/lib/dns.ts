export const RECORD_TYPES = ["A","AAAA","CNAME","TXT","MX","NS","PTR","SRV","CAA"] as const;
export type RecordType = typeof RECORD_TYPES[number];

export function validateRecord(type: RecordType, value: string): string | null {
  const v = value.trim();
  if (!v) return "Value is required";
  switch (type) {
    case "A":
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(v) ? null : "Must be an IPv4 address (e.g. 192.0.2.1)";
    case "AAAA":
      return /^[0-9a-fA-F:]+$/.test(v) && v.includes(":") ? null : "Must be an IPv6 address";
    case "CNAME":
    case "NS":
    case "PTR":
      return /^[a-zA-Z0-9.\-_]+\.?$/.test(v) ? null : "Must be a domain name";
    case "MX":
      return /^\d+\s+[a-zA-Z0-9.\-_]+\.?$/.test(v) ? null : "Format: '<priority> <host>' (e.g. 10 mail.example.com)";
    case "SRV":
      return /^\d+\s+\d+\s+\d+\s+[a-zA-Z0-9.\-_]+\.?$/.test(v) ? null : "Format: '<priority> <weight> <port> <target>'";
    case "TXT":
      return v.length <= 4096 ? null : "TXT value too long";
    case "CAA":
      return /^\d+\s+(issue|issuewild|iodef)\s+".*"$/.test(v) ? null : 'Format: "0 issue \"letsencrypt.org\""';
  }
}

export function isValidDomain(d: string): boolean {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\.?$/.test(d.trim());
}
