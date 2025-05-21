import * as websocket from './websocket';

let miningState = {
  blocksMined: 0,
  lastTick: Date.now()
};

export function tickMining() {
  miningState.blocksMined += 1;
  miningState.lastTick = Date.now();
  websocket.emitMiningTick(miningState);
}