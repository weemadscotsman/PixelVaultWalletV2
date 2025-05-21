export function emitTransaction(tx) {
  io.emit("tx:new", tx);
}

export function emitMiningTick(tickData) {
  io.emit("mining:tick", tickData);
}

export function emitThringletEvent(event) {
  io.emit("thringlet:emotion", event);
}