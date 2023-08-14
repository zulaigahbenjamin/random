// const express = require("express");
// const app = express();
// const mysql = require("mysql2");
// const bcrypt = require('bcrypt');
// require("dotenv").config();
// const port = 4008;







// const db = mysql.createPool({
//     connectionLimit: 100,
//     host: "127.0.0.1",       // This is your localhost IP
//     user: "root",            // User for the database
//     password: "zulaigahbenjamin",  // Password for the user
//     database: "userdb",      // Database name
//     port: 4008             // Port number, "3306" by default
// });

// app.use(express.json());

// app.post('/createUser', async (req, res) => {
//     const user = req.body.name;
//     const password = req.body.password;

//     if (!user || !password) {
//         return res.status(400).send("Name and password are required.");
//     }
//     const hashedPassword = await bcrypt.hash(req.body.password, 10);

//     const sqlSearch = "SELECT * FROM userTable WHERE user = ?";
//     const search_query = mysql.format(sqlSearch, [user]);

//     const sqlInsert = "INSERT INTO userTable VALUES (0, ?, ?)";
//     const insert_query = mysql.format(sqlInsert, [user, hashedPassword]);

//     db.getConnection(async (err, connection) => {
//         if (err) {
//             console.error("Error connecting to database:", err);
//             return;
//         }

//         connection.query(search_query, async (err, result) => {
//             if (err) {
//                 connection.release();
//                 console.error("Error executing query:", err);
//                 res.sendStatus(500); // Internal Server Error
//                 return;

//             }

//             console.log("------> Search Results");
//             console.log(result.length);

//             if (result.length !== 0) {
//                 connection.release();
//                 console.log("------> User already exists");
//                 res.sendStatus(409);
//             } else {
//                 connection.query(insert_query, (err, result) => {
//                     connection.release();
//                     if (err) throw err;
//                     console.log("--------> Created new User");
//                     console.log(result.insertId);
//                     res.sendStatus(201);
//                 });
//             }
//         });
//     });
// });

// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });

const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const express = require('express');
const jwt = require('jsonwebtoken'); // Import jwt module
const router = express.Router();
const User = require('./models/user'); // Import the User model

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({ message: "user registered successfully" });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, 'your-secret-key', {
            expiresIn: '1h',
        });
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json({ message: 'logged in successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.post('/logout', (req,res) => {
    res.clearCookie('token');
    res.status(200).json({message: 'logged out !'});
});



router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email }); // Corrected typo "fineOne" to "findOne"
        if (!user) {
            return res.status(404).json({ error: 'User not found' }); // Moved this line up
        }

        const resetToken = Math.random().toString(36).substring(2, 10);
        user.resetToken = resetToken; // Assign the reset token to the user
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'zulaigahbenjamin01@gmail.com', // Your Gmail email address
                pass: 'Laigahbee.03', // Your Gmail password or an app-specific password
            },
        });
        

        const mailOptions = {
            from: 'zulaigah@gmail.com',
            to: email,
            subject: 'Password Reset',
            html: `<p>Click <a href="http://localhost:3000/reset/${resetToken}">here</a> to reset your password</p>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Error while sending email' });
            }
            console.log('Email Sent:', info.response);
            res.status(200).json({ message: 'Password reset email sent' });
        });

    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

module.exports = router;


