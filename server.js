
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");

// Load .env from the project folder
dotenv.config({
    path: path.join(__dirname, ".env")
});

const app = express();
const PORT = process.env.PORT || 5000;

// Temporary debugging (never print passwords or database credentials)
console.log("Admin username loaded:", process.env.ADMIN_USERNAME);
console.log(
    "Admin password loaded:",
    Boolean(process.env.ADMIN_PASSWORD)
);

// Check required environment variables
const requiredEnv = [
    "MONGODB_URI",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "SESSION_SECRET"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.error(`Missing ${key} in .env file`);
        process.exit(1);
    }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: "medicalcamp.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000
    }
}));

// Serve frontend files
app.use(express.static(__dirname));

// Registration schema
const registrationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 1,
        max: 120
    },
    contact: {
        type: String,
        required: true,
        match: /^\d{10}$/
    },
    camp: {
        type: String,
        required: true,
        enum: [
            "general-health",
            "eye-checkup",
            "womens-health"
        ]
    }
}, {
    timestamps: true
});

const Registration = mongoose.model(
    "Registration",
    registrationSchema
);

// Will be initialized once when the server starts
let adminPasswordHash;

// Middleware to protect admin routes
function requireAdmin(req, res, next) {
    if (req.session?.isAdmin !== true) {
        return res.status(401).json({
            success: false,
            message: "Admin login required."
        });
    }

    next();
}

// Test API
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Medical Camp API is running."
    });
});

// Check whether admin is logged in
app.get("/api/admin/session", (req, res) => {
    res.json({
        authenticated: req.session?.isAdmin === true
    });
});

// ADMIN LOGIN
app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid username and password."
            });
        }

        const usernameMatches =
            username === process.env.ADMIN_USERNAME;

        const passwordMatches = await bcrypt.compare(
            password,
            adminPasswordHash
        );

        // TEMPORARY DIAGNOSTICS
        console.log("Username matches:", usernameMatches);
        console.log("Password matches:", passwordMatches);

        if (!usernameMatches || !passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Regenerate session after successful login
        req.session.regenerate((err) => {
            if (err) {
                console.error("Session error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Could not create login session."
                });
            }

            req.session.isAdmin = true;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error(
                        "Session save error:",
                        saveError.message
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Could not save login session."
                    });
                }

                return res.json({
                    success: true,
                    message: "Admin login successful."
                });
            });
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An error occurred during login."
        });
    }
});

// ADMIN LOGOUT
app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Could not log out."
            });
        }

        res.clearCookie("medicalcamp.sid", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        return res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

// PUBLIC: Register for a camp
app.post("/api/registrations", async (req, res) => {
    try {
        const { name, age, contact, camp } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            !Number.isInteger(Number(age)) ||
            !/^\d{10}$/.test(String(contact ?? "")) ||
            ![
                "general-health",
                "eye-checkup",
                "womens-health"
            ].includes(camp)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid registration details."
            });
        }

        const numericAge = Number(age);

        if (numericAge < 1 || numericAge > 120) {
            return res.status(400).json({
                success: false,
                message: "Age must be between 1 and 120."
            });
        }

        const registration = await Registration.create({
            name: name.trim(),
            age: numericAge,
            contact: String(contact),
            camp
        });

        return res.status(201).json({
            success: true,
            message: "Registration completed successfully!",
            registration: {
                id: registration._id,
                name: registration.name,
                camp: registration.camp
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }
});

// ADMIN ONLY: View all registrations
app.get("/api/registrations", requireAdmin, async (req, res) => {
    try {
        const registrations = await Registration.find()
            .select("-__v")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: registrations.length,
            registrations
        });
    } catch (error) {
        console.error("Fetch error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not fetch registrations."
        });
    }
});

// ADMIN ONLY: View one registration
app.get("/api/registrations/:id", requireAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration ID."
            });
        }

        const registration = await Registration.findById(
            req.params.id
        ).select("-__v");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found."
            });
        }

        return res.json({
            success: true,
            registration
        });
    } catch (error) {
        console.error("Fetch error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not fetch registration."
        });
    }
});

// ADMIN ONLY: Update a registration
app.patch("/api/registrations/:id", requireAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration ID."
            });
        }

        const allowedFields = ["name", "age", "contact", "camp"];
        const updates = {};

        for (const field of allowedFields) {
            if (Object.hasOwn(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided."
            });
        }

        if (updates.name !== undefined) {
            if (
                typeof updates.name !== "string" ||
                !updates.name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid name."
                });
            }

            updates.name = updates.name.trim();
        }

        if (updates.age !== undefined) {
            if (
                !Number.isInteger(Number(updates.age)) ||
                Number(updates.age) < 1 ||
                Number(updates.age) > 120
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Age must be between 1 and 120."
                });
            }

            updates.age = Number(updates.age);
        }

        if (updates.contact !== undefined) {
            if (!/^\d{10}$/.test(String(updates.contact))) {
                return res.status(400).json({
                    success: false,
                    message: "Contact must contain 10 digits."
                });
            }

            updates.contact = String(updates.contact);
        }

        if (
            updates.camp !== undefined &&
            ![
                "general-health",
                "eye-checkup",
                "womens-health"
            ].includes(updates.camp)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid camp selection."
            });
        }

        const registration = await Registration.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select("-__v");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found."
            });
        }

        return res.json({
            success: true,
            message: "Registration updated successfully.",
            registration
        });
    } catch (error) {
        console.error("Update error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not update registration."
        });
    }
});

// ADMIN ONLY: Delete a registration
app.delete("/api/registrations/:id", requireAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration ID."
            });
        }

        const registration = await Registration.findByIdAndDelete(
            req.params.id
        );

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found."
            });
        }

        return res.json({
            success: true,
            message: "Registration deleted successfully."
        });
    } catch (error) {
        console.error("Delete error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not delete registration."
        });
    }
});

// Start server
async function startServer() {
    try {
        // Hash the password only once
        adminPasswordHash = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            12
        );

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Startup error:", error.message);
        process.exit(1);
    }
}

startServer();
