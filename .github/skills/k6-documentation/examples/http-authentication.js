import http from "k6/http";
import { check } from "k6";

const BASE_URL = "https://httpbin.org";
const USER = "user";
const PASS = "pass";

export default function () {
  const res = http.get(`${BASE_URL}/basic-auth/${USER}/${PASS}`, {
    auth: `${USER}:${PASS}`,
  });

  check(res, {
    "authenticated": (r) => r.status === 200,
  });
}
