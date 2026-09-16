# NameOnMyMind

GitHub Pages에서 배포하는 정적 웹앱의 초기 골격입니다.

## 구조

```text
NameOnMyMind/
├── index.html
├── .nojekyll
└── assets/
    ├── css/
    │   └── styles.css
    └── js/
        └── app.js
```

## 로컬 실행

```bash
cd ~/Github/NameOnMyMind
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080`을 엽니다.

## GitHub Pages 배포

GitHub 저장소에 push한 뒤 저장소의 **Settings → Pages**에서
`Deploy from a branch`를 선택하고 `main / (root)`를 지정합니다.

현재는 빌드 과정이나 외부 프레임워크가 없는 순수 HTML/CSS/JS 구조입니다.
