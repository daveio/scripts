# Configuring ntopng to Isolate External Network Traffic by Hiding Local-to-Local Communications

## 1. Executive Summary

This report details the methodology for configuring the open-source version of ntopng to selectively display network traffic, specifically by hiding or ignoring communications internal to designated local networks (`10.0.99.0/24` and `10.0.98.0/24`) and between these local networks. The primary and most effective approach involves a two-pronged strategy: correctly defining these subnets as "local" to ntopng and then applying a Berkeley Packet Filter (BPF) to exclude the undesired local-to-local flows from being processed and subsequently displayed.

The methods covered emphasize command-line arguments, particularly `-m` for local network definition and `--packet-filter` for BPF implementation, along with their equivalents in the `ntopng.conf` configuration file for persistent settings. The intended outcome is to achieve a focused view within ntopng that highlights only remote-to-local and local-to-remote traffic. This declutters the interface, allowing administrators to concentrate on external network interactions, which is often the primary goal when monitoring perimeter traffic or internet usage.

## 2. Understanding Local vs. Remote Traffic in ntopng

The ability of ntopng to distinguish between "local" and "remote" traffic is a fundamental concept that underpins many of its reporting and analysis features. This distinction is not inherently automatic for all private IP address ranges; it typically requires explicit configuration by the administrator. ntopng determines which networks are considered local based on the IP addresses of its active monitoring interfaces and, critically, through user-defined networks specified via the `-m` (or `--local-networks`) command-line option or its configuration file equivalent.[1, 2] Any traffic that does not originate from or target these defined local networks is subsequently categorized as remote.[1, 3]

This categorization is crucial because the objective of hiding local-to-local traffic relies entirely on ntopng first having an accurate understanding of which IP addresses constitute the "local" environment. Once local networks such as `10.0.99.0/24` and `10.0.98.0/24` are defined, ntopng can classify network flows as follows:
* **Local-to-Local:** Both the source and destination IP addresses fall within the defined local networks. This is the category of traffic targeted for exclusion from view.
* **Local-to-Remote:** The source IP address is part of a defined local network, while the destination IP address is not.
* **Remote-to-Local:** The source IP address is not part of a defined local network, while the destination IP address is.
* **Remote-to-Remote:** Neither the source nor the destination IP address is part of the defined local networks. This is less common in typical LAN monitoring scenarios unless ntopng is positioned to monitor traffic traversing multiple external networks.

Without proper local network definition, all traffic might be miscategorized, potentially appearing as "remote," which would render subsequent filtering attempts based on this local/remote distinction ineffective or misleading. Therefore, defining local networks is not merely a best practice but a mandatory prerequisite for achieving the specific filtering goal of isolating external interactions. The BPF filter designed to exclude "local-to-local" traffic implicitly depends on ntopng's internal understanding of what "local" signifies. If `10.0.99.0/24` and `10.0.98.0/24` are not declared as local via the `-m` option, ntopng might treat them as remote. Consequently, a BPF rule intended to filter traffic between these networks might not behave as anticipated because ntopng's contextual understanding of these networks is absent or incorrect. The `-m` option primes ntopng's internal logic, which the BPF then acts upon.

Furthermore, the scope of the "local" definition provided by the `-m` option is global within ntopng's reporting. This means any ntopng features that differentiate between local and remote hosts, such as "Top Local Talkers" dashboards or specific alert conditions [4, 5], will utilize this definition. The documentation clearly states, "Any traffic on those networks is considered local... All other hosts are considered remote" [1, 2], implying a system-wide application of the `-m` setting within ntopng's data processing and reporting framework.

## 3. Step 1: Defining Your Local Networks in ntopng

To explicitly inform ntopng which network segments are considered part of the internal infrastructure, and thus "local," the `-m` or `--local-networks` command-line argument is used. This step is essential for ntopng to correctly categorize traffic before any filtering logic is applied.

**Command-Line Argument: `-m` or `--local-networks`**

The syntax for this option allows for a comma-separated list of networks, typically specified in CIDR (Classless Inter-Domain Routing) notation.[1, 2] For the specific local networks `10.0.99.0/24` and `10.0.98.0/24`, the command-line argument would be:
`-m "10.0.99.0/24,10.0.98.0/24"`

Alternatively, the long-form option can be used:
`--local-networks "10.0.99.0/24,10.0.98.0/24"`

This command instructs ntopng to treat any IP address within the range `10.0.99.0` to `10.0.99.255` and any IP address within the range `10.0.98.0` to `10.0.98.255` as local. Practical examples of this option's usage can be found in various guides and configuration discussions.[6, 7]

**Configuration File (`ntopng.conf`)**

For a persistent configuration that survives ntopng restarts without requiring manual command-line input each time, these settings should be added to the ntopng configuration file. This file is typically located at `/etc/ntopng/ntopng.conf` on Linux systems.[1, 7]

The syntax within the configuration file requires an equal sign (`=`) between the option key and its value.[2] For the specified local networks, the line in `ntopng.conf` would be:
`-m=10.0.99.0/24,10.0.98.0/24`

Or, using the long-form option:
`--local-networks=10.0.99.0/24,10.0.98.0/24`

If the `-m` option is not specified, ntopng's default behavior might be to consider only the directly connected subnet of its monitoring interface(s) as local, or it may default to a common private range such as `192.168.1.0/24`.[1, 2] This default behavior is insufficient for accurately defining the multiple distinct local networks `10.0.99.0/24` and `10.0.98.0/24`.

Using CIDR notation (e.g., `/24`) provides a clear and precise definition of the network boundaries. While the documentation indicates that traditional netmasks (e.g., `255.255.255.0`) can also be used [1], CIDR is generally the preferred method in modern network configurations due to its brevity and unambiguous nature. Adhering to CIDR notation, as used in the user's query, ensures consistency.

Conceptually, ntopng's operational flow involves first ingesting packets from the monitored interface(s). It then applies the local network definitions provided by the `-m` option to classify the source and destination endpoints of these packets. Only after this classification are packet filters, such as BPF rules, applied. This sequence is inferred from the distinct functionalities of the `-m` option (which establishes the local context [1, 2]) and the `--packet-filter` option (which acts on packets based on various criteria, including their source and destination attributes [8, 9]). For a filter to effectively distinguish and exclude "local-to-local" traffic, the definition of "local" must be established beforehand.

The following table summarizes the local network configuration:

| Parameter | Command-Line Example | `ntopng.conf` Example | Purpose |
|------------------|---------------------------------------|---------------------------------------|-----------------------------------------------|
| Local Networks | `-m "10.0.99.0/24,10.0.98.0/24"` | `-m=10.0.99.0/24,10.0.98.0/24` | Defines specified networks as local to ntopng. |

## 4. Step 2: Implementing Packet Filtering with BPF to Hide Local-to-Local Traffic

Once ntopng is aware of which networks are considered local, the next step is to implement a filter that instructs ntopng to ignore or hide traffic that is purely internal to these local segments. Berkeley Packet Filters (BPF) offer a powerful and efficient mechanism for this purpose.

**Introduction to BPF in ntopng**

BPF provides a low-level filtering language that allows ntopng to decide which packets to process or discard *before* they undergo extensive analysis, flow creation, or storage.[8] This early-stage filtering is highly efficient for excluding unwanted traffic streams entirely, making it the ideal method for achieving the goal of "hiding or ignoring" local-to-local communications. By applying a BPF filter, the specified local-to-local traffic is prevented from entering ntopng's main processing pipeline and, consequently, will not appear in flow tables or other displays.[8, 9]

**Core BPF Syntax Elements (pcap-filter syntax)**

Constructing an effective BPF filter requires understanding its basic syntax, which is derived from the `pcap-filter` library. Key primitives include [8, 10]:
* `net <network/cidr>`: Matches traffic where either the source or destination IP address belongs to the specified network.
* `src net <network/cidr>`: Matches traffic originating from the specified network.
* `dst net <network/cidr>`: Matches traffic destined for the specified network.
* `host <ip_address>`: Matches traffic involving a specific IP address as either source or destination.
* `and` (or `&&`): Logical AND operator, used to combine conditions where all must be true.
* `or` (or `||`): Logical OR operator, used to combine conditions where at least one must be true.
* `not` (or `!`): Logical NOT operator, used to negate a condition.
* Parentheses `()`: Used for grouping expressions to control the order of evaluation.

The `pcap-filter` man page serves as the definitive reference for BPF syntax.[8, 9]

**Constructing the BPF Filter for the User's Scenario**

The objective is to prevent ntopng from displaying traffic that meets any of the following conditions:
1.  Traffic entirely within the `10.0.99.0/24` network (e.g., from `10.0.99.10` to `10.0.99.20`).
2.  Traffic entirely within the `10.0.98.0/24` network (e.g., from `10.0.98.5` to `10.0.98.15`).
3.  Traffic between the `10.0.99.0/24` network and the `10.0.98.0/24` network, in either direction.

To achieve this, first, define the individual traffic patterns to be excluded:
* Traffic within `10.0.99.0/24`: `(src net 10.0.99.0/24 and dst net 10.0.99.0/24)`
* Traffic within `10.0.98.0/24`: `(src net 10.0.98.0/24 and dst net 10.0.98.0/24)`
* Traffic from `10.0.99.0/24` to `10.0.98.0/24`: `(src net 10.0.99.0/24 and dst net 10.0.98.0/24)`
* Traffic from `10.0.98.0/24` to `10.0.99.0/24`: `(src net 10.0.98.0/24 and dst net 10.0.99.0/24)`

These individual conditions represent all forms of local-to-local traffic that should be hidden. They are combined using the `or` operator, as matching any one of these conditions is sufficient for exclusion:
`(src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24)`

Finally, to instruct ntopng to process only traffic that *does not* match this combined local-to-local pattern, the `not` operator is applied to the entire group of conditions. This is the crucial step for ensuring that only remote-to-local or local-to-remote traffic is shown. The complete BPF filter expression is:
`not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24))`

This structure is similar to examples found for dropping intra-subnet traffic, which can be extended to cover multiple subnets and inter-subnet communications.[8]

The following table breaks down the logic of the BPF filter:

| BPF Component | Purpose |
|------------------------------------------------------------|--------------------------------------------------------------------------|
| `src net 10.0.99.0/24 and dst net 10.0.99.0/24` | Matches traffic *within* the `10.0.99.0/24` network. |
| `src net 10.0.98.0/24 and dst net 10.0.98.0/24` | Matches traffic *within* the `10.0.98.0/24` network. |
| `src net 10.0.99.0/24 and dst net 10.0.98.0/24` | Matches traffic *from* `10.0.99.0/24` *to* `10.0.98.0/24`. |
| `src net 10.0.98.0/24 and dst net 10.0.99.0/24` | Matches traffic *from* `10.0.98.0/24` *to* `10.0.99.0/24`. |
| `(cond1) or (cond2) or (cond3) or (cond4)` | Combines all specified local-to-local communication patterns. |
| `not (all_local_conditions_combined)` | Excludes all packets matching any of the defined local-to-local patterns. |

**Applying the Filter via Command-Line: `--packet-filter`**

The BPF expression is passed to ntopng using the `--packet-filter` command-line argument. It is crucial to enclose the BPF expression in quotes, especially when it contains spaces or special characters, to ensure the shell passes it correctly to ntopng.[11]

The full ntopng command, including the local network definition and the BPF filter, would be:
`ntopng -m "10.0.99.0/24,10.0.98.0/24" --packet-filter "not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24))"`

**Applying the Filter via `ntopng.conf`**

For persistence, this BPF filter can be added to the `ntopng.conf` file. The syntax requires the option and its value on a single line, with the BPF expression enclosed in quotes [2]:
`--packet-filter="not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24))"`

**Critical Note: Single BPF Expression**

ntopng can only apply one active BPF filter at a time. If multiple `--packet-filter` options are specified (either on the command line, in the configuration file, or a combination thereof), typically only the *last one parsed* by ntopng will take effect, overriding any previous filter definitions.[11] This is a common pitfall and underscores the necessity of combining all desired filtering logic into a single, comprehensive BPF expression, as demonstrated above.

The BPF filter operates at a very early stage of packet handling within ntopng. Traffic that is dropped by this BPF rule will not consume significant processing resources for Layer 7 analysis, host tracking, flow logging, or other intensive operations. This pre-processing filtering makes BPF a highly efficient method for achieving the desired traffic visibility.[8] While BPF syntax is powerful, its complexity can make it prone to errors. A minor mistake in the filter expression can lead to no filtering occurring, or, more detrimentally, filtering out traffic that should be monitored.[8] The filter required for this scenario is moderately complex due to the multiple `or` conditions nested within the overarching `not` operator, necessitating careful construction.

An advanced consideration arises in networks utilizing VLAN tagging. Standard BPF filters may not function as expected with VLAN-tagged packets because the VLAN header shifts the byte offsets of network and transport layer information that the BPF filter relies on. In such cases, the BPF filter might need to be adapted, for instance, by prefixing it with `vlan and (...)` to correctly parse the encapsulated packet data.[8] While not explicitly requested, this is an important factor in complex network environments.

The following table summarizes the BPF filter configuration:

| Feature | Command-Line Argument | `ntopng.conf` Parameter | Example BPF Rule (for user's case) |
|---------------------|------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Packet Filter (BPF) | `--packet-filter "<rule>"` | `--packet-filter="<rule>"` | `"not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24))"` |

## 5. Step 3: Verifying the Configuration

After applying the local network definitions and the BPF filter, it is crucial to verify that ntopng is behaving as expected.

**Restart ntopng Service**
Any changes made to command-line arguments used to start ntopng or modifications to the `ntopng.conf` file require a restart of the ntopng service for these changes to take effect. Common commands to restart the service on Linux systems include `sudo systemctl restart ntopng` or, for older init systems, `/etc/init.d/ntopng restart`.[7, 12]

**Checking ntopng Logs**
Upon startup, ntopng typically logs the parameters it is using. Review the ntopng log files (the location can vary depending on the installation, but often found in `/var/log/` or viewed via `journalctl`) for lines indicating the local networks being recognized (from the `-m` option) and the applied packet filter (from the `--packet-filter` option). If there is a syntax error in the BPF expression, ntopng will usually log an error message, such as "Failed to parse filter" or "syntax error".[8] These logs are the primary source for diagnosing configuration parsing issues.

**Observing Traffic in the ntopng Web UI**
Access the ntopng web interface and navigate to views that display network flows or host communications, such as the "Flows" or "Hosts" sections.[13, 14]
1.  Generate some test traffic that should be filtered:
    * Within the `10.0.99.0/24` network (e.g., ping or file transfer between two hosts in this subnet).
    * Within the `10.0.98.0/24` network.
    * Between a host in `10.0.99.0/24` and a host in `10.0.98.0/24`.
    This traffic should *not* appear in the ntopng flow tables if the filter is working correctly.
2.  Generate some test traffic that should *not* be filtered:
    * From a local host (e.g., `10.0.99.10`) to a remote host (e.g., an internet IP address like 8.8.8.8).
    * From a remote host to a local host.
    This traffic *should* appear in ntopng's displays.

**Using `tcpdump` for BPF Testing (Recommended)**
Before applying a BPF filter to ntopng, especially a complex one, it is highly recommended to test it using `tcpdump` on the same network interface that ntopng will monitor.[8] This allows for direct verification of the filter's behavior at the packet level.
The command syntax would be:
`sudo tcpdump -i <interface_name> -n -v '<your_bpf_filter_here>'`

Replace `<interface_name>` with the actual interface (e.g., `eth0`) and `<your_bpf_filter_here>` with the exact BPF string intended for ntopng.
* If the filter is designed to *pass* certain traffic (as in this case, where `not` is used to exclude local traffic and thus pass other traffic), `tcpdump` should display packets matching the remote-to-local or local-to-remote criteria.
* Conversely, if testing the *exclusion part* of the filter (e.g., `(src net 10.0.99.0/24 and dst net 10.0.99.0/24) or...`), `tcpdump` should only show the local-to-local traffic.

This pre-testing step can save significant time and prevent misconfigurations in ntopng.

When troubleshooting, it is advisable to adopt an incremental approach. First, verify that the `-m` setting for local networks is correctly recognized by ntopng by checking the logs and observing how hosts are classified in the UI (without any BPF filter applied). Once this is confirmed, then introduce the BPF filter and verify its effect. This layered verification helps to isolate the source of any potential issues more easily, determining whether a problem lies with the local network definition or the BPF syntax itself.

## 6. Alternative Considerations (and their limitations for this specific goal)

While BPF filtering at the command line or via `ntopng.conf` is the recommended approach for persistently ignoring specific traffic flows, other mechanisms within ntopng exist that might seem relevant but have limitations for this particular use case.

**UI Display Filters (Post-Capture Filtering)**
The ntopng web interface often includes search bars or filtering options within specific views, such as the flow table.[14, 15] These allow users to dynamically refine the displayed data based on various criteria (e.g., IP address, port, protocol).
* **Limitation:** These UI-level filters typically operate on data that has *already been captured and processed* by ntopng. They can hide data from a specific, currently active view, but they do not prevent ntopng from initially "seeing," processing, and potentially storing (if persistence is enabled) the local-to-local traffic. This means the underlying data still exists in ntopng's memory or database and contributes to overall metrics unless it is filtered out at the source by a BPF filter. The user's request to "hide or ignore" implies a more fundamental exclusion than what UI display filters offer. They are more suited for ad-hoc analysis rather than persistent, system-wide traffic exclusion.

**LUA Scripting**
ntopng incorporates support for LUA scripting, enabling users to extend its functionality. This can include creating custom alerts, implementing specialized data processing logic, and potentially making UI modifications.[16] The ntopng system can be seen as scriptable, capable of reacting to network events through LUA.[17]
* **Limitation for Open-Source UI Flow Hiding:** While LUA scripts can interact with flow data and are used for creating plugins or new REST API endpoints [3, 18], using LUA to dynamically remove or hide specific flows (like all local-to-local traffic as defined by the user) from the standard UI tables in the open-source version is not a straightforward, well-documented, or commonly employed method compared to the directness of BPF. Such deep UI customization or alteration of core flow table rendering logic might be more feasible or accessible in the Professional or Enterprise versions of ntopng, or would likely require significant custom development effort. The available information on LUA in the open-source context points more towards *adding* functionality or *reacting* to events rather than fundamentally *subtracting* or *filtering out* data from core displays based on complex local network criteria. The official, detailed LUA documentation and hook guides that might clarify this further were not accessible for this report. [19, 20, 21, 22, 23, 24, 25, 26]

**Host Pools and Categories**
ntopng allows the creation of "Host Pools," which group hosts into logical sets based on IP or MAC addresses, and "Categories," which can classify applications or traffic types.[27, 16]
* **Limitation:** In the open-source version, Host Pools and Categories are primarily intended for organizational purposes, applying policies (a feature more extensively developed in Pro/Enterprise versions [16]), or for generating aggregated reports. They are not designed as a primary mechanism to dynamically hide specific inter-group or intra-group flows from the main, live flow views. While one might define pools for `10.0.99.0/24` and `10.0.98.0/24`, there isn't a simple, built-in open-source feature to then say "hide all traffic between hosts in these pools" from the general flow display. Detailed documentation on using Host Pools for display filtering in the open-source edition was not accessible. [28, 29]

The crucial distinction lies between "hiding" traffic at the display level and "not processing" traffic at the capture level. BPF achieves the latter, aligning with the intent to "ignore" the traffic, as it prevents the data from being deeply processed or stored by ntopng.[8] UI methods and potentially LUA or Host Pool configurations (if they could be used for display filtering) would typically only affect the presentation layer, not the underlying data handling. For the open-source version, BPF remains the most robust and efficient solution for the user's requirement. While LUA and Host Pools are present in the open-source edition, their advanced capabilities for fine-grained UI control or policy-based flow visibility might be more developed or easier to implement in ntopng's commercial versions.[16, 5]

## 7. Troubleshooting Common Issues

Implementing network traffic filtering can sometimes lead to unexpected behavior. Below are common issues encountered when configuring ntopng with local network definitions and BPF filters, along with their solutions:

* **Incorrect BPF Syntax:**
    * **Symptom:** ntopng may fail to start, the filter may not seem to apply (i.e., local-to-local traffic is still visible), or, in worst-case scenarios, all traffic might be inadvertently dropped. Error messages related to BPF parsing may appear in ntopng's logs.[8]
    * **Solution:** Meticulously verify the BPF syntax against the `pcap-filter` man page documentation.[8, 10] Test the exact filter string with `tcpdump` on a relevant interface or pcap file before applying it in ntopng.[8] Pay close attention to the correct usage of primitives like `src`, `dst`, `net`, logical operators (`and`, `or`, `not`), and the placement of parentheses for grouping conditions.

* **Multiple `--packet-filter` Arguments Specified:**
    * **Symptom:** If multiple `--packet-filter` options are provided either on the command line or in `ntopng.conf`, only the last one processed by ntopng typically takes effect, and earlier filters are silently ignored.[11]
    * **Solution:** Consolidate all BPF conditions into a single, comprehensive filter expression within one `--packet-filter` argument string.

* **Local Networks (`-m` or `--local-networks`) Not Defined Correctly or At All:**
    * **Symptom:** The BPF filter, even if syntactically correct, may not function as intended because ntopng lacks the correct context to identify which traffic is truly "local-to-local." All traffic might appear as remote, or the filter might not match the intended flows.
    * **Solution:** Ensure that the `-m "10.0.99.0/24,10.0.98.0/24"` option (or its equivalent in `ntopng.conf`) is correctly specified and that ntopng has loaded this configuration. Check ntopng's startup logs for confirmation of the local networks it has recognized.

* **Quoting Issues with the BPF Filter String:**
    * **Symptom:** The shell or ntopng's configuration parser may misinterpret the BPF filter string if it is not correctly quoted, leading to syntax errors or incorrect filter behavior.
    * **Solution:** When providing the BPF filter as a command-line argument, enclose the entire string in double quotes (`"..."`). Within the `ntopng.conf` file, ensure that quotes used for the filter value are correctly balanced (e.g., `--packet-filter="..."`).

* **ntopng Interface Not Capturing Expected Traffic:**
    * **Symptom:** ntopng runs, and the configuration seems correct, but no relevant traffic (or sometimes no traffic at all) is displayed in the web UI, even traffic that should pass the filter (i.e., local-to-remote or remote-to-local).
    * **Solution:**
        1.  Verify that ntopng is configured to listen on the correct network interface(s) using the `-i` option.[1, 2]
        2.  Confirm that the specified network interface is indeed seeing the network traffic (e.g., by using `tcpdump` on that interface without any BPF filter).
        3.  If using port mirroring (SPAN) on a switch to feed traffic to ntopng, double-check the switch's port mirroring configuration to ensure the correct source ports/VLANs are being mirrored to the destination port connected to the ntopng machine.[6, 7]

* **VLAN Tagged Traffic Issues (Advanced):**
    * **Symptom:** The BPF filter does not work as expected when applied to VLAN-tagged packets. The filter may fail to match traffic it should, or match traffic it shouldn't.
    * **Solution:** If the monitored traffic includes VLAN tags, the standard BPF filter may need modification to correctly interpret the encapsulated packet structure. This often involves adding `vlan and` at the beginning of the relevant parts of the filter expression, e.g., `not (vlan and ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or...))`.[8] Testing with `tcpdump` is particularly important in VLAN environments.

A systematic, layered troubleshooting approach is generally most effective:
1.  Confirm ntopng is running and listening on the correct network interface.
2.  Verify that the local networks are defined in ntopng's configuration and recognized upon startup (check logs).
3.  Test the BPF filter syntax independently using `tcpdump`.
4.  Ensure ntopng is loading the specified BPF filter (check logs for confirmation or errors).
5.  Observe traffic flow in the ntopng UI and compare it against expected behavior based on the filter.

## 8. Conclusion and Best Practices

The most effective and efficient method to configure the open-source version of ntopng to hide or ignore local-to-local traffic involving the networks `10.0.99.0/24` and `10.0.98.0/24`—thereby focusing visibility on remote-to-local and local-to-remote communications—involves two key configuration steps:

1.  **Define Local Networks:** Explicitly declare `10.0.99.0/24` and `10.0.98.0/24` as local networks to ntopng. This is achieved using the command-line option `-m "10.0.99.0/24,10.0.98.0/24"` or by adding the equivalent line `-m=10.0.99.0/24,10.0.98.0/24` to the `ntopng.conf` file.
2.  **Implement a BPF Packet Filter:** Apply a single, comprehensive Berkeley Packet Filter to instruct ntopng to not process packets matching any local-to-local communication patterns. The command-line option is `--packet-filter "not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24))"`, with the equivalent line in `ntopng.conf` being `--packet-filter="not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24))"`.

Adhering to the following best practices will facilitate a successful and maintainable configuration:

* **Test BPF Filters Thoroughly:** Before applying any BPF filter to a production ntopng instance, always test its syntax and behavior using `tcpdump`. This can be done on a live interface mirroring the production traffic or against a relevant pcap file. This step is crucial to ensure the filter correctly identifies the intended traffic for exclusion and does not inadvertently drop desired packets.[8]
* **Utilize `ntopng.conf` for Persistence:** For configurations that should persist across ntopng service restarts, it is strongly recommended to add the `-m` and `--packet-filter` options (and any other desired startup parameters) to the `ntopng.conf` file.[1, 2] This avoids the need to manually specify these options each time ntopng is started.
* **Consult ntopng Logs Regularly:** The ntopng logs are an invaluable resource for verifying that configurations are loaded correctly and for diagnosing any issues. Check the logs particularly after making configuration changes or restarting the service to look for error messages or confirmation of applied settings.
* **Understand BPF Limitations and Complexities:** Be aware that BPF, while powerful, has its limitations and can introduce complexity, especially in environments with advanced network features like VLAN tagging.[8] Ensure the filter syntax is precise.
* **Implement Changes Incrementally:** When setting up or modifying complex configurations, apply changes in small, verifiable steps. For instance, first ensure local networks are correctly defined and recognized by ntopng, then introduce the BPF filter. This simplifies troubleshooting by isolating the impact of each change.

By correctly defining local networks and applying a carefully constructed BPF filter, administrators can effectively tailor ntopng's traffic visibility. This BPF-centric approach is highly efficient as it filters traffic at the packet capture stage, reducing the processing load on ntopng and ensuring that only relevant external communication flows are analyzed and displayed. This aligns directly with the requirement to focus on interactions between the local network segments and remote systems. Understanding the principles behind these configurations empowers administrators to adapt this solution for different network segments or evolving monitoring needs, leveraging the efficiency of BPF for precise traffic control.

## 9. Quick Steps to Hide Local-to-Local Traffic

For those looking for a concise summary, here are the essential steps to configure ntopng to hide traffic between `10.0.99.0/24` and `10.0.98.0/24`, and also traffic within each of these subnets:

1.  **Define Your Local Networks:**
    Tell ntopng which networks are local. You can do this either via the command line when starting ntopng or by adding it to the `ntopng.conf` file.
    * **Command Line:**
        ```bash
        -m "10.0.99.0/24,10.0.98.0/24"
        ```
    * **`ntopng.conf` file:**
        ```
        -m=10.0.99.0/24,10.0.98.0/24
        ```
        Or, using the long-form option:
        ```
        --local-networks=10.0.99.0/24,10.0.98.0/24
        ```
    This step is crucial for ntopng to understand what "local" means before applying any filters.[1, 2]

2.  **Apply a Berkeley Packet Filter (BPF) to Exclude Local-to-Local Traffic:**
    Use a BPF filter to tell ntopng to ignore packets where both the source and destination are within your defined local networks, or between these two local networks.
    * **Command Line (as part of the ntopng startup command):**
        ```bash
        --packet-filter "not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or \
        (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or \
        (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or \
        (src net 10.0.98.0/24 and dst net 10.0.99.0/24))"
        ```
    * **`ntopng.conf` file:**
        ```
        --packet-filter="not ((src net 10.0.99.0/24 and dst net 10.0.99.0/24) or (src net 10.0.98.0/24 and dst net 10.0.98.0/24) or (src net 10.0.99.0/24 and dst net 10.0.98.0/24) or (src net 10.0.98.0/24 and dst net 10.0.99.0/24))"
        ```
    This filter ensures that ntopng only processes and displays traffic that is either local-to-remote or remote-to-local.[11, 8, 9] Remember that ntopng only uses one BPF filter, so this must be a single, comprehensive expression.[11]

3.  **Restart and Verify:**
    * Restart the ntopng service for the changes to take effect (e.g., `sudo systemctl restart ntopng`).[7, 12]
    * Check ntopng logs for any errors, especially related to BPF syntax.[8]
    * Observe the traffic in the ntopng web UI to confirm that local-to-local traffic is no longer displayed, while external traffic remains visible.[13, 14]
    * It's highly recommended to test your BPF filter syntax with `tcpdump` before applying it to ntopng.[8]

By following these steps, you will configure ntopng to focus on external network interactions by effectively hiding internal local traffic.

