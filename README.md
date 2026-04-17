# Distributed Werewolf 🐺

A multiplayer Mafia/Werewolf game built with **Node.js**, **Express**, and **Socket.io** for real-time gameplay across distributed clients.

## Features

- 🎮 Real-time multiplayer gameplay
- 🌙 Day/Night phase system
- 🗳️ Dynamic voting mechanics
- 👥 Multiple player roles (Werewolves, Villagers, Special roles)
- 💬 Distributed game room management
- 📱 Web-based UI for easy access

## Tech Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Package Manager**: npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/siddhi3124distributed-werewolf.git
cd distributed-werewolf
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3000` by default.

## How to Play

1. Open the web application in your browser
2. Create a new game room or join an existing one
3. Wait for the minimum number of players to join
4. Game starts with role assignment
5. Follow the day/night cycle:
   - **Night Phase**: Werewolves choose a victim
   - **Day Phase**: All players vote to eliminate a suspect
6. Game ends when all werewolves or all villagers are eliminated

## Project Structure

```
distributed-werewolf/
├── game/
│   ├── constants.js       # Game rules and phases
│   ├── gameEngine.js      # Core game logic
│   ├── roomManager.js     # Room and player management
│   └── utils.js           # Utility functions
├── public/
│   ├── app.js             # Frontend logic
│   ├── index.html         # Main page
│   └── style.css          # Styling
├── server.js              # Express & Socket.io server
└── package.json           # Dependencies
```

## API & Game Events

### Socket.io Events

- `create_room` - Create a new game room
- `join_room` - Join an existing room
- `start_game` - Begin the game
- `submit_night_action` - Werewolf action during night
- `submit_day_vote` - Vote during day phase
- `leave_room` - Exit a room

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by Siddhi Suryavanshi

---

**Note**: This is a learning/hobby project. Enjoy!
