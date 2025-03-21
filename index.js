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

// GET / - Render home page
app.get("/", (request, response) => {
    response.render("index");
});

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login", { error: null });
});

// POST /login - Authenticate user
app.post("/login", async (request, response) => {
    const { email, password } = request.body;
    const user = USERS.find(u => u.email === email);

    if (user && await bcrypt.compare(password, user.password)) {
        request.session.user = user;
        return response.redirect("/landing");
    }
    response.render("login", { error: "Invalid email or password. Please try again!" });
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    response.render("signup", { error: null });
});

// POST /signup - Register new user
app.post("/signup", async (request, response) => {
    const { username, email, password } = request.body;

    if (USERS.some(u => u.email === email || u.username === username)) {
        return response.render("signup", { error: "Email or username already exists!" });
    }

    if (password.length < 8) {
        return response.render("signup", { error: "Password must be at least 8 characters long!" });
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

    request.session.user = newUser;
    response.redirect("/landing");
});

// GET /landing - Render landing page
app.get("/landing", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/login");
    }

    const user = request.session.user;
    if (user.role === "admin") {
        response.render("landing", { user, users: USERS });
    } else {
        response.render("landing", { user, users: null });
    }
});

// GET /logout - Logout user
app.get("/logout", (request, response) => {
    request.session.destroy(() => {
        response.redirect("/");
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});