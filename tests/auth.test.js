const { describe, it } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");

describe("Auth — Segurança e Hashing de Senhas", () => {
  it("Gera hash seguro com bcrypt e verifica com sucesso", async () => {
    const password = "my_secure_password_123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    assert.notStrictEqual(password, hash);
    assert.ok(hash.startsWith("$2a$") || hash.startsWith("$2b$"));

    const valid = await bcrypt.compare(password, hash);
    assert.strictEqual(valid, true);

    const invalid = await bcrypt.compare("wrong_password", hash);
    assert.strictEqual(invalid, false);
  });
});
