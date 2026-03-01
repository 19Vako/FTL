const http = require("http");
const { URL } = require("url");
require('dotenv').config();

let inventory = [
  { id: 1, name: "Monitor", price: 500, qty: 10 }
];

let nextId = 2;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  res.setHeader("Content-Type", "application/json");

  // ===== GET =====
  if (method === "GET" && url.pathname === "/inventory") {
    const minPrice = url.searchParams.get("minPrice");

    let result = inventory;

    if (minPrice !== null) {
      const price = Number(minPrice);
      if (isNaN(price)) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "minPrice must be a number" }));
      }
      result = inventory.filter(item => item.price >= price);
    }

    res.writeHead(200);
    return res.end(JSON.stringify(result));
  }

  // ===== POST =====
  if (method === "POST" && url.pathname === "/inventory") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (
          !data.name ||
          typeof data.price !== "number" ||
          typeof data.qty !== "number"
        ) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Invalid input data" }));
        }

        const newItem = {
          id: nextId++,
          name: data.name,
          price: data.price,
          qty: data.qty
        };

        inventory.push(newItem);

        res.writeHead(201);
        res.end(JSON.stringify(newItem));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return;
  }

  // ===== PATCH =====
  if (method === "PATCH" && url.pathname.startsWith("/inventory/")) {
    const id = Number(url.pathname.split("/")[2]);
    const item = inventory.find(i => i.id === id);

    if (!item) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: "Item not found" }));
    }

    let body = "";
    req.on("data", chunk => (body += chunk));

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (data.id) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Cannot update id" }));
        }

        if (data.name !== undefined) item.name = data.name;
        if (data.price !== undefined) {
          if (typeof data.price !== "number") {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "price must be number" }));
          }
          item.price = data.price;
        }
        if (data.qty !== undefined) {
          if (typeof data.qty !== "number") {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "qty must be number" }));
          }
          item.qty = data.qty;
        }

        res.writeHead(200);
        res.end(JSON.stringify(item));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return;
  }

  // ===== DELETE =====
  if (method === "DELETE" && url.pathname.startsWith("/inventory/")) {
    const id = Number(url.pathname.split("/")[2]);
    const index = inventory.findIndex(i => i.id === id);

    if (index === -1) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: "Item not found" }));
    }

    inventory.splice(index, 1);

    res.writeHead(204);
    return res.end();
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on http://${process.env.HOSTNAME}:${process.env.PORT}`);
});