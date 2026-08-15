[![cover](images/cover.png)](SUMMARY.md)

# 가장 쉬운 함수형 프로그래밍 가이드 (한국어판)

## 책 소개

이 책은 일반적인 함수형 프로그래밍 패러다임에 대한 책입니다. 우리는 세계에서 가장 유명한 함수형 언어인 '자바스크립트'를 사용할 것입니다. 현재의 자바스크립트 관련 문화가 주로 명령형(imperative) 패러다임이기 때문에, 이런 선택이 조금은 잘못된 것 아닌가 하고 느낄지도 모르겠습니다. 하지만 다음과 같은 이유로, 저는 자바스크립트를 활용하는 것이 FP를 배우는 데 가장 좋은 선택이 될 수 있다고 믿습니다.

- **매일 업무에 자바스크립트를 사용하고 있는 프로그래머가 많습니다.**  
  따라서 소수만 좋아하는 함수형 프로그래밍 언어로 자잘한 토이 프로젝트에나 적용해 보는 대신, 실전에서 매일매일 자신이 배운 함수형 프로그래밍 지식을 적용하고 연습할 수 있습니다.

- **프로그램을 작성하기 위해 필요한 여러 가지 다른 내용을 다시 배울 필요가 없습니다.**  
  순수 함수형 언어에서는 모나드(monad)의 도움 없이 변수의 로그를 찍어보거나 DOM 노드를 읽어볼 수 없습니다. 하지만 자바스크립트에서는 코드베이스를 깔끔하게 유지하면서도 필요할 때 그런 기능을 살짝살짝 사용할 수 있습니다. 또한 자바스크립트가 다양한 패러다임을 지원하기 때문에, 잘 모르는 부분이 있다면 최후의 수단으로 기존의 방식을 활용해 문제를 해결할 수도 있습니다.

- **자바스크립트는 최상급의 함수형 코드를 작성할 수 있는 모든 기능을 완전히 지원합니다.**  
  소수의 라이브러리만 추가하면 하스켈(Haskell)이나 스칼라(Scala)와 같은 언어가 제공하는 기능을 흉내 낼 수 있는 모든 특징을 활용할 수 있습니다. 객체 지향 프로그래밍이 현재 업계를 지배하고 있지만, 자바스크립트의 OOP는 분명 약간 이상합니다. 이는 마치 구두 위에 고무 덧신을 신고 탭댄스를 추는 것과 같습니다. `this`가 부지불식간에 바뀌지 않도록 `bind`를 여기저기서 사용해야 하며, 클로저(closure)를 통해서만 private 멤버를 온전히 캡슐화할 수 있습니다. 일반적인 프로그래머에게 이보다는 FP(함수형 프로그래밍)가 훨씬 더 자연스럽습니다.

정적 타입을 제공하는 함수형 언어가 의심할 여지 없이 이 책에서 설명하는 스타일로 코딩하는 가장 좋은 환경일 것입니다. 자바스크립트는 단지 함수형 패러다임을 배우는 수단일 뿐이며, 그 패러다임을 적용하는 것은 여러분에게 달려있습니다. 운 좋게도 함수형 패러다임에 접근하는 경로는 수학적이며, 따라서 어디에서든 통할 수 있습니다. 이 책을 다루고 나면 Swiftz, Scalaz, Haskell, PureScript 등을 막론하고 편안함을 느낄 수 있을 것입니다.

---

## 코드와 함께 실습하기

책에 나오는 여러 가지 개념들을 직접 실행하고 조작해 보세요. 처음에는 이해하기 힘들더라도 코드를 만져보면서 점차 이해하게 될 것입니다.
이 책에 나온 모든 함수와 대수적 자료구조들은 부록에 정리되어 있으며 npm 모듈로도 제공됩니다.

```bash
$ pnpm add @mostly-adequate/support
# 또는 npm i @mostly-adequate/support
```

각 장의 연습문제 또한 로컬 환경의 에디터에서 직접 풀고 테스트할 수 있습니다! 예를 들어 `exercises/ch04`의 `exercise_*.js`를 수정한 후 다음 명령어로 정답을 검증하세요.

```bash
$ cd exercises
$ pnpm install
$ pnpm run ch04
```

전체 연습문제 정답 테스트:
```bash
$ cd exercises
$ pnpm test
```

---

## 전자책(PDF) 생성 및 로컬 실행

### 한국어판 PDF 생성하기

이 프로젝트는 최신 Node.js 환경에서 동작하는 Puppeteer 기반의 고품질 PDF 생성 스크립트를 내장하고 있습니다.

```bash
# 1. 저장소 클론
$ git clone https://github.com/MostlyAdequate/mostly-adequate-guide-kr.git
$ cd mostly-adequate-guide-kr

# 2. 의존성 설치
$ pnpm install

# 3. PDF 빌드 (루트에 mostly-adequate-guide-kr.pdf 생성)
$ pnpm run generate-pdf
```

### 마크다운 무결성 테스트 실행

```bash
$ pnpm test
```

---

# 목차

전체 목차 및 각 챕터 바로가기는 **[SUMMARY.md](SUMMARY.md)**를 참조하세요.

- **[01 장: 우리는 무엇을 하고 있나?](ch01-kr.md)**
- **[02 장: 일급 함수](ch02-kr.md)**
- **[03 장: 순수 함수와 순수한 기쁨을](ch03-kr.md)**
- **[04 장: 커링](ch04-kr.md)**
- **[05 장: 합성으로 코딩하기](ch05-kr.md)**
- **[06 장: 예제 애플리케이션](ch06-kr.md)**
- **[07 장: 힌들리-밀너와 나](ch07-kr.md)**
- **[08 장: 터퍼웨어 (Tupperware)](ch08-kr.md)**
- **[09 장: 모나드라는 이름의 양파](ch09-kr.md)**
- **[10 장: 어플리카티브 펑터](ch10-kr.md)**
- **[11 장: 다시 변환하기, 자연스럽게](ch11-kr.md)**
- **[12 장: 트래버싱 더 스톤](ch12-kr.md)**
- **[13 장: 모노이드가 모든 것을 하나로 묶다](ch13-kr.md)**
- **[부록 A: 필수 함수 지원](appendix_a.md)**
- **[부록 B: 대수적 구조 지원](appendix_b.md)**
- **[부록 C: 포인트프리 유틸리티](appendix_c.md)**

---

### 기여하기

[CONTRIBUTING.md](CONTRIBUTING.md) 를 참조하세요.

### 번역 정보

[TRANSLATIONS.md](TRANSLATIONS.md) 를 참조하세요.

### FAQ

[FAQ.md](FAQ.md) 를 참조하세요.

---

<p align="center">
  <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">
    <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" />
  </a>
  <br />
  This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
</p>
