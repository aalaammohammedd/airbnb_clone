require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cookieParser = require("cookie-parser");
const messageRoutes = require("./routes/message.routes");
const { initializeSocket } = require("./socket");
const http = require("http");

// Routes
const userRoute = require("./routes/user.routes");
const mailRoute = require("./routes/mail.routes");
const listingRoute = require("./routes/listing.routes");
const reviewRoute = require("./routes/review.routes");
const bookingRoute = require("./routes/booking.routes");
const paymentRoute = require("./routes/payment.routes");
const amenityRoute = require("./routes/amenity.routes");
const wishlistRoute = require("./routes/wishlist.routes");
const experienceRoutes = require("./routes/experience.routes");
const serviceRoutes = require("./routes/service.routes");
const recentlyViewedRoute = require("./routes/recentlyViewed.routes");
const reportRoute = require("./routes/report.routes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);
const port = process.env.PORT || 3000;

//CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4200",
      "http://localhost:4000",
    ], // frontend origin
    credentials: true, // allow cookies
  })
);
// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.set("view engine", "ejs");
app.set("io", io);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb Clone API",
      version: "1.0.0",
      description: "API documentation for Airbnb clone project",
    },
    servers: [
      {
        url: "http://localhost:" + port + "/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"], // scan all route files for @swagger comments
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api", userRoute);
app.use("/api/mail", mailRoute);
app.use("/api", listingRoute);
app.use("/api/amenity", amenityRoute);
app.use("/api", bookingRoute);
app.use("/api", paymentRoute);
app.use("/api", reviewRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/recently-viewed", recentlyViewedRoute);
app.use("/api/reports", reportRoute);
app.use("/api/experiences", experienceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/messages", messageRoutes);

// Root route
app.get("/api", (req, res) => {
  res.render("index.ejs");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Error handling for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

// Start server
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
