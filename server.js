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

// Ledger of all avatars: { [socket.id]: { ...avatarData } }
const avatars = {};

// --- Ledger of movable titles ---
// Match your client initial positions/config!
const titles = {
    sphagnopsida: {
        id: 'sphagnopsida',
        x: 254,
        y: 84,
        currentZoneIndex: 1,
        carriedBy: null, // socket.id if carried
        teamColor: null,
    },
    takakia: {
        id: 'takakia',
        x: 205,
        y: 80,
        currentZoneIndex: 2,
        carriedBy: null,
        teamColor: null,
    },
};

// Handle new connections
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // --- Avatars ---
    socket.on('join', (data) => {
        avatars[socket.id] = {
            ...data,
            id: socket.id // so frontend can identify self
        };
        io.emit('avatars', Object.values(avatars));
        io.emit('titles', Object.values(titles)); // Send titles to newly connected client
    });

    socket.on('move', (data) => {
        if (avatars[socket.id]) {
            avatars[socket.id] = {
                ...avatars[socket.id],
                ...data
            };
            io.emit('avatars', Object.values(avatars));
        }
    });

    // --- Titles: position/ownership update ---
    socket.on('titleMove', (data) => {
        const { titleId, x, y, currentZoneIndex, carriedBy, teamColor } = data;

        if (titles[titleId]) {
            titles[titleId] = {
                ...titles[titleId],
                x,
                y,
                currentZoneIndex,
                carriedBy, // should be a socket.id or null
                teamColor,
            };
            io.emit('titles', Object.values(titles));
        }
    });

    // --- Clean up on disconnect ---
    socket.on('disconnect', () => {
        delete avatars[socket.id];
        io.emit('avatars', Object.values(avatars));

        // Drop any titles this player was carrying
        let updated = false;
        Object.values(titles).forEach(title => {
            if (title.carriedBy === socket.id) {
                title.carriedBy = null;
                updated = true;
            }
        });
        if (updated) {
            io.emit('titles', Object.values(titles));
        }

        console.log('Client disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});

