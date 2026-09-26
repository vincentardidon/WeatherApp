import { test } from "node:test";
import assert from "node:assert/strict";

import { parseGeocodeQuery, parseWeatherQuery } from "../src/utils/validators.js";
import { sanitizeSearchText } from "../src/utils/sanitize.js";
import { describeWeatherCode } from "../src/utils/weatherCodes.js";
import { searchLocations } from "../src/services/geocoding.service.js";
import { getWeather } from "../src/services/weather.service.js";
import { handleGetWeather } from "../src/controllers/weather.controller.js";
import { handleGeocode } from "../src/controllers/geocode.controller.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { requestTimeout } from "../src/middleware/timeout.js";
import { AppError } from "../src/utils/AppError.js";

// ---------- helpers ----------

function makeForecast({ offsetSeconds = 28800, timezone = "Asia/Manila", nowHourLocal = 14 } = {}) {
  const dayStart = Date.UTC(2026, 8, 21) / 1000 - offsetSeconds;
  const hours = Array.from({ length: 168 }, (_, i) => dayStart + i * 3600);
  const days = Array.from({ length: 7 }, (_, i) => dayStart + i * 86400);
  const series = (fn) => Array.from({ length: 168 }, (_, i) => fn(i));

  return {
    latitude: 10.3,
    longitude: 123.9,
    utc_offset_seconds: offsetSeconds,
    timezone,
    current: {
      time: dayStart + nowHourLocal * 3600 + 15 * 60,
      temperature_2m: 31.4,
      relative_humidity_2m: 70,
      apparent_temperature: 37.1,
      is_day: 1,
      precipitation: 0.2,
      weather_code: 2,
      cloud_cover: 45,
      pressure_msl: 1008.3,
      wind_speed_10m: 12.6,
      wind_direction_10m: 90,
      wind_gusts_10m: 25.2,
    },
    hourly: {
      time: hours,
      temperature_2m: series((i) => 20 + i / 10),
      precipitation_probability: series(() => 30),
      weather_code: series(() => 61),
      is_day: series((i) => (i % 24 >= 6 && i % 24 < 18 ? 1 : 0)),
      visibility: series(() => 24000),
      uv_index: series((i) => i / 100),
      dew_point_2m: series(() => 24.5),
    },
    daily: {
      time: days,
      weather_code: days.map(() => 95),
      temperature_2m_max: days.map((_, i) => 32 + i),
      temperature_2m_min: days.map((_, i) => 25 - i),
      sunrise: days.map((d) => d + 5 * 3600 + 30 * 60),
      sunset: days.map((d) => d + 17 * 3600 + 45 * 60),
      precipitation_probability_max: days.map(() => 60),
    },
  };
}

const GEO_CEBU = {
  results: [
    { id: 1, name: "Cebu City", latitude: 10.31672, longitude: 123.89071, country: "Philippines", admin1: "Central Visayas" },
    { id: 2, name: "Cebu", latitude: 10.417, longitude: 123.75, country: "Philippines", admin1: "Central Visayas" },
  ],
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function mockFetch(t, handler) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(new URL(url));
    return handler(new URL(url));
  });
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "error", () => {});
  return calls;
}

async function expectAppError(promise, status, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof AppError, `expected AppError, got ${error}`);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

function fakeRes() {
  const listeners = {};
  return {
    statusCode: null,
    body: null,
    headersSent: false,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; this.headersSent = true; listeners.finish?.forEach((fn) => fn()); return this; },
    on(event, fn) { (listeners[event] ??= []).push(fn); },
  };
}

// ================= sanitize.js =================

test("sanitize: strips disallowed characters but keeps real place names", () => {
  assert.equal(sanitizeSearchText("  Cebu   City "), "Cebu City");
  assert.equal(sanitizeSearchText("São Paulo"), "São Paulo");
  assert.equal(sanitizeSearchText("Saint-Étienne"), "Saint-Étienne");
  assert.equal(sanitizeSearchText("Coeur d'Alene"), "Coeur d'Alene");
  assert.equal(sanitizeSearchText("Washington, D.C."), "Washington, D.C.");
  assert.equal(sanitizeSearchText("<script>Cebu</script>"), "scriptCebuscript");
  assert.equal(sanitizeSearchText("Cebu;DROP TABLE"), "CebuDROP TABLE");
  assert.equal(sanitizeSearchText("Cebu\u0000\u001F"), "Cebu");
});

test("sanitize: rejects empty, whitespace-only, too-short, and non-string input", () => {
  for (const raw of ["", "   ", "a", " a ", ",PH", "<>{}"]) {
    assert.throws(() => sanitizeSearchText(raw), (e) => e.code === "invalid_query", JSON.stringify(raw));
  }
  assert.throws(() => sanitizeSearchText(123), (e) => e.code === "invalid_query");
  assert.throws(() => sanitizeSearchText(["Cebu"]), (e) => e.code === "invalid_query");
});

test("sanitize: rejects input over the length limit", () => {
  assert.throws(() => sanitizeSearchText("x".repeat(101)), (e) => e.code === "invalid_query");
});

// ================= validators.js: geocode =================

test("parseGeocodeQuery: accepts a valid query, rejects missing/duplicated q", () => {
  assert.deepEqual(parseGeocodeQuery({ q: " Cebu " }), { query: "Cebu" });
  assert.throws(() => parseGeocodeQuery({}), (e) => e.code === "invalid_query");
  assert.throws(() => parseGeocodeQuery({ q: ["a", "b"] }), (e) => e.code === "invalid_query");
});

// ================= validators.js: weather =================

test("parseWeatherQuery: accepts valid coordinates", () => {
  assert.deepEqual(parseWeatherQuery({ lat: "10.3", lon: "-123.9" }), { latitude: 10.3, longitude: -123.9 });
});

test("parseWeatherQuery: rejects missing lat, missing lon, and both missing", () => {
  assert.throws(() => parseWeatherQuery({ lon: "10" }), (e) => e.code === "invalid_coordinates");
  assert.throws(() => parseWeatherQuery({ lat: "10" }), (e) => e.code === "invalid_coordinates");
  assert.throws(() => parseWeatherQuery({}), (e) => e.code === "invalid_coordinates");
});

test("parseWeatherQuery: rejects out-of-range and non-numeric coordinates", () => {
  for (const query of [
    { lat: "91", lon: "0" },
    { lat: "-91", lon: "0" },
    { lat: "0", lon: "181" },
    { lat: "0", lon: "-181" },
    { lat: "abc", lon: "0" },
    { lat: "0", lon: "NaN" },
    { lat: "", lon: "0" },
    { lat: "1e400", lon: "0" }, // Infinity
  ]) {
    assert.throws(() => parseWeatherQuery(query), (e) => e.code === "invalid_coordinates", JSON.stringify(query));
  }
});

test("parseWeatherQuery: rejects duplicated lat/lon (arrays) without crashing", () => {
  assert.throws(() => parseWeatherQuery({ lat: ["1", "2"], lon: "0" }), (e) => e.code === "invalid_query");
});

test("parseWeatherQuery: unrelated extra query params are ignored, not errors", () => {
  assert.deepEqual(parseWeatherQuery({ lat: "10", lon: "20", foo: "bar" }), { latitude: 10, longitude: 20 });
});

// ================= weatherCodes.js =================

test("weather codes become readable conditions and icons", () => {
  assert.deepEqual(describeWeatherCode(0, true), { condition: "Clear sky", icon: "clear" });
  assert.deepEqual(describeWeatherCode(0, false), { condition: "Clear sky", icon: "clear-night" });
  assert.deepEqual(describeWeatherCode(95, true), { condition: "Thunderstorm", icon: "thunderstorm" });
  assert.deepEqual(describeWeatherCode(12345), { condition: "Unknown", icon: null });
});

// ================= geocoding.service.js =================

test("searchLocations: maps and limits results, drops bad entries", async (t) => {
  const calls = mockFetch(t, () => jsonResponse(GEO_CEBU));
  const results = await searchLocations("Cebu");
  assert.equal(calls[0].searchParams.get("count"), "5");
  assert.equal(results.length, 2);
  assert.deepEqual(results[0], {
    name: "Cebu City",
    region: "Central Visayas",
    country: "Philippines",
    latitude: 10.31672,
    longitude: 123.89071,
  });
});

test("searchLocations: no matches -> empty array (not an error)", async (t) => {
  mockFetch(t, () => jsonResponse({}));
  assert.deepEqual(await searchLocations("Zzzzqxw"), []);
});

test("searchLocations: drops entries with missing/invalid coordinates", async (t) => {
  mockFetch(t, () =>
    jsonResponse({ results: [{ name: "Bad", latitude: null, longitude: 1 }, GEO_CEBU.results[0]] })
  );
  const results = await searchLocations("Cebu");
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Cebu City");
});

test("searchLocations: region equal to name is dropped", async (t) => {
  mockFetch(t, () =>
    jsonResponse({ results: [{ name: "Berlin", admin1: "Berlin", country: "Germany", latitude: 52.5, longitude: 13.4 }] })
  );
  const [result] = await searchLocations("Berlin");
  assert.equal(result.region, null);
});

// ================= weather.service.js (mapper included) =================

test("getWeather: full mapping for valid coordinates", async (t) => {
  const calls = mockFetch(t, () => jsonResponse(makeForecast()));
  const weather = await getWeather({ latitude: 10.316724, longitude: 123.890713 });

  assert.equal(calls.length, 1); // ONLY the forecast call — no geocoding here
  assert.equal(calls[0].hostname, "api.open-meteo.com");
  assert.ok(!calls[0].searchParams.has("apikey"));

  assert.equal(weather.location.name, null); // frontend fills this in, not the backend
  assert.equal(weather.location.latitude, 10.3167);
  assert.equal(weather.location.timezone, "Asia/Manila");
  assert.equal(weather.current.temperature, 31.4);
  assert.equal(weather.current.condition, "Partly cloudy");
  assert.equal(weather.current.visibility, 24);
  assert.equal(weather.hourly.length, 24);
  assert.equal(weather.daily.length, 7);
  assert.equal(weather.daily[0].date, "2026-09-21");
  assert.equal(weather.astronomy.sunrise, "2026-09-20T21:30:00.000Z");
  assert.equal(weather.meta.source, "Open-Meteo");
});

test("getWeather: missing values become null instead of crashing", async (t) => {
  const forecast = makeForecast();
  forecast.current.wind_direction_10m = null;
  delete forecast.hourly.visibility;
  mockFetch(t, () => jsonResponse(forecast));
  const weather = await getWeather({ latitude: 10.3, longitude: 123.9 });
  assert.equal(weather.current.windDirection, null);
  assert.equal(weather.current.visibility, null);
});

test("getWeather: incomplete forecast -> 502 upstream_invalid_response", async (t) => {
  mockFetch(t, () => jsonResponse({ current: {} }));
  await expectAppError(getWeather({ latitude: 10.3, longitude: 123.9 }), 502, "upstream_invalid_response");
});

// ================= upstream failures (shared by both routes via httpClient) =================

test("HTTP 500 from Open-Meteo -> 502 upstream_error", async (t) => {
  mockFetch(t, () => jsonResponse({ error: true, reason: "boom" }, 500));
  await expectAppError(getWeather({ latitude: 10.3, longitude: 123.9 }), 502, "upstream_error");
  await expectAppError(searchLocations("Cebu"), 502, "upstream_error");
});

test("HTTP 429 -> 503 upstream_rate_limited", async (t) => {
  mockFetch(t, () => jsonResponse({ error: true }, 429));
  await expectAppError(getWeather({ latitude: 10.3, longitude: 123.9 }), 503, "upstream_rate_limited");
});

test("non-JSON body -> 502 upstream_invalid_response", async (t) => {
  mockFetch(t, () => new Response("<html>oops</html>", { status: 200 }));
  await expectAppError(getWeather({ latitude: 10.3, longitude: 123.9 }), 502, "upstream_invalid_response");
});

test("network failure -> 503 upstream_unreachable", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await expectAppError(getWeather({ latitude: 10.3, longitude: 123.9 }), 503, "upstream_unreachable");
});

test("slow network (upstream timeout) -> 504 upstream_timeout", async (t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(globalThis, "fetch", async () => { throw new DOMException("timeout", "TimeoutError"); });
  await expectAppError(getWeather({ latitude: 10.3, longitude: 123.9 }), 504, "upstream_timeout");
});

test("a real hanging upstream request is aborted by the timeout", async (t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(globalThis, "fetch", (url, { signal }) =>
    new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason)))
  );
  const { config } = await import("../src/config/env.js");
  const original = config.upstreamTimeoutMs;
  config.upstreamTimeoutMs = 50;
  const keepAlive = setTimeout(() => {}, 2000);
  try {
    await expectAppError(getWeather({ latitude: 10.3, longitude: 123.9 }), 504, "upstream_timeout");
  } finally {
    clearTimeout(keepAlive);
    config.upstreamTimeoutMs = original;
  }
});

// ================= controllers =================

test("weather controller: 200 with valid coordinates", async (t) => {
  mockFetch(t, () => jsonResponse(makeForecast()));
  const res = fakeRes();
  await handleGetWeather({ query: { lat: "10.3", lon: "123.9" } }, res, (e) => { throw e; });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.current.temperature, 31.4);
});

test("weather controller: forwards validation errors to next(), never throws", async () => {
  let forwarded;
  await handleGetWeather({ query: {} }, fakeRes(), (error) => { forwarded = error; });
  assert.ok(forwarded instanceof AppError);
  assert.equal(forwarded.code, "invalid_coordinates");
});

test("geocode controller: 200 with results for a valid query", async (t) => {
  mockFetch(t, () => jsonResponse(GEO_CEBU));
  const res = fakeRes();
  await handleGeocode({ query: { q: "Cebu" } }, res, (e) => { throw e; });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.results.length, 2);
});

test("geocode controller: 200 with an EMPTY array when nothing matches (not a 404)", async (t) => {
  mockFetch(t, () => jsonResponse({}));
  const res = fakeRes();
  await handleGeocode({ query: { q: "Zzzzqxw" } }, res, (e) => { throw e; });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { results: [] });
});

test("geocode controller: forwards sanitize/validation errors to next()", async () => {
  let forwarded;
  await handleGeocode({ query: { q: "a" } }, fakeRes(), (error) => { forwarded = error; });
  assert.ok(forwarded instanceof AppError);
  assert.equal(forwarded.code, "invalid_query");
});

test("malformed query values (objects, arrays) never crash either controller", async () => {
  const weird = [{}, { q: { nested: true } }, { lat: {}, lon: [] }, null, undefined];
  for (const query of weird) {
    let forwarded;
    await handleGeocode({ query }, fakeRes(), (e) => { forwarded = e; });
    assert.ok(forwarded instanceof AppError, `geocode should not crash on ${JSON.stringify(query)}`);
    forwarded = undefined;
    await handleGetWeather({ query }, fakeRes(), (e) => { forwarded = e; });
    assert.ok(forwarded instanceof AppError, `weather should not crash on ${JSON.stringify(query)}`);
  }
});

// ================= middleware/timeout.js =================

test("requestTimeout: calls next() immediately and does nothing once the response finishes", () => {
  const res = fakeRes();
  let nextCalled = false;
  requestTimeout({ method: "GET", path: "/api/weather" }, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  res.json({ ok: true }); // triggers the "finish" listener, which must clear the timer
});

test("requestTimeout: sends 504 request_timeout if the response never completes in time", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { config } = await import("../src/config/env.js");
  const original = config.requestTimeoutMs;
  config.requestTimeoutMs = 20;
  try {
    const res = fakeRes();
    requestTimeout({ method: "GET", path: "/api/weather" }, res, () => {});
    await new Promise((resolve) => setTimeout(resolve, 40));
  } finally {
    config.requestTimeoutMs = original;
  }
});

test("requestTimeout: the error it raises has the expected shape", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { config } = await import("../src/config/env.js");
  const original = config.requestTimeoutMs;
  config.requestTimeoutMs = 10;
  try {
    const res = fakeRes();
    const calls = [];
    // requestTimeout calls next() twice: once synchronously (to continue the
    // chain) and, only if the timer fires first, again with the error.
    requestTimeout({ method: "GET", path: "/x" }, res, (arg) => calls.push(arg));
    assert.equal(calls.length, 1);
    assert.equal(calls[0], undefined);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(calls.length, 2);
    assert.ok(calls[1] instanceof AppError);
    assert.equal(calls[1].status, 504);
    assert.equal(calls[1].code, "request_timeout");
  } finally {
    config.requestTimeoutMs = original;
  }
});

// ================= middleware/errorHandler.js =================

test("errorHandler: AppError, framework 4xx, and unknown errors are all formatted safely", (t) => {
  t.mock.method(console, "error", () => {});

  let res = fakeRes();
  errorHandler(new AppError(404, "location_not_found", "Nope"), {}, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: { code: "location_not_found", message: "Nope" } });

  res = fakeRes();
  errorHandler(Object.assign(new Error("bad json"), { status: 400 }), {}, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, "bad_request");

  res = fakeRes();
  errorHandler(new Error("kaboom secret internal detail"), {}, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error.code, "internal_error");
  const serialized = JSON.stringify(res.body);
  assert.ok(!serialized.includes("kaboom"), "internal error message must not leak");
  assert.ok(!serialized.toLowerCase().includes("at "), "no stack trace must leak");
});

test("errorHandler: does nothing (delegates to Express) once headers are already sent", () => {
  const res = fakeRes();
  res.headersSent = true;
  let delegated;
  errorHandler(new AppError(500, "x", "x"), {}, res, (e) => { delegated = e; });
  assert.ok(delegated);
});