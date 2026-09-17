---

```markdown
# URL Shortener API

A simple and scalable REST API for shortening long URLs into compact links with visit tracking.

## 🚀 Features (v1)

- Create short URLs from long links
- Fast redirection using 6-character alphanumeric codes
- Track visit count and last visited timestamp
- Input validation and proper error handling
- Clean folder structure (Controller-Service-Route pattern)

## 🛠 Tech Stack

- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Language:** JavaScript (ES6+)

## 📁 Project Structure

```
url-shortener/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── app.js
├── server.js
├── .env
└── package.json
```

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd url-shortener
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/urlshortener
BASE_URL=http://localhost:3000
```

### 4. Run the server

```bash
npm start
```

## 📌 API Endpoints (v1)

| Method | Endpoint                        | Description                    |
|--------|----------------------------------|--------------------------------|
| POST   | `/api/shorten`                   | Create a short URL             |
| GET    | `/:code`                         | Redirect to original URL       |
| GET    | `/api/shorten/:code/stats`       | Get statistics of a short URL  |

## 📝 Notes

- This is **Version 1 (MVP)** focused on core functionality.
- Future versions will include Redis caching, user authentication, and analytics improvements.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
```

---

Would you like me to also create a **simpler/minimal version** or add sections like **Contributing**, **Testing**, or **Docker support**?