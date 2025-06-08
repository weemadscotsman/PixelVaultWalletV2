/**
 * Simple WebSocket Connection Test
 * Tests if the frontend can connect to the WebSocket server
 */

console.log('Testing WebSocket connection...');

// Determine the WebSocket URL
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;

console.log('Attempting to connect to:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.onopen = function(event) {
    console.log('✅ WebSocket connection successful!');
    console.log('Connection event:', event);
    
    // Send a test message
    ws.send(JSON.stringify({
        type: 'test',
        message: 'Hello from frontend test'
    }));
};

ws.onmessage = function(event) {
    console.log('📨 Message received:', event.data);
    try {
        const data = JSON.parse(event.data);
        console.log('Parsed message:', data);
    } catch (e) {
        console.log('Raw message (not JSON):', event.data);
    }
};

ws.onclose = function(event) {
    console.log('❌ WebSocket connection closed');
    console.log('Close event:', event);
    console.log('Was clean:', event.wasClean);
    console.log('Code:', event.code);
    console.log('Reason:', event.reason);
};

ws.onerror = function(error) {
    console.error('🔥 WebSocket error:', error);
};

// Test for 10 seconds then close
setTimeout(() => {
    console.log('Test complete, closing connection');
    ws.close();
}, 10000);