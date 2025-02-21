const express = require("express");
const { Sequelize, DataTypes, Op } = require("sequelize");
const cron = require("node-cron");
const path = require("path");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "database.sqlite"),
  logging: false, // Disable logging; set to true for debugging
});

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true, // Enables soft deletes by using deletedAt
  },
);

const Blog = sequelize.define(
  "Blog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true, // Enables soft deletes by using deletedAt
  },
);

sequelize
  .sync()
  .then(() => console.log("Database synced"))
  .catch((err) => console.error("Error syncing database:", err));

app.delete("/users/:id/bio", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();

    res.json({ message: "User bio soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting bio:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Soft Delete Blog
 * Endpoint: DELETE /blogs/:id
 */
app.delete("/blogs/:id", async (req, res) => {
  const blogId = req.params.id;

  try {
    const blog = await Blog.findByPk(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.destroy(); // Soft delete using Sequelize's paranoid feature

    res.json({ message: "Blog soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.findAll();
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//for simulation change it (* * * * *) and thirtyDaysAgo.getMinutes() - 1
cron.schedule("* * * * *", async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setMinutes(thirtyDaysAgo.getMinutes() - 1);
  console.log(
    `time: ${thirtyDaysAgo.setMinutes(thirtyDaysAgo.getMinutes() - 1)}`,
  );

  try {
    const deletedUsers = await User.destroy({
      where: {
        bio: null,
        deletedAt: {
          [Op.lte]: thirtyDaysAgo,
        },
      },
      force: true, // Forces hard delete
    });
    console.log(`Hard deleted ${deletedUsers} users`);

    const deletedBlogs = await Blog.destroy({
      where: {
        deletedAt: {
          [Op.lte]: thirtyDaysAgo,
        },
      },
      force: true, // Forces hard delete
    });
    console.log(`Hard deleted ${deletedBlogs} blogs`);
  } catch (error) {
    console.error("Error during hard delete:", error);
  }
});

app.post("/users", async (req, res) => {
  const { name, bio } = req.body;

  try {
    const newUser = await User.create({ name, bio });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/blogs", async (req, res) => {
  const { body } = req.body;

  try {
    const newBlog = await Blog.create({ body });
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
