const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Carrossel Virtualizado e Janela Deslizante (Sliding Window)", () => {
  const BUFFER_LEFT = 1;
  const BUFFER_RIGHT = 2;

  function computeRange(scrollLeft, clientWidth, stride, total) {
    if (stride <= 0 || total <= 0) {
      return { start: 0, end: total };
    }
    if (total <= 6) {
      return { start: 0, end: total };
    }

    const visibleCount = Math.max(1, Math.ceil(clientWidth / stride));
    const firstVisible = Math.max(0, Math.floor(scrollLeft / stride));
    const lastVisible = Math.min(total - 1, firstVisible + visibleCount - 1);

    const start = Math.max(0, firstVisible - BUFFER_LEFT);
    const end = Math.min(total, lastVisible + 1 + BUFFER_RIGHT);

    return { start, end };
  }

  it("Renderiza lista curta (<= 6 itens) de forma completa sem descartar itens", () => {
    const range = computeRange(0, 1000, 200, 5);
    assert.strictEqual(range.start, 0);
    assert.strictEqual(range.end, 5);
  });

  it("Cenário Inicial: 5 cards visíveis carregam 7 itens em memória (0 a 6)", () => {
    // 5 cards visíveis cabem na largura de 1000px com stride 200px (1000 / 200 = 5)
    // scrollLeft = 0 => firstVisible = 0, lastVisible = 4
    // start = max(0, 0 - 1) = 0
    // end = min(15, 4 + 1 + 2) = 7
    const range = computeRange(0, 1000, 200, 15);
    assert.strictEqual(range.start, 0);
    assert.strictEqual(range.end, 7);

    const renderedCount = range.end - range.start;
    assert.strictEqual(renderedCount, 7, "Deve manter exatamente 7 itens montados no estado inicial");
  });

  it("Avanço de 1 item: item 0 NÃO é descartado (permanece no buffer esquerdo)", () => {
    // scrollLeft = 200 => firstVisible = 1
    // start = max(0, 1 - 1) = 0
    // end = min(15, 5 + 1 + 2) = 8
    const range = computeRange(200, 1000, 200, 15);
    assert.strictEqual(range.start, 0, "Item 0 deve ser mantido no buffer esquerdo");
    assert.strictEqual(range.end, 8, "Item 7 deve ser pré-carregado no buffer direito");
  });

  it("Avanço de 2 itens: item 0 é descartado e substituído por slot leve", () => {
    // scrollLeft = 400 => firstVisible = 2
    // start = max(0, 2 - 1) = 1 (item 0 descartado!)
    // end = min(15, 6 + 1 + 2) = 9
    const range = computeRange(400, 1000, 200, 15);
    assert.strictEqual(range.start, 1, "Item 0 deve ser descartado ao afastar-se 2 posições");
    assert.strictEqual(range.end, 9, "Buffer direito deve avançar para o item 8");
  });

  it("Retorno de 1 item: item 0 é restaurado instantaneamente", () => {
    // Volta de scrollLeft = 400 para scrollLeft = 200 => firstVisible = 1
    const range = computeRange(200, 1000, 200, 15);
    assert.strictEqual(range.start, 0, "Item 0 deve voltar a ser montado no buffer");
  });

  it("Limites da lista: não ultrapassa o total de itens nem valores negativos", () => {
    const total = 10;
    // Posição no final da lista
    const rangeEnd = computeRange(2000, 1000, 200, total);
    assert.ok(rangeEnd.end <= total, "End não deve ultrapassar o total de itens");
    assert.ok(rangeEnd.start >= 0, "Start não deve ser negativo");
  });
});
