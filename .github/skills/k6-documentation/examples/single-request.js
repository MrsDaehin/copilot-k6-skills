import http from "k6/http";
import { check } from "k6";

export default function () {
  const res = http.get("https://httpbin.org/get");

  check(res, {
    "is status 200": (r) => r.status === 200,
    "has content-type": (r) => r.headers["Content-Type"].includes("application/json"),
  });

  console.log(`Request completed in ${res.timings.duration} ms`);
}
