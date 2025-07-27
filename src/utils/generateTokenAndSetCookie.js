import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
    res.cookie("panneaux", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // false en dev
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};


// import jwt from "jsonwebtoken";

// export const generateTokenAndSetCookie = (res, userId) => {
//   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });


