const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");

// @route           GET api/auth
// @description     Test route
// @access          Public
router.get("/", auth, async (req, res) => {
  // add auth here (add the middleware to protected route)
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
// @route           POST api/auth
// @description     Authenticat user & get token
// @access          Public
router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "passwor is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      // See if user exists
      let user = await User.findOne({ email: email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] }); // add return here just to stop proceed the function after the error has been catched
      }
      // match the password
      const isMatch = await bcrypt.compare(password, user.password)
      if(!isMatch){
        return res
        .status(400)
        .json({ errors: [{ msg: "Invalid credentials" }] }); // add return here just to stop proceed the function after the error has been catched
      }
      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id, // we don't need to write it as (user._id)
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
