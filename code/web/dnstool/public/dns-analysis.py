#!/usr/bin/env python3
"""
DNS Log Analyzer

This script processes RouterOS and NextDNS logs, performs analysis, and generates
a pre-processed JSON file for the DNS Analysis web tool.
"""

import argparse
import csv
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any, Dict, List

# Check if rich library is available, use it for nice output if possible
try:
    import concurrent.futures

    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import (
        BarColumn,
        Progress,
        SpinnerColumn,
        TextColumn,
        TimeElapsedColumn,
        TimeRemainingColumn,
    )

    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    print("Note: Install 'rich' library for better output: pip install rich")

    # Create a simple console replacement
    class SimpleConsole:
        def print(self, text, *args, **kwargs):
            # Strip rich formatting
            text = re.sub(r"\[.*?\]", "", text)
            print(text)

    console = SimpleConsole()

# Regular expression for RouterOS DNS query log lines
ROUTEROS_REGEX = r"^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\w+)\s+(\w+)\s+DNSQ:\s+query\s+from\s+([^:]+):\s+#(\d+)\s+([^\s]+)\s+(\w+|\w+\s+\$\$\d+\$\$)$"

# Common multi-part TLDs
MULTI_PART_TLDS = [
    "co.uk",
    "org.uk",
    "me.uk",
    "ac.uk",
    "gov.uk",
    "com.au",
    "net.au",
    "org.au",
    "edu.au",
    "gov.au",
    "co.nz",
    "net.nz",
    "org.nz",
    "govt.nz",
    "co.za",
    "org.za",
    "gov.za",
    "co.jp",
    "ne.jp",
    "or.jp",
    "go.jp",
    "ac.jp",
    "com.br",
    "net.br",
    "org.br",
    "gov.br",
    "com.cn",
    "net.cn",
    "org.cn",
    "gov.cn",
    "com.tw",
    "org.tw",
    "gov.tw",
    "co.in",
    "net.in",
    "org.in",
    "gov.in",
    "co.il",
    "org.il",
    "gov.il",
    "co.th",
    "in.th",
    "ac.th",
    "go.th",
]

# Common safe domains to skip in suspicious domain analysis
COMMON_SAFE_DOMAINS = [
    "google.com",
    "microsoft.com",
    "apple.com",
    "amazon.com",
    "facebook.com",
    "youtube.com",
    "netflix.com",
    "github.com",
    "cloudfront.net",
    "akamaiedge.net",
    "akadns.net",
    "cloudflare.com",
    "fastly.net",
]


def extract_domain_tld(domain: str) -> str:
    """Extract the domain.tld from a full domain name."""
    if not domain:
        return ""

    # Remove any trailing dots
    domain = domain.rstrip(".")

    # Handle IP addresses
    if re.match(r"^\d+\.\d+\.\d+\.\d+$", domain):
        return domain

    # Check for multi-part TLDs
    for tld in MULTI_PART_TLDS:
        pattern = re.compile(r"([^.]+\." + re.escape(tld) + r")(\.|$)")
        match = pattern.search(domain)
        if match:
            return match[1]

    # Extract the last two parts of the domain
    parts = domain.split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else domain


def parse_routeros_log(log_content: str) -> List[Dict[str, Any]]:
    """Parse RouterOS log and return structured data."""
    results = []
    lines = log_content.strip().split("\n")
    total_lines = len(lines)
    console.print(f"Processing {total_lines} lines from RouterOS log...")

    # Month name to number mapping
    month_map = {
        "Jan": 1,
        "Feb": 2,
        "Mar": 3,
        "Apr": 4,
        "May": 5,
        "Jun": 6,
        "Jul": 7,
        "Aug": 8,
        "Sep": 9,
        "Oct": 10,
        "Nov": 11,
        "Dec": 12,
    }

    # Current year (for timestamp completion)
    current_year = datetime.now().year

    # Track progress
    processed = 0
    matched = 0

    for line in lines:
        processed += 1
        if processed % 100 == 0:
            print(
                f"\rProcessed {processed}/{total_lines} lines, matched {matched} DNS queries",
                end="",
            )

        match = re.match(ROUTEROS_REGEX, line)
        if match:
            matched += 1
            timestamp_str, router, log_type, source_ip, query_id, domain, query_type = (
                match.groups()
            )

            # Parse timestamp
            try:
                month_str, day_str, time_str = timestamp_str.split()
                month = month_map.get(month_str, 1)
                day = int(day_str)
                hour, minute, second = map(int, time_str.split(":"))

                # Create timestamp (using current year)
                timestamp = datetime(
                    current_year, month, day, hour, minute, second
                ).isoformat()
            except Exception as e:
                # Fallback to current time if parsing fails
                timestamp = datetime.now().isoformat()
                console.print(
                    f"Warning: Failed to parse timestamp '{timestamp_str}': {e}"
                )

            # Clean up query type
            if "$" in query_type:
                query_type = "UNKNOWN"

            # Extract base domain
            base_domain = extract_domain_tld(domain)

            results.append(
                {
                    "timestamp": timestamp,
                    "router": router,
                    "source_ip": source_ip,
                    "query_id": query_id,
                    "domain": domain,
                    "base_domain": base_domain,
                    "query_type": query_type,
                    "log_type": log_type,
                    "source": "routeros",
                }
            )

    print(
        f"\rProcessed {total_lines}/{total_lines} lines, matched {matched} DNS queries"
    )
    console.print(f"Successfully parsed {matched} DNS queries from RouterOS log")

    return results


def parse_nextdns_log(csv_content: str) -> List[Dict[str, Any]]:
    """Parse NextDNS CSV log and return structured data."""
    results = []

    # Use Python's CSV reader to properly handle quoted fields
    try:
        reader = csv.DictReader(csv_content.strip().splitlines())
        rows = list(reader)
        total_rows = len(rows)
        console.print(f"Processing {total_rows} rows from NextDNS CSV...")

        blocked_count = 0
        for row in rows:
            try:
                # Create a new entry with normalized fields
                entry = {
                    "timestamp": row.get("timestamp", ""),
                    "domain": row.get("domain", ""),
                    "query_type": row.get("query_type", ""),
                    "status": row.get(
                        "status", ""
                    ).lower(),  # Normalize status to lowercase
                    "reasons": row.get("reasons", ""),
                    "source_ip": row.get("client_ip", ""),
                    "source": "nextdns",
                }

                # Count blocked entries
                if entry["status"] == "blocked":
                    blocked_count += 1

                # Add base domain
                if entry["domain"]:
                    entry["base_domain"] = extract_domain_tld(entry["domain"])

                # Handle timestamp parsing
                if entry["timestamp"]:
                    try:
                        timestamp = datetime.fromisoformat(
                            entry["timestamp"].replace("Z", "+00:00")
                        )
                        entry["timestamp"] = timestamp.isoformat()
                    except ValueError:
                        # Fallback to current time if parsing fails
                        entry["timestamp"] = datetime.now().isoformat()

                results.append(entry)

            except Exception as e:
                console.print(f"Warning: Error parsing row: {e}")

        console.print(f"Successfully parsed {len(results)} entries from NextDNS CSV")
        console.print(f"Found {blocked_count} blocked entries in NextDNS log")

    except Exception as e:
        console.print(f"Error parsing NextDNS CSV: {e}")

    return results


def cross_match_logs(
    routeros_data: List[Dict[str, Any]], nextdns_data: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Cross-match RouterOS and NextDNS logs based on domain and timestamp."""

    def build_nextdns_map(nextdns_data):
        nextdns_map = defaultdict(list)
        for entry in nextdns_data:
            domain = entry.get("domain")
            if domain:
                nextdns_map[domain].append(entry)
        return nextdns_map

    def find_closest_entry(router_entry, matching_entries):
        router_time = datetime.fromisoformat(router_entry["timestamp"])
        closest_entry = matching_entries[0]
        min_time_diff = float("inf")
        for next_entry in matching_entries:
            try:
                next_time = datetime.fromisoformat(next_entry["timestamp"])
                time_diff = abs((next_time - router_time).total_seconds())
                if time_diff < min_time_diff:
                    min_time_diff = time_diff
                    closest_entry = next_entry
            except (ValueError, KeyError):
                continue
        return closest_entry

    combined = []
    total_entries = len(routeros_data)
    console.print(
        f"Cross-matching {total_entries} RouterOS entries with {len(nextdns_data)} NextDNS entries..."
    )

    nextdns_map = build_nextdns_map(nextdns_data)
    processed_domains = set()
    for router_entry in routeros_data:
        domain = router_entry.get("domain")
        if not domain:
            continue
        matching_entries = nextdns_map.get(domain, [])
        if matching_entries:
            closest_entry = find_closest_entry(router_entry, matching_entries)
            merged_entry = {
                "timestamp": router_entry["timestamp"],
                "domain": domain,
                "base_domain": router_entry.get("base_domain", ""),
                "source_ip": router_entry.get("source_ip", ""),
                "query_type": router_entry.get("query_type", ""),
                "status": closest_entry.get("status", "unknown").lower(),
                "reasons": closest_entry.get("reasons", ""),
                "source": "both",
            }
            combined.append(merged_entry)
            processed_domains.add(domain)
        else:
            combined.append(
                {
                    "timestamp": router_entry["timestamp"],
                    "domain": domain,
                    "base_domain": router_entry.get("base_domain", ""),
                    "source_ip": router_entry.get("source_ip", ""),
                    "query_type": router_entry.get("query_type", ""),
                    "status": "unknown",
                    "source": "routeros",
                }
            )
    for next_entry in nextdns_data:
        domain = next_entry.get("domain")
        if domain and domain not in processed_domains:
            combined.append(
                {
                    "timestamp": next_entry.get("timestamp", ""),
                    "domain": domain,
                    "base_domain": next_entry.get("base_domain", ""),
                    "source_ip": next_entry.get("source_ip", ""),
                    "status": next_entry.get("status", "unknown").lower(),
                    "reasons": next_entry.get("reasons", ""),
                    "source": "nextdns",
                }
            )
    blocked_count = sum(entry.get("status") == "blocked" for entry in combined)
    console.print(f"Total entries in combined data: {len(combined)}")
    console.print(f"Total blocked entries in combined data: {blocked_count}")
    return combined


def is_likely_non_suspicious(domain: str) -> bool:
    """Quick pre-filter to skip obviously non-suspicious domains."""
    return next(
        (True for safe_domain in COMMON_SAFE_DOMAINS if domain.endswith(safe_domain)),
        len(domain) < 8,
    )


def check_suspicious_domains(
    data: List[Dict[str, Any]], regex_patterns: List[str]
) -> List[Dict[str, Any]]:
    """Check for suspicious domains based on regex patterns."""
    if not regex_patterns:
        return []

    suspicious = []
    console.print(
        f"Checking for suspicious domains using {len(regex_patterns)} patterns..."
    )

    # Pre-filter common domains
    filtered_data = [
        item
        for item in data
        if item.get("domain") and not is_likely_non_suspicious(item["domain"])
    ]

    console.print(f"Pre-filtered data from {len(data)} to {len(filtered_data)} entries")

    # Compile regex patterns
    compiled_patterns = []
    for pattern in regex_patterns:
        try:
            compiled_patterns.append(
                {"pattern": pattern, "regex": re.compile(pattern, re.IGNORECASE)}
            )
        except re.error:
            console.print(f"Warning: Skipping invalid pattern: {pattern[:30]}...")

    console.print(f"Compiled {len(compiled_patterns)} patterns")

    def check_domain(item):
        domain = item.get("domain", "")
        for pattern_info in compiled_patterns:
            try:
                if pattern_info["regex"].search(domain):
                    if item.get("status") != "blocked":
                        return {
                            "timestamp": item.get("timestamp", ""),
                            "domain": domain,
                            "source_ip": item.get("source_ip", ""),
                            "status": item.get("status", "unknown"),
                            "matchedPattern": pattern_info["pattern"],
                        }
                    break
            except Exception as e:
                console.print(f"Error checking domain '{domain}': {e}")
        return None

    total_items = len(filtered_data)
    suspicious = []
    max_workers = min(16, (os.cpu_count() or 4))
    if RICH_AVAILABLE:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            "[progress.percentage]{task.percentage:>3.0f}%",
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=console,
            transient=True,
        ) as progress:
            task = progress.add_task(
                "[cyan]Checking suspicious domains...", total=total_items
            )
            with concurrent.futures.ThreadPoolExecutor(
                max_workers=max_workers
            ) as executor:
                futures = {
                    executor.submit(check_domain, item): i
                    for i, item in enumerate(filtered_data)
                }
                for _i, future in enumerate(concurrent.futures.as_completed(futures)):
                    result = future.result()
                    if result:
                        suspicious.append(result)
                    progress.update(task, advance=1)
    else:
        for processed, item in enumerate(filtered_data, start=1):
            if processed % 100 == 0:
                print(f"\rChecked {processed}/{total_items} domains", end="")
            result = check_domain(item)
            if result:
                suspicious.append(result)
        print(f"\rChecked {total_items}/{total_items} domains")
    console.print(f"Found {len(suspicious)} suspicious domains")
    return suspicious


def analyze_domain_source_relationships(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze relationships between domains and source IPs."""
    # Initialize data structures
    ip_to_domains = defaultdict(lambda: defaultdict(int))
    domain_to_ips = defaultdict(lambda: defaultdict(int))
    console.print("Analyzing domain-source relationships...")

    # Process data
    for item in data:
        source_ip = item.get("source_ip")
        domain = item.get("domain")
        base_domain = item.get("base_domain")

        if not source_ip or not domain or not base_domain:
            continue

        # Count domain lookups per IP
        ip_to_domains[source_ip][base_domain] += 1

        # Count IP lookups per domain
        domain_to_ips[base_domain][source_ip] += 1

    # Convert to serializable format
    result = {
        "ip_to_domains": [
            {
                "ip": ip,
                "domains": [
                    {"domain": domain, "count": count}
                    for domain, count in sorted(
                        domains.items(), key=lambda x: x[1], reverse=True
                    )
                ],
                "total_lookups": sum(domains.values()),
                "unique_domains": len(domains),
            }
            for ip, domains in ip_to_domains.items()
        ],
        "domain_to_ips": [
            {
                "domain": domain,
                "ips": [
                    {"ip": ip, "count": count}
                    for ip, count in sorted(
                        ips.items(), key=lambda x: x[1], reverse=True
                    )
                ],
                "total_lookups": sum(ips.values()),
                "unique_ips": len(ips),
            }
            for domain, ips in domain_to_ips.items()
        ],
    }

    # Sort by total lookups
    result["ip_to_domains"].sort(key=lambda x: x["total_lookups"], reverse=True)
    result["domain_to_ips"].sort(key=lambda x: x["total_lookups"], reverse=True)

    console.print(
        f"Analyzed {len(result['ip_to_domains'])} devices and {len(result['domain_to_ips'])} domains"
    )
    return result


def generate_time_series_data(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate time series data for charts."""
    # Initialize counters
    hourly_counts = defaultdict(int)
    status_counts = defaultdict(int)
    query_type_counts = defaultdict(int)
    console.print("Generating time series data...")

    # Process data
    for item in data:
        # Extract hour from timestamp for hourly distribution
        try:
            timestamp = datetime.fromisoformat(item.get("timestamp", ""))
            hour_key = timestamp.strftime("%Y-%m-%d %H:00")
            hourly_counts[hour_key] += 1
        except (ValueError, TypeError):
            pass

        # Count by status
        status = item.get("status", "unknown")
        status_counts[status] += 1

        # Count by query type
        query_type = item.get("query_type", "unknown")
        query_type_counts[query_type] += 1

    # Convert to serializable format
    result = {
        "hourly_distribution": [
            {"hour": hour, "count": count}
            for hour, count in sorted(hourly_counts.items())
        ],
        "status_distribution": [
            {"status": status, "count": count}
            for status, count in status_counts.items()
        ],
        "query_type_distribution": [
            {"type": query_type, "count": count}
            for query_type, count in sorted(
                query_type_counts.items(), key=lambda x: x[1], reverse=True
            )
        ],
    }

    console.print(
        f"Generated time series data with {len(result['hourly_distribution'])} time points"
    )
    return result


def analyze_devices(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze device activity based on source IPs."""
    # Initialize counters
    device_query_counts = defaultdict(int)
    device_domain_sets = defaultdict(set)
    device_blocked_counts = defaultdict(int)
    console.print("Analyzing device activity...")

    # Debug: Count total blocked entries
    total_blocked = 0

    # Process data
    for item in data:
        source_ip = item.get("source_ip")
        if not source_ip:
            continue

        # Count queries per device
        device_query_counts[source_ip] += 1

        # Track unique domains per device
        domain = item.get("domain")
        if domain:
            device_domain_sets[source_ip].add(domain)

        # Count blocked queries per device
        status = item.get("status", "").lower()
        if status == "blocked":
            device_blocked_counts[source_ip] += 1
            total_blocked += 1

    console.print(f"Total blocked queries found: {total_blocked}")

    # Convert to serializable format
    result = {
        "devices": [
            {
                "ip": ip,
                "query_count": count,
                "unique_domains": len(device_domain_sets[ip]),
                "blocked_count": device_blocked_counts[ip],
                "blocked_percentage": (
                    round(device_blocked_counts[ip] / count * 100, 2)
                    if count > 0
                    else 0
                ),
            }
            for ip, count in sorted(
                device_query_counts.items(), key=lambda x: x[1], reverse=True
            )
        ]
    }

    console.print(f"Analyzed {len(result['devices'])} devices")
    return result


def generate_stats(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate overall statistics from the data."""
    total_queries = len(data)
    unique_domains = len({item.get("domain") for item in data if item.get("domain")})
    unique_base_domains = len(
        {item.get("base_domain") for item in data if item.get("base_domain")}
    )
    unique_ips = len({item.get("source_ip") for item in data if item.get("source_ip")})
    console.print("Generating overall statistics...")

    # Count by source
    source_counts = Counter(item.get("source", "unknown") for item in data)

    # Count by status
    status_counts = Counter(item.get("status", "unknown") for item in data)

    # Debug: Print status counts
    console.print("Status distribution:")
    for status, count in status_counts.items():
        console.print(f"  {status}: {count}")

    # Count by query type
    query_type_counts = Counter(item.get("query_type", "unknown") for item in data)

    # Get time range - normalize timestamps to be all naive or all aware
    timestamps = []
    for item in data:
        if item.get("timestamp"):
            try:
                # Parse timestamp and convert to naive by replacing timezone info
                dt = datetime.fromisoformat(item.get("timestamp"))
                if dt.tzinfo is not None:
                    # Convert to naive datetime by removing timezone info
                    dt = dt.replace(tzinfo=None)
                timestamps.append(dt)
            except (ValueError, TypeError):
                pass

    time_range = {
        "start": min(timestamps).isoformat() if timestamps else None,
        "end": max(timestamps).isoformat() if timestamps else None,
        "duration_hours": (
            (max(timestamps) - min(timestamps)).total_seconds() / 3600
            if timestamps
            else 0
        ),
    }

    result = {
        "total_queries": total_queries,
        "unique_domains": unique_domains,
        "unique_base_domains": unique_base_domains,
        "unique_ips": unique_ips,
        "source_distribution": [
            {"source": source, "count": count}
            for source, count in source_counts.items()
        ],
        "status_distribution": [
            {"status": status, "count": count}
            for status, count in status_counts.items()
        ],
        "query_type_distribution": [
            {"type": query_type, "count": count}
            for query_type, count in query_type_counts.most_common(10)
        ],
        "time_range": time_range,
    }

    console.print(f"Generated statistics for {total_queries} queries")
    return result


def parse_blocklist(content: str) -> List[str]:
    """Parse blocklist and return list of regex patterns."""
    lines = content.strip().split("\n")
    console.print(f"Parsing blocklist with {len(lines)} lines...")

    patterns = [
        line.strip()
        for line in lines
        if line.strip() and not line.strip().startswith("#")
    ]
    console.print(f"Extracted {len(patterns)} regex patterns from blocklist")
    return patterns


def main():
    parser = argparse.ArgumentParser(description="DNS Log Analyzer")
    parser.add_argument("--routeros", required=True, help="RouterOS log file")
    parser.add_argument("--nextdns", required=True, help="NextDNS CSV log file")
    parser.add_argument("--blocklist", help="OISD regex blocklist file")
    parser.add_argument("--output", required=True, help="Output JSON file")
    parser.add_argument(
        "--skip-suspicious", action="store_true", help="Skip suspicious domain analysis"
    )
    parser.add_argument("--debug", action="store_true", help="Enable debug output")

    args = parser.parse_args()

    # Print welcome message
    if RICH_AVAILABLE:
        console.print(
            Panel.fit(
                "[bold blue]DNS Log Analyzer[/bold blue]\n[cyan]Processing RouterOS and NextDNS logs...[/cyan]",
                title="🔍 Analysis Started",
                border_style="green",
            )
        )
    else:
        console.print("DNS Log Analyzer - Processing RouterOS and NextDNS logs...")

    # Check if input files exist
    for file_path, file_type in [
        (args.routeros, "RouterOS log"),
        (args.nextdns, "NextDNS CSV"),
    ]:
        if not os.path.exists(file_path):
            console.print(f"Error: {file_type} file not found: {file_path}")
            sys.exit(1)

    if args.blocklist and not os.path.exists(args.blocklist):
        console.print(f"Warning: Blocklist file not found: {args.blocklist}")
        args.blocklist = None

    # Read input files
    try:
        console.print("Reading input files...")

        with open(args.routeros, "r", encoding="utf-8", errors="ignore") as f:
            routeros_content = f.read()
            console.print(f"Read {len(routeros_content)} bytes from RouterOS log")

        with open(args.nextdns, "r", encoding="utf-8", errors="ignore") as f:
            nextdns_content = f.read()
            console.print(f"Read {len(nextdns_content)} bytes from NextDNS CSV")

        blocklist_content = ""
        if args.blocklist and not args.skip_suspicious:
            with open(args.blocklist, "r", encoding="utf-8", errors="ignore") as f:
                blocklist_content = f.read()
                console.print(f"Read {len(blocklist_content)} bytes from blocklist")
    except Exception as e:
        console.print(f"Error reading input files: {e}")
        sys.exit(1)

    try:
        # Parse logs
        routeros_data = parse_routeros_log(routeros_content)
        nextdns_data = parse_nextdns_log(nextdns_content)

        # Cross-match logs
        combined_data = cross_match_logs(routeros_data, nextdns_data)

        # Generate analysis
        relationships = analyze_domain_source_relationships(combined_data)
        time_series = generate_time_series_data(combined_data)
        devices = analyze_devices(combined_data)
        stats = generate_stats(combined_data)

        # Check for suspicious domains
        suspicious_domains = []
        if blocklist_content and not args.skip_suspicious:
            regex_patterns = parse_blocklist(blocklist_content)
            suspicious_domains = check_suspicious_domains(combined_data, regex_patterns)

        # Prepare output data
        output_data = {
            "stats": stats,
            "devices": devices,
            "time_series": time_series,
            "suspicious_domains": suspicious_domains,
            "relationships": relationships,
        }

        # Write output file
        console.print(f"Writing output to {args.output}...")
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2)

        console.print(f"Analysis complete! Output written to {args.output}")

    except Exception as e:
        console.print(f"Error during analysis: {e}")
        if args.debug:
            import traceback

            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
