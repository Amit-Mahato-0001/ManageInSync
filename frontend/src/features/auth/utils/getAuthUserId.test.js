import assert from "node:assert/strict"

import { getAuthUserId } from "./getAuthUserId.js"

assert.equal(getAuthUserId({ _id: "mongo-id", userId: "legacy-id" }), "mongo-id")
assert.equal(getAuthUserId({ userId: "legacy-id" }), "legacy-id")
assert.equal(getAuthUserId({ id: "plain-id" }), "plain-id")
assert.equal(getAuthUserId(null), null)
assert.equal(getAuthUserId({}), null)

console.log("getAuthUserId tests passed")
