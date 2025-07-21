import app from "./app";

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
