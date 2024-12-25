import csv
import os
import pprint
import sys
import time
import xmlrpc.client

# Usage:
# GANDI_XMLRPC_API_KEY=xxxyourapikeyxxx GANDI_DOMAIN_NAME=yourdomain python3 ./gandi_domain_search.py
# Note that your API key is the old-style XMLRPC key, which you get from the v4 web UI.
# Using the REST API key from the v5 (current at time of scripting) web UI will not work.

pp = pprint.pprint
k = os.environ["GANDI_XMLRPC_API_KEY"]
print("API initialising           ", end="", flush=True, file=sys.stderr)
api = xmlrpc.client.ServerProxy("https://rpc.gandi.net/xmlrpc/")
print("[ok]", flush=True, file=sys.stderr)
print("Fetching TLDs              ", end="", flush=True, file=sys.stderr)
tlds = api.domain.tld.list(k)
print("[ok]", flush=True, file=sys.stderr)
print("Fetching results           ", end="", flush=True, file=sys.stderr)
res = api.domain.price.list(
    k,
    {
        "tlds": [
            "{0}.{1}".format(os.environ["GANDI_DOMAIN_NAME"], i["name"]) for i in tlds
        ],
        "action": ["create", "renew"],
    },
)
final = []
while True:
    final += [x for x in res if x["available"] != "pending"]
    pending = [x["extension"] for x in res if x["available"] == "pending"]
    num_pending = len(pending)
    if num_pending > 0:
        res = api.domain.price.list(k, {"tlds": pending, "action": ["create", "renew"]})
        print("[awaiting {}] ".format(num_pending), end="", flush=True, file=sys.stderr)
        time.sleep(5)
    else:
        print("[ok]", flush=True, file=sys.stderr)
        break
available = [x for x in final if x["available"] == "available"]
concise = [
    [
        x["extension"],
        list(filter(lambda y: y["action"]["name"] == "create", x["prices"]))[0][
            "unit_price"
        ][0]["price"],
        list(filter(lambda y: y["action"]["name"] == "renew", x["prices"]))[0][
            "unit_price"
        ][0]["price"],
        # FIXME just grabbing index 0 is a bit braindead as it unpredictably selects for/against special offers
    ]
    for x in available
]
wr = csv.writer(sys.stdout, dialect="excel")
wr.writerow(["fqdn", "create_usd", "renew_usd"])
[wr.writerow(x) for x in concise]
sys.stdout.flush()
