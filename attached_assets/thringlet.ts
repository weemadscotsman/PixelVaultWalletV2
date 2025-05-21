import * as websocket from './websocket';

export async function pingThringlet(thringletId, signal) {
  // logic here...
  websocket.emitThringletEvent({ id: thringletId, signal });
}