import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: 10,
  duration: "30s",
};

export default function () {
  const res = http.get("https://test.k6.io");

  check(res, {
    "status is 200": (r) => r.status === 200,
    "body size > 100": (r) => r.body.length > 100,
  });

  sleep(1);
}
