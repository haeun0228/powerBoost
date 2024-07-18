## 게시판 만들기 (2)

# 🔐로그인, 로그아웃, 회원가입 기능 구현

### 1. user model 생성

user 스키마에는 usernId, password을 만들어 주었고 userId는 `unique: true`로 설정해주었다.

password를 저장할 암호화 라이브러리는 **bcryptjs**를 사용했다.

- bycrypt는 Blowfish 암호를 기반으로 한 EksBlowfish 해시 함수를 사용한다.
- Eks는 expensive key schedule을 의미한다. 즉, 키 스케쥴링 과정이 매우 느리기 때문에 공격자가 해시를 역산하거나 brute force하기 어렵게 만든다.
- bycrpyt는 salt 값도 설정하기 때문에 공격이 더욱 힘드게 만든다.
- `npm install bcryptjs`

`pre(’save’)` : Mongoose에서 문서가 저장되기 전에 특정 작업을 수행할 수 있게 한다. 이를 사용해서 DB에 비밀번호를 저장하기 전에 암호화를 수행할 수 있다.

```jsx
userSchema.pre("save", async function (next) {
  //이미 해싱된 비밀번호는 넘어간다.
  if (!this.isModified("password")) {
    return next();
  }
  //비밀번호 해싱
  const salt = await bycrpt.genSalt(10);
  this.password = await bycrypt.hash(this.password, salt);
  next();
});
```

입력한 비밀번호와 암호화된 비밀번호 비교하는 인스턴스 메소드를 생성했다.

```jsx
//비밀번호 확인
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

### 2. JWT 발급 및 사용

JWT : JSON Web Token

- header.payload.signature 로 구성되어 있다.
- signature를 통해 위변조를 방지한다.

`npm install jsonwebtoken`

JWT 발급 함수

```jsx
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "3d", // 토큰의 유효 기간 3일
  });
};

export default generateToken;
```

인증 미들웨어 생성

사용자가 인증되었는지 확인하는 과정.

```jsx
const protect = asyncHandler(async (req, res, next) => {
  let token;

  //토큰이 Authorization 헤더에 있는지 확인
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 토큰을 'Bearer' 이후의 부분에서 추출
      token = req.headers.authorization.split(" ")[1];
      // 추출한 토큰을 JWT_SECRET으로 검증하여 디코딩
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // 디코딩된 정보에서 사용자 ID를 사용하여 사용자 정보 가져오기
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});
```

# 🔐 본인의 게시물과 댓글만 수정 및 삭제하도록 제한

app.js에서 인증 미들웨어를 불러온다.

`import { protect } from './middleware/authMiddleware.js'`

⇒ 이제 req.user로 인증된 사용자의 정보에 접근할 수 있다.

게시물 생성할 때, 작성한 사용자의 id 값을 user라는 이름으로 저장하도록 한다.

```jsx
// 게시물 생성
app.post(
  "/posts",
  protect,
  asyncHandler(async (req, res) => {
    const newPost = await Post.create({ ...req.body, user: req.user._id });
    res.status(201).send(newPost);
  })
);
```

게시물을 수정하거나 삭제할 때, request하는 사용자의 id 값이랑 게시물에 기록된 사용자 id 값 (user)와 비교해서 검증을 한다.

```jsx
// 게시물 수정하기
app.patch(
  "/posts/:postId",
  protect,
  asyncHandler(async (req, res) => {
    const id = req.params.postId;
    const post = await Post.findById(id);
    if (post) {
      if (post.user.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .send({ message: "You cna only edit your post." });
      }
      Object.keys(req.body).forEach((key) => {
        post[key] = req.body[key];
      });
      await post.save();
      res.send(post);
    } else {
      res.status(404).send({ message: "Post not found." });
    }
  })
);
```

# ⚠️문제

나는 설정한 적이 없는데, DELETE나 PUT, PATCH 등의 메소드 사용을 서버에서 허용하지 않았다.

⇒ 아직 해결 못함.. 😢

# 💫 회고

- 인증 토큰 부분이 제일 어려웠다. 한 번 더 복습해야 할 것 같다.
- 웹 해킹 공부하면서 이해가 안 됐던 것들이 백엔드 공부하면서 서서히 이해가 되기 시작했다. 신기하다!!
  - 예를 들어, burp suite로 RESTFUL한 사이트에 PUT이나 PATCH 패킷을 보낼 때면 항상 `Content-Type: application/json` 을 꼭 적어줘야 했는데, 이걸 왜 적는지도 모르고 그냥 했었다.. 이걸 안 적으면 걍 서버가 json으로 해석을 못하는 것이었다!
  - 열심히 공부하다보면 시큐어 코딩을 마스터할 수 있지 않을까 기대해본다 !
- password 저장할 때 사용할 암호화 라이브러리를 공부할 때가 제일 재밌었다 ㅎㅎ
- 일주일만에 기초 서버 구현, DB 연동을 공부하고 실습하고 정리하려니 시간이 좀 부족했다.. OTL 다음주까지 빡세게 하면 어느정도 빵꾸를 해결할 수 있을 듯하다.
- 저번주에 requirements.txt, post men, DB ERD를 작성하라고 하셨는데, 시간이 부족해서 작성하지 못했다. ㅠㅠ 다음주에는 꼭 작성하겠슴다!
