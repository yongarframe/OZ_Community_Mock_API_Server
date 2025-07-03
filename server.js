const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const users = require("./users.js");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, "posts.json");

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["OPTIONS", "POST", "GET", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));

// 데이터 초기화
let postId = 1;
let posts = [];

const secretKey = "ozcodingschool";

// 클라이언트에서 post 요청을 받은 경우
app.post("/", (req, res) => {
  const { email, password } = req.body;
  // console.log(userId, userPassword);
  const userInfo = users.find(
    (el) => el.user.email === email && el.user.password === password
  );

  // 유저정보가 없는 경우
  if (!userInfo) {
    res.status(401).send("로그인 실패");
  } else {
    const accessToken = jwt.sign({ email: userInfo.user.id }, secretKey, {
      expiresIn: 1000 * 60 * 5,
    });
    userInfo.access_token = accessToken;
    const { password, ...userWithoutPassword } = userInfo.user;
    const userInfoWithoutPassword = {
      ...userInfo,
      user: userWithoutPassword,
    };
    return res.json(userInfoWithoutPassword);
    // 1. 유저정보가 있는 경우 accessToken을 발급하는 로직을 작성하세요.(sign)
    // 이곳에 코드를 작성하세요.
    // 2. 응답으로 accessToken을 클라이언트로 전송하세요. (res.send 사용)
    // 이곳에 코드를 작성하세요.
  }
});

// 서버 시작 시 posts.json 로딩
if (fs.existsSync(DATA_PATH)) {
  const fileData = fs.readFileSync(DATA_PATH, "utf-8");
  posts = JSON.parse(fileData);
  if (posts.length > 0) {
    postId = Math.max(...posts.map((p) => p.id)) + 1;
  }
}

// 파일에 저장하는 함수
const savePostsToFile = () => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2), "utf-8");
};

app.post("/api/v1/community/posts/", (req, res) => {
  const data = req.body;
  console.log("📥 받은 게시글:", data);

  const response = {
    id: postId++,
    category: {
      id: data.category_id,
      name: data.category?.name || data.category_name || "",
    },
    author_id: 1,
    title: data.title,
    content: data.content,
    view_count: 0,
    is_visible: true,
    is_notice: false,
    attachments: data.attachments,
    images: data.images,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  posts.push(response);
  savePostsToFile();

  res.status(201).json(response);
});

app.get("/api/v1/community/posts", (req, res) => {
  res.json(posts);
});

app.get("/api/v1/community/posts/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
  }
  res.json(post);
});

// 게시글 수정
app.put("/api/v1/community/posts/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return res
      .status(404)
      .json({ message: "수정할 게시글을 찾을 수 없습니다." });
  }

  const data = req.body;

  const updatedPost = {
    ...posts[index],
    title: data.title,
    content: data.content,
    category: {
      id: data.category_id,
      name: data.category?.name || data.category_name || "",
    },
    attachments: data.attachments || [],
    images: data.images || [],
    updated_at: new Date().toISOString(),
  };

  posts[index] = updatedPost;
  savePostsToFile();

  res.json(updatedPost);
});

// 클라이언트에서 get 요청을 받은 경우
// app.get("/", (req, res) => {
//   const accessToken = req.headers.authorization.split(" ")[1];
//   const payload = jwt.verify(accessToken, secretKey);

//   const userInfo = users.find((el) => el.user.id === payload.email);
//   userInfo.access_token = accessToken;

//   return res.json(userInfo);
//   // 3. req headers에 담겨있는 accessToken을 검증하는 로직을 작성하세요.(verify)
//   // 이곳에 코드를 작성하세요.
//   // 4. 검증이 완료되면 유저정보를 클라이언트로 전송하세요.(res.send 사용)
//   // 이곳에 코드를 작성하세요.
// });

app.listen(PORT, () => {
  console.log(`✅ Mock 서버 실행 중: http://localhost:${PORT}`);
});
