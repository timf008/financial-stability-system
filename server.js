import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("financial-stability-system backend is running.");
});

app.listen(PORT, () => {
  console.log(`financial-stability-system running on port ${PORT}`);
});
