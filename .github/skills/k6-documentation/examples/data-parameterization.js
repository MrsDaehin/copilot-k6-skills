import http from "k6/http";
import { check } from "k6";
import { SharedArray } from "k6/data";
import papaparse from "https://jslib.k6.io/papaparse/5.1.1/index.js";

const data = new SharedArray("user-data", function () {
  return papaparse
    .parse(open("./data/users.csv"), { header: true })
    .data.filter(Boolean);
});

export default function () {
  const user = data[__VU % data.length];
  const res = http.post("https://httpbin.org/post", JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
