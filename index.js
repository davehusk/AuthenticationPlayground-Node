const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("adminPassword", 10), // Hashed password
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("userPassword", 10), // Hashed password
        role: "user",
    },
];

// Middleware to pass session messages to views
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

// GET / - Render home page
app.get("/", (req, res) => {
    res.render("index");
});

// GET /login - Render login form
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// POST /login - Authenticate user
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = USERS.find(u => u.email === email);

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        req.session.message = { type: "success", text: "Login successful! Welcome back." };
        return res.redirect("/landing");
    }
    res.render("login", { error: "Invalid email or password. Please try again!" });
});

// GET /signup - Render signup form
app.get("/signup", (req, res) => {
    res.render("signup", { error: null });
});

// POST /signup - Register new user
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    if (USERS.some(u => u.email === email || u.username === username)) {
        return res.render("signup", { error: "Email or username already exists!" });
    }

    if (password.length < 8) {
        return res.render("signup", { error: "Password must be at least 8 characters long!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: USERS.length + 1,
        username,
        email,
        password: hashedPassword,
        role: "user",
    };
    USERS.push(newUser);

    req.session.user = newUser;
    req.session.message = { type: "success", text: "Signup successful! Welcome to the app." };
    res.redirect("/landing");
});

// GET /landing - Render landing page
app.get("/landing", (req, res) => {
    if (!req.session.user) {
        req.session.message = { type: "error", text: "Please log in to access this page." };
        return res.redirect("/login");
    }

    const user = req.session.user;
    if (user.role === "admin") {
        res.render("landing", { user, users: USERS });
    } else {
        res.render("landing", { user, users: null });
    }
});

// GET /logout - Logout user
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});