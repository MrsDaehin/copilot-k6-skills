import http from "k6/http";
import { sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export let options = {
  vus: 2,
  duration: "10s",
};

export default function () {
  const res = http.get("https://test.k6.io");
  console.log(`status: ${res.status}`);
  sleep(1);
}

export function handleSummary(data) {
  return {
    "html_summary_concount1.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
