# 🤝 Contributing to NextPlate

> First of all, thank you for being a part of the Zero Waste revolution.

We follow a rigorous protocol to ensure the stability of the food redistribution grid. Please read these guidelines before contributing.

## 🛠️ Tech Stack
- **Frontend:** Next.js 15, Tailwind, Framer Motion, Lucide
- **Backend:** Node.js, Express, MongoDB
- **AI Engine:** Google Gemini (Multi-Key Pool)
- **Real-time:** Socket.IO, Firebase Cloud Messaging

## 🚀 Development Workflow

1. **Fork & Clone**
2. **Environment Setup**: Copy `.env.example` in both folders.
3. **Local Grid Launch**:
   ```bash
   # Run with Docker
   docker-compose up
   ```
4. **Manual Setup**:
   ```bash
   # Backend
   cd backend && npm install && npm run dev
   
   # Frontend
   cd dashboard && npm install && npm run dev
   ```

## 🧪 Testing Protocol
We maintain a high reliability score. All logic changes must be covered by tests.
```bash
cd backend && npm test
```

## 📜 Code Style
- Use **ES6+** syntax.
- Follow the **Espresso/Orange** design system for all UI.
- All functional components should use **TypeScript** (frontend).
- Maintain **ARIA labels** for accessibility.

## 📡 Pull Request Policy
- **Describe your impact**: Every PR must state how much "CO2e" it might indirectly save or how it improves the "Rescue Velocity".
- **Evidence**: Provide screenshots for UI changes.
- **Continuous Integration**: Ensure all GH Actions pass.

---
*NextPlate — Technology for a Sustainable Future.*
