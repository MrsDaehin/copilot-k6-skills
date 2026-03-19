import crypto from "k6/crypto";

import encoding from "k6/encoding";

export const calculateHmac512 = (
  hmac512AppId,
  hmac512SharedKey,
  method,
  uri,
  body
) => {
  const requestUri = encodeURIComponent(uri).toLowerCase();
  const now = new Date();
  let requestTimeStamp = (now.getTime() - now.getMilliseconds()) / 1000;

  const signatureRawData = `${hmac512AppId}${method}${requestUri}${
    body === undefined ? "" : body
  }${requestTimeStamp}`;

  let hash = crypto.hmac("sha512", hmac512SharedKey, signatureRawData, "hex");

  let hashInBase64 = encoding.b64encode(hash);

  let auth =
    "ldx " + hmac512AppId + ":" + hashInBase64 + ":" + requestTimeStamp;

  return auth;
};

export const calculateHmac256BodyByteArray = (sharedKey, body) => {
  let hash = crypto.hmac("sha256", sharedKey, body, "hex");

  const hmacStringSeparated = hash
    .match(/.{1,2}/g)
    .join("-")
    .toUpperCase();

  return "sha256=" + hmacStringSeparated;
};