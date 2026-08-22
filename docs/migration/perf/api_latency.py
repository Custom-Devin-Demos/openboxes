#!/usr/bin/env python3
"""API latency smoke for OpenBoxes. Warm-up requests discarded, then N timed requests per endpoint."""
import http.client, json, time, statistics, sys, urllib.parse

BASE = "localhost"; PORT = 8080; CTX = "/openboxes"
WARMUP = 5; N = 25

def login():
    c = http.client.HTTPConnection(BASE, PORT, timeout=60)
    c.request("POST", CTX + "/api/login", json.dumps({"username": "admin", "password": "password"}),
              {"Content-Type": "application/json"})
    r = c.getresponse(); r.read()
    cookie = r.getheader("Set-Cookie").split(";")[0]
    assert r.status == 200, r.status
    # choose location (main warehouse) so dashboard/location-scoped endpoints work
    c.request("GET", CTX + "/dashboard/chooseLocation/1", headers={"Cookie": cookie})
    r = c.getresponse(); r.read()
    return cookie, r.status

ENDPOINTS = [
    ("products (paginated)", "/api/products?max=10&offset=0"),
    ("categories", "/api/categories"),
    ("stockMovements OUTBOUND", "/api/stockMovements?direction=OUTBOUND&origin=1&max=10&offset=0"),
    ("product search", "/api/products/search?name=Ibuprofen"),
    ("stockCard details (seed-product-03)", "/api/stockCard/seed-product-03/details?locationId=1"),
    ("stockCard currentStock (seed-product-03)", "/api/stockCard/seed-product-03/currentStock?locationId=1"),
    ("dashboard inProgressShipments", "/api/dashboard/inProgressShipments?locationId=1"),
    ("dashboard expirationSummary", "/api/dashboard/expirationSummary?locationId=1"),
    ("dashboard inventorySummary", "/api/dashboard/inventorySummary?locationId=1"),
    ("dashboard openStockRequests", "/api/dashboard/openStockRequests?locationId=1"),
]

def timed_get(cookie, path):
    c = http.client.HTTPConnection(BASE, PORT, timeout=120)
    t0 = time.perf_counter()
    c.request("GET", CTX + path, headers={"Cookie": cookie, "Accept": "application/json"})
    r = c.getresponse(); body = r.read()
    dt = (time.perf_counter() - t0) * 1000
    c.close()
    return dt, r.status, len(body)

def main():
    cookie, loc_status = login()
    print(f"login ok, chooseLocation status={loc_status}")
    results = []
    for name, path in ENDPOINTS:
        for _ in range(WARMUP):
            timed_get(cookie, path)
        times = []; status = None; size = None
        for _ in range(N):
            dt, status, size = timed_get(cookie, path)
            times.append(dt)
        times.sort()
        med = statistics.median(times)
        p95 = times[int(0.95 * len(times)) - 1]
        results.append((name, path, status, size, med, p95, min(times), max(times)))
        print(f"{name:45s} {path:60s} status={status} size={size}B median={med:8.1f}ms p95={p95:8.1f}ms min={min(times):.1f} max={max(times):.1f}")
    print(json.dumps([{"name": n, "path": p, "status": s, "bytes": b,
                       "median_ms": round(m,1), "p95_ms": round(q,1),
                       "min_ms": round(lo,1), "max_ms": round(hi,1)}
                      for n,p,s,b,m,q,lo,hi in results], indent=2))

if __name__ == "__main__":
    main()
