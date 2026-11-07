// tests/landing/proxyLanding.test.ts
import { describe, it, expect } from "vitest";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";

describe("Proxy landing and role redirects", () => {
  const secret = new TextEncoder().encode("test-secret-key-that-is-at-least-32-chars-long");
  process.env.JWT_SECRET = "test-secret-key-that-is-at-least-32-chars-long";

  async function createToken(role: string) {
    return new SignJWT({ userId: "u-123", email: `${role}@academy.com`, role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(secret);
  }

  it("allows unauthenticated visitor to access landing page '/' without redirect", async () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = await proxy(req);

    // Should not redirect to /login
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows unauthenticated visitor to access /api/sports/public without redirect", async () => {
    const req = new NextRequest("http://localhost:3000/api/sports/public");
    const res = await proxy(req);

    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated visitor from protected route /coach to /login", async () => {
    const req = new NextRequest("http://localhost:3000/coach");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirects unauthenticated visitor from protected route /admin to /login", async () => {
    const req = new NextRequest("http://localhost:3000/admin");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirects authenticated coach from '/' to '/coach'", async () => {
    const token = await createToken("coach");
    const req = new NextRequest("http://localhost:3000/", {
      headers: { cookie: `token=${token}` },
    });
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/coach");
  });

  it("redirects authenticated coach from '/admin' to '/coach'", async () => {
    const token = await createToken("coach");
    const req = new NextRequest("http://localhost:3000/admin", {
      headers: { cookie: `token=${token}` },
    });
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/coach");
  });

  it("redirects authenticated coach from '/coach/sports' to '/coach' (sports section removed)", async () => {
    const token = await createToken("coach");
    const req = new NextRequest("http://localhost:3000/coach/sports", {
      headers: { cookie: `token=${token}` },
    });
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/coach");
  });

  it("redirects authenticated admin from '/' to '/admin'", async () => {
    const token = await createToken("admin");
    const req = new NextRequest("http://localhost:3000/", {
      headers: { cookie: `token=${token}` },
    });
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/admin");
  });

  it("allows authenticated admin to access '/admin' without redirect", async () => {
    const token = await createToken("admin");
    const req = new NextRequest("http://localhost:3000/admin", {
      headers: { cookie: `token=${token}` },
    });
    const res = await proxy(req);

    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects authenticated player from '/' to '/player'", async () => {
    const token = await createToken("player");
    const req = new NextRequest("http://localhost:3000/", {
      headers: { cookie: `token=${token}` },
    });
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/player");
  });
});
