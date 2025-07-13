// server.js
const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server
const server = http.createServer();

// Set up Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (adjust for production)
        methods: ["GET", "POST"]
    }
});

// Ledger of all avatars: { [socket.id]: { x, y, color, label, zoneIndex } }
const avatars = {};

// Handle new connections
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Client joins with initial avatar state
    socket.on('join', (data) => {
        avatars[socket.id] = {
            ...data,
            id: socket.id // so frontend can identify self
        };
        io.emit('avatars', Object.values(avatars));
    });

    // Client sends movement/state updates
    socket.on('move', (data) => {
        if (avatars[socket.id]) {
            avatars[socket.id] = {
                ...avatars[socket.id],
                ...data
            };
            io.emit('avatars', Object.values(avatars));
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        delete avatars[socket.id];
        io.emit('avatars', Object.values(avatars));
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});

