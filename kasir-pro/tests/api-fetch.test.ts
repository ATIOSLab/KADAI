import test from "node:test";
import assert from "node:assert/strict";
import { apiFetch, ApiError } from "../src/lib/api";

/** Ganti fetch global dengan balasan buatan, lalu kembalikan seperti semula. */
async function withFetch(
  response: Response,
  run: () => Promise<void>
) {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => response) as typeof fetch;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}

test("balasan error dari proxy dibaca sebagai pesan yang bisa ditindaklanjuti", async () => {
  const html = "<!DOCTYPE html><html><body>502 Bad Gateway</body></html>";
  await withFetch(
    new Response(html, { status: 502, headers: { "Content-Type": "text/html" } }),
    async () => {
      await assert.rejects(
        () => apiFetch("/api/customers", { method: "POST", body: {} }),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 502);
          // Dulu pesannya "Failed to execute 'json' on 'Response': Unexpected token '<'"
          assert.match(error.message, /Server sedang sibuk atau sedang diperbarui/);
          assert.doesNotMatch(error.message, /Unexpected token|<!DOCTYPE/);
          return true;
        }
      );
    }
  );
});

test("pesan error JSON dari API dipakai apa adanya beserta kodenya", async () => {
  const body = JSON.stringify({
    success: false,
    error: "Tier keanggotaan tidak dikenal (BRONZE, SILVER, GOLD, PLATINUM)",
    code: "VALIDATION_ERROR",
  });
  await withFetch(
    new Response(body, { status: 400, headers: { "Content-Type": "application/json" } }),
    async () => {
      await assert.rejects(
        () => apiFetch("/api/customers", { method: "POST", body: {} }),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 400);
          assert.equal(error.code, "VALIDATION_ERROR");
          assert.match(error.message, /Tier keanggotaan tidak dikenal/);
          return true;
        }
      );
    }
  );
});

test("balasan sukses tanpa body tidak membuat halaman gagal", async () => {
  await withFetch(new Response("", { status: 200 }), async () => {
    const result = await apiFetch<{ ok?: boolean }>("/api/logout", { method: "POST" });
    assert.deepEqual(result, {});
  });
});

test("balasan sukses berisi JSON diteruskan utuh", async () => {
  await withFetch(
    new Response(JSON.stringify({ success: true, data: { id: "abc" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    async () => {
      const result = await apiFetch<{ data: { id: string } }>("/api/customers");
      assert.equal(result.data.id, "abc");
    }
  );
});
